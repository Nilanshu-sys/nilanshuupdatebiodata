"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [fullName, setFullName] = useState("User");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      setFullName(user.displayName || user.email || "User");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      alert("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  if (loading) {
    return null;
  }

  const navLinks = [
    { label: "Home", href: "/dashboard" },
    { label: "About", href: "/dashboard#about" },
    { label: "Education", href: "/dashboard#education" },
    { label: "Contact", href: "/dashboard#contact" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <a href="/dashboard" className="navbar-logo">
          <span className="logo-icon">N</span>
          <span>Nilanshu</span>
        </a>

        {/* Desktop Navigation */}
        <nav
          className={`navbar-links ${
            mobileMenuOpen ? "navbar-links-open" : ""
          }`}
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={
                pathname === link.href
                  ? "navbar-link active"
                  : "navbar-link"
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}

          {/* Mobile user information and logout */}
          <div className="mobile-user-actions">
            <span className="navbar-user">{fullName}</span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </nav>

        {/* Right Side */}
        <div className="navbar-actions">
          <span className="navbar-user">{fullName}</span>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((previous) => !previous)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
}