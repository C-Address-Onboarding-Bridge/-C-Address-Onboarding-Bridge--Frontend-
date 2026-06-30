import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.moonpay.com https://transak.com https://widget.transak.com https://js.freighter.app;
  style-src 'self' 'unsafe-inline' https://cdn.moonpay.com https://widget.transak.com;
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.stellar.org https://testnet.sorobanrpc.com https://sorobanrpc.stellar.org https://horizon.stellar.org https://horizon-testnet.stellar.org https://api.moonpay.com https://widget.transak.com https://api.transak.com;
  frame-src 'self' https://cdn.moonpay.com https://widget.transak.com;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
