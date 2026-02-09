"use client";

import Link from "next/link";
import { useState } from "react";
import { WalletConnect } from "@/components/wallet-connect";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/agents", label: "My Agents" },
    { href: "/religions", label: "Religions" },
    { href: "/arena", label: "Arena" },
    { href: "/marketplace", label: "Marketplace" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
      <nav className="px-4 lg:px-6 w-full">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-2xl font-[family-name:var(--font-press-start-2p)] tracking-tighter">
              HolyMon
            </span>
          </Link>

          <div className="hidden md:flex md:items-center gap-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-400 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <WalletConnect />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 p-1.5"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800">
            <div className="px-4 py-3 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-gray-400 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4">
                <WalletConnect />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
