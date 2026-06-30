export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: June 30, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--text-muted)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">1. Financial Risk Disclaimer</h2>
          <p>
            C-Address Bridge is a software protocol that facilitates the transfer of digital assets
            between Stellar addresses. The protocol does not provide financial advisory services,
            investment recommendations, or custodial services. Digital assets are inherently volatile
            and may result in total loss of value. By using this service, you acknowledge that:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Cryptocurrency investments carry significant financial risk</li>
            <li>Past performance does not guarantee future results</li>
            <li>You are solely responsible for your financial decisions</li>
            <li>Market conditions can change rapidly and without notice</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">2. User Responsibilities</h2>
          <p>As a user of C-Address Bridge, you agree to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            <li>Verify the accuracy of all transaction details before submission</li>
            <li>Maintain the security of your wallet keys and private information</li>
            <li>Not use the protocol for any illegal or unauthorized purpose</li>
            <li>Pay all applicable taxes on any gains or income from digital asset transactions</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">3. No Warranty</h2>
          <p>
            The C-Address Bridge protocol is provided &quot;as is&quot; and &quot;as available&quot; without
            any warranty of any kind, either express or implied. We do not guarantee that:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>The service will be uninterrupted, timely, secure, or error-free</li>
            <li>Transactions will be processed within any specific timeframe</li>
            <li>Third-party services (including Moonpay, Transak, and CEXes) will perform as expected</li>
            <li>The protocol will be compatible with all wallets, devices, or networks</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">4. Limitation of Liability</h2>
          <p>
            In no event shall C-Address Bridge, its contributors, or affiliates be liable for any
            indirect, incidental, special, consequential, or punitive damages, including without
            limitation, loss of profits, data, use, or other intangible losses arising from:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Your use or inability to use the protocol</li>
            <li>Unauthorized access to or alteration of your transactions</li>
            <li>Loss of funds due to incorrect address entry or network errors</li>
            <li>Actions taken by third-party services integrated with the protocol</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">5. Third-Party Services</h2>
          <p>
            C-Address Bridge integrates with third-party services including Moonpay, Transak, and
            various cryptocurrency exchanges. These services are independent and have their own terms
            of service. We are not responsible for the actions, policies, or failures of these
            third parties. Users should review the applicable terms before using any third-party
            service through the protocol.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">6. Modifications</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be posted on this
            page with an updated &quot;Last updated&quot; date. Continued use of the protocol after
            changes constitutes acceptance of the modified terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">7. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of the
            Republic of Panama. Any disputes arising from these terms shall be resolved through
            binding arbitration.
          </p>
        </div>
      </section>
    </div>
  );
}
