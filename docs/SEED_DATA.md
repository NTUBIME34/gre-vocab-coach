# Seed Data Guide

本專案提供三種 seed / sample 檔案：

| 檔案 | 用途 |
| --- | --- |
| `supabase/seed.sql` | 匯入 10 筆 GRE 測試單字 |
| `supabase/seed_user_progress.sql` | 為指定 Supabase Auth 使用者建立複習進度 |
| `data/sample-vocabulary.csv` | CSV 匯入功能完成後可用的範例檔 |

## 建議順序

1. 先跑 `supabase/schema.sql`
2. 再跑 `supabase/seed.sql`
3. 建立 Supabase Auth 使用者
4. 複製使用者 UID
5. 修改並執行 `supabase/seed_user_progress.sql`

## 為什麼 progress seed 要分開？

`user_progress.user_id` 參考的是 Supabase `auth.users(id)`。這個 id 應該由 Supabase Auth 建立，不建議自己手動 insert 到 `auth.users`。

所以正確流程是：

1. 先建立使用者
2. 拿到真實 UID
3. 再建立該使用者的 `user_progress`

## CSV 格式

CSV 欄位：

```csv
word,part_of_speech,chinese_meaning,english_definition,example_sentence,synonyms,antonyms,memory_hint,difficulty_level,frequency_level,source_book_chapter
```

多個 synonyms / antonyms 使用分號：

```csv
abate,verb,減少；緩和,to become less intense,The storm abated.,subside;diminish,intensify;increase,,3,4,Chapter 1
```

## 從 Mason PDF 匯入的建議流程

第一輪不要一次處理整本。建議先抽 50-100 個單字：

1. 從 PDF 抽文字
2. 交給 LLM 整理成 CSV
3. 人工抽查 20 筆
4. 匯入測試資料庫
5. 確認 app 顯示正常
6. 再批次處理完整 Mason 1000 / 2000

給 LLM 的整理 prompt：

```text
你是 GRE 單字資料整理助理。請把以下單字書內容整理成 CSV。

請輸出欄位：
word,part_of_speech,chinese_meaning,english_definition,example_sentence,synonyms,antonyms,memory_hint,difficulty_level,frequency_level,source_book_chapter

規則：
1. 不要新增原文沒有的單字。
2. 如果某欄位缺資料，請留空。
3. synonyms 和 antonyms 若有多個，請用分號分隔。
4. difficulty_level 用 1-5。
5. frequency_level 用 1-5。
6. 修正明顯 OCR 錯字，但不要改變原意。
7. 只輸出 CSV，不要輸出額外說明。

以下是原始內容：
[貼上文字]
```
