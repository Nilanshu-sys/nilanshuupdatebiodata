
import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using this website.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800">
      <h1 className="mb-3 text-3xl font-bold">
        Terms of Service
      </h1>

      <p className="mb-8 text-sm text-gray-500">
        Last updated: October 15, 2026
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using this website, you agree to these
            Terms of Service. If you do not agree, please discontinue
            using the website.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            2. Use of the Website
          </h2>
          <p>
            You agree to use this website lawfully, provide accurate
            information when required, and avoid activities that could
            disrupt or harm the website or other users.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            3. Accounts and Security
          </h2>
          <p>
            Sign-in may be provided through Firebase Authentication
            and supported identity providers such as Google or GitHub.
            You are responsible for using your account appropriately.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            4. Website Content
          </h2>
          <p>
            Unless otherwise stated, website content may not be copied,
            republished, or commercially reused without permission.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            5. Availability
          </h2>
          <p>
            We may update, change, or temporarily suspend parts of the
            website. We do not guarantee uninterrupted availability.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            6. Changes and Contact
          </h2>
          <p>
            These terms may be updated when the website changes. For
            questions about these terms, contact the website owner
            using the contact details published on the website.
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

        
      </div>
    </main>
  );
}
