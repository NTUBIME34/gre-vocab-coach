# Vercel 部署教學

這份教學會把 Next.js app 部署到 Vercel，讓手機、平板、電腦都能透過網址使用。

## 1. 部署前檢查

本機先確認可以通過：

```bash
npm install
npm run typecheck
npm run dev
```

目前 app 需要 Supabase 環境變數：

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

## 2. 建立 GitHub repository

Vercel 最順的方式是從 GitHub 匯入。

如果你的專案還沒有 git：

```bash
git init
git add .
git commit -m "Initial GRE vocab coach MVP"
```

到 GitHub 建立新 repository，例如：

```text
gre-vocab-coach
```

然後依照 GitHub 顯示的指令 push。

## 3. 建立 Vercel 帳號

1. 到 [Vercel](https://vercel.com/)。
2. 點 `Sign Up`。
3. 建議使用 GitHub 登入。
4. 授權 Vercel 讀取你的 GitHub repository。

## 4. 匯入專案

1. Vercel dashboard 點 `Add New`。
2. 選 `Project`。
3. 找到 `gre-vocab-coach` repository。
4. 點 `Import`。
5. Framework Preset 應該會自動偵測為 `Next.js`。

Build settings 通常保持預設：

```text
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## 5. 設定 Environment Variables

在 Vercel import project 畫面找到 `Environment Variables`。

加入：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_NAME=GRE Vocab Coach
```

目前先不要填 `SUPABASE_SERVICE_ROLE_KEY`，除非之後做 server-side CSV import route。若要填，務必只放在 Vercel Environment Variables，不要寫進程式碼。

點 `Deploy`。

## 6. 更新 Supabase Auth Site URL

部署成功後，Vercel 會給你一個網址，例如：

```text
https://gre-vocab-coach.vercel.app
```

回到 Supabase：

1. 左側點 `Authentication`。
2. 點 `URL Configuration`。
3. `Site URL` 填：

```text
https://gre-vocab-coach.vercel.app
```

4. `Redirect URLs` 加入：

```text
http://localhost:3000/**
https://gre-vocab-coach.vercel.app/**
```

這樣本機和正式站都能使用 Auth redirect。

## 7. 如果使用 Google Login

到 Google Cloud Console 的 OAuth Client 設定，把 Authorized JavaScript origins 加入：

```text
http://localhost:3000
https://gre-vocab-coach.vercel.app
```

Authorized redirect URIs 仍然是 Supabase callback：

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

## 8. 部署後測試清單

打開正式網址後，檢查：

1. `/` 可以開
2. `/words` 可以讀到 seed vocabulary
3. `/dashboard` 未登入時顯示 sign in required
4. 補完登入頁後，可以登入並看到 dashboard
5. `/review` 可以翻卡片
6. 點 Again / Hard / Good / Easy 後，`user_progress` 和 `review_logs` 有更新

## 9. 常見部署問題

### Build failed

先在本機跑：

```bash
npm run typecheck
npm run build
```

若本機可過、Vercel 不過，檢查 Node 版本和環境變數。

### Supabase request failed

檢查：

1. Vercel env 是否填對
2. Supabase project URL 和 anon key 是否同一個 project
3. RLS policy 是否允許目前操作
4. 使用者是否已登入

### Auth redirect 回 localhost

檢查：

1. Vercel 的 `NEXT_PUBLIC_APP_URL`
2. Supabase `Site URL`
3. Supabase `Redirect URLs`
