# web_r_for_physics

高校の理科実験向けに作った、**単一 `index.html` 完結** の webR データ解析ツールです。GitHub Pages にそのまま配置でき、iPad の Safari / Chrome でも使えるように、RStudio 風の 2 ペイン UI と軽量な表入力を 1 画面に収めています。

公開サイト: https://phys-ken.github.io/web_r_for_physics/

## できること

- 左ペインで複数シートの測定データを入力
- 1 行目の列名を R 互換の名前へ自動調整
- `get.input()` で現在シート / 名前指定 / 1 始まりの番号指定で R の data.frame を取得
- 右上で複数行の R スクリプトを実行
- 右下で 1 行ずつ REPL 風に実行
- `plot()` や `ggplot2` の結果をキャンバスに描画し、PNG 保存
- アプリ上部バーからワークスペース / マニュアルを切り替え
- 表データだけでなく、スクリプト・表示タブ・console 履歴なども含めて `experiment_setup.json` に保存 / 復元
- 初期状態は空で起動し、「設定読込 (JSON)」から授業用サンプル 5 種を展開

## ローカル起動

```bash
npm start
```

起動後に `http://127.0.0.1:4173/` を開いてください。

## テスト

```bash
npm test
```

`npm test` は次を実行します。

1. `node scripts/smoke-test.mjs` による静的スモークテスト
2. Playwright によるブラウザ実行テスト

Playwright 初回実行時に追加セットアップが必要な場合は次を実行してください。

```bash
npx playwright install chromium
```

## GitHub Pages 公開

このリポジトリはビルド不要です。`index.html` と `.nojekyll` をそのまま公開できます。

1. デフォルトブランチへ push
2. GitHub Pages の公開元を `master` ブランチの `/ (root)` に設定
3. 数分待つと Pages URL で配信開始

## 実装メモ

- webR は GitHub Pages と同じ制約で動作確認しやすいよう、`PostMessage` チャネルで起動
- `get.input()` は JS 側が実行前に全シートを R のグローバル環境へ注入する方式
- webR は `v0.6.0` に固定して、`latest` 参照による破壊的変更を避けています
- エクスポート JSON は作業中のプログラミング状態も復元できるよう、UI 状態と console 履歴を含む形式に拡張しています
- 授業用サンプルは `samples/manifest.json` と個別 JSON に分けて管理しています
