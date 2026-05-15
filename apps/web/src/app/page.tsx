import {
  Zap,
  Globe,
  Shield,
  Wallet,
  Code2,
  Users,
  Wallet2,
  SendHorizonal,
  CheckCircle2,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AfriWage — Pay Your African Team Instantly',
  description:
    'AfriWage sends USDC over Stellar directly to gig workers across Africa. Workers receive local currency. No banks. No delays. No markup.',
};

/* ─── DATA ─────────────────────────────────────────────── */

const steps = [
  {
    num: '01',
    Icon: Wallet2,
    title: 'Connect your wallet',
    body: 'Install Freighter and connect your Stellar wallet in seconds. No account creation. No KYC.',
    accent: false,
  },
  {
    num: '02',
    Icon: SendHorizonal,
    title: 'Send USDC',
    body: 'Enter your worker\u2019s Stellar address and amount. Review the live NGN, GHS, or KES conversion before confirming.',
    accent: false,
  },
  {
    num: '03',
    Icon: CheckCircle2,
    title: 'Worker receives local currency',
    body: 'Settlement completes on Stellar in under 5 seconds. The anchor delivers local currency to the worker\u2019s account.',
    accent: true,
  },
];

const features = [
  {
    Icon: Zap,
    title: 'Instant settlement',
    body: 'USDC settles on Stellar in under 5 seconds. No 3-day wire windows.',
  },
  {
    Icon: Globe,
    title: '8 African corridors',
    body: 'NGN, GHS, KES, ZAR, TZS, UGX, XOF, XAF. Local currency delivered via anchor rails.',
  },
  {
    Icon: Shield,
    title: 'Verifiable on-chain',
    body: 'Every payment has a Stellar transaction hash. Verify any payment in seconds.',
  },
  {
    Icon: Wallet,
    title: 'Non-custodial',
    body: 'Your keys stay in Freighter. AfriWage never holds your funds.',
  },
  {
    Icon: Code2,
    title: 'Open source SDK',
    body: '@afriwage/sdk wraps Stellar helpers for balances, payments, and account ops.',
  },
  {
    Icon: Users,
    title: 'Worker passport',
    body: 'Every worker has a shareable payment history. Proof of international work, on-chain.',
  },
];

const corridors = [
  { flag: '🇳🇬', country: 'Nigeria', code: 'NGN' },
  { flag: '🇬🇭', country: 'Ghana', code: 'GHS' },
  { flag: '🇰🇪', country: 'Kenya', code: 'KES' },
  { flag: '🇿🇦', country: 'South Africa', code: 'ZAR' },
  { flag: '🇹🇿', country: 'Tanzania', code: 'TZS' },
  { flag: '🇺🇬', country: 'Uganda', code: 'UGX' },
  { flag: '🇸🇳', country: 'Senegal', code: 'XOF' },
  { flag: '🇨🇲', country: 'Cameroon', code: 'XAF' },
];

