
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "How this website handles personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800">
      <h1 className="mb-3 text-3xl font-bold">Privacy Policy</h1>

      <p className="mb-8 text-sm text-gray-500">
        Last updated: October 15, 2026
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            1. Information We Receive
          </h2>
          <p>
            When you sign in, we may receive account information such as your
            name, email address, profile picture, and provider account
            identifier, depending on the identity provider and its permissions.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">2. Authentication</h2>
          <p>
            This website uses Firebase Authentication to manage supported
            sign-in methods. Google or GitHub may process your information
            according to their own privacy policies when you use their sign-in
            services.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            3. How Information Is Used
          </h2>
          <p>
            Account information may be used to authenticate users, maintain
            account security, provide website features, and respond to support
            requests.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            4. Storage and Security
          </h2>
          <p>
            Data handling depends on the services and configuration used by
            this website. Reasonable measures should be taken to protect
            information, but no online system can guarantee absolute security.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            5. Sharing and Third Parties
          </h2>
          <p>
            Firebase and the identity provider you choose may process
            information to provide authentication. Any additional analytics,
            advertising, databases, or third-party services used by this
            website should be disclosed here before publication.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">6. Your Choices</h2>
          <p>
            You can stop using the website at any time. To ask about your
            account information or request account deletion, contact the
            website owner using the contact details published on the website.
            Account deletion may require additional steps in Firebase or other
            services.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            7. Policy Updates and Contact
          </h2>
          <p>
            This policy may be updated as the website changes. Contact the
            website owner through the published contact details for privacy
            questions.
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-5">
        <Link
          href="/login"
          className="text-blue-600 underline hover:text-blue-800"
        >
          ← Back to Sign In
        </Link>

      <Link
  href="/terms"
  className="text-blue-600 underline hover:text-blue-800"
>
  Terms of Service
</Link>
      </div>
    </main>
  );
}
