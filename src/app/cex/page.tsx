import dynamic from "next/dynamic";

const CexPage = dynamic(() => import("@/components/routes/cex-page"), {
  loading: () => <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-sm text-[var(--text-muted)]">Loading CEX route…</div>,
});

export default function CexRoutePage() {
  return <CexPage />;
}
