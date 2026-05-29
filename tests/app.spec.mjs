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

  await page.locator("#consoleInput").fill("print(names(get.input()))");
  await page.getByRole("button", { name: "1行実行" }).click();
  await expect(page.locator("#consoleOutput")).toContainText("distance_m", { timeout: 30000 });

  await page.locator("#scriptEditor").fill(`df <- get.input()
plot(
  df$time_s,
  df$distance_m,
  pch = 19,
  cex = 3,
  col = "red",
  xlab = "time_s",
  ylab = "distance_m"
)
arrows(
  df$time_s - df$time_err_s,
  df$distance_m,
  df$time_s + df$time_err_s,
  df$distance_m,
  angle = 90,
  code = 3,
  length = 0.08,
  lwd = 2
)
arrows(
  df$time_s,
  df$distance_m - df$distance_err_m,
  df$time_s,
  df$distance_m + df$distance_err_m,
  angle = 90,
  code = 3,
  length = 0.08,
  lwd = 2
)`);
  await page.getByRole("button", { name: "グラフ", exact: true }).click();
  await page.getByRole("button", { name: "コード実行" }).click();
  await expect(page.locator("#graphEmptyState")).toBeHidden({ timeout: 30000 });
  const pixelStats = await page.evaluate(() => {
    const canvas = document.getElementById("graphCanvas");
    const ctx = canvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let redPixels = 0;
    let darkPixels = 0;
    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];
      if (alpha === 0) {
        continue;
      }
      if (red > 170 && green < 110 && blue < 110) {
        redPixels += 1;
      }
      if (red < 140 && green < 140 && blue < 140) {
        darkPixels += 1;
      }
    }
    return { redPixels, darkPixels };
  });
  expect(pixelStats.redPixels).toBeGreaterThan(200);
  expect(pixelStats.darkPixels).toBeGreaterThan(400);

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
  await expect(page.locator("#scriptEditor")).toHaveValue(/col = "red"/);
  await expect(page.locator("#restoreBanner")).toContainText("復元");
});
