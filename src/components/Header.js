"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Portfolio", href: "/Portfolio" },
    { name: "About", href: "/About" },
    { name: "Contact", href: "/Contact" },
  ];

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/80 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/80 transition-colors duration-300">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            G
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Genius<span className="text-indigo-600 dark:text-indigo-400 font-semibold">DomainNames</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative py-1 text-sm font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {link.name}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full" />
              )}
            </Link>
          ))}
          
          <Link
            href="/Contact"
            className="ml-4 inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wide text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-200 shadow-sm shadow-indigo-500/10 active:scale-95"
          >
            Make an Offer
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 focus:outline-none md:hidden transition-colors"
          aria-expanded={isOpen}
        >
          <span className="sr-only">Open main menu</span>
          {isOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-64 border-b border-zinc-200 dark:border-zinc-800" : "max-h-0"
        }`}
      >
        <div className="space-y-1 px-4 pb-4 pt-2 bg-white dark:bg-zinc-950">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block rounded-lg px-4 py-2.5 text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 px-4">
            <Link
              href="/Contact"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all active:scale-98"
            >
              Make an Offer
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
