import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bankPath = join(__dirname, '..', 'src', 'Sabq.Infrastructure', 'Data', 'QuestionBank', 'questions.ar.json');

const minimumTotalQuestions = 5000;
const minimumCategoryQuestions = 250;
const minimumSportsQuestions = 700;

const bannedQuestionPhrases = [
  'اختر الإجابة الصحيحة المرتبطة',
  'بماذا يشتهر',
  'بماذا تشتهر',
  'ما الاستخدام الأشهر',
  'ما نوع لعبة',
  'ما نوع ',
  'في أي عام صدر',
  'في أي عام أو فترة حدث',
  'من أخرج فيلم',
  'من كتب مسلسل',
  'من مؤلف',
  'في أي مجال فني اشتهر',
  'ما المجال الرئيسي لعمل',
  'أين يعيش',
  'أين يقع مقر',
  'ما الرمز أو الوصف المختصر',
  'تخص غالبا أي نوع فرق',
  'أي نوع فرق',
  'تحت أي نوع',
  'تتحسب من أي نوع',
  'أي نوع ألعاب',
  'معلومة سريعة تنفع',
  'معرفة هادئة بلا جدل',
  'سهلة الحفظ',
  'ما اسم أول',
  'ما اسم أطول',
  'ما اسم أشهر',
  'ما القبلة التي',
  'في أي شهر يصوم',
  'من هو خاتم الأنبياء',
  'كل كام سنة'
];

const sportsForbiddenTerms = [
  'الإسكواش',
  'التنس',
  'ويمبلدون',
  'رولان جاروس',
  'الدراجات',
  'فورمولا',
  'الكريكيت',
  'الرجبي',
  'كرة السلة',
  'NBA',
  'كرة اليد',
  'السوبر بول',
  'NFL',
  'الأولمبية',
  'البارالمبية',
  'التايكوندو',
  'الكاراتيه',
  'المصارعة',
  'السلاح',
  'السباحة',
  'الجودو',
  'ألعاب القوى'
];

const sportsForbiddenEnglishTerms = [
  'squash',
  'tennis',
  'wimbledon',
  'roland garros',
  'cycling',
  'formula',
  'cricket',
  'rugby',
  'basketball',
  'nba',
  'handball',
  'super bowl',
  'nfl',
  'olympic',
  'paralympic',
  'taekwondo',
  'karate',
  'wrestling',
  'fencing',
  'swimming',
  'judo',
  'athletics'
];

const obviousAnswerPairs = [
  ['الفيل الأفريقي', 'أفريقيا'],
  ['التمساح النيلي', 'نهر النيل'],
  ['النسر الأصلع', 'أمريكا الشمالية'],
  ['الباندا العملاقة', 'الصين'],
  ['الكنغر', 'أستراليا'],
  ['الصحراء الكبرى', 'شمال أفريقيا']
];

function normalize(value) {
  return String(value)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[ـ"'""'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function includesEnglishForbiddenTerm(text, term) {
  const normalizedTerm = normalize(term);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, 'i').test(normalize(text));
}

function answerAppearsInQuestionText(question, correctOption) {
  const normalizedAnswer = normalize(correctOption.textAr);
  return normalizedAnswer.length >= 4 && normalize(question.textAr).includes(normalizedAnswer);
}

function findObviousAnswerPair(question, correctOption) {
  const normalizedText = normalize(question.textAr);
  const normalizedAnswer = normalize(correctOption.textAr);
  return obviousAnswerPairs.find(([subject, answer]) =>
    normalizedText.includes(normalize(subject)) &&
    normalizedAnswer.includes(normalize(answer))
  );
}

const bank = JSON.parse(readFileSync(bankPath, 'utf8'));
const failures = [];
const categoryCounts = Object.fromEntries(bank.categories.map((category) => [category.slug, 0]));
const seenSlugs = new Set();
const seenArabicTexts = new Set();

if (bank.questions.length < minimumTotalQuestions) {
  failures.push(`Expected at least ${minimumTotalQuestions} questions, found ${bank.questions.length}`);
}

for (const question of bank.questions) {
  categoryCounts[question.categorySlug] = (categoryCounts[question.categorySlug] ?? 0) + 1;

  if (seenSlugs.has(question.slug)) {
    failures.push(`Duplicate slug: ${question.slug}`);
  }
  seenSlugs.add(question.slug);

  const normalizedText = normalize(question.textAr);
  if (seenArabicTexts.has(normalizedText)) {
    failures.push(`Duplicate Arabic text: ${question.textAr}`);
  }
  seenArabicTexts.add(normalizedText);

  if (!question.source) {
    failures.push(`Missing source: ${question.slug}`);
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    failures.push(`Question must have 4 options: ${question.slug}`);
    continue;
  }

  const correctOptions = question.options.filter((option) => option.isCorrect);
  if (correctOptions.length !== 1) {
    failures.push(`Question must have exactly one correct option: ${question.slug}`);
    continue;
  }

  const correctOption = correctOptions[0];
  if (answerAppearsInQuestionText(question, correctOption)) {
    failures.push(`Answer appears in text: ${question.slug}`);
  }

  const obviousPair = findObviousAnswerPair(question, correctOption);
  if (obviousPair) {
    failures.push(`Obvious clue/answer pair ${obviousPair.join(' / ')}: ${question.slug}`);
  }

  const bannedPhrase = bannedQuestionPhrases.find((phrase) => question.textAr.includes(phrase));
  if (bannedPhrase) {
    failures.push(`Banned phrase "${bannedPhrase}": ${question.slug}`);
  }

  if (question.categorySlug === 'sports') {
    const arabicSportsHaystack = normalize(`${question.textAr} ${question.options.map((option) => option.textAr).join(' ')}`);
    const forbiddenSportsTerm = sportsForbiddenTerms.find((term) => arabicSportsHaystack.includes(normalize(term)));
    if (forbiddenSportsTerm) {
      failures.push(`Non-football sports term "${forbiddenSportsTerm}": ${question.slug}`);
    }

    const englishSportsHaystack = `${question.textEn} ${question.options.map((option) => option.textEn).join(' ')}`;
    const forbiddenEnglishSportsTerm = sportsForbiddenEnglishTerms.find((term) => includesEnglishForbiddenTerm(englishSportsHaystack, term));
    if (forbiddenEnglishSportsTerm) {
      failures.push(`Non-football English sports term "${forbiddenEnglishSportsTerm}": ${question.slug}`);
    }
  }
}

for (const category of bank.categories) {
  const count = categoryCounts[category.slug] ?? 0;
  if (count < minimumCategoryQuestions) {
    failures.push(`Category ${category.slug} has ${count}; expected at least ${minimumCategoryQuestions}`);
  }
}

if ((categoryCounts.sports ?? 0) < minimumSportsQuestions) {
  failures.push(`Sports has ${categoryCounts.sports ?? 0}; expected at least ${minimumSportsQuestions}`);
}

console.log(JSON.stringify({
  questions: bank.questions.length,
  categoryCounts,
  failures: failures.slice(0, 30),
  failureCount: failures.length
}, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
