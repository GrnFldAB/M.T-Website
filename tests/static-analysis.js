/**
 * Static Analysis Tests for MONO•TERRA™ Landing Page
 * Runs in pure Node.js — no browser required.
 * Checks HTML structure, meta integrity, JSON-LD validity,
 * ARIA usage, JS syntax, CSS consistency, and link hygiene.
 */

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

// ─── Minimal assertion helpers ────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
    failures.push({ label, detail });
  }
}

function section(name) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('─'.repeat(60));
}

// ─── 1. FILE INTEGRITY ────────────────────────────────────────────────────────
section('1. FILE INTEGRITY');

assert(html.length > 10000, 'HTML file is non-trivial in size', `${html.length} chars`);
assert(html.startsWith('<!DOCTYPE html>'), 'Starts with <!DOCTYPE html>');
assert(html.includes('<html lang="en">'), 'HTML lang attribute is set to "en"');
assert(html.includes('</html>'), 'Closing </html> tag present');
assert(html.includes('</body>'), 'Closing </body> tag present');

// Check tag balance for critical structural elements
['head', 'body', 'main', 'nav'].forEach(tag => {
  const opens  = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
  const closes = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  assert(opens === closes, `<${tag}> opens/closes balanced (${opens}/${closes})`);
});

// ─── 2. META & HEAD ───────────────────────────────────────────────────────────
section('2. META & HEAD');

assert(html.includes('<meta charset="UTF-8">'), 'charset UTF-8 declared');
assert(html.includes('name="viewport"'), 'viewport meta present');
assert(html.includes('name="description"'), 'meta description present');
assert(html.includes('name="copyright"'), 'copyright meta present');
assert(html.includes('<title>'), 'title element present');
assert(!html.match(/<title>\s*<\/title>/), 'title is not empty');

// OG tags
['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:site_name'].forEach(prop => {
  assert(html.includes(`property="${prop}"`), `OG tag present: ${prop}`);
});

// Twitter card
['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'].forEach(name => {
  assert(html.includes(`name="${name}"`), `Twitter card tag present: ${name}`);
});

// Canonical & hreflang
assert(html.includes('rel="canonical"'), 'canonical link present');
assert((html.match(/hreflang/g) || []).length >= 4, 'At least 4 hreflang entries present');
assert(html.includes('hreflang="x-default"'), 'x-default hreflang present');

// ─── 3. JSON-LD SCHEMA ───────────────────────────────────────────────────────
section('3. JSON-LD SCHEMA');

const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(!!jsonLdMatch, 'JSON-LD script block present');

if (jsonLdMatch) {
  let schema;
  try {
    schema = JSON.parse(jsonLdMatch[1]);
    assert(true, 'JSON-LD parses without error');
  } catch (e) {
    assert(false, 'JSON-LD parses without error', e.message);
  }
  if (schema) {
    assert(schema['@context'] === 'https://schema.org', 'JSON-LD @context is schema.org');
    assert(schema['@type'] === 'Organization', 'JSON-LD @type is Organization');
    assert(typeof schema.name === 'string' && schema.name.length > 0, 'Organization name present');
    assert(typeof schema.url === 'string', 'Organization url present');
    assert(schema.address && schema.address['@type'] === 'PostalAddress', 'Address PostalAddress present');
    assert(schema.brand && schema.brand['@type'] === 'Brand', 'Brand object present');
    assert(schema.brand && schema.brand.name === 'LYTEN™', 'Brand name is LYTEN™');
  }
}

// ─── 4. ACCESSIBILITY ────────────────────────────────────────────────────────
section('4. ACCESSIBILITY');

// Skip link
assert(html.includes('class="skip-link"'), 'Skip-to-content link present');
assert(html.includes('href="#hero"'), 'Skip link targets #hero');

// ARIA on nav
assert(html.includes('aria-label="Primary navigation"'), 'Primary nav has aria-label');

// Hamburger button
assert(html.includes('aria-expanded="false"'), 'Hamburger button has aria-expanded');
assert(html.includes('aria-controls="mobileDrawer"'), 'Hamburger has aria-controls');
assert(html.includes('aria-label="Toggle navigation menu"'), 'Hamburger has descriptive aria-label');

