
"use client";

import { useEffect, useState } from "react";
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

type ProviderName = "google.com" | "github.com";

export default function LinkedAccounts() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] =
    useState<ProviderName | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const isLinked = (providerId: ProviderName) =>
    Boolean(
      user?.providerData.some(
        (provider) => provider.providerId === providerId
      )
    );

  const linkProvider = async (providerId: ProviderName) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setMessage("Please sign in to your existing account first.");
      return;
    }

    if (isLinked(providerId)) {
      setMessage("This provider is already linked to your account.");
      return;
    }

    setLoading(true);
    setActiveProvider(providerId);
    setMessage("");

    try {
      let provider;

      switch (providerId) {
        case "google.com":
          provider = new GoogleAuthProvider();
          break;
        case "github.com":
          provider = new GithubAuthProvider();
          provider.addScope("read:user");
          provider.addScope("user:email");
          break;
      }

      await linkWithPopup(currentUser, provider);
      await currentUser.reload();

      setUser(auth.currentUser);
      setMessage("Account linked successfully!");
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/credential-already-in-use") {
        setMessage(
          "This provider account is already connected to another Firebase account. Sign in to that account and verify ownership before resolving the accounts."
        );
      } else if (code === "auth/provider-already-linked") {
        setMessage("This provider is already linked.");
      } else if (code === "auth/popup-closed-by-user") {
        setMessage("The sign-in popup was closed.");
      } else if (code === "auth/popup-blocked") {
        setMessage("Your browser blocked the popup. Allow popups and try again.");
      } else if (code === "auth/operation-not-allowed") {
        setMessage(
          "This provider is disabled. Enable it in Firebase Console > Authentication > Sign-in method."
        );
      } else {
        setMessage(
          error instanceof Error ? error.message : "Could not link account."
        );
      }
    } finally {
      setLoading(false);
      setActiveProvider(null);
    }
  };

  const signInWithProvider = async (providerId: ProviderName) => {
    setLoading(true);
    setActiveProvider(providerId);
    setMessage("");

    try {
      let provider;

      switch (providerId) {
        case "google.com":
          provider = new GoogleAuthProvider();
          break;
        case "github.com":
          provider = new GithubAuthProvider();
          break;
      }

      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setMessage(`Signed in as ${result.user.email ?? "user"}.`);
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/popup-closed-by-user") {
        setMessage("The sign-in popup was closed.");
      } else if (code === "auth/operation-not-allowed") {
        setMessage(
          "This provider is disabled in Firebase Console > Authentication > Sign-in method."
        );
      } else {
        setMessage(
          error instanceof Error ? error.message : "Sign-in failed."
        );
      }
    } finally {
      setLoading(false);
      setActiveProvider(null);
    }
  };

  const providers: {
    id: ProviderName;
    name: string;
    description: string;
  }[] = [
    {
      id: "google.com",
      name: "Google",
      description: "Google account authentication",
    },
    {
      id: "github.com",
      name: "GitHub",
      description: "Developer account authentication",
    },
  ];

  const emailPasswordLinked = Boolean(
    user?.providerData.some(
      (provider) => provider.providerId === "password"
    )
  );

  return (
    <section className="space-y-5 rounded-2xl border border-white/15 bg-white/5 p-6">
      <h2 className="text-xl font-semibold">Linked Accounts</h2>

      <p className="text-sm text-gray-300">
        Connect Google or GitHub to your existing Firebase account.
        Linking requires you to be signed in first.
      </p>

      {!user ? (
        <div className="space-y-3">
          <p className="text-sm text-amber-200">
            You are not signed in. Sign in with the account you want to keep.
          </p>

          <button
            type="button"
            onClick={() => signInWithProvider("google.com")}
            disabled={loading}
            className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
          >
            {loading && activeProvider === "google.com"
              ? "Please wait..."
              : "Sign in with Google"}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-sm text-gray-300">Signed-in account</p>
            <p className="break-all font-medium">
              {user.email ?? user.displayName ?? user.uid}
            </p>
          </div>

          <div className="space-y-3">
            {providers.map((provider) => {
              const linked = isLinked(provider.id);

              return (
                <div
                  key={provider.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-sm text-gray-400">
                      {provider.description}
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        linked ? "text-green-300" : "text-amber-200"
                      }`}
                    >
                      {linked ? "Linked" : "Not linked"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => linkProvider(provider.id)}
                    disabled={loading || linked}
                    className="rounded-xl bg-white px-4 py-2 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading && activeProvider === provider.id
                      ? "Please wait..."
                      : linked
                        ? "Already linked"
                        : `Link ${provider.name}`}
                  </button>
                </div>
              );
            })}

            <div className="rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold">Email &amp; Password</h3>
              <p className="text-sm text-gray-400">
                Email and password authentication
              </p>
              <p
                className={`mt-1 text-sm ${
                  emailPasswordLinked
                    ? "text-green-300"
                    : "text-amber-200"
                }`}
              >
                {emailPasswordLinked
                  ? "Linked"
                  : "Not linked to this account"}
              </p>
            </div>
          </div>
        </>
      )}

      <p className="text-sm text-gray-300">
        Facebook and Phone authentication are not shown here.
      </p>

      {message && (
        <p className="break-words text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
