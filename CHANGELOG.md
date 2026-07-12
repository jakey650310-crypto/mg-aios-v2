# MG-AIOS V2 Daily Build Changelog

MG-AIOS 採用 Daily Build。

每天至少發布一個可以操作、可以驗收、可以開始使用的小版本。
不累積大量功能一起發布，讓系統每天都比昨天更好用。

## 2026-07-09

### 今天新增什麼

- 本次 Sprint：新增「貼上 ChatGPT 整理結果」單一輸入窗口。
- 支援固定格式解析：聯絡人、物件、案件名稱、案件類型、使用者指定身分、案件摘要、重要發現、目前階段、下一步、提醒日期、最終文案或話術。
- 新增分類預覽頁，每個欄位可手動修改，缺少必要欄位會顯示提醒。
- 確認後一次性建立或關聯 Contact、Property、Case、Journey 與一筆主要 Event / Timeline。
- 同一份整理結果使用 source hash 防重複，避免快速連點或重複貼上造成多筆案件。
- Case 卡片列表可點擊進入 Case 工作台。
- Case 工作台新增案件現況與外部工具入口：ChatGPT、住商 AI 生態圈、LINE、Google Calendar、591、Facebook。
- README 明確標示目前仍為 localStorage，尚未達成正式資料庫永久保存。
- V4 產品定位校正：MG-AIOS 是 AI 工作平台，不是 CRM、Notion 或另一個 ChatGPT。
- 介面名稱從「AI 店長」調整為「AI 工作台」。
- 首頁文案改為 AI Workspace：MG-AIOS 管理案件脈絡與 AI 工具入口，ChatGPT / Claude / Gemini 負責思考，使用者負責成交。
- 產品規格新增三階段：Phase 1 AI Workspace、Phase 2 AI Assistant、Phase 3 AI Manager。
- 明確規定目前只做 Phase 1，不提前假裝 MG-AIOS 已經是 AI Manager。
- V3.1 UX P0：AI 店長九宮格模式可正常切換，並顯示目前模式與目的。
- 「準備 AI 任務」新增 Loading 狀態：整理案件資料、建立任務、完成複製。
- 新增 Toast：「✓ Prompt 已複製」與「✓ AI 回答已解析」。
- ChatGPT / Claude / Gemini 按鈕會先確認任務已準備並複製，再開啟對應 AI。
- AI 店長新增固定流程提示：選工作 → 準備 AI 任務 → ChatGPT → 貼回 AI 回答 → 解析 AI 回答 → 完成。
- AI 回答新增回寫碼，同一份 AI 回答不會重複新增 Timeline。
- V3 產品定位調整：MG-AIOS 是 AI 工作中心，不是另一個 AI。
- AI 助理回寫流程改為一顆「解析 AI 回答」。
- 移除「存成 AI Summary」「存成 AI Insight」「更新 AI Brain」「寫入案件紀錄」四個手動分類按鈕。
- 貼上 ChatGPT / Claude / Gemini 回答後，MG-AIOS 會自動萃取 Summary、Insight、Brain、Timeline，並更新 Journey 建議與今日排序。
- 解析 AI 回答採用本機規則式整理，不呼叫 OpenAI API，不產生 API 費用。
- 完成 P0 核心重構第一版：Case 成為系統中心。
- 新增 Case Detail 頁，集中顯示 Journey、案件紀錄、Google Calendar、Tasks、Notes、Files、AI 建議。
- Google Calendar 不再是獨立模組，所有 Calendar Event 必須綁定 Case ID。
- 新增 Event Engine 欄位：事件日期、來源、優先級、建立者、完成時間。
- 新增 Case Task，待辦事項掛回 Case。
- 新增 AI Summary、AI Insight、AI Brain 到 Case。
- 新增 Context Builder，將 Case、Contact、Property、Journey、Events、Attachments 整理成純文字 Context。
- 新增 Prompt Builder，使用 Context + Prompt Template 產生可貼到 ChatGPT / Claude / Gemini 的 Prompt。
- Case Detail 新增「AI 助理」：快速摘要、LINE 回覆、電話話術、成交分析、下一步建議、591 文案、FB 文案、短影音腳本、自由詢問。
- AI 回答可貼回 MG-AIOS，並存成 AI Summary、AI Insight、AI Brain，或寫入案件紀錄。

### 今天改善什麼

- 使用者不需要知道 AI 回答要存到哪裡；分類與保存是 MG-AIOS 的工作。
- AI Brain 只保留長期有效知識，Timeline 只記錄發生過什麼，AI Insight 只保留會影響下一次成交判斷的洞察。
- 首頁 TOP5 不再顯示 29184 這類機器分數。
- 首頁卡片改顯示標籤、成交率、下一步與一句理由。
- 點擊首頁 TOP5 會進入 Case Detail，而不是進入零散模組。
- 取消獨立 Calendar Center 入口，行程回到每個案件內管理。
- README 與產品規格改為 Case-first 架構。

### 下一步做什麼

- P0 資料安全：導入 Supabase PostgreSQL、Migration、Backup / Restore、Audit Log。
- 將刪除流程改為封存與恢復。
- 把現有 localStorage 資料遷移到正式資料庫。
- 讓 Prompt Launcher 與行銷中心共用同一套 Context Builder。

## 2026-07-07

### 今天新增什麼

