# 完整深色主題設計

日期：2026-07-15
狀態：已由使用者核准（選項：完整深色主題，保留切換）

## 目的

使用者覺得白色刺眼，要求深色模式。現有的 `dark_mode` 設定靠 globals.css 的全域 CSS 覆蓋（`.dark .bg-white {...}`），蓋不到按鈕、hover、練習題對錯配色、表單控制項，開啟後多處對比破損。改為正規的 Tailwind class-based dark variants。

## 作法

- `tailwind.config.ts`：加 `darkMode: "class"`（Tailwind 3.4）。
- `globals.css`：刪除全部 `.dark ...` 覆蓋規則，只保留 `color-scheme` 宣告。
- `app-shell.tsx`：沿用現有的 `dark` class 切換；無設定（未登入/新帳號）時預設深色（`settings?.dark_mode ?? true`）。
- `getUserSettings` 的預設值 `dark_mode` 改為 `true`；使用者現有帳號的資料列直接更新為 `true`。
- Settings 的勾選框保留，可隨時切回淺色。
- 全部 24 個含色彩 class 的檔案補上 `dark:` variants。

## 調色映射（全站一致）

| 淺色 | 加上 |
| --- | --- |
| 頁面底 `bg-slate-50`（外層） | `dark:bg-slate-950` |
| 卡片/表面 `bg-white` | `dark:bg-slate-900` |
| 卡內色塊/表頭 `bg-slate-50` | `dark:bg-slate-800` |
| `bg-slate-100` | `dark:bg-slate-800` |
| 主文字 `text-slate-950` | `dark:text-slate-50` |
| `text-slate-800` | `dark:text-slate-200` |
| `text-slate-700` | `dark:text-slate-300` |
| `text-slate-600` / `text-slate-500` | `dark:text-slate-400` |
| 邊框 `border-slate-200` / `border-slate-100` | `dark:border-slate-800` |
| `border-slate-300`（虛線空狀態） | `dark:border-slate-700` |
| `divide-slate-100` | `dark:divide-slate-800` |
| `hover:bg-slate-50` / `hover:bg-slate-100` | `dark:hover:bg-slate-800` |
| 主按鈕 `bg-slate-950 text-white hover:bg-slate-800` | `dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200` |
| emerald 淡底（50/200/700/950） | `dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300`（深文字→`dark:text-emerald-100`） |
| rose 淡底 | `dark:bg-rose-950 dark:text-rose-300`，邊框 `dark:border-rose-900`（強調 500 保留） |
| amber 淡底 | `dark:bg-amber-950 dark:border-amber-900 dark:text-amber-100/200` |
| 輸入框 `bg-white border-slate-200` | `dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50` |
| header `bg-white/95` | `dark:bg-slate-950/95` |

情境例外：與頁面底同色的元素（如 Review 底部評分列的 `bg-slate-50`）對應 `dark:bg-slate-950`，不是 slate-800。

## 驗證

- typecheck / test / build 全綠。
- 全站稽核：grep 所有色彩 utility，確認每個淺色 class 都有對應 dark variant 或明確豁免（如 rose-600 按鈕在深色下本就可用）。
- 部署後以未登入狀態抓 /login、/guide HTML 確認 dark class 與 dark: variants 存在。
