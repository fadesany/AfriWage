import Link from 'next/link';
import {
  Code,
  Github,
  Globe,
  LineChart,
  RefreshCw,
  Send,
  Shield,
  Wallet,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Section 1: Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              AfriWage
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-[#14A800] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#108A00]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Section 2: Hero */}
      <section className="bg-[#0A0A0A] py-24 sm:py-32 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-8 flex justify-center">
            <span className="rounded-full bg-[#14A800]/20 px-3 py-1 text-xs font-semibold tracking-wide text-[#14A800] ring-1 ring-inset ring-[#14A800]/30">
              Built on Stellar Testnet
            </span>
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl">
            Pay your African team. Instantly.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Send USDC via Stellar. Workers receive NGN, GHS, or KES directly to their bank accounts. No 5-day delays. No 10% wire fees.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-md bg-[#14A800] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#108A00]"
            >
              Launch App
            </Link>
            <Link
              href="https://github.com/AfriWage/AfriWage"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Read Docs
            </Link>
          </div>
          <div className="mt-20 flex flex-wrap justify-center gap-8 sm:gap-20 text-sm font-medium text-slate-500">
            <div className="flex flex-col items-center gap-2">
              <Zap className="h-5 w-5 text-slate-400" />
              <span>&lt; 5s Settlement</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <LineChart className="h-5 w-5 text-slate-400" />
              <span>Fractions of a cent fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: How it works */}
      <section className="bg-[#F9FAFB] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
            How the infrastructure works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Connect Treasury',
                desc: 'Fund your Freighter wallet with USDC.',
                icon: Wallet,
              },
              {
                num: '02',
                title: 'Dispatch Payroll',
                desc: 'Send batches instantly on-chain.',
                icon: Send,
              },
              {
                num: '03',
                title: 'Automatic Off-Ramp',
                desc: 'Anchors convert USDC to local fiat.',
                icon: RefreshCw,
              },
            ].map((step) => (
              <div
                key={step.num}
                className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#14A800]/10 text-xl font-bold text-[#14A800]">
                  {step.num}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Features */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Non-custodial',
                desc: 'You hold the keys. Funds never touch our servers.',
                icon: Shield,
              },
              {
                title: 'SEP-24/SEP-6 Anchor ready',
                desc: 'Direct integration with Stellar network anchors.',
                icon: Globe,
              },
              {
                title: 'Real-time tracking',
                desc: 'Monitor every transaction live on the ledger.',
                icon: LineChart,
              },
              {
                title: 'Multi-currency',
                desc: 'Send in USDC, workers receive their local fiat.',
                icon: RefreshCw,
              },
              {
                title: 'Soroban compatible',
                desc: 'Ready for next-gen smart contract workflows.',
                icon: Zap,
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                  <feature.icon className="h-5 w-5 text-[#14A800]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Corridors */}
      <section className="bg-[#F9FAFB] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
            Supported Corridors
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { code: 'NGN', flag: '🇳🇬' },
              { code: 'GHS', flag: '🇬🇭' },
              { code: 'KES', flag: '🇰🇪' },
              { code: 'ZAR', flag: '🇿🇦' },
              { code: 'TZS', flag: '🇹🇿' },
              { code: 'UGX', flag: '🇺🇬' },
              { code: 'XOF', flag: '🇨🇮' },
              { code: 'XAF', flag: '🇨🇲' },
            ].map((currency) => (
              <div
                key={currency.code}
                className="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-2 text-3xl">{currency.flag}</div>
                <div className="text-xl font-bold text-slate-900">{currency.code}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Footer */}
      <footer className="bg-white py-12 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-bold tracking-tight text-slate-900">
            AfriWage
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
            <Link href="https://github.com/AfriWage/AfriWage" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
              GitHub
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/worker" className="hover:text-slate-900 transition-colors">
              Worker Portal
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} AfriWage. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
