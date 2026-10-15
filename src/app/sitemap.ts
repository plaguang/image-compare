import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://image-compare-six.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/image-comparison-slider",
    "/before-after-image-slider",
    "/image-diff-checker",
  ];
  return routes.map((r) => ({
    url: `${SITE}${r}`,
    lastModified: "2026-10-16",
    changeFrequency: "weekly",
    priority: r === "" ? 1.0 : 0.9,
  }));
}
