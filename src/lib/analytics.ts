"use client";

import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export type ToolEventName =
  | "compare_demo_loaded"
  | "compare_image_uploaded"
  | "compare_mode_switched"
  | "compare_export_png"
  | "artifact_hue_shifted";

// 统一向 Vercel Analytics、Google Analytics 4 (GA4) 与 Microsoft Clarity 发送工具交互埋点
export function trackToolEvent(
  event: ToolEventName,
  props?: Record<string, string | number | boolean>
) {
  try {
    track(event, props);
  } catch {
    // ignore in dev/offline
  }

  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, props ?? {});
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window !== "undefined" && typeof window.clarity === "function") {
      window.clarity("event", event);
      if (props) {
        for (const [k, v] of Object.entries(props)) {
          window.clarity("set", k, String(v));
        }
      }
    }
  } catch {
    // ignore
  }
}
