import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("manual navigation, webR execution, graph render, and JSON round-trip", async ({ page }) => {
  await page.goto("./");

  await expect(page.getByRole("tab", { name: "マニュアル" })).toBeVisible();
  await page.getByRole("tab", { name: "マニュアル" }).click();
  await expect(page.getByRole("heading", { name: "マニュアル" })).toBeVisible();
  await expect(page.locator("#manualPage a[href=\"./manual/\"]")).toBeVisible();
  await page.getByRole("tab", { name: "ワークスペース" }).click();

  await expect(page.locator("#runtimeStatus")).toHaveText(/webR 準備完了/, { timeout: 180000 });
  await expect(page.locator("#scriptEditor")).toHaveValue("");

  await page.locator("#consoleInput").fill("print(names(get.input()))");
  await page.getByRole("button", { name: "1行実行" }).click();
  await expect(page.locator("#consoleOutput")).toContainText("column_1", { timeout: 30000 });

  await page.getByRole("button", { name: "設定読込 (JSON)" }).click();
  await expect(page.getByRole("dialog", { name: "設定読込" })).toBeVisible();
  await page.getByRole("button", { name: "単振り子" }).click();
  await expect(page.locator("#scriptEditor")).toHaveValue(/set\.paper_style/, { timeout: 30000 });
  await expect(page.locator("#sheetTabs")).toContainText("pendulum");

  await page.getByRole("button", { name: "グラフ", exact: true }).click();
  await page.getByRole("button", { name: "コード実行" }).click();
  await expect(page.locator("#graphEmptyState")).toBeHidden({ timeout: 30000 });
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
  await expect(page.locator("#graphViewerMeta")).toContainText(/最後に描いたグラフ/);
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
  await expect(page.locator("#scriptEditor")).toHaveValue(/set\.paper_style/);
  await expect(page.locator("#restoreBanner")).toContainText("復元");

  await page.goto("./manual/");
  await expect(page.getByRole("heading", { name: "Physics webR Lab 学習ガイド" })).toBeVisible();
  await expect(page.locator(".navbar").getByRole("link", { name: "スニペット集" })).toBeVisible();
});

test("editor execution prints data frames and dataframe tab previews pasted TSV data", async ({ page }) => {
  await page.goto("./");

  await expect(page.locator("#runtimeStatus")).toHaveText(/webR 準備完了/, { timeout: 180000 });

  const firstDataCell = page.locator('.cell[data-row="1"][data-col="0"]').first();
  await firstDataCell.click();
  await page.locator('.cell[data-row="0"][data-col="0"]').fill("x");
  await page.locator('.cell[data-row="0"][data-col="1"]').fill("y");
  await firstDataCell.evaluate((cell) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", "1\t2\n3\t4\n5\t6");
    const event = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer,
    });
    cell.dispatchEvent(event);
  });

  await expect(page.locator('.cell[data-row="2"][data-col="1"]')).toHaveText("4");
  await expect(page.locator('.cell[data-row="3"][data-col="0"]')).toHaveText("5");

  await page.locator("#scriptEditor").fill(
    "df <- get.input()\nhead(mtcars)\nprocessed <- transform(df, sum_xy = x + y)\nhead(processed)",
  );
  await page.getByRole("button", { name: "コード実行" }).click();

  await expect(page.locator("#consoleOutput")).toContainText("Mazda RX4", { timeout: 30000 });
  await expect(page.locator("#consoleOutput")).toContainText("sum_xy", { timeout: 30000 });

  await page.getByRole("button", { name: "データフレーム", exact: true }).click();
  await expect(page.locator("#dataframeList")).toContainText("df", { timeout: 30000 });
  await expect(page.locator("#dataframeList")).toContainText("processed");
  await page.getByRole("button", { name: /^processed/ }).click();

  await expect(page.locator("#dataframePreviewMeta")).toContainText("processed", { timeout: 30000 });
  await expect(page.locator("#dataframeTableWrap")).toContainText("sum_xy");
  await expect(page.locator("#dataframeTableWrap")).toContainText("7");
});

async function runEditor(page) {
  const runButton = page.getByRole("button", { name: "コード実行" });
  await runButton.click();
  await expect(runButton).toBeDisabled();          // entered busy state
  await expect(runButton).toBeEnabled({ timeout: 30000 }); // finished this run
  await expect(page.locator("#graphEmptyState")).toBeHidden({ timeout: 30000 });
}

async function viewerDims(page) {
  await page.getByRole("button", { name: "全体表示" }).click();
  const meta = await page.locator("#graphViewerMeta").innerText();
  await page.getByRole("button", { name: "閉じる" }).click();
  const match = meta.match(/\((\d+)\s*×\s*(\d+)\)/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

test("set.figure lets code control the figure aspect ratio", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#runtimeStatus")).toHaveText(/webR 準備完了/, { timeout: 180000 });
  await page.getByRole("button", { name: "グラフ", exact: true }).click();

  // Default capture follows the (landscape) panel.
  await page.locator("#scriptEditor").fill("plot(1:5, 1:5, pch = 19)");
  await runEditor(page);
  const panelDims = await viewerDims(page);
  expect(panelDims.width).toBeGreaterThan(panelDims.height);

  // set.figure makes the captured figure square, independent of the panel.
  await page.locator("#scriptEditor").fill(
    'set.figure(width = 4, height = 4, units = "in")\nplot(1:5, 1:5, pch = 19, asp = 1)',
  );
  await runEditor(page);
  const squareDims = await viewerDims(page);
  expect(squareDims.width).toBe(squareDims.height);

  // The graph-size sample combines set.figure, par(mfrow) subplots and margins.
  await page.getByRole("button", { name: "設定読込 (JSON)" }).click();
  await page.getByRole("button", { name: "作図サイズとレイアウト" }).click();
  await expect(page.locator("#scriptEditor")).toHaveValue(/set\.figure/, { timeout: 30000 });
  await page.getByRole("button", { name: "グラフ", exact: true }).click();
  await runEditor(page);
  const wideDims = await viewerDims(page);
  expect(wideDims.width / wideDims.height).toBeGreaterThan(2);
});
