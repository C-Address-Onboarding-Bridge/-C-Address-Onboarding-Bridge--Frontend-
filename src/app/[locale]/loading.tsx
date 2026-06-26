import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-light)]" />
      </div>
    </div>
  );
}
