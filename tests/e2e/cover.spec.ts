import { expect, test } from "@playwright/test";

for (const javaScriptEnabled of [true, false]) {
  test.describe(
    javaScriptEnabled ? "Interactive cover" : "Pre-rendered cover",
    () => {
      test.use({ javaScriptEnabled });

      test("the ring card turns by touch and keyboard and keeps the same set in view", async ({
        page,
      }) => {
        await page.goto("/");
        const card = page.locator(".deck-inspection");
        const turn = card.locator("summary");
        const previous = page.locator(".deck-ledger dd").first();
        const current = page.locator(".deck-ledger dd").last();
        await expect(turn).toContainText("Vend til appvisning");
        await expect(previous).toHaveText("60 kg × 8");
        await expect(current).toHaveText("62,5 kg × 8");
        await turn.click(); // The printed card itself is also the pointer target.
        await expect(card).toHaveAttribute("open", "");
        await expect(card.locator(".turn-back")).toBeVisible();
        const values = card.getByRole("img", {
          name: /60 kg × 8.*62,5 kg × 8/,
        });
        await expect(values).toBeVisible();
        await values.evaluate((img) => (img as HTMLImageElement).decode());
        await expect(
          card.getByRole("heading", { name: "Bænkpres med stang" }),
        ).toBeVisible();
        await turn.focus();
        await page.keyboard.press("Enter");
        await expect(card).not.toHaveAttribute("open", "");
        await expect(card.locator(".turn-to")).toBeVisible();
        await expect(turn).toBeFocused();
        await expect(current).toHaveText("62,5 kg × 8");
      });
    },
  );
}
