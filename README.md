# CoursePower Extensions

CoursePowerの各種機能を強化・改善するFirefox向け拡張機能です。

※Firefox用に作成したものですので、Chromeなどの他ブラウザで使用できるかは分かりません。

---

## Firefox へのアドオン追加方法

### 1. リリースページからダウンロードする

1. リリースページを開く
   https://github.com/kinoko2k/coursepower-extensions/releases
2. 最新のリリースの中から、"coursepower-extensions.xpi" をダウンロードする
3. ダウンロードしたファイルを開いて、アドオンインストールを確認する

---

### 2. 一時的なアドオンとして追加する方法

ソースコードをそのまま読み込みます。

1. Firefox を起動します。
2. アドレスバーに以下の URL を入力してアクセスします。
   ```text
   about:debugging#/runtime/this-firefox
   ```
3. ページ内の **「一時的なアドオンを読み込む...」** ボタンをクリックします。
4. ファイル選択ダイアログが開くので、このプロジェクトのフォルダ内の `manifest.json` を選択して開きます。
5. アドオンが正しく読み込まれ、拡張機能一覧に追加されます。アドオンメニューからポップアップ画面や設定画面にアクセスできます。

> [!NOTE]
> 「一時的なアドオンを読み込む」方法で追加した場合、Firefox を終了・再起動すると読み込みが解除されます。継続して使用したい場合や次回再起動時にも利用したい場合は、再度同じ手順で `manifest.json` を読み込んでください。

---

## ディレクトリ構成

```text
coursepower-extensions/
├── manifest.json
├── README.md
└── src/
    ├── background/
    │   └── background.js
    ├── content/
    │   └── content.js
    ├── options/
    │   ├── options.html
    │   └── options.js
    └── popup/
        ├── popup.html
        └── popup.js
```
