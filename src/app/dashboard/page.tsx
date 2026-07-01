import dynamic from "next/dynamic";

const DashboardPage = dynamic(() => import("@/components/routes/dashboard-page"), {
  loading: () => <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-sm text-[var(--text-muted)]">Loading dashboard…</div>,
});

export default function DashboardRoutePage() {
  return <DashboardPage />;
}
