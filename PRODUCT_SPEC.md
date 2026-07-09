# MG-AIOS Product Specification v1.0

## 產品定位

MG-AIOS 不是 CRM。

MG-AIOS 是 AI 房仲營運系統。

它的目的不是管理客戶，而是每天幫房仲找到最有價值的下一步行動。

AI 負責：
- 找資訊
- 整理資訊
- 排序資訊
- 提醒資訊
- 產生內容

人負責：
- 建立關係
- 判斷機會
- 談判
- 成交

## 開發原則

### 使用者介面

全部使用繁體中文。

主要介面包含：
- 首頁
- 物件中心
- 聯絡人
- 案件旅程
- 買賣管理
- 租賃管理
- 修繕管理
- 文件中心
- 行銷中心
- AI 助理
- 設定

不要出現不必要的英文介面。

### 開發端

程式碼、API、資料庫、型別與模型維持英文。

主要內部模型包含：
- Property
- Contact
- Journey
- Repair
- Rental
- Marketing
- Document
- Finance
- AI Center

## 首頁

首頁不要變成資料庫。

首頁只回答：

今天哪些工作最值得先做？

AI 必須依照以下因素排序：
- 成交價值
- 成交機率
- 時效性
- 逾期天數
- 重要程度

首頁只顯示：
- 今日 TOP5
- 今日提醒
- 今日風險
- 今日待辦

## 核心資料原則

### Case 是唯一核心

所有資料都必須掛回 Case。

Case 包含：
- Contact
- Property
- Journey
- Timeline / Event
- Google Calendar
- Tasks
- Notes
- Files
- AI Summary
- AI Insight
- AI Brain

AI Today、Calendar、Prompt、Journey 都不是獨立資料來源，而是 Case 的不同 View。

### Google Calendar 原則

Google Calendar 不是獨立模組。

Calendar Event 必須與 Case ID 綁定，並在 Case Detail 中管理。

首頁只顯示今天有哪些案件需要處理；點進案件後才看到 Journey、Timeline、Google Calendar、待辦、備註、文件與 AI 建議。

## 六大核心能力

### 1. 首頁

AI 今日工作中心。

### 2. 案件中心

一個 Case 是一段成交或服務流程。

所有資料都掛回 Case。

包含：
- 物件
- 聯絡人
- 旅程
- 事件
- 待辦
- 文件
- AI Summary
- AI Insight
- AI Brain

### 3. 聯絡人

一位人只有一份資料。

可以同時是：
- 屋主
- 買方
- 租客
- 介紹人
- 修繕廠商

不要重複建立。

### 4. 案件旅程

案件旅程類型：
- 買方
- 屋主
- 租客
- 修繕

AI 永遠知道目前在哪一個階段，並推薦：
- 下一步
- 原因
- 風險

### 5. 修繕管理

管理：
- 報修
- 通知師傅
- 估價
- 施工
- 完工
- 付款
- 保固

### 6. AI 助理

AI 可以：
- 整理摘要
- 分析成交率
- 排序今天工作
- 生成 LINE 話術
- 生成追蹤建議
- 提醒風險

## 下一階段

新增：
- 租賃管理
- 文件中心
- 財務中心
- 行銷中心

## Prompt Launcher

不要重複開發 ChatGPT 已經做得好的 AI 生成能力。

MG-AIOS 負責：
- 整理 Case Context
- 產生 Prompt
- 複製 Prompt
- 開啟 ChatGPT / Claude / Gemini
- 儲存 AI 回答結果

Prompt Template 包含：
- 快速摘要
- LINE 回覆
- 電話話術
- 成交分析
- 下一步建議
- 591
- Facebook
- 短影音腳本
- 自由詢問

## 文件中心

所有文件自動綁定 Property。

例如：
- 照片
- 360
- 影片
- 權狀
- 謄本
- 地籍圖
- PDF
- 售屋簡報
- AI 文案

## 財務中心

每間物件管理：
- 買賣佣金
- 租賃佣金
- 修繕收入
- 代墊
- 付款
- 收款
- 獲利分析

## MG-AIOS 開發憲章

1. 使用者介面全部繁體中文。
2. 程式碼、API、資料庫全部英文。
3. 所有工作流程以 Case 為核心。
4. 一位 Contact 永遠只有一份資料。
5. Calendar、Timeline、AI Today 都必須回到 Case / Event。
6. 手機優先。
7. 能一鍵完成，就不要多步驟。
8. 能自動，就不要手動。
9. 每新增一個功能，都必須讓房仲減少重複工作。
10. 每個 Sprint 都必須讓系統更接近每天都會使用，而不是增加展示功能。

最重要的一句：

MG-AIOS 的核心不是 CRM，而是每天幫房仲找到最有價值的下一步行動。