- MG-AIOS v2 升級為 AI 房仲營運系統架構。
- 新增 Property Model，所有資料以物件為核心關聯。
- 新增 Contact Model，一位客戶可同時是 Owner、Buyer、Tenant、Referrer。
- 新增 Operating Journey Model，支援 Buyer、Owner、Tenant、Repair 四種旅程。
- 新增 Repair、Files、Financial、AI Center 資料模型。
- 新增 Operating System State Management，六大模組共用同一份 localStorage 狀態。
- 新增 AI Priority Score：成交價值 × 成交機率 × 時效性 × 逾期天數。
- 首頁新增六大模組總覽：Dashboard、Property、Contact、Journey、Repair、AI Center。
- 首頁新增 AI 今天最重要 TOP5 與今日營運摘要。
- Journey 詳細頁升級為「客戶作戰頁」。
- 新增客戶儀表板：關係指數、委託機率、轉介紹機率、成交價值。
- 新增客戶旅程視覺化節點。
- 新增 AI 下一步、最新追蹤、AI 建議、客戶資料、房屋資訊、LINE 紀錄、檔案區塊。
- 客戶頁支援電話、標籤、潛力、關係、委託、轉介紹、房屋與追蹤資料維護。
- Journey 從展示卡片升級為可正式使用的 CRM。
- 每張 Journey 支援查看、修改、刪除、複製與歷程紀錄。
- Journey 卡片新增右上角「功能選單」：編輯、刪除、複製、歷程紀錄。
- 點擊 Journey 卡片會進入手機優先的全螢幕編輯頁。
- 編輯頁可修改客戶姓名、Journey 類型、目前階段、下一步、成交機率、成交價值、預計成交日期、原因、風險、AI 建議、備註。
- 新增「AI 更新 Journey」，可貼聊天內容、LINE 截圖、照片或語音輸入，AI 分析後由使用者確認才寫入。
- 新增 Journey 修改歷程，保留修改時間、修改人、修改前與修改後。
- 新增 AI Inbox v2。
- 首頁「新增」支援貼文字、上傳 LINE 截圖、上傳照片。
- 新增 `/api/ai-inbox`，由 MG-AIOS 伺服器端呼叫 ChatGPT API。
- AI 回傳 Journey 草稿 JSON：Person、Journey、Stage、Priority、Next Action、Summary。
- 新增人工確認流程：接受、修改、取消。
- 採用 Friction Driven Development（摩擦驅動開發）。
- 新增 Product Backlog 頁面 `/backlog`。
- Product Backlog 可記錄摩擦點、發現日期、影響成交程度、解決方案、狀態。
- 首頁新增「摩擦待辦」入口。
- 首頁改為 AI Decision Dashboard。
- 新增「今日最重要 TOP 5」，依成交價值排序。
- 新增「高優先事件」，收斡旋、見面談、交屋、簽約、等待回覆優先顯示。
- 新增「等待中的案件」，集中顯示等待屋主、買方、貸款、代書、租客的事項。
- 新增「今天完成」，完成後從主要清單消失，只保留完成紀錄。

### 今天改善什麼

- 資料不再只以 Journey 卡片為中心，改成 Property 關聯 Contact、Journey、Repair、Files、Financial、AI 分析。
- 未來新增租賃管理、修繕管理、收租管理、591刊登、PDF售屋簡報、LINE整合、Google Calendar，不需要重寫核心資料層。
- Journey 修改後會立即更新 Dashboard 的 TOP5 排名、成交價值、成交率與下一步。
- 編輯不使用桌面彈窗，改用 iPhone 友善的 Full Screen 編輯頁。
- MG-AIOS 不再要求使用者先到 ChatGPT 整理摘要後再貼回系統。
- AI 先整理，使用者只確認，不重複輸入 AI 已能辨識的資訊。
- 若 `OPENAI_API_KEY` 尚未設定，會明確提示，不會建立錯誤 Journey。
- 完成 MVP Freeze 收尾驗收，今天停止新增功能，目標改為「可以每天實際使用」。
- 修正 ESLint 設定缺失，讓 Daily Build 收尾檢查可以正常執行。
- 新功能不再以功能數量為優先，而是先確認是否能消除實際使用摩擦。
- 下一個 Daily Build 優先處理高影響摩擦。
- 首頁不再呈現 CRM 清單或大量資料管理畫面。
- 首頁聚焦回答：「今天要先做什麼？」
- 每張卡片固定顯示 Person、Journey、下一步、原因、風險、預估成交價值。
- 保留手機優先、大按鈕、大字體與繁體中文介面。

### MVP Freeze 驗收

- 首頁可以正常開啟。
- AI Inbox 可以用 ChatGPT 摘要建立 Journey。
- Person 會自動成為 Journey 卡片上的主體，不需要另外填 CRM 表單。
- Journey 狀態可以更新為完成。
- 完成後會從今日 TOP 5 消失，並保留在今天完成紀錄。
- 首頁可以看到今日待處理事項。
- 手機尺寸檢查正常，沒有水平溢出。
- Product Backlog 可以記錄使用摩擦。
- 正式網址與 `/backlog` 頁面皆可正常開啟。
- `npm run build` 通過。
- `npm run lint` 通過。

### 下一步做什麼

- 設定正式環境 `OPENAI_API_KEY`，讓正式網址可以直接呼叫 ChatGPT API。
- 用真實 LINE 截圖測試 AI Inbox v2 的辨識品質。
- 每天實際使用後，先把卡住的地方記錄成 Improvement。
- 優先消除 Product Backlog 中「高」影響摩擦。
- 讓 AI Inbox 貼上 ChatGPT 摘要後，更精準建立或更新 Journey。
- 優化成交價值排序規則。
- 增加每日版本驗收紀錄。
