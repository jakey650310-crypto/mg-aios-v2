# MG-AIOS V4｜AI 工作平台

MG-AIOS 不是 CRM、不是 Notion、不是另一個 ChatGPT。

MG-AIOS 是 AI 工作平台。

ChatGPT / Claude / Gemini 負責思考、分析、生成。

MG-AIOS 負責工作中心、CRM、Case、Contact、Property、Timeline、Event、Journey、AI Knowledge、搜尋、提醒與 Dashboard。

「準備 AI 任務」只在本機整理案件內容並複製，不呼叫 OpenAI API，不產生 API 費用。

目前核心採用 Case-first 架構：所有 Journey、Timeline、Google Calendar、Tasks、Notes、Files、今天建議、最近學到、長期判斷都掛回 Case。

## 功能

- 單一輸入窗口：貼上 ChatGPT 固定格式整理結果，預覽後才建立案件
- 固定格式解析：聯絡人、物件、案件名稱、案件類型、使用者指定身分、摘要、重要發現、階段、下一步、提醒日期、文案或話術
- 確認寫入：一次確認只建立一個主要 Case 與一筆主要 Timeline / Event 紀錄
- 防重複：同一份整理結果不會重複建立案件，同一份 AI 回答不會重複新增 Timeline
- 今日工作中心：只顯示今天最值得處理的案件，不顯示機器分數
- Case Detail：Journey、案件紀錄、Google Calendar、Tasks、Notes、Files、AI 建議集中在同一頁
- Case 工作台：集中顯示案件現況、聯絡人、物件、角色、類型、階段、摘要、重要發現、下一步、提醒日期與外部工具入口
- Event Engine：Timeline、Calendar、AI Today 共用同一份 Event 資料
- Context Builder：把 Case、Contact、Property、Journey、Events、AI 學到的內容整理成任務內容
- AI 工作台：系統在背景整理完整案件脈絡，可直接貼到 ChatGPT / Claude / Gemini
- AI 回寫：貼上 AI 回答後，一鍵解析成今天建議、最近學到、長期判斷與案件紀錄
- localStorage 本機保存
- 手機優先，不需登入

## 產品發展三階段

Phase 1：AI Workspace，管理 AI、整理知識。

Phase 2：AI Assistant，開始理解案件並主動提醒。

Phase 3：AI Manager，主動安排工作、分析、排序與提醒。

## 啟動

```powershell
npm install
npm run dev
```

預設網址：`http://localhost:8770`

## 資料安全 P0

目前仍使用 localStorage，沒有正式 Database / ORM / Migration。這代表：

- 重新整理同一瀏覽器後資料仍存在
- 重新部署後，同一瀏覽器 localStorage 仍存在
- 換裝置、清除瀏覽器資料、無痕模式或瀏覽器損毀會遺失資料
- Production / Preview 沒有正式資料隔離機制

正式跨裝置與長期保存需進入下一個 P0：

- Supabase PostgreSQL
- Migration
- Backup / Restore
- Audit Log
- 封存取代硬刪除
- 部署後資料不得消失
