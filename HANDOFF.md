# MG-AIOS｜工程交接入口（HANDOFF）

> 狀態：**DRAFT / 待新 Codex 工作階段驗收**。這是工程交接索引，不是第二套正式資料庫，也不是新的自動化服務。
>
> 安全：本 Repository 是公開的。**禁止寫入**客戶姓名、電話、地址、未公開售價／底價、憑證、Token、環境變數、正式案件資料、私人對話或完整敏感 Log。

## 1. 本交接的範圍

- 專案：`jakey650310-crypto/mg-aios-v2`
- 初始盤點日期：2026-10-20（台灣／曼谷時區）
- 初始 GitHub `main` 參考提交：`2d0a31d70cf6d899b594b0a47bcd7587962c02f3`（2026-10-10）
- 本次變動：**只在獨立分支提出 HANDOFF.md 草稿**；不得據此宣告 `main` 已更新、公司電腦已同步或程式已部署。
- 正式業務資料：Google Drive《★名廣房仲中心》；Git Repository 只存工程程式／不含敏感資料的驗收紀錄。不得複製正式房源或客戶資料到此檔。

## 2. 唯一來源與閱讀順序

每個接手的 Codex 工作階段在執行前依序：

1. `AGENTS.md`：Repository 共用安全規則、CHECKPOINT_FIRST、DELTA_ONLY、UNKNOWN=STOP、交接摘要格式。
2. 本 `HANDOFF.md`：**當次交接入口**；以下狀態可能隨任務更新，需核對日期和 commit。
3. `.codex/checkpoints/`、`.codex/reports/`：按任務查核客觀證據；不能把候選／舊證據誤認為本輪 PASS。
4. `README.md`、`PRODUCT_SPEC.md`、`CHANGELOG.md`：在本輪有關時讀取，不重掃無關歷史。
5. 若以上資料互相矛盾，以**新且經驗證的正式來源**及明確使用者授權為準；先揭露衝突，不自行選定。

## 3. 最近一次盤點｜2026-10-20

### 已確認（只限 GitHub 遠端主分支唯讀盤點）

- `AGENTS.md` 存在，已規定分階段自主執行、Checkpoint／Delta、停損與交接摘要。
- `.codex/checkpoints/` 和 `.codex/reports/` 存在。
- `CHANGELOG.md`、`README.md`、`PRODUCT_SPEC.md` 存在。
- 初始盤點時 `main` 沒有 `HANDOFF.md`。
- 歷史報告 `.codex/reports/shared-rules-validation.md` 記載先前的規則檢查 8/8 與本機 prompt loader 檢查 2/2；屬**舊驗證紀錄**，不等於新雲端工作階段已驗證。

### BLOCKED／待確認

- **LOCAL_SYNC_UNKNOWN**：無法從 GitHub 確認公司 Windows 工作目錄的 HEAD、未提交修改與未推送提交。
- **NEW_SESSION_NOT_TESTED**：尚未在全新的 Codex 工作階段驗證能依本檔準確恢復進度。
- **NOT_MERGED**：此檔先在獨立分支／Draft PR，未納入正式 `main`。
- **NO_RUNTIME_TEST**：本輪不啟動網站、不執行程式回歸、不聲稱功能已發布。

## 4. 下一個最小必要動作（P0 → P2）

**P0｜先核對公司電腦（唯讀）**

在公司電腦原本的 `mg-aios-v2` 工作目錄核對：
- `git status --short`（有無未提交修改）
- `git branch --show-current`（目前分支）
- `git rev-parse HEAD`（目前提交）
- `git log -1 --format="%h %cI %s"`（最近提交）

只回報狀態，不執行 `reset`、`clean`、`pull`、`push`、`merge`、`checkout` 等可能改動工作目錄的命令。**若本機與 GitHub 不同，先保留本機工作並釐清差異。**

**P1｜新 Codex 工作階段交接驗收（先唯讀）**

讓全新工作階段讀取 `AGENTS.md`、本檔及相關 Checkpoint，回答：
- 現在的 HEAD／分支與最新可核實版本是什麼？
- 哪些事項已有 PASS 證據？來源是哪一份？
- 哪些仍屬 BLOCKED／NOT_TESTED？
- 依 CHECKPOINT_FIRST、DELTA_ONLY，下一步是什麼？
- 目前有哪些禁止事項與資料安全界線？

以上答案需能逐項與文件／Git 狀態核對。讀不到檔案、版本不一致或自稱未經驗證的功能已完成，均不能判定 PASS。

**P2｜經核對後再處理導入**

先檢視 Draft PR 與本機差異，確認本檔沒有敏感資料或與既有規則衝突；經驗收後才考慮合併 `main`。本草稿不授權自動合併、部署、修改正式資料或聯絡客戶。

## 5. 後續任務的交接格式（只更新新證據）

每次**真正完成**可恢復的工程切片或遇到阻塞時，更新此交接入口內的「最後更新／最新版本／目前狀態／下一步」；詳細測試證據存於既有 `.codex/checkpoints/` 與 `.codex/reports/`，不要把完整歷史全部複製回來。

- 工作任務：
- 最後更新（含時區）：
- Repo／分支／Commit：
- 本輪新增變化（Delta）：
- 已確認 PASS（檢查方式＋證據路徑）：
- FAIL／BLOCKED／NOT_TESTED：
- 下一個最小必要動作：
- 禁止事項／需人工授權：
- 詳細報告或 Checkpoint 路徑：

> 接手原則：**先讀來源，再核對版本，只做尚未完成且獲授權的最小步驟；無證據不宣稱完成。**
