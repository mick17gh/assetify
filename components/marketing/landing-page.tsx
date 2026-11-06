"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Layers3,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { APP_ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Layers3,
    title: "One register",
    body: "Every asset has an AIN, a branch, a custodian, and a condition you can filter.",
  },
  {
    icon: ClipboardCheck,
    title: "Floor checks",
    body: "Freeze a campaign, assign officers, and record what was verified, missing, or unregistered.",
  },
  {
    icon: MapPin,
    title: "Custody that sticks",
    body: "Transfers keep a reason. A staff assignment is saved only after the assignee accepts it.",
  },
  {
    icon: Wrench,
    title: "Repair through disposal",
    body: "Log the service outcome, then recommend disposal. Nothing leaves the register until it is approved.",
  },
];

const steps = [
  { n: "01", title: "Set the map", body: "Regions, branches, and the people who hold the assets." },
  { n: "02", title: "Walk the floor", body: "Officers verify what is there and open an exception for what is not." },
  { n: "03", title: "Close the loop", body: "Repair, replace, or dispose with an approval and a record that stays." },
];

const CONTACT_NUMBER = "233554510864";
const CONTACT_LABEL = "+233 55 451 0864";
const CALL_HREF = `tel:+${CONTACT_NUMBER}`;
const WHATSAPP_HREF = `https://wa.me/${CONTACT_NUMBER}`;

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f4f7fb] text-navy-900">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="landing-float absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#9bb8dc]/50 blur-3xl" />
        <div className="landing-float absolute right-[-4rem] top-40 h-80 w-80 rounded-full bg-[#c5d7ee]/80 blur-3xl [animation-delay:1.5s]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/80 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/45 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={APP_ROUTES.HOME} className="text-lg font-semibold tracking-tight text-navy-900">
            VortAsset
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#contact" className="px-3 text-sm font-medium text-navy-800 hover:text-navy-950">
              Contact
            </a>
            <Button variant="ghost" asChild className="cursor-pointer text-navy-800">
              <Link href={APP_ROUTES.SIGN_IN}>Sign in</Link>
            </Button>
            <Button asChild className="hidden cursor-pointer bg-navy-900 hover:bg-navy-950 sm:inline-flex">
              <Link href={APP_ROUTES.SIGN_IN}>
                Open the register
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-24">
          <div className="landing-rise min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/50 px-3 py-1 text-xs font-medium text-navy-700 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Asset control for every branch
            </p>
            <h1 className="mt-5 max-w-xl text-[2.05rem] font-semibold leading-[1.15] tracking-tight text-balance text-navy-950 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
              Know what you own, where it is, and who has it.
            </h1>
            <p className="mt-5 w-full max-w-lg text-base leading-relaxed text-pretty text-navy-800/80 sm:text-lg">
              VortAsset keeps the register, the floor check, and the disposal decision in one place. Officers verify. Managers approve. Finance sees the value that left.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="cursor-pointer bg-navy-900 hover:bg-navy-950">
                <Link href={APP_ROUTES.SIGN_IN}>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="cursor-pointer border-white/80 bg-white/40 backdrop-blur-md hover:bg-white/70">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
          </div>

          <div className="landing-rise relative min-w-0 [animation-delay:140ms]">
            <div className="rounded-3xl border border-white/70 bg-white/45 p-4 shadow-[0_24px_80px_rgba(1,47,107,0.12)] backdrop-blur-2xl">
              <div className="flex items-center justify-between px-2 pb-3">
                <p className="text-sm font-medium">November floor check</p>
                <span className="rounded-full bg-navy-900/10 px-2 py-0.5 text-xs font-medium text-navy-800">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["Expected", "4"],
                  ["Verified", "1"],
                  ["Not found", "0"],
                  ["Unregistered", "0"],
                  ["Exceptions", "0"],
                  ["Completion", "25%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/80 bg-white/55 px-3 py-4 backdrop-blur-md">
                    <p className="text-xs text-navy-800/70">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="landing-float absolute -bottom-6 -left-4 hidden rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm shadow-lg backdrop-blur-xl sm:block">
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-navy-700" />
                Assignee accepted custody
              </p>
              <p className="mt-1 text-xs text-navy-800/70">Checkbox, PIN, or signature</p>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="landing-rise rounded-3xl border border-white/70 bg-white/45 p-6 shadow-[0_12px_40px_rgba(1,47,107,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/70"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <feature.icon className="h-5 w-5 text-navy-700" />
                <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-navy-800/75">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="relative mx-auto max-w-6xl px-5 pb-24">
          <div className="rounded-[2rem] border border-white/70 bg-white/40 p-6 backdrop-blur-xl sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">From the shelf to the record</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <li key={step.n} className="rounded-2xl border border-white/80 bg-white/50 p-5 backdrop-blur-md">
                  <p className="text-xs font-semibold tracking-[0.18em] text-navy-500">{step.n}</p>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-800/75">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contact" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 pb-20">
          <div className="grid items-center gap-8 rounded-[2rem] border border-white/70 bg-white/45 p-6 shadow-[0_12px_40px_rgba(1,47,107,0.06)] backdrop-blur-xl sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em] text-navy-500">CONTACT</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Call or WhatsApp</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-pretty text-navy-800/75 sm:text-base">
                Ask about a rollout, branch setup, or access for your organization. The same number takes a call or a WhatsApp message.
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-md">
              <p className="text-xs font-medium text-navy-800/70">Phone</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">{CONTACT_LABEL}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="cursor-pointer bg-navy-900 hover:bg-navy-950">
                  <a href={CALL_HREF}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
                <Button asChild variant="outline" className="cursor-pointer border-white/80 bg-white/70 hover:bg-white">
                  <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 pb-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-navy-900 px-6 py-12 text-white shadow-[0_20px_60px_rgba(1,47,107,0.28)] sm:px-12">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative max-w-lg text-3xl font-semibold tracking-tight">The register is ready when you are.</h2>
            <p className="relative mt-3 max-w-md text-sm text-white/75">Sign in to the organization you already belong to. There is no public signup on this page.</p>
            <Button asChild size="lg" className="relative mt-6 cursor-pointer bg-white text-navy-900 hover:bg-navy-50">
              <Link href={APP_ROUTES.SIGN_IN}>
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/60 bg-white/40 py-6 text-center text-xs text-navy-800/70 backdrop-blur-md">
        <p>VortAsset</p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <a href={CALL_HREF} className="font-medium text-navy-800 underline-offset-2 hover:underline">
            Call {CONTACT_LABEL}
          </a>
          <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="font-medium text-navy-800 underline-offset-2 hover:underline">
            WhatsApp
          </a>
        </p>
      </footer>
    </div>
  );
}
