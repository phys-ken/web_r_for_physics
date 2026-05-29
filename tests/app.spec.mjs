import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("manual navigation, webR execution, graph render, and JSON round-trip", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("tab", { name: "マニュアル" })).toBeVisible();
  await page.getByRole("tab", { name: "マニュアル" }).click();
  await expect(page.getByRole("heading", { name: "マニュアル" })).toBeVisible();
  await expect(page.locator("#manualPage code").filter({ hasText: "get.input()" }).first()).toBeVisible();
  await page.getByRole("tab", { name: "ワークスペース" }).click();

  await expect(page.locator("#runtimeStatus")).toHaveText(/webR 準備完了/, { timeout: 180000 });
  await expect(page.locator("#scriptEditor")).toHaveValue("");

  await page.locator("#consoleInput").fill("print(names(get.input()))");
  await page.getByRole("button", { name: "1行実行" }).click();
  await expect(page.locator("#consoleOutput")).toContainText("column_1", { timeout: 30000 });

  await page.getByRole("button", { name: "設定読込 (JSON)" }).click();
  await expect(page.getByRole("dialog", { name: "設定読込" })).toBeVisible();
  await page.getByRole("button", { name: "単振り子" }).click();
  await expect(page.locator("#scriptEditor")).toHaveValue(/Simple Pendulum/, { timeout: 30000 });
  await expect(page.locator("#sheetTabs")).toContainText("pendulum");
  await expect(page.locator("#graphWidthInput")).toHaveValue("820");
  await expect(page.locator("#graphHeightInput")).toHaveValue("520");
  await expect(page.locator("#graphBgInput")).toHaveValue("#fffdf7");

  await page.getByRole("button", { name: "グラフ", exact: true }).click();
  await page.getByRole("button", { name: "コード実行" }).click();
  await expect(page.locator("#graphEmptyState")).toBeHidden({ timeout: 30000 });
  await expect(page.locator("#graphCanvas")).toHaveJSProperty("width", 820);
  await expect(page.locator("#graphCanvas")).toHaveJSProperty("height", 520);
  await expect(page.locator("#graphSizeStatus")).toContainText("820 × 520");
  const pixelStats = await page.evaluate(() => {
    const canvas = document.getElementById("graphCanvas");
    const ctx = canvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let nonWhitePixels = 0;
    let darkPixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (alpha === 0) {
        continue;
      }
      if (!(red > 245 && green > 245 && blue > 245)) {
        nonWhitePixels += 1;
      }
      if (red < 140 && green < 140 && blue < 140) {
        darkPixels += 1;
      }
    }
    return { nonWhitePixels, darkPixels };
  });
  expect(pixelStats.nonWhitePixels).toBeGreaterThan(1500);
  expect(pixelStats.darkPixels).toBeGreaterThan(400);

  await page.getByRole("button", { name: "全体表示" }).click();
  await expect(page.getByRole("dialog", { name: "グラフ全体表示" })).toBeVisible();
  await expect(page.locator("#graphViewerMeta")).toContainText("820 × 520");
  await page.getByRole("button", { name: "閉じる" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "設定保存 (JSON)" }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const jsonText = await readFile(downloadPath, "utf8");
  const payload = JSON.parse(jsonText);
  expect(payload.version).toBe(2);
  expect(payload.app.ui.currentPage).toBe("workspace");
  expect(payload.app.ui.outputTab).toBe("graph");
  expect(Array.isArray(payload.app.console.entries)).toBe(true);
  expect(payload.app.console.entries.length).toBeGreaterThan(0);
  expect(payload.app.workbook.sheets.length).toBeGreaterThan(0);

  await page.locator("#scriptEditor").fill("temporary <- TRUE");
  await page.locator("#importFileInput").setInputFiles(downloadPath);
  await expect(page.locator("#scriptEditor")).toHaveValue(/Simple Pendulum/);
  await expect(page.locator("#restoreBanner")).toContainText("復元");
});
