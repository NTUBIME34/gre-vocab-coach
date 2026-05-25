import { AppShell } from "@/components/app-shell";
import { CsvImportForm } from "@/components/CsvImportForm";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getUserSettings } from "@/lib/data";
import { updateSettingsAction } from "@/app/settings/actions";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getUserSettings(user.id);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Tune your daily workload, import new vocabulary, and export a backup."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Daily review settings" />
          <CardBody>
            <form action={updateSettingsAction} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Daily new words
                <input
                  type="number"
                  name="daily_new_words"
                  min={0}
                  max={200}
                  defaultValue={settings.daily_new_words}
                  className="rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Daily review limit
                <input
                  type="number"
                  name="daily_review_limit"
                  min={1}
                  max={500}
                  defaultValue={settings.daily_review_limit}
                  className="rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name="dark_mode" defaultChecked={settings.dark_mode} />
                Dark mode
              </label>
              <Button type="submit">Save settings</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Import vocabulary CSV" description="Duplicates are skipped by word." />
          <CardBody>
            <CsvImportForm />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Export backup" />
          <CardBody>
            <a
              href="/api/export"
              className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            >
              Export vocabulary CSV
            </a>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
