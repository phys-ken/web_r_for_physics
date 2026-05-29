import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../samples/manifest.json", import.meta.url), "utf8"));

assert.match(html, /<title>Physics webR Lab<\/title>/);
assert.match(html, /webr\.r-wasm\.org\/v0\.6\.0\/webr\.mjs/);
assert.match(html, /WEBR_BASE_URL = "https:\/\/webr\.r-wasm\.org\/v0\.6\.0\/"/);
assert.match(html, /ワークスペース/);
assert.match(html, /マニュアル/);
assert.match(html, /設定読込 \(JSON\)/);
assert.match(html, /設定保存 \(JSON\)/);
assert.match(html, /get\.input <- function/);
assert.match(html, /experiment_setup\.json/);
assert.match(html, /channelType: "PostMessage"/);
assert.match(html, /ggplot2 could not be loaded/);
assert.match(html, /console:\s*\{\s*entries:/);
assert.match(html, /normaliseImportedPayload/);
assert.match(html, /height: 100dvh/);
assert.match(html, /物理実験サンプルを開く/);
assert.match(html, /graphViewerModal/);
assert.equal(manifest.samples.length, 5);

console.log("Smoke test passed: index.html and sample manifest contain the expected app scaffolding.");
