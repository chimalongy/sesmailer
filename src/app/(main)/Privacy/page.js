export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-905 dark:text-white mb-6">
        Privacy Policy
      </h1>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-8">Last updated: July 2026</p>
      
      <div className="prose prose-zinc dark:prose-invert space-y-6 text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">1. Overview</h2>
          <p>
            Genius Domain Names ("we", "us", or "our") respects your privacy. This Privacy Policy details how we collect, use, and protect your information when you visit our website, submit inquiries, or buy domains from us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">2. Information Collection</h2>
          <p>
            We collect personal information that you provide voluntarily when using our Contact forms or submitting offers. This may include your name, company name, email address, phone number, and offer details. We also collect basic technical data like your IP address via server logs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">3. Use of Information</h2>
          <p>
            We use your collected information solely to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Process and negotiate domain name transactions.</li>
            <li>Respond to offers, brokerage inquiries, and customer service.</li>
            <li>Maintain site security and troubleshoot technical errors.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">4. Third-Party Sharing</h2>
          <p>
            We do not sell, rent, or trade your personal information. To facilitate secure domain transactions, we may share essential data with escrow brokers (e.g., Escrow.com, DAN.com, SEDO) to verify your credentials and secure the funds.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">5. Data Retention & Security</h2>
          <p>
            We retain message histories only as long as necessary to complete commercial transactions or satisfy legal compliance requirements. We apply industry-standard electronic safeguards to prevent unauthorized data access.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">6. Contact Us</h2>
          <p>
            For privacy inquiries or data requests, reach us at{" "}
            <a href="mailto:privacy@geniusdomainnames.com" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              privacy@geniusdomainnames.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
