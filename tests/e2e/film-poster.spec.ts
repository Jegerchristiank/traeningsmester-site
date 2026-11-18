import { expect, test } from "@playwright/test";

test.use({ browserName: "webkit", reducedMotion: "reduce" });

test("the title and play control stay inside the photograph above the credits", async ({ page }, info) => {
  const mobile = info.project.name === "mobile";
  const sizes = mobile
    ? [[393, 644], [393, 730], [667, 309]]
    : [[3440, 900], [1440, 720]];
  const section = page.locator("#traeningsforloeb");
  await page.goto("/#traeningsforloeb");
  await section.locator("picture img").evaluate((image: HTMLImageElement) => image.decode());
  await page.evaluate(() => document.fonts.ready);

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    const play = section.getByRole("link", { name: "Afspil filmen", exact: true });
    await play.scrollIntoViewIfNeeded();
    const [picture, label, title, button, credits, practice] = await Promise.all([
      section.locator("picture").boundingBox(),
      section.locator(".cinema-intro > p").boundingBox(),
      section.getByRole("heading").boundingBox(),
      play.boundingBox(),
      section.locator(".cinema-credits").boundingBox(),
      page.locator(".bench-disclosure > summary").boundingBox(),
    ]);
    expect(label!.y).toBeGreaterThanOrEqual(picture!.y - 1);
    expect(title!.y + title!.height).toBeLessThanOrEqual(button!.y);
    expect(button!.y + button!.height).toBeLessThanOrEqual(picture!.y + picture!.height);
    expect(picture!.y + picture!.height).toBeLessThanOrEqual(credits!.y + 1);
    expect(credits!.y + credits!.height).toBeLessThanOrEqual(practice!.y + 1);
    await play.click({ trial: true });
  }
});
