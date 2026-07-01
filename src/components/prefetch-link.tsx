"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  prefetchOnVisible?: boolean;
};

export function PrefetchLink({ href, prefetchOnVisible = true, onMouseEnter, onFocus, ...props }: PrefetchLinkProps) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  const prefetch = () => {
    if (typeof href === "string") {
      router.prefetch(href);
    }
  };

  useEffect(() => {
    if (!prefetchOnVisible || typeof window === "undefined" || !linkRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetch();
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(linkRef.current);
    return () => observer.disconnect();
  }, [href, prefetchOnVisible]);

  return (
    <Link
      ref={linkRef}
      href={href}
      onMouseEnter={(event) => {
        prefetch();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        prefetch();
        onFocus?.(event);
      }}
      {...props}
    />
  );
}
