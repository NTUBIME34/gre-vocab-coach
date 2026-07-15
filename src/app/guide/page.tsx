import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

const dailySteps = [
  {
    step: "1",
    title: "Review — 清空今日到期卡片",
    href: "/review",
    linkLabel: "開始 Review",
    body: "翻卡回想是整套訓練的核心：每天最優先把到期的卡片清完。看到單字先在腦中回想意思，翻開後誠實評分，系統會依你的評分安排下一次出現的時間。記憶是在「快忘記之前剛好再看到」的瞬間建立的，所以到期卡片放著不清，效果會大打折扣。"
  },
  {
    step: "2",
    title: "Practice → Target 模式 — 先攻高頻字",
    href: "/practice",
    linkLabel: "開始 Practice",
    body: "全部 2,060 字裡，出現頻率最高的 tier 5 只有 222 字、tier 4+5 合計 541 字，這些字在考題中反覆出現，先精通它們的分數投報率最高。Target 模式會優先出當前最高頻層還沒熟練的字，整層都熟練之後自動解鎖下一層，你不需要自己挑字。"
  },
  {
    step: "3",
    title: "Practice → Synonym 題型 — 練同義詞辨析",
    href: "/practice",
    linkLabel: "選 Synonym 題型",
    body: "GRE Verbal 的 Sentence Equivalence 考的是「從六個選項中選出兩個意思相近的字」，本質是同義詞辨析，不是背中文翻譯。Synonym 題型會問你哪個字與題目字意思最接近，選項都是字庫裡的真實單字，直接模擬這個能力。"
  },
  {
    step: "4",
    title: "Practice → Wrong 模式 — 清錯題",
    href: "/mistakes",
    linkLabel: "查看 Mistakes",
    body: "答錯過的字就是你的弱點清單。Wrong 模式只出你錯過的字，錯最多次的優先（還沒有錯題時會隨機出題）；搭配 Mistakes 頁面可以瀏覽錯題排行。考前一兩週，把時間重心逐漸移到這一步。"
  }
];

const ratingRows = [
  { rating: "Again", interval: "10 分鐘後重來", when: "完全想不起來，或用猜的猜對" },
  { rating: "Hard", interval: "1 天後", when: "想了很久才想起來，或只想起一部分" },
  { rating: "Good", interval: "3 天起，之後每次 ×2", when: "稍微停頓後正確想起來" },
  { rating: "Easy", interval: "7 天起，之後每次 ×3", when: "看到字立刻反應出意思" }
];

const featureRows = [
  { feature: "Review", when: "每天第一件事：清空到期卡片，建立長期記憶" },
  { feature: "Practice → Target", when: "背新字時用：從最高頻層開始，逐層往下解鎖" },
  { feature: "Practice → Synonym", when: "有一定字量後：練 GRE 真正考的同義詞辨析" },
  { feature: "Practice → Wrong", when: "每天收尾或考前衝刺：只打弱點" },
  { feature: "Practice → Smart", when: "時間零碎時：混合到期、易錯、高價值字的綜合複習" },
  { feature: "Mistakes", when: "瀏覽錯題排行，找出反覆記不住的字" },
  { feature: "Dictionary", when: "閱讀時遇到生字，隨手查字庫內的解釋與例句" },
  { feature: "Vocabulary", when: "瀏覽或搜尋整個字庫，點進單字頁可寫個人筆記" },
  { feature: "Stats", when: "每週看一次：追蹤複習量、正確率、精通進度" },
  { feature: "Settings", when: "調整每日新字量與複習上限，匯入/匯出 CSV" }
];

export default function GuidePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Guide"
        title="使用指南：快速提升 Verbal 分數"
        description="用最少的時間換最大的分數增益：每天 30–60 分鐘，照下面的循環練。"
        action={<ButtonLink href="/review">立刻開始</ButtonLink>}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="為什麼這樣練最快" />
          <CardBody className="space-y-3 text-sm leading-7 text-slate-700">
            <p>
              字庫的 2,060 個單字已依 GRE 出題頻率標成 1–5 級。頻率最高的兩級（tier 4+5）只有 541
              字，卻涵蓋考題中最常出現的核心字彙——先精通這 541 字，再往低頻層擴展，是投報率最高的順序。
            </p>
            <p>
              訓練方法建立在兩個記憶科學原則上：<span className="font-medium text-slate-950">主動回想</span>
              （看到字先自己想意思，再翻答案）與<span className="font-medium text-slate-950">間隔重複</span>
              （在快忘記之前剛好再複習一次，間隔隨熟練度拉長）。Review 翻卡負責這兩件事；Practice
              的選擇題負責檢驗與辨析。兩者搭配，缺一不可。
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="每日訓練循環" description="30–60 分鐘，四個步驟照順序做。" />
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2">
              {dailySteps.map((item) => (
                <div key={item.step} className="rounded-lg border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      {item.step}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                  <Link href={item.href} className="mt-3 inline-block text-sm font-medium text-slate-950 underline underline-offset-4">
                    {item.linkLabel}
                  </Link>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="誠實評分原則"
            description="評分決定卡片下次出現的時間——評得誠實，系統才能把時間花在你真正的弱點上。"
          />
          <CardBody className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">評分</th>
                    <th className="px-4 py-3 font-medium">下次複習</th>
                    <th className="px-4 py-3 font-medium">什麼時候按</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ratingRows.map((row) => (
                    <tr key={row.rating}>
                      <td className="px-4 py-3 font-medium text-slate-950">{row.rating}</td>
                      <td className="px-4 py-3 text-slate-600">{row.interval}</td>
                      <td className="px-4 py-3 text-slate-600">{row.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>
                <span className="font-medium text-slate-950">翻卡前想不起來的就按 Again。</span>
                騙過系統只會讓弱字更晚回來找你。選擇題矇對的也一樣算不會——下次這個字出現在翻卡時，記得誠實評分。
              </li>
              <li>複習間隔累積到 30 天，該字標記為 Mastered，之後幾乎不再佔用你的時間。</li>
              <li>
                Practice 答對的間隔推進比翻卡保守（從選項中「認出」比憑空「想起」容易），所以選擇題刷得再多，也取代不了每天的
                Review。
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="功能速查表" />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">功能</th>
                    <th className="px-4 py-3 font-medium">使用時機</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {featureRows.map((row) => (
                    <tr key={row.feature}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">{row.feature}</td>
                      <td className="px-4 py-3 text-slate-600">{row.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="設定建議" description="在 Settings 依備考階段調整每日工作量。" />
          <CardBody>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
              <li>
                <span className="font-medium text-slate-950">預設值（每日 20 個新字、複習上限 100）</span>
                適合 3 個月以上的準備期。照這個節奏，541 個高頻字約一個月可以全部進入複習循環。
              </li>
              <li>
                <span className="font-medium text-slate-950">衝刺期（考前 4–6 週）</span>
                ：新字調到 30–40、複習上限調到 150–200，並把 Practice 時間集中在 Wrong 模式與 Synonym 題型。
              </li>
              <li>
                <span className="font-medium text-slate-950">到期卡片爆量時</span>
                ：先把新字暫時調到 0，專心清存量——累積的到期卡片比新字更重要。
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