// Mobile drawer
assert(html.includes('role="dialog"'), 'Mobile drawer has role=dialog');

// Section landmarks: all major sections should have aria-labelledby or aria-label
const sectionIds = ['hero', 'problem', 'circularity', 'lyten-intro', 'material', 'data-story', 'execution', 'cta'];
sectionIds.forEach(id => {
  const sectionRegex = new RegExp(`id="${id}"[^>]*(aria-label|aria-labelledby)`);
  assert(sectionRegex.test(html), `Section #${id} has ARIA label`);
});

// Images with alt text
const imgMatches = html.match(/<img[^>]*>/g) || [];
imgMatches.forEach((img, i) => {
  const hasAlt = /alt=/.test(img);
  assert(hasAlt, `img[${i}] has alt attribute`, img.slice(0, 80));
});

// Decorative aria-hidden on elements with aria-hidden
const ariaHiddenCount = (html.match(/aria-hidden="true"/g) || []).length;
assert(ariaHiddenCount >= 3, `At least 3 decorative elements marked aria-hidden (found ${ariaHiddenCount})`);

// Back to top button
assert(html.includes('aria-label="Back to top"'), 'Back-to-top button has aria-label');

// Cookie banner
assert(html.match(/id="cookieBanner"[^>]*role="dialog"/), 'Cookie banner has role=dialog');

// EPCIS code window label
assert(html.includes('aria-label="Illustrative EPCIS 2.0 data structure"'), 'EPCIS code window has aria-label');

// Tables with aria-label
assert(html.includes('aria-label="Regulatory compliance matrix"'), 'Compliance table has aria-label');
assert(html.match(/<th[^>]+scope=/), 'Table headers have scope attribute');

// Focus management: focus-visible CSS defined
assert(html.includes(':focus-visible'), ':focus-visible style defined');
assert(html.includes(':focus:not(:focus-visible)'), 'Outline suppressed for non-keyboard focus');

// ─── 5. SEMANTIC HTML ────────────────────────────────────────────────────────
section('5. SEMANTIC HTML');

assert((html.match(/<section/g) || []).length >= 8, 'At least 8 <section> elements');
assert((html.match(/<article/g) || []).length >= 3, 'At least 3 <article> elements');
assert((html.match(/<h1/g) || []).length === 1, 'Exactly one <h1> element');
assert((html.match(/<h2/g) || []).length >= 6, 'At least 6 <h2> headings');
assert((html.match(/<nav/g) || []).length >= 1, 'At least one <nav> element');
assert(html.includes('<main>'), '<main> landmark present');
assert(html.includes('<table'), 'Compliance table present');
assert(html.includes('<thead>') && html.includes('<tbody>'), 'Table has thead and tbody');

// h1 should be within the hero section
const heroSection = html.match(/<section id="hero"[\s\S]*?<\/section>/);
assert(heroSection && /<h1/.test(heroSection[0]), 'h1 is inside #hero section');

// ─── 6. PERFORMANCE INDICATORS ───────────────────────────────────────────────
section('6. PERFORMANCE INDICATORS');

// LCP image: fetchpriority and decoding
assert(html.includes('fetchpriority="high"'), 'Hero image has fetchpriority=high');
assert(html.includes('decoding="async"'), 'Hero image has decoding=async');

// Picture element for next-gen formats
assert(html.includes('<picture>'), '<picture> element for hero image');
assert(html.includes('type="image/avif"'), 'AVIF source provided in hero picture');
assert(html.includes('type="image/webp"'), 'WebP source provided in hero picture');

// Font preconnects
assert((html.match(/rel="preconnect"/g) || []).length >= 3, 'At least 3 preconnect links');
assert(html.includes('fonts.googleapis.com'), 'Google Fonts preconnect present');

// requestAnimationFrame used in scroll handler
assert(html.includes('requestAnimationFrame'), 'Scroll handler uses requestAnimationFrame (throttled)');

