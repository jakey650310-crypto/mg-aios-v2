# MG-AIOS V2 Daily Build Changelog

MG-AIOS 採用 Daily Build。

每天至少發布一個可以操作、可以驗收、可以開始使用的小版本。
不累積大量功能一起發布，讓系統每天都比昨天更好用。

## 2026-07-07

### 今天新增什麼

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
