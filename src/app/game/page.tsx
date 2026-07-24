import { AppShell } from "@/components/app-shell";
import { GameArcade } from "@/components/game/game-arcade";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export default async function GamePage() {
  await requireUser();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Arcade"
        title="單字遊樂場"
        description="換個方式複習：配對消除與 60 秒限時衝刺。單字一樣從你的到期與弱點佇列挑出，玩起來輕鬆，練到的還是該練的字。"
        action={
          <ButtonLink href="/practice" variant="secondary">
            回到 Practice
          </ButtonLink>
        }
      />
      <GameArcade />
    </AppShell>
  );
}
