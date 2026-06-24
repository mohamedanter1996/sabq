import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generationConfig } from './question-generation.config.mjs';
import {
  getQuestionQualityFailures,
  normalizeQuestionText
} from './question-quality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bankPath = join(__dirname, '..', 'src', 'Sabq.Infrastructure', 'Data', 'QuestionBank', 'questions.ar.json');

const bank = JSON.parse(readFileSync(bankPath, 'utf8'));
const failures = [];
const categoryCounts = Object.fromEntries(bank.categories.map((category) => [category.slug, 0]));
const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
const seenSlugs = new Set();
const seenArabicTexts = new Set();
let fallbackQuestions = 0;

if (bank.questions.length < generationConfig.minimumTotalQuestions) {
  failures.push(`Expected at least ${generationConfig.minimumTotalQuestions} questions, found ${bank.questions.length}`);
}

for (const question of bank.questions) {
  categoryCounts[question.categorySlug] = (categoryCounts[question.categorySlug] ?? 0) + 1;
  difficultyCounts[question.difficulty] = (difficultyCounts[question.difficulty] ?? 0) + 1;

  if (seenSlugs.has(question.slug)) {
    failures.push(`Duplicate slug: ${question.slug}`);
  }
  seenSlugs.add(question.slug);

  const normalizedText = normalizeQuestionText(question.textAr);
  if (seenArabicTexts.has(normalizedText)) {
    failures.push(`Duplicate Arabic text: ${question.textAr}`);
  }
  seenArabicTexts.add(normalizedText);

  if (!question.source) {
    failures.push(`Missing source: ${question.slug}`);
  }

  if (normalizeQuestionText(question.source).includes('same-family comparison fallback')) {
    fallbackQuestions++;
  }

  for (const failure of getQuestionQualityFailures(question)) {
    failures.push(`${failure}: ${question.slug}`);
  }
}

for (const category of bank.categories) {
  const count = categoryCounts[category.slug] ?? 0;
  if (count < generationConfig.minimumCategoryQuestions) {
    failures.push(`Category ${category.slug} has ${count}; expected at least ${generationConfig.minimumCategoryQuestions}`);
  }
}

if ((categoryCounts.sports ?? 0) < generationConfig.minimumSportsQuestions) {
  failures.push(`Sports has ${categoryCounts.sports ?? 0}; expected at least ${generationConfig.minimumSportsQuestions}`);
}

const easyShare = difficultyCounts.Easy / Math.max(1, bank.questions.length);
if (easyShare > generationConfig.targetDifficultyShare.Easy + 0.05) {
  failures.push(`Easy questions are ${(easyShare * 100).toFixed(1)}%; expected near ${generationConfig.targetDifficultyShare.Easy * 100}%`);
}

const fallbackShare = fallbackQuestions / Math.max(1, bank.questions.length);
if (fallbackShare > generationConfig.maximumFallbackQuestionShare) {
  failures.push(`Fallback comparison questions are ${(fallbackShare * 100).toFixed(1)}%; expected at most ${generationConfig.maximumFallbackQuestionShare * 100}%`);
}

console.log(JSON.stringify({
  questions: bank.questions.length,
  categoryCounts,
  difficultyCounts,
  fallbackQuestions,
  fallbackShare: Number(fallbackShare.toFixed(4)),
  failures: failures.slice(0, 50),
  failureCount: failures.length
}, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
