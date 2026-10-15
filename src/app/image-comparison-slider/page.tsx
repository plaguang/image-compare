import type { Metadata } from "next";
import Landing, { type LandingConfig } from "@/components/Landing";

export const metadata: Metadata = {
  title: "Image Comparison Slider Online Free – Interactive A/B Curtain & Imgsli Alternative",
  description:
    "Free online image comparison slider and fast local Imgsli alternative. Drag an interactive A/B split curtain across two images, customize Before/After labels, zoom 4x pixel-by-pixel, and export to PNG.",
  alternates: { canonical: "/image-comparison-slider" },
};

const config: LandingConfig = {
  badge: "Fast Local Imgsli Alternative • Interactive A/B Split Curtain • Zero Upload Lag",
  h1: "Online Image Comparison Slider",
  subtitle:
    "Drag an interactive A/B curtain across any two images in real time. Built as a fast, zero-upload alternative to Imgsli for comparing DLSS/FSR vs TAA, photo retouching, and compression quality.",
  primaryHint: "Drop your second image to drag the interactive A/B split slider",
  defaultMode: "slider",
  whyTitle: "A Faster, Lossless Alternative to Imgsli & Slow Cloud Sliders",
  whyItems: [
    {
      title: "Instant Load for 4K & 8K Uncompressed PNGs",
      body: "No waiting for 30 MB 4K screenshots to upload to a remote server or fail with gateway timeouts. Your images open in under 15 milliseconds directly from local memory.",
    },
    {
      title: "Custom Before / After Overlay Labels",
      body: "Type custom labels (e.g., 'Native 4K' vs 'DLSS Quality', or 'RAW' vs 'Color Graded') and export the split-curtain view directly to a clean PNG.",
    },
    {
      title: "Nearest-Neighbor 4× Pixel Zoom",
      body: "Inspect sub-pixel anti-aliasing edges and texture sharpening without browser bilinear blur.",
    },
  ],
  steps: [
    {
      title: "Select Before & After Images",
      body: "Drop two screenshots or photos into Slot A and Slot B.",
    },
    {
      title: "Drag the Split Curtain & Customize Labels",
      body: "Drag across the canvas or use the Split Position slider, and edit the top-corner labels.",
    },
    {
      title: "Download Split Snapshot",
      body: "Export the exact split curtain position with labels burned in as a lossless PNG.",
    },
  ],
  faqs: [
    {
      q: "Why use this instead of Imgsli?",
      a: "Imgsli frequently suffers from server downtime, slow 4K PNG uploads, and cloud storage limits. PixelDiffLab runs 100% locally in your browser with zero upload wait time, plus adds a Pixel Diff Heatmap and PSNR calculator.",
    },
    {
      q: "Can I drag directly on the image canvas?",
      a: "Yes. In 'Interactive Slider' mode, hold down your mouse button and drag horizontally across the image canvas, or use the precision Split Position (0%–100%) slider.",
    },
    {
      q: "Does the exported PNG include the split line and Before/After labels?",
      a: "Yes. Clicking 'Export Comparison .PNG' saves the exact split-screen composition including the emerald divider line and your custom A/B labels.",
    },
  ],
  jsonLdName: "Online Image Comparison Slider",
  jsonLdDescription:
    "Interactive A/B image comparison slider with custom labels, 4x pixel zoom, and lossless PNG export.",
};

export default function ImageComparisonSliderPage() {
  return <Landing config={config} />;
}
