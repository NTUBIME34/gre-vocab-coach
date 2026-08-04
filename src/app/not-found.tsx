import Link from "next/link";

export default function NotFound() {
  return (
    <div className="dark flex min-h-[60vh] items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-50">找不到這個頁面</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">網址可能打錯了，或這個單字不在字庫裡。</p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-md bg-slate-50 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
        >
          回到 Dashboard
        </Link>
      </div>
    </div>
  );
}
