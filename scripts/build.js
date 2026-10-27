#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const { transform } = require('sucrase');
let terser;
try { terser = require('terser'); } catch (_) { terser = null; }

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
process.chdir(ROOT);

const pages = {
  'index.html': ['icons', 'data', 'navbar', 'hero', 'inventory', 'spotlight', 'inspection', 'financing', 'availability', 'service', 'about', 'partners', 'reviews', 'faq', 'footer', 'tweaks-panel', 'app'],
  'Inventory.html': ['icons', 'data', 'navbar', 'footer', 'page-inventory'],
  'Vehicle.html': ['icons', 'data', 'navbar', 'footer', 'page-vehicle'],
  'Service.html': ['icons', 'data', 'navbar', 'footer', 'page-service'],
  'Financing.html': ['icons', 'data', 'navbar', 'footer', 'page-financing'],
  'About.html': ['icons', 'data', 'navbar', 'footer', 'page-about'],
  'history.html': ['icons', 'data', 'navbar', 'footer', 'page-history'],
  'contract.html': ['icons', 'data', 'navbar', 'footer', 'page-contract'],
  'admin.html': ['admin-console'],
};

function copyPublicFiles() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    const source = path.join(ROOT, entry.name);
    const destination = path.join(DIST, entry.name);
    if (entry.isDirectory() && entry.name === 'assets') fs.cpSync(source, destination, { recursive: true });
    else if (entry.isFile() && (entry.name.endsWith('.html') || ['favicon.svg', 'robots.txt', '_redirects'].includes(entry.name))) {
      fs.copyFileSync(source, destination);
    }
  }
}

async function buildCss() {
  const customCss = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');
  const input = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n${customCss}`;
  const result = await postcss([tailwind(path.join(ROOT, 'tailwind.config.cjs')), autoprefixer()])
    .process(input, { from: path.join(ROOT, 'src/index.css'), to: path.join(DIST, 'assets/app.css') });
  fs.writeFileSync(path.join(DIST, 'assets/app.css'), result.css);
}

async function buildPageScripts() {
  const vendorDir = path.join(DIST, 'assets/js/vendor');
  fs.mkdirSync(vendorDir, { recursive: true });
  const reactDir = path.dirname(require.resolve('react/package.json'));
  const reactDomDir = path.dirname(require.resolve('react-dom/package.json'));
  fs.copyFileSync(path.join(reactDir, 'umd/react.production.min.js'), path.join(vendorDir, 'react.production.min.js'));
  fs.copyFileSync(path.join(reactDomDir, 'umd/react-dom.production.min.js'), path.join(vendorDir, 'react-dom.production.min.js'));

  for (const [htmlFile, sourceFiles] of Object.entries(pages)) {
    const sources = sourceFiles.map((name) => fs.readFileSync(path.join(ROOT, `src/${name}.jsx`), 'utf8')).join('\n');
    const compiled = transform(sources, { transforms: ['jsx'], production: true }).code;
    if (!terser && process.env.ALLOW_UNMINIFIED_BUILD !== '1') {
      throw new Error('Terser is required for production builds. Install the project dependencies before building.');
    }
    const output = terser ? await terser.minify(compiled, { compress: true, mangle: true, format: { comments: false } }) : { code: compiled };
    if (output.error) throw output.error;
    const bundleName = htmlFile.replace(/\.html$/, '').toLowerCase() + '.js';
    const bundlePath = path.join(DIST, 'assets/js', bundleName);
    fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
    fs.writeFileSync(bundlePath, output.code);

    const htmlPath = path.join(DIST, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/\s*<script src="https:\/\/cdn\.tailwindcss\.com" defer><\/script>\s*<script>[\s\S]*?<\/script>/, '');
    html = html.replace(/\s*<!-- Tailwind CSS 3\.4 \(Play CDN\) -->\s*/g, '\n');
    html = html.replace(/\s*<!-- React 18 \+ Babel \(pinned\) -->\s*/g, '\n');
    html = html.replace(/\s*<script src="https:\/\/unpkg\.com\/(?:react(?:-dom)?@[^\"]+|@babel\/standalone@[^\"]+)"[^>]*><\/script>/g, '');
    html = html.replace(/\s*<script type="text\/babel" src="src\/[^"]+"><\/script>/g, '');
    html = html.replace(/\s*<link rel="stylesheet" href="src\/index\.css" \/>/, '\n  <link rel="stylesheet" href="/assets/app.css" />');
    html = html.replace('</body>', `  <script src="/assets/js/vendor/react.production.min.js" defer></script>\n  <script src="/assets/js/vendor/react-dom.production.min.js" defer></script>\n  <script src="/assets/js/${bundleName}" defer></script>\n</body>`);
    fs.writeFileSync(htmlPath, html);
  }

  // Static support pages still need the local utility stylesheet, but no JS runtime.
  for (const filename of ['contact.html', 'privacy.html']) {
    const htmlPath = path.join(DIST, filename);
    const html = fs.readFileSync(htmlPath, 'utf8').replace(
      /\s*<script src="https:\/\/cdn\.tailwindcss\.com" defer><\/script>/,
      ''
    ).replace(/<link rel="stylesheet" href="src\/index\.css" \/>/, '<link rel="stylesheet" href="/assets/app.css" />')
      .replace(/\s*<!-- Tailwind CSS 3\.4 \(Play CDN\) -->\s*/g, '\n');
    fs.writeFileSync(htmlPath, html);
  }
}

function buildSitemap() {
  const configuredUrl = process.env.PUBLIC_SITE_URL || process.env.URL;
  if (!configuredUrl) {
    console.warn('PUBLIC_SITE_URL is unset; omitting sitemap.xml and canonical host references.');
    return;
  }
  const siteUrl = new URL(configuredUrl).origin;
  const publicPaths = ['/', '/Inventory.html', '/Financing.html', '/About.html', '/contract.html'];
  const urls = publicPaths.map((pathname) => `  <url><loc>${siteUrl}${pathname === '/' ? '/' : pathname}</loc></url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  for (const [filename, pathname] of Object.entries({
    'index.html': '/', 'Inventory.html': '/Inventory.html', 'Financing.html': '/Financing.html',
    'About.html': '/About.html', 'contract.html': '/contract.html',
  })) {
    const htmlPath = path.join(DIST, filename);
    let html = fs.readFileSync(htmlPath, 'utf8');
    const pageUrl = `${siteUrl}${pathname}`;
    html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${pageUrl}" />`);
    const ogUrl = `<meta property="og:url" content="${pageUrl}" />`;
    const ogImage = `<meta property="og:image" content="${siteUrl}/assets/images/yellow-supercar-1200.webp" />\n  <meta property="og:image:alt" content="Преміальний автомобіль RentCar UA" />`;
    if (!html.includes('property="og:url"')) html = html.replace('</head>', `  ${ogUrl}\n  ${ogImage}\n</head>`);
    fs.writeFileSync(htmlPath, html);
  }
  const robotsPath = path.join(DIST, 'robots.txt');
  const robots = fs.readFileSync(robotsPath, 'utf8').replace(/\n?Sitemap:.*\n?/g, '\n').trimEnd();
  fs.writeFileSync(robotsPath, `${robots}\nSitemap: ${siteUrl}/sitemap.xml\n`);
}

async function main() {
  copyPublicFiles();
  await buildCss();
  await buildPageScripts();
  buildSitemap();
  console.log(`Built ${Object.keys(pages).length} page bundles and the static stylesheet into dist/.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
