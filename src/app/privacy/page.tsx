export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: June 30, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--text-muted)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">1. Data We Collect</h2>
          <p>We collect minimal data necessary to operate the protocol:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Wallet Address:</strong> Your Stellar public address is used to facilitate transactions and is visible on the blockchain.</li>
            <li><strong>Transaction Data:</strong> Transaction amounts, timestamps, and destination addresses are processed temporarily to execute bridges.</li>
            <li><strong>Local Storage:</strong> We store consent preferences and UI state locally in your browser. No personal data is stored on our servers.</li>
            <li><strong>Usage Data:</strong> Anonymous page navigation data for improving the user experience.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>To process and facilitate digital asset transfers</li>
            <li>To maintain and improve the protocol</li>
            <li>To comply with legal and regulatory obligations</li>
            <li>To detect and prevent fraudulent activity</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">3. Third-Party Services</h2>
          <p>We integrate with the following third-party services. Each has its own privacy policy:</p>

          <h3 className="font-semibold text-[var(--foreground)] mt-4 mb-2">Moonpay</h3>
          <p>Moonpay processes fiat-to-crypto purchases. When you use Moonpay, your payment information and identity verification data are handled by Moonpay under their privacy policy. We receive only the transaction status.</p>

          <h3 className="font-semibold text-[var(--foreground)] mt-4 mb-2">Transak</h3>
          <p>Transak provides fiat onramp services. Identity verification and payment details are processed by Transak in accordance with their privacy policy.</p>

          <h3 className="font-semibold text-[var(--foreground)] mt-4 mb-2">Stellar Blockchain</h3>
          <p>All transactions are recorded on the Stellar blockchain, a public distributed ledger. Transaction data including addresses and amounts are publicly visible and cannot be erased.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">4. Analytics</h2>
          <p>
            We collect anonymous usage statistics to improve the protocol. This includes page views,
            feature usage frequency, and aggregate transaction metrics. No personally identifiable
            information is associated with analytics data. You can opt out of analytics tracking
            via your browser&apos;s Do Not Track setting or by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">5. Data Storage and Security</h2>
          <p>
            We do not operate centralized servers that store personal data. Wallet connection state
            and preferences are stored locally in your browser using localStorage. Transaction data
            exists only temporarily in memory during processing. We implement industry-standard
            security measures to protect against unauthorized access.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">6. Your Rights (GDPR)</h2>
          <p>If you are located in the European Economic Area (EEA), you have the following rights:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Right to Access:</strong> Request a copy of data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate data.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data.</li>
            <li><strong>Right to Restrict Processing:</strong> Object to certain processing activities.</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format.</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time without affecting the lawfulness of previous processing.</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, visit our{" "}
            <a href="/data-deletion" className="text-[var(--primary-light)] hover:underline">
              Data Deletion Request
            </a>{" "}
            page or contact us at privacy@caddressbridge.com.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">7. Cookie Policy</h2>
          <p>
            We use localStorage to store your cookie consent preferences and UI settings.
            No tracking cookies from third-party services are used unless you explicitly consent.
            You can manage your cookie preferences at any time using the cookie settings button
            in the footer.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">8. Contact</h2>
          <p>
            For privacy-related inquiries, please contact us at privacy@caddressbridge.com
            or submit a request through our Data Deletion Request page.
          </p>
        </div>
      </section>
    </div>
  );
}
