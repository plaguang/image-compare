"use client";

import { useEffect, useRef, useState } from "react";
import { trackToolEvent } from "@/lib/analytics";

export type CompareMode = "slider" | "side-by-side" | "diff" | "artifact";

interface LoadedImage {
  name: string;
  width: number;
  height: number;
  data: ImageData;
}

interface CompareStats {
  diffPercent: number;
  psnr: number;
  mae: number;
  artifactScore: number;
}

// 生成内置演示双图：Image A 为锐利原生渲染，Image B 为带 TAA 模糊 + 暗部 AI 伪影噪声的对比图
function generateDemoPair(w = 320, h = 200): { imgA: LoadedImage; imgB: LoadedImage } {
  const c1 = document.createElement("canvas");
  c1.width = w;
  c1.height = h;
  const ctx1 = c1.getContext("2d")!;

  const c2 = document.createElement("canvas");
  c2.width = w;
  c2.height = h;
  const ctx2 = c2.getContext("2d")!;

  const d1 = ctx1.createImageData(w, h);
  const d2 = ctx2.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      // 几何棋盘建筑纹理 + 渐变天空
      const isSky = y < h * 0.45;
      const checker = ((x >> 3) + (y >> 3)) % 2 === 0;
      const edgeLine = x % 16 === 0 || y % 16 === 0;

      let r = isSky ? 35 + Math.floor((y / h) * 80) : checker ? 185 : 70;
      let g = isSky ? 65 + Math.floor((y / h) * 110) : checker ? 155 : 65;
      let b = isSky ? 130 + Math.floor((y / h) * 90) : checker ? 110 : 80;

      if (!isSky && edgeLine) {
        r = 245;
        g = 220;
        b = 90;
      }

      d1.data[idx] = r;
      d1.data[idx + 1] = g;
      d1.data[idx + 2] = b;
      d1.data[idx + 3] = 255;

      // Image B: 模拟 TAA 边缘柔化 + AI 细微色偏伪影（肉眼难辨，色相拉高后立刻现形）
      const aiNoiseR = ((x * 17 + y * 31) % 9) - 4;
      const aiNoiseB = ((x * 23 + y * 13) % 11) - 5;
      const blurMix = !isSky && edgeLine ? 0.55 : 1.0;

      d2.data[idx] = Math.min(255, Math.max(0, Math.round(r * blurMix + 45 * (1 - blurMix) + aiNoiseR)));
      d2.data[idx + 1] = Math.min(255, Math.max(0, Math.round(g * blurMix + 45 * (1 - blurMix))));
      d2.data[idx + 2] = Math.min(255, Math.max(0, Math.round(b * blurMix + 50 * (1 - blurMix) + aiNoiseB)));
      d2.data[idx + 3] = 255;
    }
  }

  return {
    imgA: { name: "native-dlss-sharp.png", width: w, height: h, data: d1 },
    imgB: { name: "taa-upscaled-ai.png", width: w, height: h, data: d2 },
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

export default function ImageComparator({
  defaultMode = "slider",
  primaryHint,
}: {
  defaultMode?: CompareMode;
  primaryHint?: string;
} = {}) {
  const [imgA, setImgA] = useState<LoadedImage | null>(null);
  const [imgB, setImgB] = useState<LoadedImage | null>(null);
  const [mode, setMode] = useState<CompareMode>(defaultMode);
  const [splitPos, setSplitPos] = useState<number>(50);
  const [labelA, setLabelA] = useState<string>("Before (Original)");
  const [labelB, setLabelB] = useState<string>("After (Processed)");
  const [diffThreshold, setDiffThreshold] = useState<number>(8);
  const [hueShift, setHueShift] = useState<number>(140);
  const [satBoost, setSatBoost] = useState<number>(3.5);
  const [zoom, setZoom] = useState<number>(1);
  const [stats, setStats] = useState<CompareStats | null>(null);
  const [error, setError] = useState<string>("");

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sideCanvasBRef = useRef<HTMLCanvasElement | null>(null);

  async function decodeFileToImageData(file: File): Promise<LoadedImage> {
    const bitmap = await createImageBitmap(file);
    const c = document.createElement("canvas");
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    return {
      name: file.name,
      width: bitmap.width,
      height: bitmap.height,
      data: ctx.getImageData(0, 0, bitmap.width, bitmap.height),
    };
  }

  async function handleFileUpload(slot: "A" | "B", file: File) {
    setError("");
    try {
      const loaded = await decodeFileToImageData(file);
      if (slot === "A") {
        setImgA(loaded);
        if (!imgB) setImgB(loaded);
      } else {
        setImgB(loaded);
        if (!imgA) setImgA(loaded);
      }
      trackToolEvent("compare_image_uploaded", { slot, width: loaded.width, height: loaded.height });
    } catch {
      setError("Failed to decode image file. Please select a valid PNG, JPG, WebP, or AVIF image.");
    }
  }

  function loadDemoComparison() {
    setError("");
    const { imgA: a, imgB: b } = generateDemoPair(320, 200);
    setImgA(a);
    setImgB(b);
    setLabelA("Native Render (Sharp)");
    setLabelB("TAA + AI Upscaled");
    trackToolEvent("compare_demo_loaded");
  }

  // 计算 PSNR / MAE / 差异像素占比 / 高频色度微抖动得分
  useEffect(() => {
    if (!imgA || !imgB) {
      setStats(null);
      return;
    }
    const w = imgA.width;
    const h = imgA.height;
    const bCanvas = document.createElement("canvas");
    bCanvas.width = w;
    bCanvas.height = h;
    const bCtx = bCanvas.getContext("2d")!;
    if (imgB.width === w && imgB.height === h) {
      bCtx.putImageData(imgB.data, 0, 0);
    } else {
      const tmp = document.createElement("canvas");
      tmp.width = imgB.width;
      tmp.height = imgB.height;
      tmp.getContext("2d")!.putImageData(imgB.data, 0, 0);
      bCtx.drawImage(tmp, 0, 0, w, h);
    }
    const bData = bCtx.getImageData(0, 0, w, h).data;
    const aData = imgA.data.data;

    let mseSum = 0;
    let maeSum = 0;
    let diffCount = 0;
    let chromaJitter = 0;
    const totalPx = w * h;

    for (let i = 0; i < totalPx; i++) {
      const p = i * 4;
      const dr = Math.abs(aData[p] - bData[p]);
      const dg = Math.abs(aData[p + 1] - bData[p + 1]);
      const db = Math.abs(aData[p + 2] - bData[p + 2]);
      const maxDelta = Math.max(dr, dg, db);
      if (maxDelta > diffThreshold) diffCount++;
      maeSum += (dr + dg + db) / 3;
      mseSum += (dr * dr + dg * dg + db * db) / 3;

      if (i > 0) {
        const prev = (i - 1) * 4;
        const cDiff =
          Math.abs(bData[p] - bData[p + 1] - (bData[prev] - bData[prev + 1])) +
          Math.abs(bData[p + 2] - bData[p + 1] - (bData[prev + 2] - bData[prev + 1]));
        if (cDiff > 0 && cDiff < 14) chromaJitter++;
      }
    }

    const mse = mseSum / totalPx;
    const psnr = mse === 0 ? 99.9 : Math.min(99.9, 10 * Math.log10((255 * 255) / mse));
    setStats({
      diffPercent: Number(((diffCount / totalPx) * 100).toFixed(2)),
      psnr: Number(psnr.toFixed(2)),
      mae: Number((maeSum / totalPx).toFixed(2)),
      artifactScore: Number(Math.min(100, (chromaJitter / totalPx) * 140).toFixed(1)),
    });
  }, [imgA, imgB, diffThreshold]);

  // 渲染主对比画布
  useEffect(() => {
    if (!imgA || !imgB) return;
    const c = mainCanvasRef.current;
    if (!c) return;
    const w = imgA.width;
    const h = imgA.height;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;

    // 归一化 Image B 到 Image A 尺寸
    const bCanvas = document.createElement("canvas");
    bCanvas.width = w;
    bCanvas.height = h;
    const bCtx = bCanvas.getContext("2d")!;
    if (imgB.width === w && imgB.height === h) {
      bCtx.putImageData(imgB.data, 0, 0);
    } else {
      const tmp = document.createElement("canvas");
      tmp.width = imgB.width;
      tmp.height = imgB.height;
      tmp.getContext("2d")!.putImageData(imgB.data, 0, 0);
      bCtx.drawImage(tmp, 0, 0, w, h);
    }
    const bData = bCtx.getImageData(0, 0, w, h).data;
    const aData = imgA.data.data;

    const out = ctx.createImageData(w, h);
    const dst = out.data;
    const splitX = Math.floor((splitPos / 100) * w);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        if (mode === "slider") {
          if (x < splitX) {
            dst[p] = aData[p];
            dst[p + 1] = aData[p + 1];
            dst[p + 2] = aData[p + 2];
            dst[p + 3] = 255;
          } else if (x === splitX || x === splitX - 1) {
            dst[p] = 16;
            dst[p + 1] = 185;
            dst[p + 2] = 129;
            dst[p + 3] = 255;
          } else {
            dst[p] = bData[p];
            dst[p + 1] = bData[p + 1];
            dst[p + 2] = bData[p + 2];
            dst[p + 3] = 255;
          }
        } else if (mode === "side-by-side") {
          dst[p] = aData[p];
          dst[p + 1] = aData[p + 1];
          dst[p + 2] = aData[p + 2];
          dst[p + 3] = 255;
        } else if (mode === "diff") {
          const dr = Math.abs(aData[p] - bData[p]);
          const dg = Math.abs(aData[p + 1] - bData[p + 1]);
          const db = Math.abs(aData[p + 2] - bData[p + 2]);
          const maxD = Math.max(dr, dg, db);
          if (maxD > diffThreshold) {
            // 高亮差异热力红/品红
            dst[p] = 255;
            dst[p + 1] = Math.max(0, 255 - maxD * 4);
            dst[p + 2] = 90;
            dst[p + 3] = 255;
          } else {
            const gray = Math.round((aData[p] + aData[p + 1] + aData[p + 2]) / 3 * 0.25);
            dst[p] = gray;
            dst[p + 1] = gray;
            dst[p + 2] = gray;
            dst[p + 3] = 255;
          }
        } else {
          // AI Artifact Hue / Saturation Amplifier (作用于 Image B 以暴露色彩断层与扩散噪声)
          const [hVal, sVal, lVal] = rgbToHsl(bData[p], bData[p + 1], bData[p + 2]);
          const shiftedH = (hVal + hueShift / 360) % 1;
          const boostedS = Math.min(1, Math.max(0.15, sVal * satBoost));
          const boostedL = Math.min(0.88, Math.max(0.12, (lVal - 0.5) * 1.4 + 0.5));
          const [nr, ng, nb] = hslToRgb(shiftedH, boostedS, boostedL);
          dst[p] = nr;
          dst[p + 1] = ng;
          dst[p + 2] = nb;
          dst[p + 3] = 255;
        }
      }
    }
    ctx.putImageData(out, 0, 0);

    // 如果是滑动条模式，在左右两侧绘制清晰角标
    if (mode === "slider") {
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
      ctx.fillRect(8, 8, Math.min(150, ctx.measureText(labelA).width + 16), 22);
      ctx.fillRect(w - Math.min(150, ctx.measureText(labelB).width + 16) - 8, 8, Math.min(150, ctx.measureText(labelB).width + 16), 22);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelA, 16, 23);
      ctx.fillText(labelB, w - Math.min(150, ctx.measureText(labelB).width + 16), 23);
    }

    if (mode === "side-by-side" && sideCanvasBRef.current) {
      const sb = sideCanvasBRef.current;
      sb.width = w;
      sb.height = h;
      const sbCtx = sb.getContext("2d")!;
      const bImgData = sbCtx.createImageData(w, h);
      bImgData.data.set(bData);
      sbCtx.putImageData(bImgData, 0, 0);
    }
  }, [imgA, imgB, mode, splitPos, diffThreshold, hueShift, satBoost, labelA, labelB]);

  function downloadSnapshot() {
    if (!imgA || !imgB || !mainCanvasRef.current) return;
    const outCanvas = document.createElement("canvas");
    if (mode === "side-by-side" && sideCanvasBRef.current) {
      outCanvas.width = imgA.width * 2 + 8;
      outCanvas.height = imgA.height;
      const ctx = outCanvas.getContext("2d")!;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      ctx.drawImage(mainCanvasRef.current, 0, 0);
      ctx.drawImage(sideCanvasBRef.current, imgA.width + 8, 0);
    } else {
      outCanvas.width = mainCanvasRef.current.width;
      outCanvas.height = mainCanvasRef.current.height;
      outCanvas.getContext("2d")!.drawImage(mainCanvasRef.current, 0, 0);
    }

    outCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comparison-${mode}.png`;
      a.click();
      URL.revokeObjectURL(url);
      trackToolEvent("compare_export_png", { mode });
    }, "image/png");
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      )}

      {/* 双图上传栏 + 一键加载演示对 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-emerald-600">
          <input
            type="file"
            accept="image/*"
            aria-label="Upload Image A"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload("A", e.target.files[0])}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Image A (Before / Left)</span>
          <span className="text-sm font-semibold text-slate-800">
            {imgA ? `${imgA.name} (${imgA.width}×${imgA.height})` : "Drop or Select Image A"}
          </span>
          <span className="text-xs text-slate-500">PNG, JPG, WebP, AVIF · 100% Local</span>
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-emerald-600">
          <input
            type="file"
            accept="image/*"
            aria-label="Upload Image B"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload("B", e.target.files[0])}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Image B (After / Right)</span>
          <span className="text-sm font-semibold text-slate-800">
            {imgB ? `${imgB.name} (${imgB.width}×${imgB.height})` : "Drop or Select Image B"}
          </span>
          <span className="text-xs text-slate-500">
            {primaryHint || "Compare upscalers, compression, retouching or AI artifacts"}
          </span>
        </label>
      </div>

      {!imgA && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadDemoComparison}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ✨ Load Demo Comparison Pair (Native Sharp vs TAA + AI Artifact Sample)
          </button>
        </div>
      )}

      {imgA && imgB && stats && (
        <div className="flex flex-col gap-4">
          {/* 量化指标概览栏 */}
          <div
            data-testid="compare-metrics"
            className="grid grid-cols-2 gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs sm:grid-cols-4"
          >
            <div>
              <span className="text-slate-500">Changed Pixels</span>
              <div className="mt-0.5 font-semibold text-slate-900">{stats.diffPercent}%</div>
            </div>
            <div>
              <span className="text-slate-500">PSNR Similarity</span>
              <div className="mt-0.5 font-semibold text-slate-900">{stats.psnr} dB</div>
            </div>
            <div>
              <span className="text-slate-500">Mean Abs Error (MAE)</span>
              <div className="mt-0.5 font-semibold text-slate-900">{stats.mae} / 255</div>
            </div>
            <div>
              <span className="text-slate-500">Chroma Noise Index</span>
              <div className="mt-0.5 font-semibold text-emerald-800">{stats.artifactScore} / 100</div>
            </div>
          </div>

          {/* 4 大对比模式切换栏 */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-semibold text-slate-600">Mode:</span>
              {(
                [
                  ["slider", "Interactive Slider"],
                  ["side-by-side", "Side-by-Side Sync"],
                  ["diff", "Pixel Diff Heatmap"],
                  ["artifact", "AI Artifact Hue Shift"],
                ] as const
              ).map(([mKey, mLabel]) => (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => {
                    setMode(mKey);
                    trackToolEvent("compare_mode_switched", { mode: mKey });
                  }}
                  className={`rounded-md border px-2.5 py-1 font-medium ${
                    mode === mKey
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {mLabel}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 font-medium text-slate-700">
                <span>Zoom:</span>
                <select
                  aria-label="Zoom Level"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                >
                  <option value={1}>1× Fit</option>
                  <option value={2}>2× Pixel</option>
                  <option value={4}>4× Inspect</option>
                </select>
              </label>

              <button
                type="button"
                onClick={downloadSnapshot}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                ⬇ Export Comparison .PNG
              </button>
            </div>
          </div>

          {/* 动态模式控制滑块 */}
          {mode === "slider" && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 px-4 py-2.5 text-xs">
              <label className="flex flex-1 items-center gap-2 font-medium text-slate-700">
                <span>Split Position ({splitPos}%):</span>
                <input
                  type="range"
                  aria-label="Split Position"
                  min={0}
                  max={100}
                  value={splitPos}
                  onChange={(e) => setSplitPos(Number(e.target.value))}
                  className="flex-1"
                />
              </label>
              <input
                type="text"
                aria-label="Label A"
                value={labelA}
                onChange={(e) => setLabelA(e.target.value)}
                className="w-36 rounded border border-slate-300 px-2 py-1"
              />
              <input
                type="text"
                aria-label="Label B"
                value={labelB}
                onChange={(e) => setLabelB(e.target.value)}
                className="w-36 rounded border border-slate-300 px-2 py-1"
              />
            </div>
          )}

          {mode === "diff" && (
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-2.5 text-xs">
              <label className="flex flex-1 items-center gap-2 font-medium text-slate-700">
                <span>Noise Tolerance Threshold ({diffThreshold} / 255):</span>
                <input
                  type="range"
                  aria-label="Noise Tolerance Threshold"
                  min={0}
                  max={64}
                  value={diffThreshold}
                  onChange={(e) => setDiffThreshold(Number(e.target.value))}
                  className="flex-1"
                />
              </label>
            </div>
          )}

          {mode === "artifact" && (
            <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs sm:grid-cols-2">
              <label className="flex items-center gap-2 font-medium text-slate-800">
                <span>Hue Rotation ({hueShift}°):</span>
                <input
                  type="range"
                  aria-label="Hue Rotation"
                  min={0}
                  max={360}
                  value={hueShift}
                  onChange={(e) => {
                    setHueShift(Number(e.target.value));
                    trackToolEvent("artifact_hue_shifted", { hue: Number(e.target.value) });
                  }}
                  className="flex-1"
                />
              </label>
              <label className="flex items-center gap-2 font-medium text-slate-800">
                <span>Saturation Amplifier ({satBoost.toFixed(1)}×):</span>
                <input
                  type="range"
                  aria-label="Saturation Amplifier"
                  min={1}
                  max={6}
                  step={0.5}
                  value={satBoost}
                  onChange={(e) => setSatBoost(Number(e.target.value))}
                  className="flex-1"
                />
              </label>
            </div>
          )}

          {/* 画布预览区 */}
          <div className="flex min-h-64 items-center justify-center overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            {mode === "side-by-side" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-300">{labelA}</span>
                  <canvas
                    ref={mainCanvasRef}
                    className="rounded shadow-lg"
                    style={{
                      imageRendering: "pixelated",
                      width: `${imgA.width * zoom}px`,
                      maxWidth: "100%",
                    }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-300">{labelB}</span>
                  <canvas
                    ref={sideCanvasBRef}
                    className="rounded shadow-lg"
                    style={{
                      imageRendering: "pixelated",
                      width: `${imgA.width * zoom}px`,
                      maxWidth: "100%",
                    }}
                  />
                </div>
              </div>
            ) : (
              <canvas
                ref={mainCanvasRef}
                onMouseMove={(e) => {
                  if (mode !== "slider" || e.buttons !== 1) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                  setSplitPos(pct);
                }}
                className="cursor-ew-resize rounded shadow-lg"
                style={{
                  imageRendering: "pixelated",
                  width: `${imgA.width * zoom}px`,
                  maxWidth: "100%",
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
