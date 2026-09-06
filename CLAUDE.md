# CLAUDE.md

アプリの内容と貢献方法は [`README.md`](README.md) と
[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) にある。ここには
**セッションの入口でだけ必要なこと**を書く。

## 知識はこのリポジトリに置く（memory を使わない）

memory（`~/.claude/projects/…/memory/`）は **clone ごと・マシンごとに別**で、
持ち歩けない。本人は複数の PC で作業するので、memory に置くと別の PC では
最初から無い。だから**このリポジトリに関わることは全部リポジトリに置く**。

お願いではなく、[`.claude/settings.json`](.claude/settings.json) で
`"autoMemoryEnabled": false` にして**機能ごと切ってある**（読み書きとも止まる）。
追跡されている設定なので clone しても PC を変えても効く。

**git 管理されていないディレクトリでの作業は例外**で、そちらは memory を使う
（置き場が他に無いため）。

## mac の署名付きビルドは自分で走らせてよい

`npm run package:mac`（および他の packaging スクリプト）は**そのまま実行してよい**。
署名と notarize の認証はこのマシンに用意済みで、対話は要らない。

- Developer ID Application 証明書はログインキーチェーンに在るので
  `CSC_LINK` / `CSC_KEY_PASSWORD` は不要
- `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` はシェルの
  プロファイルで export 済み。`afterSign` フックの `script/notarize/notarize.js`
  がこれを読む

所要はおおむね 5 分（Angular の production ビルド 1 分＋universal packaging 数分＋
Apple 側の notarize 待ち 2 分ほど）。**バックグラウンドで走らせてログを読む**。

`PLM_PACKAGE_TEST=true`（`npm run test:package` が設定する）は notarize を飛ばすので、
**notarize 済みの成果物が要る場面では package test は代用にならない**。

成果物を GitHub へ publish するのは外向きの別作業なので、そこは必ず確認を取る。

## 上流のバグには、狭い回避策を選ぶ

間欠的な失敗が上流の既知バグだと分かったとき、**特殊なビルド構成や major 版の
アップグレードではなく、狭い回避策（リトライ・ガード）を提案する**。

**なぜ**: このリポジトリのビルドとリリースの経路（electron-builder・NSIS・
notarize・auto-update）は**利用者に届く部分**。beta のツールや 2 メジャー飛ばしの
更新は、CI でしか現れない利益のためにリリースを壊しかねない。

回避策は**証拠が許すだけ狭く**する。例: Windows インストーラのリトライは
win32 かつ終了コード 3221225477 のときだけに絞ってあるので、本物の失敗は今も表に出る。
調査の記録（証拠・棄却した仮説・他の直し方を選ばなかった理由）は issue ではなく
**回避策の隣のコメント**に、`TL;DR:` / `Details:` の形で書く。

## CI の失敗は、再実行する前に分類する

PR を緑に保つよう頼まれたら、**失敗したジョブのログを読んで原因を分類してから**
再実行する。push と pull_request の両トリガが同じコミットをビルドするので、
**重複した実行と見比べる**——同じコミットで片方が通っているなら環境要因。

**なぜ**: 何も見ない再実行は本物の欠陥を隠す。このリポジトリでは Windows の
間欠的な失敗が数週間 flake に見えていたが、ちゃんと読んだらインストーラが
`0xC0000005` で落ちて**インストール自体されていなかった**。

自動で再実行してよいのは**インフラ起因と分かったものだけ**（GitHub Releases の
ダウンロード失敗は `socket hang up`・`Get "https://github.com/...": EOF`・
`status code 5xx` として出る）。それ以外は止めて報告する。

**失敗したチェックはその都度扱う**。全チェックの完了を待たないこと——
`macos-26-intel` のジョブは 15〜28 分かかるので、待つと Windows の失敗が
そのあいだ放置される。

## Windows の CI が publish するのは意図的

`.github/workflows/ci-on-windows.yml` は `[Publish to GitHub Releases]` の手順
（`npm run publish:windows`）を**すべてのブランチのすべての push で**走らせる。
これは意図的で、**publish が今も動くことをリリース当日ではなく普段から確かめる**ため。
結果として現れる draft リリース（`1.12.1-alpha` など）は**予期された副産物**であって、
消し忘れのゴミではない。

**この手順を消す・条件を付ける提案をしない。draft リリースを片付け作業として扱わない。**

なおこの形で確かめられているのは Windows の publish 経路だけ。
`ci-on-ubuntu.yml` の同等手順はコメントアウトされており、macOS の publish は
CI に無い（署名と notarize の認証が要るため。上の節を参照）。

## このリポジトリは公開されている

`TomoyukiAota/photo-location-map` は **public**。ここに残るもの——PR のタイトルと
本文、issue、**コミットメッセージ**、ブランチ名、コード中のコメント——は誰でも読める。

**非公開のもの（非公開リポジトリの名前、私的に使っている外部サービス、個人の写真など）
を書かない。** 参照が要る作業でも、出典を示さずに**内容だけ**転記する。
迷ったら書かずに確認する。
