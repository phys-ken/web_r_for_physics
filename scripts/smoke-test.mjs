import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /<title>Physics webR Lab<\/title>/);
assert.match(html, /webr\.r-wasm\.org\/v0\.6\.0\/webr\.mjs/);
assert.match(html, /WEBR_BASE_URL = "https:\/\/webr\.r-wasm\.org\/v0\.6\.0\/"/);
assert.match(html, /設定読込 \(JSON\)/);
assert.match(html, /設定保存 \(JSON\)/);
assert.match(html, /get\.input <- function/);
assert.match(html, /experiment_setup\.json/);
assert.match(html, /channelType: "PostMessage"/);
assert.match(html, /ggplot2 could not be loaded/);
assert.match(html, /height: 100dvh/);

console.log("Smoke test passed: index.html contains the expected static app scaffolding.");
