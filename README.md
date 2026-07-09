# MG-AIOS V2｜AI 房仲作戰中心

MG-AIOS 不是另一個 AI。ChatGPT / Claude / Gemini 是 AI 大腦，MG-AIOS 是案件資料、流程、記憶與整合系統。

目前核心採用 Case-first 架構：所有 Journey、Timeline、Google Calendar、Tasks、Notes、Files、AI Summary、AI Insight、AI Brain 都掛回 Case。

## 功能

- 今日工作中心：只顯示今天最值得處理的案件，不顯示機器分數
- Case Detail：Journey、案件紀錄、Google Calendar、Tasks、Notes、Files、AI 建議集中在同一頁
- Event Engine：Timeline、Calendar、AI Today 共用同一份 Event 資料
- Context Builder：把 Case、Contact、Property、Journey、Events、AI 記憶整理成純文字 Context
- Prompt Builder：用 Context + Prompt Template 產生可貼到 ChatGPT / Claude / Gemini 的 Prompt
- AI 回寫：AI 回答可存成 AI Summary、AI Insight、AI Brain，或寫入案件紀錄
- localStorage 本機保存
- 手機優先，不需登入

## 啟動

```powershell
npm install
npm run dev
```

預設網址：`http://localhost:8770`

## 資料安全 P0

目前仍使用 localStorage。正式跨裝置與長期保存需進入下一個 P0：

- Supabase PostgreSQL
- Migration
- Backup / Restore
- Audit Log
- 封存取代硬刪除
- 部署後資料不得消失