// IntersectionObserver for reveals
assert((html.match(/IntersectionObserver/g) || []).length >= 2, 'IntersectionObserver used for reveals and SVG lazy-load');

// Passive event listeners
assert((html.match(/passive: true/g) || []).length >= 2, 'Passive event listeners used on scroll/resize');

// CSS marquee uses CSS animation (not JS scroll)
assert(html.includes('@keyframes marqueeScroll'), 'Marquee uses CSS animation');
assert(html.includes('marqueeScroll 60s linear infinite'), 'Marquee animation configured');

// ─── 7. CSS QUALITY ───────────────────────────────────────────────────────────
section('7. CSS QUALITY');

// CSS custom properties
['--sepia-black', '--muted-clay', '--warm-accent', '--warm-off-white', '--charcoal', '--mid-grey',
 '--font-sans', '--font-mono', '--font-body',
 '--text-secondary-dark', '--text-tertiary-dark', '--text-label-dark'].forEach(prop => {
  assert(html.includes(prop), `CSS custom property defined: ${prop}`);
});

// Reduced motion
assert(html.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion media query present');
assert(html.includes('animation-duration: 0.01ms'), 'Reduced motion disables animations');

// Print stylesheet
assert(html.includes('@media print'), 'Print stylesheet present');
assert(html.includes('break-inside: avoid'), 'Print: sections avoid page breaks');

// Responsive breakpoints
assert(html.includes('@media (max-width: 1024px)'), '1024px breakpoint defined');
assert(html.includes('@media (max-width: 768px)'), '768px breakpoint defined');

// box-sizing reset
assert(html.includes('box-sizing: border-box'), 'box-sizing: border-box reset applied');

// clamp() for fluid typography
const clampCount = (html.match(/clamp\(/g) || []).length;
assert(clampCount >= 5, `clamp() used for fluid type (found ${clampCount})`);

// Smooth scroll
assert(html.includes('scroll-behavior: smooth'), 'Smooth scroll on html element');

// overflow-x on body
assert(html.includes('overflow-x: hidden'), 'Horizontal overflow hidden on body');

// ─── 8. JAVASCRIPT LOGIC ──────────────────────────────────────────────────────
section('8. JAVASCRIPT LOGIC');

// All IIFEs
const iifeCount = (html.match(/\(function\s*\(\)/g) || []).length;
assert(iifeCount >= 5, `At least 5 IIFE modules (found ${iifeCount})`);

// Hamburger logic
assert(html.includes("aria-expanded"), 'Hamburger toggles aria-expanded');
assert(html.includes("document.body.style.overflow"), 'Hamburger locks body scroll');
assert(html.includes("e.key === 'Escape'"), 'Escape key closes drawer');

// Cookie: localStorage try/catch
assert(html.includes("localStorage.getItem('mt_cookie_consent')"), 'Cookie consent reads localStorage');
assert(html.includes("localStorage.setItem('mt_cookie_consent'"), 'Cookie consent writes localStorage');
assert(html.match(/try\s*\{[\s\S]*?localStorage[\s\S]*?catch/), 'localStorage wrapped in try/catch');

// Terminal animation uses setTimeout stagger
assert(html.includes('900 + i * 280'), 'Terminal lines use 280ms stagger');

// Back-to-top threshold uses viewport heights
assert(html.includes('window.innerHeight * 2'), 'Back-to-top uses 2× viewport height threshold');

// Hero fade uses % of hero height (not fixed px)
assert(html.includes('heroHeight * 0.2'), 'Hero fade start at 20% scroll');
assert(html.includes('heroHeight * 0.7'), 'Hero fade end at 70% scroll');

// syntaxHighlight XSS safety: & < > are escaped before regex highlighting
const syntaxFnMatch = html.match(/function syntaxHighlight[\s\S]*?^    \}/m) ||
                       html.match(/function syntaxHighlight[\s\S]*?\n      \}/);
const syntaxFnStr = html.substring(html.indexOf('function syntaxHighlight'));
assert(syntaxFnStr.includes("replace(/&/g, '&amp;')"), 'syntaxHighlight escapes & first');
assert(syntaxFnStr.includes("replace(/</g, '&lt;')"), 'syntaxHighlight escapes < (XSS prevention)');
assert(syntaxFnStr.includes("replace(/>/g, '&gt;')"), 'syntaxHighlight escapes >');

// Resize handler recalculates hero height
assert(html.includes("heroHeight = hero.offsetHeight"), 'Hero height recalculated on resize');

// ─── 9. LINK & NAVIGATION HYGIENE ────────────────────────────────────────────
section('9. LINK & NAVIGATION HYGIENE');

// External links have rel="noopener noreferrer"
const externalLinks = html.match(/href="https?:\/\/[^"]+"/g) || [];
const targetBlankLinks = html.match(/<a[^>]+target="_blank"[^>]*>/g) || [];
targetBlankLinks.forEach((link, i) => {
  assert(/rel="noopener noreferrer"/.test(link), `External target=_blank link[${i}] has rel=noopener noreferrer`, link.slice(0, 100));
});

// Internal anchor links have matching IDs
const internalLinks = (html.match(/href="#([^"]+)"/g) || []).map(m => m.replace(/href="#|"/g, ''));
internalLinks.forEach(id => {
  const hasId = new RegExp(`id="${id}"`).test(html);
  assert(hasId, `Internal anchor #${id} has a matching id in the DOM`);
});

// CTA mailto or URL is set (not empty/placeholder)
const ctaHref = html.match(/class="cta-btn"[\s\S]*?href="([^"]+)"/);
assert(ctaHref && ctaHref[1] && !ctaHref[1].includes('#'), 'CTA button href is a real URL, not a placeholder');

// ─── 10. CONTENT COMPLETENESS ────────────────────────────────────────────────
section('10. CONTENT COMPLETENESS');

// Key brand terms present
['MONO•TERRA', 'LYTEN™', 'MONOTERRA AB', '559572-5259', 'Victoria, Australia', 'Biella'].forEach(term => {
  assert(html.includes(term), `Brand term "${term}" present in copy`);
});

// Spec values
['16.8', '98.7%', '250', 'gsm', 'RWS'].forEach(val => {
  assert(html.includes(val), `Spec value "${val}" present`);
});

// Compliance terms
['CSRD', 'ESPR', 'DPP', 'EPCIS', 'GS1'].forEach(term => {
  assert(html.includes(term), `Compliance term "${term}" present`);
});

// EPCIS JSON structure completeness (it's injected via JS but the object is in the script)
assert(html.includes('"schemaVersion": "2.0"'), 'EPCIS schemaVersion 2.0 present');
assert(html.includes('"mt:fibreSpecification"'), 'EPCIS fibreSpecification field present');
assert(html.includes('"mt:provenance"'), 'EPCIS provenance field present');
assert(html.includes('"mt:complianceFields"'), 'EPCIS complianceFields present');
assert(html.includes('"csrdScope3Cat1": true'), 'EPCIS CSRD Scope 3 Cat.1 flag set');
assert(html.includes('"espr_monoMaterial": true'), 'EPCIS ESPR mono-material flag set');

// Copyright year
assert(html.includes('2026'), '2026 copyright year present');

// FAQ entries
['// 01. INTEGRATION', '// 02. VERIFICATION', '// 03. CERTIFICATION', '// 04. SCALE'].forEach(item => {
  assert(html.includes(item), `FAQ item "${item}" present`);
});

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`  STATIC ANALYSIS COMPLETE`);
console.log('═'.repeat(60));
console.log(`  Passed : ${passed}`);
console.log(`  Failed : ${failed}`);
console.log(`  Total  : ${passed + failed}`);

if (failures.length > 0) {
  console.log('\n  FAILURES:');
  failures.forEach((f, i) => {
    console.error(`    ${i + 1}. ${f.label}${f.detail ? ` — ${f.detail}` : ''}`);
  });
}
console.log('═'.repeat(60) + '\n');

if (failed > 0) {
  process.exit(1);
}
