import path from "node:path";
import { generateSW } from "workbox-build";

const rootDir = path.resolve(process.cwd());
const swDest = path.join(rootDir, "public", "sw.js");

const { count, size, warnings } = await generateSW({
  swDest,
  globDirectory: rootDir,
  globPatterns: [
    "public/**/*.{js,css,html,svg,png,jpg,jpeg,gif,ico,webp,woff,woff2,ttf,json}",
    ".next/static/**/*.{js,css,svg,json,png,jpg,jpeg,gif,ico,webp,woff,woff2,ttf}",
  ],
  globIgnores: ["**/sw.js", "**/workbox-*.*", "**/node_modules/**", ".next/cache/**"],
  navigateFallback: "/",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  importWorkboxFrom: "local",
  runtimeCaching: [
    {
      urlPattern: ({ url }) =>
        [
          "https://horizon.stellar.org",
          "https://horizon-testnet.stellar.org",
          "https://sorobanrpc.stellar.org",
          "https://testnet.sorobanrpc.com",
        ].includes(url.origin),
      handler: "NetworkFirst",
      options: {
        cacheName: "dynamic-api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300,
        },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "page-cache",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
        },
      },
    },
    {
      urlPattern: ({ request }) =>
        ["style", "script", "worker", "font", "image"].includes(request.destination),
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

if (warnings.length > 0) {
  warnings.forEach((warning) => console.warn(warning));
}

console.log(`Generated ${swDest} with ${count} files, ${size} bytes.`);
