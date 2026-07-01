import dynamic from "next/dynamic";

const OnrampPage = dynamic(() => import("@/components/routes/onramp-page"), {
  loading: () => <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-sm text-[var(--text-muted)]">Loading onramp…</div>,
});

export default function OnrampRoutePage() {
  return <OnrampPage />;
}
