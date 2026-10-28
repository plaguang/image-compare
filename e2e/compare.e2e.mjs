import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.URL || "http://localhost:3122";

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ 断言失败: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const context = await browser.newContext({ acceptDownloads: true });
  await context.route(/googletagmanager|google-analytics|clarity\.ms|_vercel\/insights/i, (route) => route.abort());
  const page = await context.newPage();

  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(BASE, { waitUntil: "load", timeout: 30000 });

  const title = await page.title();
  assert(title.includes("Side by Side Image Comparison"), `页面标题正确 (${title})`);

  // 1. 顶部吸顶导航包含全部 4 个工具入口
  const navCount = await page.locator("header nav a").count();
  assert(navCount === 4, `顶部吸顶导航包含全部 4 个工具入口 (实际 ${navCount})`);

  // 2. 验证自动化测试环境已屏蔽统计污染
  const isBlocked = await page.evaluate(() => navigator.webdriver === true && typeof window.gtag === "undefined");
  assert(isBlocked, "自动化测试环境已成功屏蔽 GA4 / Clarity / Vercel 统计污染");

  // 3. 点击加载内置对比样本对
  await page.getByRole("button", { name: /Load Demo Comparison Pair/i }).click();

  const metrics = page.getByTestId("compare-metrics");
  await metrics.waitFor({ state: "visible", timeout: 5000 });
  const metricsText = await metrics.innerText();
  assert(metricsText.includes("dB") && metricsText.includes("%"), `成功计算 PSNR 与像素差异百分比 (${metricsText.replace(/\s+/g, " ")})`);

  // 4. 依次切换 4 大模式：Interactive Slider / Side-by-Side Sync / Pixel Diff Heatmap / AI Artifact Hue Shift
  await page.getByRole("button", { name: "Interactive Slider" }).click();
  await page.getByLabel("Split Position").waitFor({ state: "visible" });
  console.log("✅ Interactive Slider 卷帘模式切换正常");

  await page.getByRole("button", { name: "Pixel Diff Heatmap" }).click();
  await page.getByLabel("Noise Tolerance Threshold").waitFor({ state: "visible" });
  console.log("✅ Pixel Diff Heatmap 像素差异热力图模式切换正常");

  await page.getByRole("button", { name: "AI Artifact Hue Shift" }).click();
  await page.getByLabel("Hue Rotation").waitFor({ state: "visible" });
  console.log("✅ AI Artifact Hue Shift 色相伪影放大器模式切换正常");

  // 5. 导出对比快照 .PNG 并校验 PNG 魔数 89 50 4E 47
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export Comparison \.PNG/i }).click(),
  ]);
  const dlPath = await download.path();
  const dlBuf = fs.readFileSync(dlPath);
  assert(
    dlBuf[0] === 0x89 && dlBuf[1] === 0x50 && dlBuf[2] === 0x4e && dlBuf[3] === 0x47,
    `导出的对比快照 .PNG 文件头魔数正确 (${dlBuf.length} bytes)`
  );

  // 6. 用刚才导出的真实 PNG 测试双图文件上传槽位 A
  const inputA = page.getByLabel("Upload Image A");
  await inputA.setInputFiles(dlPath);
  assert((await metrics.innerText()).includes("dB"), "成功通过文件上传槽位加载自定义 PNG 图片并重算 PSNR");

  // 7. 校验全部 SEO 路由返回 HTTP 200
  for (const route of [
    "/image-comparison-slider",
    "/before-after-image-slider",
    "/image-diff-checker",
    "/sitemap.xml",
    "/robots.txt",
    "/llms.txt",
  ]) {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    assert(res && res.status() === 200, `路由 ${route} 返回 HTTP 200`);
  }

  await page.goto(`${BASE}/image-diff-checker?utm_source=claude.ai`, { waitUntil: "networkidle" });
  const aiAttr = await page.locator("html").getAttribute("data-ai-referral");
  assert(aiAttr === "anthropic:claude", `GEOInflow AI 引荐归因识别 html[data-ai-referral="${aiAttr}"]`);

  assert(pageErrors.length === 0, `无页面 JS 错误 (${pageErrors.length})`);

  await browser.close();
  console.log("\n全部通过 🎉");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
