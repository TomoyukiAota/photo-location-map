# macOS の自動更新 — 修正と検証の記録

記録日: 2026-08-13 / 対象: v1.12.0

## 要約

macOS の自動更新は **v1.9.0 以前からずっと機能していなかった**。原因は、リリースに `.zip` が含まれておらず `latest-mac.yml` が `.dmg` しか列挙していないこと。electron-updater は macOS の更新に `.zip` を必須とする。

修正（zip の生成）は PR #604 で main にマージ済み。さらに、**公開済みの v1.12.0 リリースに zip を後から追加**し、**1.11.0 → 1.12.0 の自動更新が実際に動作することを確認した**。

このブランチ `release/1.12.0-add-mac-zip` は、その遡及適用に使ったビルドの記録として残している（v1.12.0 タグ + PR #604 の cherry-pick）。

---

## 原因

electron-updater 6.3.4 の `MacUpdater` は `latest-mac.yml` から zip を探し、無ければ例外を投げる。

`node_modules/electron-updater/out/MacUpdater.js:77`
```js
const zipFileInfo = findFile(files, "zip", ["pkg", "dmg"]);
if (zipFileInfo == null) {
    throw newError(`ZIP file not provided: ...`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
}
```

修正前のリリースの `latest-mac.yml` は dmg のみ（v1.9.0 / v1.10.0 / v1.11.0 / v1.12.0 すべて確認済み）。

### なぜユーザーに何も見えなかったか

`autoUpdater.checkForUpdates()` 自体は成功する。`autoDownload` が既定で true のため、続くダウンロード段階で上記の例外が発生し、`src-main/auto-update/configure-auto-update.ts` の `.catch()` が警告をログに書いて終わる。UI には何も出ない。エラーダイアログすら出ないため、ユーザーからは「更新が無い」ようにしか見えなかった。

Windows は `latest.yml` が `.exe` を指しており正常。

---

## 修正（PR #604）

### electron-builder.json

mac のターゲットに universal の zip を追加した。

```json
"target": [
  { "target": "dmg",  "arch": ["universal"] },
  { "target": "zip",  "arch": ["universal"] }
]
```

mac の zip ターゲットは `app-builder-lib/out/macPackager.js:71` で第4引数 `isWriteUpdateInfo = true` として生成されるため、これだけで `latest-mac.yml` に zip が書き込まれる。

```js
case "zip":
    mapper(name, outDir => new ArchiveTarget(name, outDir, this, true));
```

### パッケージテスト

`script/package-test/package-test-info.js` の `expectedPackageLocation`（単数）を `expectedPackageLocations`（配列）に変更し、macOS では dmg と zip の両方の存在を検証するようにした。これにより CI が退行を防ぐ。Windows / Linux の期待値は変更していない。

### 生成される zip のファイル名

ローカル: `Photo Location Map-<version>-universal-mac.zip`
GitHub 上: `Photo-Location-Map-<version>-universal-mac.zip`

命名規則は `app-builder-lib/out/targets/ArchiveTarget.js:29` の既定パターン `${productName}-${version}[-${arch}]-${os}.${ext}` による。GitHub にアップロードする際は `computeSafeArtifactNameIfNeeded`（`app-builder-lib/out/platformPackager.js:577`）がスペースをハイフンに置換する。

---

## 公開済み v1.12.0 リリースへの遡及適用

新しいバージョンを出さずに、既存ユーザーへ修正を届けるために実施した。

### なぜ成立するか

electron-updater は**インストール済みのバージョンに関係なく、実行時に最新リリースの `latest-mac.yml` を取得する**。zip を探すのは yml の `files:` 配列（`Provider.js:112` の `resolveFiles`、`Provider.js:68` の `findFile`）。したがって公開済みリリースの yml に zip エントリを足し、実体をアセットに追加すれば、**クライアント側の変更なしに既存ユーザーの挙動が変わる**。

### 手順

1. `v1.12.0` タグからブランチを切り、PR #604 の commit を cherry-pick
2. `npm ci && npm run package:mac`（`--publish never`）で署名・notarize 済みの zip を生成
3. zip と blockmap をハイフン区切りにリネーム
4. `gh release upload v1.12.0 <zip> <zip.blockmap>` で**新規追加**
5. `latest-mac.yml` を手で組み立て、`gh release upload ... --clobber` で差し替え

### アップロードした latest-mac.yml

dmg エントリは**配布済み dmg の値のまま**残した。再ビルドした dmg（size 194450360）は配布済みのもの（size 194421520）と一致しないが、dmg アセットは差し替えていないため。macOS の更新経路は zip エントリしか見ないので実害はない。

```yaml
version: 1.12.0
files:
  - url: Photo-Location-Map-1.12.0-universal-mac.zip
    sha512: oLK8Swv+dfbxfy3uuRUjOHZoAK5JKoJNv1xdvtRaEvyl8bafxG2hWulyYmM1wvQbfoilfnvbSNO8cvw9UvRt7Q==
    size: 189147734
  - url: Photo-Location-Map-1.12.0-universal.dmg
    sha512: suKU32uZGwVgN+3LCTSUgThZtLKhxPsPl/PUNF3TEWRhXr79GzLX2ro+qCyfFMT976DEgm4XtNwjx8BaZlGXsg==
    size: 194421520
path: Photo-Location-Map-1.12.0-universal-mac.zip
sha512: oLK8Swv+dfbxfy3uuRUjOHZoAK5JKoJNv1xdvtRaEvyl8bafxG2hWulyYmM1wvQbfoilfnvbSNO8cvw9UvRt7Q==
releaseDate: '2026-08-12T07:58:53.460Z'
```

