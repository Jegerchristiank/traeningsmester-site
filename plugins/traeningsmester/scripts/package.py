#!/usr/bin/env python3
"""Validate the selected OpenAI plugin contract and build a reproducible ZIP.

Only Python's standard library is used. This is not a general schema engine,
portal scan or runtime acceptance test. No network or account access occurs.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import struct
import sys
from urllib.parse import urlsplit
import zipfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
PLUGIN_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
MCP_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json"
MCP_URL = "https://www.traeningsmester.dk/mcp"
SCOPES = {
    "training:read", "plans:write", "exercises:write", "workouts:write",
    "history:write", "preferences:write", "data:transfer",
}
TOOLS = {
    "get_training_context", "update_training_preferences", "list_training_centers",
    "manage_training_center", "search_exercises", "get_exercise", "manage_custom_exercise",
    "list_plans", "get_plan", "validate_plan", "create_plan", "apply_plan_changes",
    "duplicate_plan", "delete_plan", "set_active_plan", "get_active_workout",
    "start_workout", "apply_workout_changes", "pause_workout", "resume_workout",
    "complete_workout", "cancel_workout", "transfer_workout_control", "list_workouts",
    "get_workout", "correct_workout", "delete_workout", "get_training_statistics",
    "validate_training_import", "import_training_data", "export_training_data",
    "get_job", "cancel_job", "get_operation_status",
}
REQUIRED_FILES = ("plugin.json", "mcp.json", "README.md", "scripts/package.py")
FORBIDDEN_KEYS = {
    "clientSecret", "client_secret", "clientId", "client_id", "access_token", "refresh_token",
    "test_credentials", "reviewer_instructions", "password", "token", "api_key", "apiKey",
    "headers", "env", "hooks", "onboardingSkill", "apps", "skills", "mcpServers",
}


def require(condition: object, message: str) -> None:
    if not condition:
        raise ValueError(message)


def text(value: object, label: str, maximum: int, *, multiline: bool = False) -> str:
    require(isinstance(value, str) and bool(value.strip()), f"{label}: expected nonempty text")
    assert isinstance(value, str)
    require(len(value) <= maximum, f"{label}: exceeds {maximum} characters")
    require(value == value.strip(), f"{label}: remove surrounding whitespace")
    require(not any(ord(c) < 32 and not (multiline and c == "\n") for c in value), f"{label}: unsupported control character")
    require("\n" not in value or multiline, f"{label}: expected one line")
    return value


def https(value: object, label: str, maximum: int = 1024) -> str:
    result = text(value, label, maximum)
    url = urlsplit(result)
    require(url.scheme == "https" and bool(url.hostname), f"{label}: expected absolute HTTPS URL")
    require(not url.username and not url.password and not url.fragment, f"{label}: credentials/fragments are forbidden")
    require(url.hostname not in {"example.com", "example.org", "localhost", "127.0.0.1"}, f"{label}: placeholder URL is forbidden")
    return result


def keys(value: object, required: set[str], optional: set[str], label: str) -> dict:
    require(isinstance(value, dict), f"{label}: expected object")
    assert isinstance(value, dict)
    require(required <= value.keys(), f"{label}: missing {sorted(required - value.keys())}")
    require(value.keys() <= required | optional, f"{label}: unsupported fields {sorted(value.keys() - required - optional)}")
    return value


def load_json(name: str) -> dict:
    def unique(pairs: list[tuple[str, object]]) -> dict:
        result: dict = {}
        for key, value in pairs:
            require(key not in result, f"{name}: duplicate JSON key {key!r}")
            result[key] = value
        return result
    return json.loads((ROOT / name).read_text(encoding="utf-8"), object_pairs_hook=unique)


def no_secrets(value: object, label: str = "manifest") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            # mcpServers is the portable MCP root, not a manifest override.
            require(key not in FORBIDDEN_KEYS, f"{label}.{key}: forbidden package capability/credential field")
            no_secrets(child, f"{label}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            no_secrets(child, f"{label}[{index}]")
    elif isinstance(value, str):
        require(not re.search(r"(?:sb_secret_|sk-[A-Za-z0-9_-]{16,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)", value), f"{label}: possible secret")
        require(not re.search(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b", value), f"{label}: account/QA UUIDs do not belong in the package")


def packaged_path(value: object, label: str) -> Path:
    raw = text(value, label, 1024)
    path = PurePosixPath(raw)
    require(raw.startswith("./") and not path.is_absolute() and ".." not in path.parts, f"{label}: expected contained ./ path")
    full = ROOT / path
    require(full.resolve().is_relative_to(ROOT), f"{label}: path escapes package")
    require(full.is_file() and not full.is_symlink(), f"{label}: missing file or symlink")
    for ancestor in full.parents:
        if ancestor == ROOT:
            break
        require(not ancestor.is_symlink(), f"{label}: symlinked parent")
    return full


def png(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    require(len(data) <= 5 * 1024 * 1024, f"{path.name}: icon exceeds 5 MiB")
    require(data[:8] == b"\x89PNG\r\n\x1a\n" and len(data) >= 33 and data[12:16] == b"IHDR", f"{path.name}: expected PNG")
    width, height = struct.unpack(">II", data[16:24])
    require(width == height and 48 <= width <= 4096, f"{path.name}: expected square PNG, 48–4096 pixels")
    offset, ended = 8, False
    while offset < len(data):
        require(offset + 12 <= len(data), f"{path.name}: truncated PNG chunk")
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        end = offset + 12 + length
        require(end <= len(data), f"{path.name}: truncated PNG data")
        payload = data[offset + 4:offset + 8 + length]
        expected = struct.unpack(">I", data[offset + 8 + length:end])[0]
        require(zlib.crc32(payload) & 0xFFFFFFFF == expected, f"{path.name}: PNG CRC mismatch")
        if payload[:4] == b"IEND":
            require(length == 0 and end == len(data), f"{path.name}: trailing PNG data")
            ended = True
        offset = end
    require(ended, f"{path.name}: missing IEND")
    return width, height


def brand_color(value: object) -> None:
    require(isinstance(value, str) and re.fullmatch(r"#[0-9A-Fa-f]{6}", value), "brandColor: expected #RRGGBB")
    assert isinstance(value, str)
    rgb = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    luminance = sum(c * w for c, w in zip(linear, (0.2126, 0.7152, 0.0722)))
    require(1.05 / (luminance + 0.05) >= 2, "brandColor: contrast against white must be at least 2:1")


def validate(tools_file: Path | None = None) -> dict:
    for filename in REQUIRED_FILES:
        require((ROOT / filename).is_file() and not (ROOT / filename).is_symlink(), f"Missing package source: {filename}")
    manifest, mcp = load_json("plugin.json"), load_json("mcp.json")
    keys(manifest, {"$schema", "name", "version", "description", "author", "homepage", "extensions"}, {"keywords", "repository", "license"}, "plugin.json")
    require(manifest["$schema"] == PLUGIN_SCHEMA, "plugin.json: wrong schema version")
    require(manifest["name"] == "traeningsmester", "plugin.json: unexpected stable name")
    require(manifest["version"] == "1.0.0", "plugin.json: expected catalog package version 1.0.0")
    text(manifest["description"], "description", 4000)
    author = keys(manifest["author"], {"name", "url"}, {"email"}, "author")
    require(author["name"] == "KRISTENSON", "author: unexpected publisher")
    https(author["url"], "author.url", 2048)
    if "email" in author:
        text(author["email"], "author.email", 320)
    require(https(manifest["homepage"], "homepage", 2048) == "https://www.traeningsmester.dk/ai/help", "homepage: unexpected destination")
    extension = keys(manifest["extensions"], {"com.openai"}, set(), "extensions")["com.openai"]
    keys(extension, {"interface", "review", "publication"}, set(), "com.openai")
    interface = keys(extension["interface"], {
        "displayName", "shortDescription", "longDescription", "developerName", "category", "capabilities",
        "websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL", "defaultPrompt", "composerIcon", "logo",
    }, {"brandColor"}, "interface")
    require(text(interface["displayName"], "displayName", 30) == "Træningsmester", "displayName: unexpected brand")
    text(interface["shortDescription"], "shortDescription", 30)
    text(interface["longDescription"], "longDescription", 4000, multiline=True)
    require(text(interface["developerName"], "developerName", 80) == "KRISTENSON", "developerName: unexpected publisher")
    require(interface["category"] == "Healthcare", "category: expected proposed Healthcare title")
    labels = interface["capabilities"]
    require(isinstance(labels, list) and 1 <= len(labels) <= 20, "capabilities: expected 1–20 labels")
    for label in labels:
        text(label, "capability", 120)
    for name, suffix in {"websiteURL": "/ai/help", "supportURL": "/support", "privacyPolicyURL": "/privatliv", "termsOfServiceURL": "/vilkaar"}.items():
        require(https(interface[name], name) == "https://www.traeningsmester.dk" + suffix, f"{name}: unexpected destination")
    prompts = interface["defaultPrompt"]
    require(isinstance(prompts, list) and len(prompts) == 3 and len(set(prompts)) == 3, "defaultPrompt: expected three distinct starter prompts")
    for prompt in prompts:
        require("@" not in text(prompt, "starter prompt", 128), "starter prompt: omit @mentions")
    if "brandColor" in interface:
        brand_color(interface["brandColor"])
    assets: set[Path] = set()
    for name in ("logo", "composerIcon"):
        require(interface[name] == "./assets/logo.png", f"{name}: expected approved logo asset")
        asset = packaged_path(interface[name], name)
        png(asset)
        assets.add(asset)
    review = keys(extension["review"], {"test_cases", "commerce", "commerce_description"}, {"demo_recording_url"}, "review")
    require(review["commerce"] is False, "review.commerce: no payment capability is bundled")
    text(review["commerce_description"], "commerce_description", 4000)
    if "demo_recording_url" in review:
        https(review["demo_recording_url"], "demo_recording_url", 2048)
    cases = keys(review["test_cases"], {"positive", "negative"}, set(), "review.test_cases")
    for polarity, count in (("positive", 5), ("negative", 3)):
        require(isinstance(cases[polarity], list) and len(cases[polarity]) == count, f"review.{polarity}: expected exactly {count} cases")
        for index, case in enumerate(cases[polarity], 1):
            label = f"review.{polarity}[{index}]"
            required = {"description", "prompt", "expected_behavior"}
            if polarity == "positive":
                required.add("tools_triggered")
            keys(case, required, {"tools_triggered", "file_attachment_urls", "expected_output_url"}, label)
            for field in ("description", "prompt", "expected_behavior"):
                text(case[field], f"{label}.{field}", 4000, multiline=True)
            if "tools_triggered" in case:
                names = {name.strip() for name in text(case["tools_triggered"], f"{label}.tools_triggered", 4000).split(",")}
                require(names <= TOOLS, f"{label}: unknown tools {sorted(names - TOOLS)}")
            for attachment in case.get("file_attachment_urls", []):
                https(attachment, f"{label}.attachment", 2048)
            if "expected_output_url" in case:
                https(case["expected_output_url"], f"{label}.expected_output_url", 2048)
    publication = keys(extension["publication"], {"release_notes", "translations"}, set(), "publication")
    text(publication["release_notes"], "release_notes", 4000, multiline=True)
    translations = keys(publication["translations"], {"da-DK"}, set(), "translations")
    danish = keys(translations["da-DK"], {"subtitle", "description"}, set(), "da-DK")
    text(danish["subtitle"], "da-DK.subtitle", 30)
    text(danish["description"], "da-DK.description", 4000, multiline=True)
    keys(mcp, {"$schema", "mcpServers"}, set(), "mcp.json")
    require(mcp["$schema"] == MCP_SCHEMA, "mcp.json: wrong schema version")
    servers = keys(mcp["mcpServers"], {"traeningsmester"}, set(), "mcpServers")
    server = keys(servers["traeningsmester"], {"type", "url", "extensions"}, set(), "server")
    require(server["type"] == "streamable-http" and https(server["url"], "server.url") == MCP_URL, "server: unexpected transport or resource")
    auth = keys(keys(server["extensions"], {"com.openai"}, set(), "server.extensions")["com.openai"], {"auth"}, set(), "server.com.openai")["auth"]
    keys(auth, {"type", "client", "registrationUrl", "resource", "defaultScopes"}, set(), "auth")
    require(auth["type"] == "oauth", "auth: OAuth is required")
    require(auth["client"] == {"mode": "dcr"}, "auth: DCR must not bundle a client identity or credentials")
    require(https(auth["registrationUrl"], "registrationUrl") == "https://www.traeningsmester.dk/oauth/reg", "auth: unexpected registration endpoint")
    require(https(auth["resource"], "auth.resource") == MCP_URL, "auth: unexpected resource")
    require(isinstance(auth["defaultScopes"], list) and len(auth["defaultScopes"]) == 7 and set(auth["defaultScopes"]) == SCOPES, "auth: expected the seven existing training scopes")
    no_secrets(manifest)
    no_secrets(server)
    if tools_file is not None:
        source = tools_file.read_text(encoding="utf-8")
        names = set(re.findall(r"add\('([a-z_]+)'", source))
        names.update(re.findall(r"\['((?:pause|resume|complete|cancel)_workout)'", source))
        require(names == TOOLS, f"Tool inventory differs: missing={sorted(TOOLS - names)}, unexpected={sorted(names - TOOLS)}")
    members = sorted(set(REQUIRED_FILES) | {str(path.relative_to(ROOT)) for path in assets})
    warnings = [
        "Healthcare needs confirmation against the portal category list.",
        "Publishing identity verification, domain verification, tool scan and runtime evidence are portal/release-owner work.",
        "Review cases are proposals; private review-account access is not bundled.",
        "The OAuth extension follows the OpenAI profile; the unextended MCP 1.0.0 base schema disallows server.extensions.",
    ]
    if "demo_recording_url" not in review:
        warnings.append("A real demo_recording_url is still required before MCP review submission.")
    return {"status": "passed", "contract": "documented OpenAI portable plugin profile", "members": members,
            "manifestHashes": {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in ("plugin.json", "mcp.json")},
            "toolCount": len(TOOLS), "reviewCases": {"positive": 5, "negative": 3}, "warnings": warnings}


def destination(path: Path) -> Path:
    require(path.is_absolute() and path.suffix == ".zip", "Output must be an absolute .zip path")
    output = path.resolve()
    source_checkout = next((parent for parent in (ROOT, *ROOT.parents) if (parent / ".git").exists()), None)
    require(source_checkout is None or not output.is_relative_to(source_checkout), "Do not write a ZIP into the source repository")
    require(not any(part.lower() in {"cache", "caches", ".cache", "releaseartifacts", "release-artifacts"} for part in output.parts), "Output must be outside cache/release-artifact directories")
    require(not any((ancestor / ".git").exists() for ancestor in output.parents), "Output must be outside a Git checkout")
    require(not path.is_symlink(), "Output must not be a symlink")
    return output


def build(report: dict, output: Path) -> dict:
    stream = io.BytesIO()
    hashes: dict[str, str] = {}
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_STORED, strict_timestamps=True) as archive:
        for member in report["members"]:
            data = (ROOT / member).read_bytes()
            entry = zipfile.ZipInfo(member, date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = zipfile.ZIP_STORED
            archive.writestr(entry, data)
            hashes[member] = hashlib.sha256(data).hexdigest()
    data = stream.getvalue()
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        require(archive.testzip() is None and archive.namelist() == report["members"], "ZIP verification failed")
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        require(output.is_file() and output.read_bytes() == data, "A different file exists at output; choose a new output path")
    else:
        output.write_bytes(data)
    return {**report, "zip": str(output), "zipBytes": len(data), "zipSha256": hashlib.sha256(data).hexdigest(), "memberHashes": hashes}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("validate", "build"))
    parser.add_argument("--tools-file", type=Path, help="Optional read-only comparison with the current tool registry")
    parser.add_argument("--output", type=Path, help="Absolute ZIP destination outside Git/cache/release-artifact directories")
    args = parser.parse_args()
    try:
        report = validate(args.tools_file)
        if args.action == "build":
            require(args.output is not None, "build requires --output")
            report = build(report, destination(args.output))
        else:
            require(args.output is None, "--output is only used with build")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    except (ValueError, OSError, json.JSONDecodeError, struct.error) as error:
        print(json.dumps({"status": "failed", "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
