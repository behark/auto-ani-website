import type { Metadata } from 'next';

import { COMPANY_INFO } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy | AUTO ANI',
  description:
    'How AUTO ANI collects, uses, and protects your personal data, including login and contact information.',
};

export default function PrivacyPage() {
  const lastUpdated = 'June 1, 2026';

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <p>
              AUTO ANI (&quot;we&quot;, &quot;us&quot;) operates the website at{' '}
              {COMPANY_INFO.name}. This Privacy Policy explains what information we collect, how
              we use it, and your rights regarding that information. If you have questions, contact
              us at{' '}
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="text-[var(--primary-orange)] underline"
              >
                {COMPANY_INFO.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">Information we collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account information (login).</strong> When you log in with Google or
                Facebook, we receive your name, email address, and profile photo from that
                provider. We do not receive or store your social account password.
              </li>
              <li>
                <strong>Contact &amp; inquiry details.</strong> Information you enter into our
                forms (e.g. financing pre-qualification or fleet inquiries), such as your name,
                email, phone number, and the details of your request.
              </li>
              <li>
                <strong>Usage &amp; device data.</strong> Standard analytics and advertising
                measurement data (pages viewed, approximate location, device/browser), including
                via the Meta Pixel and Google services, to understand site usage and improve our
                marketing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">How we use your information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To authenticate you and keep you signed in.</li>
              <li>To pre-fill your details on forms so inquiries are faster.</li>
              <li>To respond to your inquiries and provide our services.</li>
              <li>To measure and improve our website and advertising.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">Sharing your information</h2>
            <p>
              We do <strong>not</strong> sell your personal data. We share data only with service
              providers that help us operate the site (such as authentication, hosting, and
              analytics/advertising providers like Google and Meta), and where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">Your rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data, and you
              can log out at any time. To make a request, email us at{' '}
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="text-[var(--primary-orange)] underline"
              >
                {COMPANY_INFO.email}
              </a>
              . You can also revoke our access from your Google or Facebook account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900">Contact</h2>
            <p>
              {COMPANY_INFO.name}
              <br />
              {COMPANY_INFO.address}
              <br />
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="text-[var(--primary-orange)] underline"
              >
                {COMPANY_INFO.email}
              </a>
              {' · '}
              <a
                href={`tel:${COMPANY_INFO.phone}`}
                className="text-[var(--primary-orange)] underline"
              >
                {COMPANY_INFO.phone}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