### 落とし穴

**`npm run publish:mac`（`--publish always`）を使ってはいけない。** 理由は2つ。

1. `electron-publish/out/gitHubPublisher.js:84` に「公開から2時間以上経過したリリースにはアップロードしない」というガードがあり、**警告ログだけ出して何もアップロードせず成功終了**する。回避には `EP_GH_IGNORE_TIME=true` が要る。
2. ガードを外しても、`gitHubPublisher.js:111` の `overwriteArtifact` により**配布済みの dmg と dmg.blockmap が再ビルド版に差し替わる**。

`--publish never` でローカルビルドし、`gh release upload` で対象を明示する方が制御が効く。実際、この方法で dmg / dmg.blockmap / exe / exe.blockmap / latest.yml はすべて無傷のまま（`updatedAt` が 8/12 のまま）zip の追加と yml の差し替えができた。

**zip を手作りしてはいけない。** Squirrel.Mac は差し替え前に新しい app bundle の署名を検証する。electron-builder は 7za で固めており（`app-builder-lib/out/targets/archive.js:173`）、`zip -r` とは symlink や属性の扱いが違う。必ず electron-builder に生成させる。

### アップロード前に確認した内容

```
codesign --verify --deep --strict  → valid on disk / satisfies its Designated Requirement
codesign -dv                       → Developer ID Application: Tomoyuki Aota (SVD3HQN7NX)
xcrun stapler validate             → The validate action worked!
spctl -a -vvv -t exec              → accepted / source=Notarized Developer ID
lipo -archs                        → x86_64 arm64
unzip -l                           → ルートが "Photo Location Map.app/"、Framework の symlink 保持
shasum -a 512 | base64             → yml の sha512 と一致
```

---

## 検証結果

**1.11.0 を起動すると自動更新が動作し、1.12.0 になることを確認した（2026-08-13）。**

これで v1.9.0 以前から続いていた不具合が、実動作レベルで解消されたことが確認できた。

---

## 既存ユーザーへの効果

クライアント側のコード変更は不要。zip を含むリリースが1つあれば、既にインストール済みの macOS ユーザーが自動更新を受け取れる。

| インストール済み | electron-updater | 結果 |
|---|---|---|
| v1.9.0 以前 | 5.3.0 | 同じ設計のため動作するはずだが未確認 |
| v1.10.0 / v1.11.0 | 6.3.4 | 1.12.0 に更新される（Intel → Universal 移行）|
| v1.12.0 | 6.3.4 | version が同じなので何も起きない（既に Universal）|

### arch の扱い

universal の zip はファイル名に `arm64` を含まない。`MacUpdater.js:70-76` の arch フィルタは、Apple Silicon 機でも Intel 機でもこの universal の zip を選択する。**zip は1つで足りる。**

---

## 今後の注意点

- **プレリリースでは自動更新が無効。** `src-main/auto-update/configure-auto-update.ts` の `isPrereleaseVersion()` で早期 return する。alpha / beta / rc では検証できない。また electron-updater の GitHub プロバイダは既定でプレリリースを更新候補にしない
- **macOS のリリースアセットのサイズが約2倍になる。** dmg 約194MB に加えて zip 約189MB が付く
- main は対応済みで、パッケージテストが zip の生成を検証するため、次回以降のリリースで特別な作業は不要

---

## 関連する背景

- v1.12.0 から macOS パッケージは **Universal Binary**。それ以前は Intel ビルドのみで、Apple Silicon 機では Rosetta 経由で動作していた
- Rosetta は **macOS 27 までは通常どおり利用可能**、**macOS 28 以降は一部の古いゲーム向けに限定**される（[Apple](https://support.apple.com/en-us/102527)）
- そのため、既存の macOS ユーザーを Universal Binary に移行させる手段として自動更新が重要。自動更新が効かないと、手動で再ダウンロードしない限り Intel ビルドのまま残る
- ダウンロードページの mac リンクは PR #603 で `-universal` 付きに更新済み

---

## 参照

| 対象 | 場所 |
|---|---|
| 修正 | [PR #604](https://github.com/TomoyukiAota/photo-location-map/pull/604) |
| ダウンロードリンク更新 | [PR #603](https://github.com/TomoyukiAota/photo-location-map/pull/603) |
| 設定 | `electron-builder.json` の `mac.target` |
| パッケージテスト | `script/package-test/package-test-info.js` |
| 自動更新の実装 | `src-main/auto-update/configure-auto-update.ts` |
| zip 必須の根拠 | `electron-updater/out/MacUpdater.js:77` |
| latest-mac.yml への書き込み | `app-builder-lib/out/macPackager.js:71` |
| zip の命名規則 | `app-builder-lib/out/targets/ArchiveTarget.js:29` |
| GitHub 安全名への変換 | `app-builder-lib/out/platformPackager.js:577` |
| 公開済みリリースへのアップロード制限 | `electron-publish/out/gitHubPublisher.js:84` |
