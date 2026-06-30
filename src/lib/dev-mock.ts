export const IS_DEV_MOCK =
  process.env.NEXT_PUBLIC_DEV_MOCK === "true" ||
  (typeof window !== "undefined" && window.localStorage.getItem("dev_mock") === "true");

export function enableDevMock() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("dev_mock", "true");
  }
}

export function disableDevMock() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("dev_mock");
  }
}
