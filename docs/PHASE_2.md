# Phase 2 改善建議

Phase 1 的核心是「能登入、能看到單字、能複習、能更新進度」。Phase 2 要讓它變成你真的願意每天打開的工具。

## 優先順序總覽

| 優先級 | 功能 | 原因 |
| --- | --- | --- |
| P0 | `/login` 登入頁 | 現在主要頁面已檢查登入，但還缺完整登入流程 |
| P0 | CSV 匯入頁與 route | 你的 Mason 單字書需要可重複匯入 |
| P0 | 自動建立 `user_progress` | 新單字匯入後要能立刻排入複習 |
| P1 | Notes 編輯 | GRE 記憶常需要個人化提示 |
| P1 | Review queue 混合新字 | 現在主要是 due review，應加入每日新字 |
| P1 | Dashboard 完成率 | 每天需要清楚知道做完了沒 |
| P2 | PWA manifest | 手機桌面啟動體驗 |
| P2 | Dark mode | 睡前複習很實用 |
| P2 | 匯出 CSV | 避免資料被平台鎖住 |

## 1. 登入頁

新增：

```text
src/app/login/page.tsx
src/app/auth/callback/route.ts
src/app/logout/route.ts
```

第一版建議支援：

1. Email magic link
2. Google Login

Google Login 體驗最好，但設定比較多。開發期可以先用 email。

## 2. CSV 匯入

新增：

```text
src/app/settings/page.tsx
src/app/api/import/route.ts
src/lib/import/parse-vocabulary-csv.ts
src/lib/import/validators.ts
```

匯入流程：

1. 使用者上傳 CSV
2. 用 `papaparse` 解析
3. 用 `zod` 驗證欄位
4. `synonyms` / `antonyms` 依分號轉 array
5. upsert 到 `vocabulary`
6. 為目前使用者建立 `user_progress`

重複單字處理：

```text
same normalized_word + same part_of_speech -> update existing row
```

## 3. Review queue 改善

目前 queue 主要來自：

```sql
next_review_at <= now()
```

Phase 2 建議改成：

1. 先抓 due reviews
2. 如果 due 不足每日上限，補新字
3. 新字建立 `user_progress`
4. queue 排序混合：
   - 錯題優先
   - 到期單字
   - 新字

建議函式：

```text
getTodayReviewQueue(userId)
```

## 4. Notes 編輯

在 `/words/[id]` 加上 client form：

1. textarea 顯示目前 notes
2. Save button
3. server action update `user_progress.notes`
4. revalidate word detail page

## 5. Stats 改善

Phase 2 可以新增：

| 指標 | 用途 |
| --- | --- |
| 7-day reviews | 看最近是否穩定 |
| Accuracy trend | 看是不是越背越穩 |
| Most missed words | 鎖定弱點 |
| Mastery ratio | 知道整本書進度 |
| Average response time | 找出猜對但不熟的字 |

## 6. PWA

新增：

```text
public/manifest.webmanifest
public/icon-192.png
public/icon-512.png
src/app/icon.png
```

在 `src/app/layout.tsx` metadata 加：

```ts
export const metadata = {
  manifest: "/manifest.webmanifest"
};
```

PWA 第一版不一定要離線。先做到可以加到手機桌面就夠。

## 7. 測試

建議新增 Vitest，先測純函式：

```text
src/lib/srs.test.ts
src/lib/import/parse-vocabulary-csv.test.ts
```

必測情境：

1. `again` -> 10 分鐘後
2. `hard` -> 1 天後
3. `good` -> interval x 2
4. `easy` -> interval x 3
5. interval >= 30 -> mastered
6. CSV synonyms 分號解析
7. CSV 缺 `word` 或 `chinese_meaning` 應報錯

## 8. 建議 Phase 2 開發順序

1. 做 `/login`
2. 做 `/settings` 基礎頁
3. 做 CSV import route
4. 做自動 `user_progress` 建立
5. 做 notes 編輯
6. 改良 review queue
7. 補 PWA manifest
8. 補測試

完成 Phase 2 後，這個工具就會從「可跑的骨架」變成「每天可用的個人 GRE 複習 app」。
