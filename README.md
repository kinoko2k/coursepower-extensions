# CoursePower Extensions

CoursePowerの各種機能を強化・改善するFirefox向け拡張機能です。

※Firefox用に作成したものですので、Chromeなどの他ブラウザで使用できるかは分かりません。

---

## Firefox へのアドオン追加方法

### 1. 一時的なアドオンとして追加する方法

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

### 2. パッケージファイル（`.zip`）から追加する方法

> [!IMPORTANT]
> **親フォルダ（`coursepower-extensions` フォルダ自体）を右クリックして圧縮しないでください。**
> 親フォルダごと圧縮すると、ZIPファイル内の直下（ルート）に `manifest.json` が配置されなくなるため、`No manifest.json was found at the root of the extension.` というエラーが発生します。必ずフォルダ内に入って `manifest.json` がある階層でファイル群を選択して圧縮してください。

1. **フォルダを開いて中身のみを圧縮します（重要）**
   - `coursepower-extensions` フォルダを**ダブルクリックして開き**、中にあるすべてのファイル・フォルダ（`manifest.json`、`src` ディレクトリなど）を複数選択します。
   - 選択した状態で右クリックし、`.zip` 形式で圧縮します。

2. Firefox のアドレスバーに以下を入力して「アドオンとテーマ」管理画面を開きます。
   ```text
   about:addons
   ```
3. 画面右上にある **歯車アイコン（設定メニュー）** をクリックします。
4. **「ファイルからアドオンをインストール...」** を選択します。
5. 作成した `.zip` ファイルを選択し、インストール確認画面で「追加」をクリックします。

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
