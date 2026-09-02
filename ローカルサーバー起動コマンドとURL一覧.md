# ローカルサーバー起動コマンドとURL一覧

最終更新：2026-09-02

## 通常開発：v2.4 ESM版

現在の推奨開発版です。新しいPowerShellを開いて実行します。

```powershell
cd "C:\Users\user\Desktop\アプリ\01_現役\エレベーター\elevator_threejs_v2.4-esm"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

URL：<http://127.0.0.1:5173/>

`npm install`は初回、または`package.json`・`package-lock.json`が変わったときに実行します。通常の起動では`npm run dev`だけで構いません。

## 公開用ビルドの確認：v2.4 ESM版

```powershell
cd "C:\Users\user\Desktop\アプリ\01_現役\エレベーター\elevator_threejs_v2.4-esm"
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

URL：<http://127.0.0.1:4173/>

`npm run build`で`dist/`を作成し、`npm run preview`で公開用ビルドを確認します。

## 旧方式：v2.4 CDN版

```powershell
cd "C:\Users\user\Desktop\アプリ\01_現役\エレベーター\elevator_threejs_v2.4"
python -m http.server 8004 --bind 127.0.0.1
```

URL：<http://127.0.0.1:8004/>

Three.jsをCDNから読み込むため、インターネット接続が必要です。

## 旧方式：v2.3 CDN版

```powershell
cd "C:\Users\user\Desktop\アプリ\01_現役\エレベーター\elevator_threejs_v2.3"
python -m http.server 8003 --bind 127.0.0.1
```

URL：<http://127.0.0.1:8003/>

Three.jsをCDNから読み込むため、インターネット接続が必要です。

## サーバーの停止

サーバーを起動したPowerShellで、`Ctrl + C`を押します。

## 注意

- コマンドは一度に複数起動せず、必要なバージョンだけ実行します。
- 「ポートが使用中」と表示された場合は、同じサーバーがすでに起動していないか確認します。
- `127.0.0.1`へ限定しているため、同じPCからのみアクセスできます。
- ESM版の通常開発には`5173`、公開用確認には`4173`を使用します。
