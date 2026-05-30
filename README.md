# web_r_for_physics

高校の理科実験向けに作った、**単一 `index.html` 完結** の webR データ解析ツールです。GitHub Pages にそのまま配置でき、iPad の Safari / Chrome でも使えるように、RStudio 風の 2 ペイン UI と軽量な表入力を 1 画面に収めています。

公開サイト: https://phys-ken.github.io/web_r_for_physics/

## できること

- 左ペインで複数シートの測定データを入力
- 1 行目の列名を R 互換の名前へ自動調整
- `get.input()` で現在シート / 名前指定 / 1 始まりの番号指定で R の data.frame を取得
- 右上で複数行の R スクリプトを実行
- スクリプト実行でも `head(df)` や `summary(df)` などの結果をコンソールへ表示
- 右下で 1 行ずつ REPL 風に実行
- `plot()` や `ggplot2` の結果をキャンバスに描画し、PNG 保存
- グラフは右下ペインに描画し、必要なら全体表示で確認、PNG 保存
- `set.figure()` で図の縦横比・サイズをコード指定（未指定なら描画エリアへ自動フィット）、`par(mfrow)` の画面分割や `asp = 1` にも対応
- 1 回の実行で複数の図を描くと、グラフタブ上部のサムネイルで切り替え（選択中の図に全体表示・PNG 保存が連動）
- 複数シート・複数データフレーム（`get.input("シート名")`）に対応
- 右下の「データフレーム」タブで、R セッション内の `data.frame` 一覧と先頭行プレビューを確認
- 左ペインのシートへ TSV / 表計算ソフトの複数セルデータをそのまま貼り付け
- 右上の「**入力**」から **Excel(xlsx) / CSV / TSV ファイルを取り込み**（複数シート対応。取り込み前に、シート選択・見出し行・列名の自動調整を確認するダイアログ）
- 右上の「**出力**」から、**データ領域・最新データフレームを CSV / xlsx で書き出し**。**R スクリプトのみ**（`get.input()` 行は自動コメントアウト）、**設定 (JSON)**、すべてを束ねた **一括出力 (zip)** にも対応。ファイル名は日時付き、詳細設定で文字コード等を切替
- アプリ上部バーからワークスペース / マニュアルを切り替え
- 表データだけでなく、スクリプト・表示タブ・console 履歴なども含めて `experiment_setup.json` に保存 / 復元
- 初期状態は空で起動し、「入力」から授業用サンプル群を展開
- アプリ内 manual は操作説明に絞り、詳しい学習用ガイドは `manual/` に分離

## 授業用サンプル

右上の「入力」から、解説コメント入りのサンプルを展開できます。多くは意図的に欠損値とばらつきを含み、コードを読み解くこと自体が学習になるよう作っています。

- **単振り子（データのみ）** — スクリプトが空のサンプル。授業でマニュアルを見ながら 1 行ずつ書いていく練習用
- **単振り子** — 繰り返し測定の平均・標準偏差、誤差棒付き散布図、回帰直線（線形回帰）
- **自由落下** — 重い球・軽い球・ひらひらの紙を比較、複数系列の重ね描き・凡例・理論曲線
- **データロガー時系列** — 20 Hz の減衰振動を分析（ピーク検出・log 振幅の回帰で減衰時定数と振動数）
- **材質ごとの抵抗比較** — カテゴリ比較の棒グラフ＋誤差棒
- **作図サイズとレイアウト** — `set.figure()` で縦横比(1:1 など)・余白を指定、`par(mfrow)` で画面分割（subplot）
- **ニュートンの第2法則** — 力・質量を変えた v-t を重ね描きし、その傾き(加速度)から a-F / a-(1/m) を作る 4 枚組（複数シート・複数データフレーム・回帰式の書き込み・誤差棒つき）

サンプルは `samples/manifest.json` と個別 JSON で管理しています。

## 入力と出力

右上の「入力」「出力」ボタンから、データやスクリプトを各種フォーマットでやり取りできます。`xlsx` の読み書きと一括出力(zip)のうち xlsx は SheetJS を **押した時だけ CDN から遅延読込**するため、初期表示は軽量なままです（WebR と同様にオンラインが前提）。

**入力**

- Excel(xlsx) / CSV / TSV を取り込み、左のデータ領域へ展開（複数シート対応）
- 取り込み前の確認ダイアログ：取り込むシートの選択、「1 行目を見出しとして扱う」、列名の自動調整プレビュー（R 互換へサニタイズ）、既存を置換／新しいシートとして追加
- 設定 (JSON) の読込・授業用サンプルの展開も同じ「入力」に集約

**出力**（ファイル名は日時付き。例 `physics-data_2026-05-30_1430.xlsx`）

- データ領域 … 全シートを csv / xlsx
- 最新データフレーム … ドロップダウンで選んだ `data.frame` を csv / xlsx
- データ ＋ 最新データフレーム … まとめ方は詳細設定（xlsx は別シート / csv は別ファイル等）
- R スクリプトのみ … `.R`。`get.input()` を含む行は自動でコメントアウトし、注意書きを付与
- 設定 (JSON) … 表・スクリプト・履歴をまとめて保存
- 一括出力 (zip) … data.xlsx / dataframe.csv / script.R / setup.json / plot.png を 1 つに同梱（依存ゼロの store-only zip）
- 詳細設定：データ＋df のまとめ方、CSV 文字コード（既定 UTF-8 BOM 付き）、NA 表記、ファイル名プレフィックス

## マニュアル

学習用マニュアルは Quarto サイト（`manual-src/` → `manual/`）に集約しています。

- [生徒ガイド](https://phys-ken.github.io/web_r_for_physics/manual/) — データフレーム・作図・欠損処理・誤差棒・回帰を順に学ぶ
- [スニペット集 / チートシート](https://phys-ken.github.io/web_r_for_physics/manual/snippets.html)
- [教師ガイド](https://phys-ken.github.io/web_r_for_physics/manual/teacher.html)
- [開発者向けリファレンス](https://phys-ken.github.io/web_r_for_physics/manual/developer.html)

## ローカル起動

```bash
npm start
```

起動後に `http://127.0.0.1:4173/` を開いてください。

別冊 manual を更新するときは次を実行します。

```bash
npm run manual:render
```

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
- エディタ実行は `source(..., print.eval = TRUE)` で評価し、対話実行に近い形でトップレベル式の結果も拾います
- Data Frame タブは `.GlobalEnv` 内の `data.frame` を走査して、一覧と先頭 100 行プレビューを表示します
- エクスポート JSON は作業中のプログラミング状態も復元できるよう、UI 状態と console 履歴を含む形式に拡張しています
- Excel/CSV の読み書きは SheetJS を遅延 import（`ensureSheetJS`）。一括出力の zip は外部依存なしの store-only 実装（`buildZip` / `crc32`、UTF-8 ファイル名フラグ）
- 出力ファイル名は `timestampLabel()` で日時付与。R スクリプト出力は `get.input()` 行を正規表現でコメントアウト（`buildExportScriptText`）
- 授業用サンプルは `samples/manifest.json` と個別 JSON に分けて管理しています
- 学習用 manual は `manual-src/` の Quarto ソースから `manual/` へ静的出力します
- グラフは 1 実行ぶんの全プロットページをネイティブ解像度で保持し、複数あればサムネイルで切替（`renderCapturedImages` / `state.graphImages`）
- 図サイズは `set.figure()` の値をキャプチャ前にサンドボックス事前評価で解決し、`captureGraphics` に渡します

## ライセンス

MIT License · © 2026 Contributors（[LICENSE](./LICENSE) を参照）
