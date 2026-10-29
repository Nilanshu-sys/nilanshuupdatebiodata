"use client";

import { useEffect, useState } from "react";
import LinkedAccounts from "./LinkedAccounts";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

type Section =
  | "overview"
  | "portfolio"
  | "security"
  | "authentication"
  | "accounts"
  | "settings";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] =
    useState<Section>("overview");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setCheckingAuth(false);
        router.replace("/login");
        return;
      }

      const isPasswordUser = currentUser.providerData.some(
        (provider) => provider.providerId === "password"
      );

      // Email/password accounts must verify their email.
      // Google accounts are not blocked by this check.
      if (isPasswordUser && !currentUser.emailVerified) {
        setUser(null);
        setCheckingAuth(false);

        void signOut(auth).finally(() => {
          router.replace("/login");
        });

        return;
      }

      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      setLoggingOut(false);
      alert("Logout failed. Please try again.");
    }
  }

  if (checkingAuth || !user) {
    return (
      <main className="security-loading">
        <div className="security-loader" />
        <p>Verifying your account...</p>
      </main>
    );
  }

  // Keep a non-null user reference after the authentication guard.
  const currentUser: User = user;

  const displayName =
    currentUser.displayName ||
    currentUser.email?.split("@")[0] ||
    "User";

  const providerNames = currentUser.providerData.map((provider) => {
    const names: Record<string, string> = {
      password: "Email & Password",
      "google.com": "Google",
      "github.com": "GitHub",
    };

    return names[provider.providerId] || provider.providerId;
  });

  const sections: {
    id: Section;
    label: string;
    icon: string;
  }[] = [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "portfolio", label: "My Portfolio", icon: "▣" },
    { id: "security", label: "Security Center", icon: "⬡" },
    { id: "authentication", label: "Authentication", icon: "⚿" },
    { id: "accounts", label: "Linked Accounts", icon: "◎" },
    { id: "settings", label: "Account Settings", icon: "⚙" },
  ];

  const cardStyle: React.CSSProperties = {
    background: "#111c30",
    border: "1px solid #25334b",
    borderRadius: 16,
    padding: 22,
  };

  const mutedText: React.CSSProperties = {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.7,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 750,
    marginBottom: 8,
    color: "#f8fafc",
  };

  function renderOverview() {
    const emailVerified = currentUser.emailVerified;
    const isEmailPasswordUser = currentUser.providerData.some(
      (provider) => provider.providerId === "password"
    );

    return (
      <>
        <div className="security-welcome">
          <div>
            <p className="security-eyebrow">
              YOUR PERSONAL CONTROL CENTER
            </p>
            <h2>Welcome back, {displayName} 👋</h2>
            <p>
              Manage your account, authentication methods and security
              from one place.
            </p>
          </div>

          <div className="security-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="security-grid">
          <div style={cardStyle}>
            <p style={mutedText}>ACCOUNT STATUS</p>
            <h3 className="security-card-heading">
              {emailVerified || !isEmailPasswordUser
                ? "Account Active"
                : "Verification Pending"}
            </h3>
            <p style={mutedText}>
              {emailVerified
                ? "Your email address is verified."
                : isEmailPasswordUser
                  ? "Email verification status is not confirmed."
                  : "Signed in using an external provider."}
            </p>
          </div>

          <div style={cardStyle}>
            <p style={mutedText}>LOGIN METHODS</p>
            <h3 className="security-card-heading">
              {providerNames.length}
            </h3>
            <p style={mutedText}>
              Authentication provider(s) linked to your account.
            </p>
          </div>

          <div style={cardStyle}>
            <p style={mutedText}>USER ID</p>
            <h3 className="security-card-heading">Firebase account</h3>
            <p style={mutedText}>
              {currentUser.uid.slice(0, 12)}...
            </p>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 22 }}>
          <h3 className="security-card-heading">Account Information</h3>

          <div className="security-info-row">
            <span>Email address</span>
            <strong>{currentUser.email || "Not available"}</strong>
          </div>

          <div className="security-info-row">
            <span>Display name</span>
            <strong>{displayName}</strong>
          </div>

          <div className="security-info-row">
            <span>Email verified</span>
            <strong>{emailVerified ? "Yes" : "Not confirmed"}</strong>
          </div>

          <div className="security-info-row">
            <span>Account created</span>
            <strong>
              {currentUser.metadata.creationTime
                ? new Date(
                    currentUser.metadata.creationTime
                  ).toLocaleDateString()
                : "Not available"}
            </strong>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 22 }}>
          <h3 className="security-card-heading">Quick Actions</h3>

          <div className="security-actions">
            <button
              className="security-action-button"
              onClick={() => setActiveSection("security")}
            >
              🛡️ Open Security Center
            </button>

            <button
              className="security-action-button"
              onClick={() => setActiveSection("authentication")}
            >
              🔐 View Authentication Methods
            </button>

            <button
              className="security-action-button"
              onClick={() => setActiveSection("portfolio")}
            >
              🌐 Open My Portfolio
            </button>
          </div>
        </div>
      </>
    );
  }

  function renderSecurity() {
    const emailVerified = currentUser.emailVerified;

    return (
      <>
        <h2 style={sectionTitleStyle}>Security Center</h2>

        <p style={{ ...mutedText, marginBottom: 24 }}>
          Review your account security and explore additional protections.
        </p>

        <div className="security-grid">
          {[
            {
              icon: "✉️",
              title: "Email Verification",
              description: emailVerified
                ? "Your email is verified."
                : "Your email verification is not confirmed.",
              status: emailVerified ? "Verified" : "Unverified",
            },
            {
              icon: "🛡️",
              title: "Account Protection",
              description:
                "Use a strong password and trusted sign-in providers.",
              status: "Review recommended",
            },
            {
              icon: "🔑",
              title: "Sign-in Methods",
              description:
                "Review the providers linked to your Firebase account.",
              status: `${providerNames.length} linked`,
            },
          ].map((item) => (
            <div key={item.title} style={cardStyle}>
              <div style={{ fontSize: 27 }}>{item.icon}</div>
              <h3 className="security-card-heading">{item.title}</h3>
              <p style={mutedText}>{item.description}</p>
              <div className="security-status">{item.status}</div>
            </div>
          ))}
        </div>

        <div style={{ ...cardStyle, marginTop: 22 }}>
          <h3 className="security-card-heading">
            Security Recommendations
          </h3>
          <ul className="security-recommendations">
            <li>Use a unique, strong password.</li>
            <li>Keep your email address up to date.</li>
            <li>Never share passwords or verification codes.</li>
            <li>Review the providers linked to your account.</li>
          </ul>
        </div>
      </>
    );
  }

  function renderAuthentication() {
    const methods = [
      {
        id: "password",
        name: "Email & Password",
        description: "Sign in using your registered email and password.",
        icon: "✉️",
      },
      {
        id: "google.com",
        name: "Google",
        description: "Sign in using your Google account.",
        icon: "🌐",
      },
      {
        id: "github.com",
        name: "GitHub",
        description: "Sign in using your GitHub account.",
        icon: "🐙",
      },
    ];

    return (
      <>
        <h2 style={sectionTitleStyle}>Authentication Methods</h2>

        <p style={{ ...mutedText, marginBottom: 24 }}>
          Review Email & Password, Google, and GitHub authentication.
        </p>

        <div className="security-method-list">
          {methods.map((method) => {
            const available = currentUser.providerData.some(
              (provider) => provider.providerId === method.id
            );

            return (
              <div className="security-method" key={method.id}>
                <div className="security-method-icon">
                  {method.icon}
                </div>

                <div className="security-method-copy">
                  <h3>{method.name}</h3>
                  <p style={mutedText}>{method.description}</p>
                </div>

                <span
                  className={
                    available
                      ? "security-method-status active"
                      : "security-method-status"
                  }
                >
                  {available ? "Linked" : "Not linked"}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderLinkedAccounts() {
    const providers = [
      {
        id: "google.com",
        name: "Google",
        icon: "🌐",
        description: "Google account authentication",
      },
      {
        id: "github.com",
        name: "GitHub",
        icon: "🐙",
        description: "Developer account authentication",
      },
      {
        id: "password",
        name: "Email & Password",
        icon: "✉️",
        description: currentUser.email || "Email-based account",
      },
    ];

    return (
      <>
        <h2 style={sectionTitleStyle}>Linked Accounts</h2>

        <p style={{ ...mutedText, marginBottom: 24 }}>
          These are the authentication providers linked to your Firebase user.
        </p>

        {providers.map((provider) => {
          const linked = currentUser.providerData.some(
            (item) => item.providerId === provider.id
          );

          return (
            <div className="security-method" key={provider.id}>
              <div className="security-method-icon">
                {provider.icon}
              </div>

              <div className="security-method-copy">
                <h3>{provider.name}</h3>
                <p style={mutedText}>{provider.description}</p>
              </div>

              <span
                className={
                  linked
                    ? "security-method-status active"
                    : "security-method-status"
                }
              >
                {linked ? "Linked" : "Not linked"}
              </span>
            </div>
          );
        })}

        <div style={{ ...cardStyle, marginTop: 24 }}>
          <h3 className="security-card-heading">Connect Accounts</h3>
          <p style={mutedText}>
            Link Google or GitHub to this signed-in account.
            Make sure you are signed in to the account you want to keep.
          </p>

          <div style={{ marginTop: 16 }}>
            <LinkedAccounts />
          </div>
        </div>
      </>
    );
  }

  function renderSettings() {
    return (
      <>
        <h2 style={sectionTitleStyle}>Account Settings</h2>

        <p style={{ ...mutedText, marginBottom: 24 }}>
          Review your account details and available actions.
        </p>

        <div style={cardStyle}>
          <h3 className="security-card-heading">Profile Information</h3>

          <div className="security-info-row">
            <span>Name</span>
            <strong>{displayName}</strong>
          </div>

          <div className="security-info-row">
            <span>Email</span>
            <strong>{currentUser.email || "Not available"}</strong>
          </div>

          <div className="security-info-row">
            <span>Account UID</span>
            <strong className="security-uid">{currentUser.uid}</strong>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 22 }}>
          <h3 className="security-card-heading">Session</h3>

          <p style={mutedText}>
            Sign out of this browser when you have finished using your
            account. This does not remotely revoke every other device session.
          </p>

          <button
            className="security-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </>
    );
  }

  function renderSection() {
    switch (activeSection) {
      case "overview":
        return renderOverview();

      case "portfolio":
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "#08111f",
            }}
          >
            <iframe
              src="/portfolio.html"
              title="My Portfolio"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />

            <button
              type="button"
              onClick={() => setActiveSection("overview")}
              style={{
                position: "fixed",
                top: 16,
                left: 16,
                zIndex: 1001,
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #475569",
                background: "#111c30",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        );

      case "security":
        return renderSecurity();

      case "authentication":
        return renderAuthentication();

      case "accounts":
        return renderLinkedAccounts();

      case "settings":
        return renderSettings();
    }
  }

  return (
    <main className="security-dashboard">
      <aside className="security-sidebar">
        <div className="security-brand">
          <div className="security-brand-icon">N</div>
          <div>
            <h1>Nilanshu</h1>
            <p>SECURITY CONSOLE</p>
          </div>
        </div>

        <p className="security-nav-label">WORKSPACE</p>

        <nav className="security-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={
                activeSection === section.id
                  ? "security-nav-item selected"
                  : "security-nav-item"
              }
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="security-sidebar-bottom">
          <div className="security-mini-profile">
            <div className="security-small-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="security-mini-profile-text">
              <strong>{displayName}</strong>
              <span>{currentUser.email || "Authenticated user"}</span>
            </div>
          </div>

          <button
            className="security-sidebar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            ↪ {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </aside>

      <section className="security-main">
        <header className="security-topbar">
          <div>
            <p className="security-breadcrumb">
              Workspace / Security
            </p>
            <h2>
              {sections.find((item) => item.id === activeSection)?.label}
            </h2>
          </div>

          <div className="security-topbar-user">
            <span className="security-online-dot" />
            <span>Authenticated</span>
            <div className="security-small-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="security-content">{renderSection()}</div>

        <footer className="security-footer">
          <span>Nilanshu Security Console</span>
          <span>Account management dashboard</span>
        </footer>
      </section>
    </main>
  );
}