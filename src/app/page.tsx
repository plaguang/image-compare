import type { Metadata } from "next";
import Landing, { type LandingConfig } from "@/components/Landing";

export const metadata: Metadata = {
  title: "Side by Side Image Comparison Online Free – Sync Zoom, Slider & Pixel Diff",
  description:
    "Compare two images side by side or with an interactive Before/After split slider in your browser. Inspect DLSS vs TAA sharpness, JPEG/WebP compression, PSNR similarity, and AI color artifacts.",
  alternates: { canonical: "/" },
};

const config: LandingConfig = {
  badge: "100% Client-Side • Side-by-Side Sync Zoom • Split Slider • Pixel Diff & AI Artifact Check",
  h1: "Side by Side Image Comparison Online",
  subtitle:
    "Compare two photos, game renders (DLSS/FSR vs Native/TAA), or compression exports side by side and with an interactive split curtain slider. Measure exact pixel differences (PSNR / MAE) and export a single comparison PNG.",
  primaryHint: "Drop Image B to compare side by side, drag the split slider, or run pixel diff",
  defaultMode: "side-by-side",
  whyTitle: "Why Graphics Enthusiasts, Photographers & QA Engineers Use PixelDiffLab",
  whyItems: [
    {
      title: "Zero Re-Compression (Unlike Cloud Image Hosts)",
      body: "Online image comparison hosts re-encode your screenshots into lossy WebP/JPEG, destroying the subtle anti-aliasing or denoising details you wanted to compare. PixelDiffLab compares raw decoded RGBA pixels locally in your browser.",
    },
    {
      title: "4 Inspection Modes in One Workspace",
      body: "Switch seamlessly between Side-by-Side Synchronized Zoom, Interactive Split Slider, Pixel Difference Heatmap, and Hue/Saturation AI Artifact Amplification.",
    },
    {
      title: "1-Click Export to Shareable PNG",
      body: "Download your side-by-side layout, split-curtain view (with custom Before/After labels), or difference heatmap as a single lossless PNG ready for Reddit, GitHub PRs, or client reviews.",
    },
  ],
  steps: [
    {
      title: "Drop Image A & Image B",
      body: "Select any two PNG, JPG, WebP, or AVIF images from your device — or load our built-in Native vs TAA + AI sample pair.",
    },
    {
      title: "Switch Between 4 Inspection Modes",
      body: "Compare Side-by-Side, drag the Interactive Slider, highlight changed pixels in the Diff Heatmap, or amplify chroma noise.",
    },
    {
      title: "Export Lossless Comparison Snapshot",
      body: "Click 'Export Comparison .PNG' to save the combined visual comparison straight to your disk.",
    },
  ],
  faqs: [
    {
      q: "Can I compare two images with different resolutions?",
      a: "Yes. If Image A and Image B have different dimensions, PixelDiffLab automatically aligns Image B to Image A's canvas dimensions so you can compare upscaled vs native renders seamlessly.",
    },
    {
      q: "What do PSNR and MAE mean in the comparison metrics bar?",
      a: "PSNR (Peak Signal-to-Noise Ratio, in dB) measures image fidelity — values above 40 dB indicate near-identical quality, while lower values reveal heavier compression or blur. MAE (Mean Absolute Error) shows the average per-channel RGB difference from 0 to 255.",
    },
    {
      q: "Are my confidential photos or NDA game builds uploaded anywhere?",
      a: "Never. All image decoding, pixel math, and PNG snapshot rendering execute 100% locally inside your browser tab.",
    },
  ],
  jsonLdName: "Side by Side Image Comparison Online",
  jsonLdDescription:
    "Free browser-based side by side image comparison tool with split slider, pixel diff heatmap, PSNR calculator, and AI artifact hue shifter.",
};

export default function HomePage() {
  return <Landing config={config} />;
}
