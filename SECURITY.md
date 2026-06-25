# Security Policy

## Content Security Policy (CSP)

The C-Address Bridge implements a strict Content Security Policy (CSP) to protect against XSS attacks and other injection vulnerabilities.

### CSP Header Configuration

The application enforces the following CSP header:

```
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
```

### Allowed Third-Party Scripts

The following third-party services are whitelisted:

- **Moonpay**: `https://cdn.moonpay.com` - Fiat onramp provider
- **Transak**: `https://widget.transak.com` - Alternative fiat onramp provider
- **Freighter Wallet**: `https://js.freighter.app` - Stellar wallet integration

### Directive Explanation

- **default-src 'self'**: All content must come from the same origin by default
- **script-src**: JavaScript can only be loaded from trusted sources (self and whitelisted CDNs)
- **style-src**: CSS can only be loaded from trusted sources
- **img-src**: Images can be loaded from self, data URIs, and HTTPS sources
- **connect-src**: Network requests are restricted to trusted API endpoints:
  - Stellar RPC endpoints
  - Horizon API servers
  - Third-party payment provider APIs
- **frame-src**: iframes are restricted to whitelisted payment provider domains
- **frame-ancestors 'none'**: Prevents this app from being embedded in other sites
- **upgrade-insecure-requests**: Forces HTTP requests to upgrade to HTTPS
- **form-action 'self'**: Forms can only be submitted to the same origin

### Additional Security Headers

The application also implements:

- **X-Content-Type-Options: nosniff**: Prevents MIME type sniffing
- **X-Frame-Options: DENY**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS protections
- **Referrer-Policy: strict-origin-when-cross-origin**: Controls referrer information
- **Permissions-Policy**: Disables access to sensitive APIs (camera, microphone, geolocation)

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email security@c-address-bridge.dev with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if available)

**Do not** open public GitHub issues for security vulnerabilities.

## Security Best Practices

When using the C-Address Bridge:

1. Always verify you're accessing the official domain
2. Enable two-factor authentication on your wallet
3. Never share your private keys or seed phrases
4. Use only trusted wallet extensions
5. Keep your browser and extensions updated

## Regular Audits

The CSP policy and security measures are reviewed regularly. If you notice any security issues, please report them immediately.
