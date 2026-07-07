import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective: {new Date().toLocaleDateString("en-MY")}
        </p>
      </header>

      <section className="space-y-6 text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Data We Collect</h2>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
            <li>Name, email, phone, and role (account profile)</li>
            <li>Asset management data (hardware records, maintenance logs, audit trails)</li>
            <li>Usage logs (login timestamps, actions performed)</li>
            <li>Device information (browser type, IP address)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Purpose of Processing</h2>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
            <li>Asset tracking and management per contract</li>
            <li>Maintenance and repair workflow management</li>
            <li>Compliance audit logging and reporting</li>
            <li>System security and access control</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Data Retention</h2>
          <p className="mt-2 text-muted-foreground">
            Personal data is retained for the duration of the active contract plus 7 years for audit
            compliance purposes. After this period, data is securely deleted or anonymized in
            accordance with PDPA requirements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Your Rights (PDPA)</h2>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground">Right to access</strong> — download your personal
              data via the Export feature in Settings
            </li>
            <li>
              <strong className="text-foreground">Right to correction</strong> — edit your profile
              information at any time
            </li>
            <li>
              <strong className="text-foreground">Right to deletion</strong> — request account
              deletion via the Settings page
            </li>
            <li>
              <strong className="text-foreground">Right to portability</strong> — export your data
              in JSON format
            </li>
            <li>
              <strong className="text-foreground">Right to object</strong> — contact the Data
              Protection Officer to restrict processing
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
          <p className="mt-2 text-muted-foreground">
            We implement industry-standard security measures including HTTPS encryption, secure
            session management, two-factor authentication, and role-based access controls. All data
            is stored on servers within Malaysia.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Third-Party Processors</h2>
          <p className="mt-2 text-muted-foreground">
            Your data may be processed by trusted service providers for hosting, authentication, and
            analytics purposes. All third-party processors are bound by data processing agreements
            compliant with PDPA.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            For privacy-related inquiries or to exercise your rights, please contact:
          </p>
          <p className="mt-1 text-muted-foreground">
            <strong className="text-foreground">Data Protection Officer</strong>
            <br />
            Email: dpo@aims.gov.my
            <br />
            Phone: +60 3-2178 4000
          </p>
        </section>

        <footer className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          <Link href="/login" className="hover:underline">
            Back to Login
          </Link>
        </footer>
      </section>
    </main>
  );
}
