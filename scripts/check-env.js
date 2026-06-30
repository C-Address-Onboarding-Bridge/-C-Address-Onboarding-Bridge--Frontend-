const optional = [
  'NEXT_PUBLIC_BRIDGE_CONTRACT_ID',
  'NEXT_PUBLIC_MOONPAY_API_KEY',
  'NEXT_PUBLIC_TRANSAK_API_KEY',
];

const missing = optional.filter((k) => !process.env[k]);

if (missing.length) {
  console.warn('[check:env] Missing optional environment variables:');
  missing.forEach((k) => console.warn(`  - ${k}`));
} else {
  console.log('[check:env] All environment variables configured.');
}
