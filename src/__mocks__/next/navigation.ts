export function usePathname() {
  return "/";
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  };
}

export function useParams() {
  return {};
}

export function useSearchParams() {
  return new URLSearchParams();
}