/* ─── PAGE ─────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── NAVBAR ────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-16 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          {/* Left */}
          <Link href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#14A800]" />
            <span className="text-lg font-bold text-[#111111]">AfriWage</span>
          </Link>

          {/* Center nav links — hidden on mobile */}
          <div className="hidden items-center gap-8 md:flex">
            {['Platform', 'How It Works', 'Corridors', 'Developers'].map(
              (label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm text-[#6B7280] transition-colors duration-150 hover:text-[#111111]"
                >
                  {label}
                </a>
              ),
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-[#E5E7EB] px-6 py-2 text-sm font-semibold text-[#111111] transition-colors duration-150 hover:bg-[#F9FAFB] sm:inline-flex"
            >
              View on GitHub
            </a>
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#14A800] px-6 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#108A00]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────── */}
      <section id="platform" className="bg-[#0A0A0A] pb-24 pt-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          {/* Pill badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#14A800]/30 bg-[#14A800]/10 px-4 py-1.5 text-xs font-semibold text-[#14A800]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#14A800]" />
            Live on Stellar Testnet
          </div>

          {/* H1 */}
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
            Pay your African team.
            <br />
            <span className="text-[#14A800]">Instantly.</span>
          </h1>

          {/* Body */}
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            AfriWage sends USDC over Stellar directly to gig workers across
            Africa. Workers receive local currency. No banks. No delays. No
            markup.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-[#14A800] px-6 py-3 font-semibold text-white transition-colors duration-150 hover:bg-[#108A00]"
            >
              Launch App →
            </Link>
            <a
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              View on GitHub
            </a>
          </div>

          {/* Trust row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40">
            <span>✓ Free on testnet</span>
            <span>✓ Open source MIT</span>
            <span>✓ Non-custodial</span>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-8 border-t border-white/10 pt-12">
            {[
              { value: '< 5s', label: 'Settlement time' },
              { value: '~$0.0001', label: 'Per transfer fee' },
              { value: '8', label: 'African corridors' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#14A800]">
            HOW IT WORKS
          </p>
          <h2 className="text-center text-3xl font-bold text-[#111111] md:text-4xl">
            Three steps. Zero banks.
          </h2>
          <p className="mx-auto mb-16 mt-4 max-w-xl text-center text-[#6B7280]">
            From your wallet to your worker&apos;s bank account in seconds.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-8"
              >
                <p className="mb-6 text-4xl font-bold text-[#14A800]">
                  {step.num}
                </p>
                <step.Icon
                  className={`mb-4 h-8 w-8 ${step.accent ? 'text-[#14A800]' : 'text-[#111111]'}`}
                />
                <h3 className="text-lg font-semibold text-[#111111]">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[#6B7280]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section id="features" className="bg-[#F9FAFB] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#14A800]">
            FEATURES
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold text-[#111111] md:text-4xl">
            Everything payroll needs. Nothing it doesn&apos;t.
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#E5E7EB] bg-white p-6"
              >
                <f.Icon className="mb-4 h-6 w-6 text-[#14A800]" />
                <h3 className="mb-2 text-base font-semibold text-[#111111]">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORRIDORS ─────────────────────────────── */}
      <section id="corridors" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[#14A800]">
            SUPPORTED CORRIDORS
          </p>
          <h2 className="text-center text-3xl font-bold text-[#111111] md:text-4xl">
            8 African payout corridors
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-[#6B7280]">
            More being added. PRs welcome.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {corridors.map((c) => (
              <div
                key={c.code}
                className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center"
              >
                <p className="mb-3 text-3xl">{c.flag}</p>
                <p className="text-sm font-semibold text-[#111111]">
                  {c.country}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">{c.code}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
          {/* Left */}
          <div>
            <p className="text-lg font-bold text-white">AfriWage</p>
            <p className="mt-2 text-sm text-white/50">
              Borderless payroll for African teams.
            </p>
            <p className="mt-4 text-xs text-white/30">
              Built on Stellar · MIT License
            </p>
          </div>

          {/* Middle — Product */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              PRODUCT
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Worker Portal', href: '/worker' },
                { label: 'Send Payment', href: '/send' },
                { label: 'Receipt Lookup', href: '/transactions' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors duration-150 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Community */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              COMMUNITY
            </p>
            <ul className="space-y-3">
              {[
                {
                  label: 'GitHub',
                  href: 'https://github.com/AfriWage/AfriWage',
                },
                {
                  label: 'GitBook Docs',
                  href: 'https://k1ngd4vid.gitbook.io/afriwage-docs',
                },
                { label: 'Telegram', href: 'https://t.me/afriwage' },
                { label: 'Stellar.org', href: 'https://stellar.org' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/60 transition-colors duration-150 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 px-6 pt-8 text-center text-xs text-white/30">
          © 2025 AfriWage · Open source under MIT License
        </div>
      </footer>
    </div>
  );
}
