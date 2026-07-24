import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const questionBankPath = join(repoRoot, 'src', 'Sabq.Infrastructure', 'Data', 'QuestionBank', 'questions.ar.json');
const webRoot = join(repoRoot, 'src', 'Sabq.Web');
const assetsRoot = join(webRoot, 'src', 'assets');
const dataRoot = join(webRoot, 'src', 'app', 'data');
const sitemapPath = join(assetsRoot, 'sitemap.xml');
const adsTxtPath = join(assetsRoot, 'ads.txt');
const routesPath = join(webRoot, 'routes.txt');
const previewDataPath = join(dataRoot, 'question-preview.generated.ts');

const siteUrl = 'https://sabiqgame.com';
const publisherId = 'pub-2380690201803806';

const staticRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.5' },
  { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.5' },
  { path: '/editorial-policy', changefreq: 'monthly', priority: '0.7' },
  { path: '/corrections', changefreq: 'monthly', priority: '0.6' },
  { path: '/team', changefreq: 'monthly', priority: '0.6' },
  { path: '/learn', changefreq: 'weekly', priority: '0.9' },
  { path: '/learn/arabic-language-basics', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/math-and-logic', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/science-around-us', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/life-science', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/earth-and-space', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/climate-and-water', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/digital-citizenship', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/world-geography', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/egyptian-heritage', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/arab-scientific-heritage', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/historical-thinking', changefreq: 'monthly', priority: '0.8' },
  { path: '/learn/reading-and-research', changefreq: 'monthly', priority: '0.8' }
];

const questionBank = JSON.parse(readFileSync(questionBankPath, 'utf8'));
const generatedAt = questionBank.generatedAtUtc || new Date().toISOString();
const categories = Array.isArray(questionBank.categories) ? questionBank.categories : [];
const questions = Array.isArray(questionBank.questions) ? questionBank.questions : [];
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const previewQuestionsPerCategory = 20;

// These routes remain part of the playable question bank, but are deliberately
// excluded from the public sitemap. Pre-rendering them still gives crawlers a
// document with the component's `noindex,follow` directive instead of the
// generic root document. Individual question URLs are intentionally absent so
// the host can retire them with 410 Gone.
const noindexQuestionRoutes = [
  { path: '/questions' },
  ...categories
    .filter((category) => category.slug)
    .map((category) => ({ path: `/questions/${category.slug}` }))
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizePath(path) {
  if (!path || path === '/') {
    return '/';
  }

  return `/${String(path).replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function absoluteUrl(path) {
  const normalized = normalizePath(path);
  return normalized === '/' ? `${siteUrl}/` : `${siteUrl}${normalized}`;
}

function sitemapUrl({ path, lastmod, changefreq, priority }) {
  const lines = [
    '  <url>',
    `    <loc>${escapeXml(absoluteUrl(path))}</loc>`
  ];

  if (lastmod) {
    lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  }

  if (changefreq) {
    lines.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`);
  }

  if (priority) {
    lines.push(`    <priority>${escapeXml(priority)}</priority>`);
  }

  lines.push('  </url>');
  return lines.join('\n');
}

const sitemapEntries = [...staticRoutes];

const seenUrls = new Set();
const uniqueSitemapEntries = sitemapEntries.filter((entry) => {
  const url = absoluteUrl(entry.path);
  if (seenUrls.has(url)) {
    return false;
  }

  seenUrls.add(url);
  return true;
});

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...uniqueSitemapEntries.map(sitemapUrl),
  '</urlset>',
  ''
].join('\n');

const routes = [...staticRoutes, ...noindexQuestionRoutes]
  .map((route) => normalizePath(route.path));

const previewQuestionMap = new Map();
for (const question of questions.slice(0, previewQuestionsPerCategory)) {
  previewQuestionMap.set(`${question.categorySlug}/${question.slug}`, question);
}

for (const category of categories) {
  for (const question of questions
    .filter((item) => item.categorySlug === category.slug && item.slug)
    .slice(0, previewQuestionsPerCategory)) {
    previewQuestionMap.set(`${question.categorySlug}/${question.slug}`, question);
  }
}

function mapPreviewQuestion(question) {
  const category = categoryBySlug.get(question.categorySlug) || {};

  return {
    id: question.slug,
    textAr: question.textAr || '',
    textEn: question.textEn || '',
    slug: question.slug,
    categorySlug: question.categorySlug,
    categoryNameAr: category.nameAr || question.categorySlug,
    categoryNameEn: category.nameEn || question.categorySlug,
    difficulty: question.difficulty || 'Medium',
    timeLimitSec: question.timeLimitSec || 20,
    options: (question.options || []).map((option, index) => ({
      id: `${question.slug}-${index + 1}`,
      textAr: option.textAr || '',
      textEn: option.textEn || '',
      isCorrect: Boolean(option.isCorrect)
    })),
    lastModified: question.lastModified || generatedAt
  };
}

const previewCategories = categories.map((category) => ({
  id: category.slug,
  nameAr: category.nameAr || category.slug,
  nameEn: category.nameEn || category.slug,
  slug: category.slug,
  questionCount: questions.filter((question) => question.categorySlug === category.slug).length
}));

const previewData = `/* Auto-generated by scripts/generate-frontend-seo-assets.mjs. Do not edit manually. */
export interface QuestionPreviewCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  questionCount: number;
}

export interface QuestionPreviewOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
}

export interface QuestionPreviewItem {
  id: string;
  textAr: string;
  textEn: string;
  slug: string;
  categorySlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  difficulty: string;
  timeLimitSec: number;
  options: QuestionPreviewOption[];
  lastModified: string;
}

export const QUESTION_PREVIEW_TOTAL_COUNT = ${questions.length};
export const QUESTION_PREVIEW_CATEGORIES: QuestionPreviewCategory[] = ${JSON.stringify(previewCategories, null, 2)};
export const QUESTION_PREVIEW_QUESTIONS: QuestionPreviewItem[] = ${JSON.stringify(Array.from(previewQuestionMap.values()).map(mapPreviewQuestion), null, 2)};
`;

mkdirSync(assetsRoot, { recursive: true });
mkdirSync(dataRoot, { recursive: true });
writeFileSync(sitemapPath, sitemap, 'utf8');
writeFileSync(adsTxtPath, `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, 'utf8');
writeFileSync(routesPath, `${Array.from(new Set(routes)).join('\n')}\n`, 'utf8');
writeFileSync(previewDataPath, previewData, 'utf8');

console.log(`Generated ${uniqueSitemapEntries.length} sitemap URLs at ${sitemapPath}`);
console.log(`Generated ${routes.length} prerender routes at ${routesPath} (${noindexQuestionRoutes.length} noindex question routes)`);
console.log(`Generated ${previewQuestionMap.size} preview questions at ${previewDataPath}`);
