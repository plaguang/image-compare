import type { Metadata } from "next";
import Landing, { type LandingConfig } from "@/components/Landing";

export const metadata: Metadata = {
  title: "Image Diff Checker & AI Artifact Hue Detector Online – Pixel Difference Heatmap",
  description:
    "Spot exact pixel differences between two images with a live Diff Heatmap, PSNR/MAE metrics, and a Hue/Saturation Amplifier that exposes hidden AI generation color artifacts.",
  alternates: { canonical: "/image-diff-checker" },
};

const config: LandingConfig = {
  badge: "Pixel Diff Heatmap • PSNR / MAE Metrics • Hue & Saturation AI Artifact Amplifier",
  h1: "Image Pixel Diff & AI Artifact Checker",
  subtitle:
    "Detect subtle pixel modifications, compression loss, or hidden AI diffusion color banding in your browser. Highlight changed pixels in a high-contrast heatmap or rotate Hue & Saturation up to 6× to make invisible AI chroma noise pop out.",
  primaryHint: "Drop a second image to compute pixel diff, or test AI artifact hue shifting",
  defaultMode: "diff",
  whyTitle: "Uncover What the Naked Eye Misses",
  whyItems: [
    {
      title: "Adjustable Noise-Tolerance Pixel Diff Heatmap",
      body: "Filter out minor 1–8 bit JPEG rounding noise with the Noise Tolerance slider so only genuine structural changes, tampering, or rendering bugs light up in hot magenta/yellow.",
    },
    {
      title: "Hue & Saturation Shift for AI Artifact Detection",
      body: "Diffusion and GAN generators often leave subtle pixel-to-pixel color probability jitter in flat backgrounds. Rotating Hue (0°–360°) and boosting Saturation (up to 6×) exposes synthetic color blotches immediately.",
    },
    {
      title: "Quantitative PSNR, MAE & Chroma Noise Metrics",
      body: "Get objective engineering numbers: Changed Pixel Percentage, Peak Signal-to-Noise Ratio (dB), Mean Absolute Error, and Chroma Noise Index.",
    },
  ],
  steps: [
    {
      title: "Load One or Two Images",
      body: "Drop two images to run a pixel difference heatmap, or drop a single image to inspect AI chroma artifacts.",
    },
    {
      title: "Tune Threshold or Hue/Saturation",
      body: "Adjust the Noise Tolerance slider in Diff mode, or switch to 'AI Artifact Hue Shift' to amplify subtle color banding.",
    },
    {
      title: "Export Evidence Snapshot",
      body: "Download the high-contrast diff heatmap or hue-amplified forensic view as a lossless PNG.",
    },
  ],
  faqs: [
    {
      q: "How does shifting Hue and Saturation help spot AI-generated images?",
      a: "When an AI model generates a uniform surface (like a wall, sky, or skin), it predicts RGB values probabilistically across patches, leaving tiny 1–3 bit chromaticity fluctuations that look uniform to human eyes. Boosting saturation 3×–6× and rotating hue turns those subtle chroma fluctuations into visible rainbow blotches.",
    },
    {
      q: "How do I ignore minor JPEG compression noise when comparing two images?",
      a: "In 'Pixel Diff Heatmap' mode, increase the 'Noise Tolerance Threshold' slider from 0 up to 10–15. Any pixel whose RGB delta is below that threshold is dimmed into the dark grayscale background, leaving only real visual edits highlighted.",
    },
    {
      q: "Can I use this for visual regression testing of UI screenshots?",
      a: "Yes. Developers and QA engineers regularly drop Before/After UI screenshots into PixelDiffLab to verify CSS layout shifts and export diff heatmaps for pull requests.",
    },
  ],
  jsonLdName: "Image Pixel Diff & AI Artifact Checker",
  jsonLdDescription:
    "Browser-based pixel difference heatmap, PSNR calculator, and hue/saturation AI artifact amplifier.",
};

export default function ImageDiffCheckerPage() {
  return <Landing config={config} />;
}
