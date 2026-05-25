# Supabase 設定教學

這份教學假設你是第一次使用 Supabase。目標是讓本專案可以：

1. 使用 Supabase Postgres 儲存 GRE 單字與複習進度
2. 使用 Supabase Auth 登入
3. 讓本機 Next.js app 能連到 Supabase
4. 匯入 seed data 後看到測試單字

## 1. 建立 Supabase 專案

1. 到 [Supabase](https://supabase.com/)。
2. 點右上角 `Sign in` 或 `Start your project`。
3. 使用 GitHub 或 email 註冊。
4. 登入後點 `New project`。
5. 如果還沒有 organization，先建立一個 organization。
6. 填寫專案資料：
   - `Name`: `gre-vocab-coach`
   - `Database Password`: 請產生一組強密碼並保存
   - `Region`: 選離你近的區域，例如 `Northeast Asia`
7. 點 `Create new project`。
8. 等待 Supabase 建立完成，通常需要 1-3 分鐘。

## 2. 找到 API URL 和 anon key

1. 進入你的 Supabase 專案。
2. 左側選單點 `Project Settings`。
3. 點 `API`。
4. 找到：
   - `Project URL`
   - `anon public` key
5. 稍後要填入 `.env.local`。

本機 `.env.local` 範例：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GRE Vocab Coach
```

## 3. 建立資料庫 schema

1. 在 Supabase 左側選單點 `SQL Editor`。
2. 點 `New query`。
3. 打開本專案檔案：
   - `supabase/schema.sql`
4. 複製整份 SQL。
5. 貼到 Supabase SQL Editor。
6. 點 `Run`。

成功後會建立：

- `vocabulary`
- `user_progress`
- `review_logs`
- `user_settings`
- `v_due_reviews`
- indexes
- triggers
- RLS policies

## 4. 匯入 seed vocabulary

1. 在 Supabase 左側選單點 `SQL Editor`。
2. 點 `New query`。
3. 打開：
   - `supabase/seed.sql`
4. 複製整份 SQL。
5. 貼上後點 `Run`。

完成後，左側選單點 `Table Editor`，打開 `vocabulary`，應該會看到 10 筆 GRE 測試單字。

## 5. 設定 Supabase Auth

第一版 app 目前頁面已經會檢查目前登入使用者，但尚未做完整 `/login` UI。你可以先用 Supabase Auth 建立測試使用者，或下一階段再補登入頁。

### Email 登入設定

1. 左側點 `Authentication`。
2. 點 `Providers`。
3. 確認 `Email` 是 enabled。
4. 若只想本機測試，可以暫時關閉 email confirmation：
   - `Authentication` -> `Providers` -> `Email`
   - 找到 confirm email 相關設定
   - 開發期可關閉，正式上線前再打開

### Google 登入設定，可稍後做

Google Login 需要 Google Cloud Console OAuth Client。第一次做可以先跳過，用 Email provider 開發即可。

正式要做 Google Login 時：

1. 到 [Google Cloud Console](https://console.cloud.google.com/)。
2. 建立或選擇一個 project。
3. 進入 `APIs & Services` -> `OAuth consent screen`。
4. 設定 app name、email、developer contact。
5. 進入 `Credentials`。
6. 建立 `OAuth client ID`。
7. Application type 選 `Web application`。
8. Authorized redirect URI 加入 Supabase callback URL：

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

9. 複製 Google `Client ID` 和 `Client Secret`。
10. 回 Supabase：
    - `Authentication` -> `Providers` -> `Google`
    - Enable Google
    - 貼上 Client ID / Client Secret
    - Save

## 6. 建立第一個測試使用者

方式 A：從 Supabase 後台手動新增

1. 左側點 `Authentication`。
2. 點 `Users`。
3. 點 `Add user`。
4. 輸入 email 和 password。
5. 建立後，點該使用者並複製 `User UID`。

方式 B：等 app 做好 `/login` 後從前端註冊。

目前如果你想讓 `/review` 立刻有資料，可以先用方式 A。

## 7. 為測試使用者建立 user_progress

1. 打開：
   - `supabase/seed_user_progress.sql`
2. 找到所有：

```sql
'REPLACE_WITH_YOUR_AUTH_USER_ID'::uuid
```

3. 換成你剛剛複製的 Supabase Auth User UID。

例如：

```sql
'11111111-2222-3333-4444-555555555555'::uuid
```

4. 到 Supabase `SQL Editor`。
5. 貼上修改後的 SQL。
6. 點 `Run`。

完成後會建立：

- `user_settings`
- 目前 `vocabulary` 每個單字對應的 `user_progress`
- 所有 `next_review_at = now()`，所以 `/review` 會立刻有卡片

## 8. 設定本機 `.env.local`

在專案根目錄：

```bash
cp .env.example .env.local
```

編輯 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GRE Vocab Coach
```

目前不需要填：

```bash
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` 很敏感，不要放到前端，也不要公開到 GitHub。

## 9. 啟動本機

```bash
npm install
npm run dev
```

打開：

```text
http://localhost:3000
```

目前主要頁面：

- `/dashboard`
- `/review`
- `/words`
- `/mistakes`
- `/stats`

## 10. 常見問題

### 頁面顯示 Sign in required

代表目前 app 還沒有登入 session。下一階段需要補 `/login` 頁，或先用 Supabase Auth helper 建立登入流程。

### `/words` 沒資料

檢查：

1. 是否已執行 `supabase/schema.sql`
2. 是否已執行 `supabase/seed.sql`
3. Supabase `Table Editor` -> `vocabulary` 是否有資料

### `/review` 沒卡片

檢查：

1. 是否有登入使用者
2. 是否已執行 `supabase/seed_user_progress.sql`
3. `user_progress.next_review_at` 是否小於或等於現在
4. `user_progress.is_mastered` 是否為 `false`

### RLS 權限錯誤

請確認：

1. 使用者已登入
2. `user_progress.user_id` 等於 `auth.users.id`
3. 沒有用錯 Supabase project
4. `.env.local` 裡的 URL 和 anon key 來自同一個 project
