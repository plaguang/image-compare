import type { Metadata } from "next";
import Landing, { type LandingConfig } from "@/components/Landing";

export const metadata: Metadata = {
  title: "Before After Image Slider Online Free – Create & Export Split Photo Comparisons",
  description:
    "Create Before and After photo comparisons online for free. Preview with an interactive split slider or side-by-side layout, add custom Before/After badges, and download a shareable PNG.",
  alternates: { canonical: "/before-after-image-slider" },
};

const config: LandingConfig = {
  badge: "Before & After Photo Generator • Custom Badges • Split Curtain & Side-by-Side Export",
  h1: "Before & After Image Slider & Photo Maker",
  subtitle:
    "Compare photo edits, color grading, AI upscaling, or design revisions with an interactive Before/After slider. Customize the corner badges and export a ready-to-share Before/After PNG in one click.",
  primaryHint: "Upload your 'After' photo to preview the interactive Before/After curtain",
  defaultMode: "slider",
  whyTitle: "Designed for Photographers, Retouchers & Designers",
  whyItems: [
    {
      title: "Custom 'Before' & 'After' Corner Badges",
      body: "Rename the overlay badges to anything you want — 'RAW vs Edited', 'v1 vs v2', or 'Original vs Upscaled' — before exporting your comparison image.",
    },
    {
      title: "Switch Between Split Curtain & Side-by-Side Diptych",
      body: "Export either a single split-curtain frame or a full side-by-side diptych PNG for client presentations, portfolios, and social posts.",
    },
    {
      title: "100% Private Client-Side Processing",
      body: "Client portraits, unreleased product renders, and studio RAW exports stay strictly on your own computer.",
    },
  ],
  steps: [
    {
      title: "Upload Before & After Photos",
      body: "Drop your original photo in Image A and your edited or upscaled version in Image B.",
    },
    {
      title: "Adjust Split Position & Labels",
      body: "Set the split percentage where the change is most dramatic and customize the corner text.",
    },
    {
      title: "Export High-Res PNG",
      body: "Download the lossless comparison image at full original resolution.",
    },
  ],
  faqs: [
    {
      q: "Does this tool watermark my Before/After image?",
      a: "Never. Your exported PNG contains only your own images and the customizable Before/After labels you set.",
    },
    {
      q: "Can I export both images side by side instead of a split slider?",
      a: "Yes! Switch the Mode toolbar to 'Side-by-Side Sync' and click 'Export Comparison .PNG' to download a combined side-by-side diptych image.",
    },
    {
      q: "What image formats can I upload?",
      a: "You can drop PNG, JPEG, WebP, AVIF, GIF, or BMP files of any resolution.",
    },
  ],
  jsonLdName: "Before and After Image Slider Online",
  jsonLdDescription:
    "Free browser-based Before and After image slider and side-by-side comparison PNG generator.",
};

export default function BeforeAfterSliderPage() {
  return <Landing config={config} />;
}
