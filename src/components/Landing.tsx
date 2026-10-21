import Link from "next/link";
import ImageComparator, { type CompareMode } from "./ImageComparator";
import FeedbackBar from "./FeedbackBar";

export interface LandingConfig {
  h1: string;
  badge: string;
  subtitle: string;
  primaryHint: string;
  defaultMode?: CompareMode;
  whyTitle: string;
  whyItems: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  jsonLdName: string;
  jsonLdDescription: string;
}

const NAV_LINKS = [
  { href: "/", label: "Side by Side Compare" },
  { href: "/image-comparison-slider", label: "Comparison Slider" },
  { href: "/before-after-image-slider", label: "Before / After Slider" },
  { href: "/image-diff-checker", label: "Pixel Diff & AI Artifact Checker" },
];

export default function Landing({ config }: { config: LandingConfig }) {
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: config.jsonLdName,
    description: config.jsonLdDescription,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Interactive Before / After split curtain slider with customizable labels",
      "Side-by-side synchronized pixel zoom (1x, 2x, 4x nearest-neighbor)",
      "Pixel-level difference heatmap with PSNR and MAE similarity metrics",
      "Hue rotation and saturation amplifier to reveal hidden AI image generation artifacts",
      "100% client-side browser execution with instant PNG comparison snapshot export",
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-mono">
              A|B
            </span>
            <span>PixelDiffLab</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-600">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10 space-y-12">
        {/* Hero */}
        <section className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <span>🔍</span>
            <span>{config.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {config.h1}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {config.subtitle}
          </p>
        </section>

        {/* Interactive Image Comparison Tool */}
        <section aria-label="Interactive Image Comparison Tool" className="space-y-4">
          <ImageComparator
            defaultMode={config.defaultMode}
            primaryHint={config.primaryHint}
          />
          <FeedbackBar toolName="Image Comparison Tool" theme="light" />
        </section>

        {/* How It Works */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {config.steps.map((s, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Step {idx + 1}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose PixelDiffLab */}
        <section className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">{config.whyTitle}</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {config.whyItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-xs"
              >
                <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {config.faqs.map((f, idx) => (
              <div key={idx} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-semibold text-slate-900 text-sm">{f.q}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 PixelDiffLab — 100% Client-Side Image Comparison Slider, Diff Heatmap &amp; AI Artifact Inspector.
          </div>
          <div className="flex flex-wrap gap-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-800">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
