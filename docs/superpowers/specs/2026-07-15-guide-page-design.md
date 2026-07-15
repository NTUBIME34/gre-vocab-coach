# /guide 使用指南頁設計

日期：2026-07-15
狀態：已由使用者核准

## 目的

網站缺少一頁告訴使用者「想快速提升 GRE Verbal 分數該怎麼訓練」的說明。新增一個靜態使用指南頁，以每日訓練循環為主軸，把現有功能（Review、Practice 的 target/synonym/wrong、Mistakes、Settings）串成一套有科學依據、以分數投報率排序的訓練法。

## 範圍

- 新路由 `src/app/guide/page.tsx`：純靜態 server component，不撈資料、不需要登入（頁面無個資；未登入者也可閱讀）。
- `src/components/app-shell.tsx`：`navItems` 加入 `{ href: "/guide", label: "Guide" }`，位置在 Stats 與 Settings 之間。
- `src/app/dashboard/page.tsx`：Quick actions 加一個「使用指南」的 secondary ButtonLink。

不做：多語言切換、動態個人化內容（顯示使用者自己的 tier 進度）、獨立 CMS。內容直接寫在 TSX。

## 內容大綱（繁體中文，功能名稱保留英文）

1. **前言**：目標 Verbal 155 → 先攻高頻字投報率最高。字庫 2,060 字按 GRE 頻率 1–5 分層，tier 4+5 共 541 字是核心；間隔重複＋主動回想一句話原理。
2. **每日訓練循環**（30–60 分鐘，4 步驟）：
   1. Review 清空今日到期卡片（主動回想是記憶核心，最優先）。
   2. Practice → Target 模式：從 tier 5（222 字）開始，整層 familiarity 達標後自動解鎖下一層。
   3. Practice → Synonym 題型：對應 GRE Sentence Equivalence 的同義詞辨析。
   4. Practice → Wrong 模式：清錯題。
3. **誠實評分原則**：Again（10 分鐘後重來）/ Hard（1 天）/ Good（3 天起，間隔 ×2）/ Easy（7 天起，間隔 ×3）；間隔達 30 天標記 Mastered。猜對的要按 Again。練習題答對的間隔推進比翻卡保守（辨認 ≠ 回想）。
4. **功能速查表**：各頁面/模式 → 使用時機（表格）。
5. **設定建議**：每日新字量與複習上限（預設 20/100）的調整原則；衝刺期建議值。

## 驗證

- `npm run typecheck`、`npm run test`、`npm run build` 全綠。
- 內容事實查核：指南中的數字與行為描述（間隔天數、tier 字數、精通門檻等）需與 `src/lib/srs.ts`、`src/lib/practice.ts`、live DB 一致。
- 部署後 smoke：GET /guide 回 200 且含關鍵內容；導覽列出現 Guide 連結。
