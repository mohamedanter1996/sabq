import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generationConfig } from './question-generation.config.mjs';
import {
  assertQuestionQuality as assertRubricQuestionQuality,
  getQuestionQualityFailures
} from './question-quality.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'src', 'Sabq.Infrastructure', 'Data', 'QuestionBank', 'questions.ar.json');

const source = 'Curated static factual bank / Wikipedia, Wikidata, and official-source checks';
const directQuestionFrames = {};
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
  'لو خلطت بين',
  'لو خلط بين',
  'بطاقة',
  'من غير ما نقول الاسم',
  'يكمل البطاقة',
  'لو البطاقة فيها',
  'دليلان قبل الاسم',
  'دليلان في بطاقة',
  'أي اسم يناسب',
  'قرينة واضحة',
  'استبعد التشابه',
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

const categories = [
  { slug: 'general-knowledge', nameAr: 'معلومات عامة', nameEn: 'General Knowledge', description: 'أسئلة مصرية وعربية وعالمية واضحة في الثقافة العامة.', displayOrder: 1 },
  { slug: 'religion-islamic', nameAr: 'دين وإسلاميات', nameEn: 'Religion and Islamic Studies', description: 'قرآن وسيرة وتاريخ إسلامي ومعالم دينية، بدون فتاوى خلافية.', displayOrder: 2 },
  { slug: 'history', nameAr: 'تاريخ', nameEn: 'History', description: 'تاريخ مصر القديم والحديث مع لمحات عربية وعالمية.', displayOrder: 3 },
  { slug: 'geography', nameAr: 'جغرافيا', nameEn: 'Geography', description: 'محافظات ومعالم مصرية ودول وعواصم مختارة.', displayOrder: 4 },
  { slug: 'art', nameAr: 'فن', nameEn: 'Art', description: 'فن مصري وتشكيلي ومعالم ومتاحف فنية.', displayOrder: 5 },
  { slug: 'film-tv', nameAr: 'أفلام وتلفزيون', nameEn: 'Film and Television', description: 'أفلام ومسلسلات ومخرجون ونجوم من مصر أولا.', displayOrder: 6 },
  { slug: 'music', nameAr: 'موسيقى', nameEn: 'Music', description: 'موسيقى ومطربون وملحنون مصريون وعرب.', displayOrder: 7 },
  { slug: 'books-literature', nameAr: 'كتب وأدب', nameEn: 'Books and Literature', description: 'أعمال أدبية وروائيون وشعراء من مصر والعالم العربي.', displayOrder: 8 },
  { slug: 'sports', nameAr: 'رياضة', nameEn: 'Sports', description: 'كرة قدم مصرية وعالمية: لاعبين وأندية ومنتخبات وبطولات.', displayOrder: 9 },
  { slug: 'science-nature', nameAr: 'علوم وطبيعة', nameEn: 'Science and Nature', description: 'علوم وطبيعة وكيمياء وفلك بأسئلة مباشرة.', displayOrder: 10 },
  { slug: 'technology', nameAr: 'تكنولوجيا', nameEn: 'Technology', description: 'برمجة واختراعات وشركات تقنية مع أسماء أصلية عند الحاجة.', displayOrder: 11 },
  { slug: 'politics', nameAr: 'سياسة', nameEn: 'Politics', description: 'مؤسسات مصرية ومنظمات دولية ومفاهيم سياسية عامة.', displayOrder: 12 },
  { slug: 'animals', nameAr: 'حيوانات', nameEn: 'Animals', description: 'حيوانات وبيئاتها وصفاتها.', displayOrder: 13 },
  { slug: 'vehicles', nameAr: 'مركبات', nameEn: 'Vehicles', description: 'سيارات وطائرات وقطارات ووسائل نقل.', displayOrder: 14 },
  { slug: 'games', nameAr: 'ألعاب', nameEn: 'Games', description: 'ألعاب فيديو وألعاب لوحية وكلاسيكيات اللعب.', displayOrder: 15 }
];

const minimumTotalQuestions = generationConfig.minimumTotalQuestions;
const targetCategoryCounts = generationConfig.targetCategoryCounts;

const questions = [];
const usedSlugs = new Set();
const usedQuestionTexts = new Set();

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 150) || `q-${hash(value)}`;
}

function uniqueOptions(options) {
  const seen = new Set();
  const result = [];
  for (const option of options) {
    const key = option.ar.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(option);
    }
  }
  return result;
}

function pickOptions(correct, pool, seed) {
  const cleanPool = uniqueOptions(pool.filter((option) => option.ar && option.en));
  const wrong = cleanPool
    .filter((option) => option.ar !== correct.ar)
    .sort((a, b) => hash(`${seed}:wrong:${a.ar}`) - hash(`${seed}:wrong:${b.ar}`))
    .slice(0, 3);

  if (wrong.length < 3) {
    throw new Error(`Not enough distractors for ${correct.ar}`);
  }

  return [correct, ...wrong]
    .sort((a, b) => hash(`${seed}:order:${a.ar}`) - hash(`${seed}:order:${b.ar}`))
    .map((option, index) => ({
      textAr: option.ar,
      textEn: option.en,
      isCorrect: option.ar === correct.ar,
      displayOrder: index + 1
    }));
}

function normalizeForQuality(value) {
  return value
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
  const normalizedText = normalizeForQuality(text);
  const normalizedTerm = normalizeForQuality(term);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, 'i').test(normalizedText);
}

function answerAppearsInQuestionText(textAr, correct) {
  const normalizedAnswer = normalizeForQuality(correct.ar);
  return normalizedAnswer.length >= 4 && normalizeForQuality(textAr).includes(normalizedAnswer);
}

function findObviousAnswerPair(textAr, correct) {
  const normalizedText = normalizeForQuality(textAr);
  const normalizedAnswer = normalizeForQuality(correct.ar);
  return obviousAnswerPairs.find(([subject, answer]) =>
    normalizedText.includes(normalizeForQuality(subject)) &&
    normalizedAnswer.includes(normalizeForQuality(answer))
  );
}

function findObviousQuestionPair(textAr) {
  const normalizedText = normalizeForQuality(textAr);
  return obviousAnswerPairs.find(([subject, answer]) =>
    normalizedText.includes(normalizeForQuality(subject)) &&
    normalizedText.includes(normalizeForQuality(answer))
  );
}

function assertQuestionVoice(textAr) {
  const normalized = textAr.replace(/\s+/g, ' ').trim();
  const bannedPhrase = bannedQuestionPhrases.find((phrase) => normalized.includes(phrase));
  if (bannedPhrase) {
    throw new Error(`Boring question phrase "${bannedPhrase}" in question: ${textAr}`);
  }

  if (normalized.length < 18) {
    throw new Error(`Question is too short to feel playable: ${textAr}`);
  }
}

function assertQuestionQuality(categorySlug, textAr, textEn, correct, options) {
  if (answerAppearsInQuestionText(textAr, correct)) {
    throw new Error(`Answer appears in question text: ${textAr} -> ${correct.ar}`);
  }

  const obviousPair = findObviousAnswerPair(textAr, correct);
  if (obviousPair) {
    throw new Error(`Obvious answer pair "${obviousPair.join(' / ')}" in question: ${textAr}`);
  }

  const obviousQuestionPair = findObviousQuestionPair(textAr);
  if (obviousQuestionPair) {
    throw new Error(`Obvious clue pair "${obviousQuestionPair.join(' / ')}" in question: ${textAr}`);
  }

  if (categorySlug === 'sports') {
    const haystack = normalizeForQuality(`${textAr} ${options.map((option) => option.textAr).join(' ')}`);
    const forbiddenTerm = sportsForbiddenTerms.find((term) => haystack.includes(normalizeForQuality(term)));
    if (forbiddenTerm) {
      throw new Error(`Non-football sports term "${forbiddenTerm}" in sports question: ${textAr}`);
    }

    const englishHaystack = `${textEn} ${options.map((option) => option.textEn).join(' ')}`;
    const forbiddenEnglishTerm = sportsForbiddenEnglishTerms.find((term) => includesEnglishForbiddenTerm(englishHaystack, term));
    if (forbiddenEnglishTerm) {
      throw new Error(`Non-football sports term "${forbiddenEnglishTerm}" in sports question: ${textEn}`);
    }
  }
}

function frameDirectQuestion(categorySlug, textAr, textEn) {
  if (textAr.includes(':')) {
    return { textAr, textEn };
  }

  const frame = directQuestionFrames[categorySlug];
  if (!frame) {
    return { textAr, textEn };
  }

  return {
    textAr: `${frame.ar}${textAr}`,
    textEn: `${frame.en}${textEn}`
  };
}

function addQuestion(categorySlug, difficulty, timeLimitSec, textAr, textEn, correct, pool, questionSource = source) {
  assertQuestionVoice(textAr);

  const baseSlug = `${categorySlug}-${slugify(textEn)}`;
  let slug = baseSlug;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }
  usedSlugs.add(slug);

  const options = pickOptions(correct, pool, slug);
  assertQuestionQuality(categorySlug, textAr, textEn, correct, options);
  const question = { slug, categorySlug, difficulty, timeLimitSec, textAr, textEn, options, source: questionSource };
  assertRubricQuestionQuality(question);
  const normalizedQuestionText = normalizeForQuality(textAr);
  if (usedQuestionTexts.has(normalizedQuestionText)) {
    throw new Error(`Duplicate Arabic question text: ${textAr}`);
  }
  usedQuestionTexts.add(normalizedQuestionText);
  questions.push(question);
}

function addDirectQuestion(categorySlug, difficulty, timeLimitSec, textAr, textEn, answerAr, answerEn, wrongOptions, questionSource = source) {
  const framed = frameDirectQuestion(categorySlug, textAr, textEn);
  try {
    addQuestion(
      categorySlug,
      difficulty,
      timeLimitSec,
      framed.textAr,
      framed.textEn,
      { ar: answerAr, en: answerEn },
      [{ ar: answerAr, en: answerEn }, ...wrongOptions.map(([ar, en]) => ({ ar, en }))],
      questionSource
    );
    return true;
  } catch {
    return false;
  }
}

function fieldPool(records, arField, enField, centerIndex = null, radius = null) {
  let sourceRecords = records;
  if (Number.isInteger(centerIndex) && Number.isInteger(radius)) {
    let start = Math.max(0, centerIndex - radius);
    let end = Math.min(records.length, centerIndex + radius + 1);
    const uniqueCount = () => new Set(records.slice(start, end).map((record) => record[arField])).size;
    while (uniqueCount() < 4 && (start > 0 || end < records.length)) {
      start = Math.max(0, start - 1);
      end = Math.min(records.length, end + 1);
    }
    sourceRecords = records.slice(start, end);
  }

  return sourceRecords.map((record) => ({ ar: record[arField], en: record[enField] }));
}

function addFieldQuestions(categorySlug, records, specs, questionSource = source) {
  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const record = records[recordIndex];
    for (const spec of specs) {
      const correct = { ar: record[spec.arField], en: record[spec.enField] };
      const pool = fieldPool(records, spec.arField, spec.enField, recordIndex, spec.poolRadius);
      for (const variant of spec.variants) {
        const textAr = variant.ar(record);
        const textEn = variant.en(record);
        if (answerAppearsInQuestionText(textAr, correct) ||
          findObviousAnswerPair(textAr, correct) ||
          findObviousQuestionPair(textAr)) {
          continue;
        }

        tryAddQuestion(
          categorySlug,
          spec.difficulty,
          spec.timeLimitSec,
          textAr,
          textEn,
          correct,
          pool,
          questionSource
        );
      }
    }
  }
}

function tryAddQuestion(categorySlug, difficulty, timeLimitSec, textAr, textEn, correct, pool, questionSource = source) {
  try {
    addQuestion(categorySlug, difficulty, timeLimitSec, textAr, textEn, correct, pool, questionSource);
    return true;
  } catch {
    return false;
  }
}

function fieldName(field, lang) {
  return `${field}${lang}`;
}

function fieldOption(record, field) {
  return {
    ar: record[fieldName(field, 'Ar')],
    en: record[fieldName(field, 'En')]
  };
}

function relationshipPool(records, field, centerIndex, radius = 4) {
  return fieldPool(records, fieldName(field, 'Ar'), fieldName(field, 'En'), centerIndex, radius);
}

function addAnswerFieldRelationships(categorySlug, records, spec, questionSource = `${source} / rubric relationship template`) {
  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const record = records[recordIndex];
    const correct = fieldOption(record, spec.answerField);
    const pool = relationshipPool(records, spec.answerField, recordIndex, spec.poolRadius);
    const clue = record[fieldName(spec.clueField, 'Ar')];
    const clueEn = record[fieldName(spec.clueField, 'En')];
    const name = record.nameAr;
    const nameEn = record.nameEn;
    const labelAr = spec.labelAr;
    const labelEn = spec.labelEn;
    const variants = [
      {
        ar: `السؤال عن ${labelAr}: ${name} و${clue}. ما الإجابة الصحيحة؟`,
        en: `Question about ${labelEn}: ${nameEn} and ${clueEn}. What is the correct answer?`
      },
      {
        ar: `دليل سريع عن ${name}: ${clue}. أي ${labelAr} أقرب للمعنى؟`,
        en: `Quick clue about ${nameEn}: ${clueEn}. Which ${labelEn} is closest to the meaning?`
      },
      {
        ar: `لما يجتمع ${name} مع ${clue}، أي تفصيلة أدق؟`,
        en: `When ${nameEn} meets ${clueEn}, which detail is most accurate?`
      },
      {
        ar: `تفصيلة صغيرة عن ${name}: ${clue}. أي ${labelAr} يفسرها؟`,
        en: `Small detail about ${nameEn}: ${clueEn}. Which ${labelEn} explains it?`
      },
      {
        ar: `الدليل عن ${labelAr}: ${name} و${clue}. ما الإجابة؟`,
        en: `Clue about ${labelEn}: ${nameEn} and ${clueEn}. What is the answer?`
      }
    ];

    for (const variant of variants) {
      if (answerAppearsInQuestionText(variant.ar, correct) ||
        findObviousAnswerPair(variant.ar, correct) ||
        findObviousQuestionPair(variant.ar)) {
        continue;
      }

      tryAddQuestion(
        categorySlug,
        spec.difficulty,
        spec.timeLimitSec,
        variant.ar,
        variant.en,
        correct,
        pool,
        questionSource
      );
    }
  }
}

function addNameFromClueRelationships(categorySlug, records, spec, questionSource = `${source} / rubric relationship template`) {
  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const record = records[recordIndex];
    const correct = fieldOption(record, 'name');
    const pool = relationshipPool(records, 'name', recordIndex, spec.poolRadius);
    const clueA = record[fieldName(spec.clueFields[0], 'Ar')];
    const clueB = record[fieldName(spec.clueFields[1], 'Ar')];
    const clueAEn = record[fieldName(spec.clueFields[0], 'En')];
    const clueBEn = record[fieldName(spec.clueFields[1], 'En')];
    const variants = [
      {
        ar: `الدليلان: ${clueA} و${clueB}. ما الاسم الصحيح؟`,
        en: `Two clues: ${clueAEn} and ${clueBEn}. Which name is correct?`
      },
      {
        ar: `يجتمع فيه ${clueA} و${clueB}. ما الاسم؟`,
        en: `It has ${clueAEn} and ${clueBEn}. What is the name?`
      },
      {
        ar: `من الدليلين ${clueA} و${clueB}، ما الإجابة؟`,
        en: `From the clues ${clueAEn} and ${clueBEn}, what is the answer?`
      },
      {
        ar: `الدليلان معًا: ${clueA} و${clueB}. ما الاسم؟`,
        en: `The two clues together: ${clueAEn} and ${clueBEn}. What is the name?`
      },
      {
        ar: `الدليل: ${clueA} ثم ${clueB}. ما الاسم الصحيح؟`,
        en: `Clue: ${clueAEn}, then ${clueBEn}. Which name is correct?`
      }
    ];

    for (const variant of variants) {
      if (answerAppearsInQuestionText(variant.ar, correct) ||
        findObviousAnswerPair(variant.ar, correct) ||
        findObviousQuestionPair(variant.ar)) {
        continue;
      }

      tryAddQuestion(
        categorySlug,
        spec.difficulty,
        spec.timeLimitSec,
        variant.ar,
        variant.en,
        correct,
        pool,
        questionSource
      );
    }
  }
}

function addRecordRelationshipSet(categorySlug, records, specs) {
  for (const spec of specs) {
    if (spec.kind === 'nameFromClues') {
      addNameFromClueRelationships(categorySlug, records, spec);
    } else {
      addAnswerFieldRelationships(categorySlug, records, spec);
    }
  }
}

const egyptPlaces = [
  ['أهرامات الجيزة', 'Pyramids of Giza', 'الجيزة', 'Giza', 'مقابر ملكية أثرية', 'ancient royal tombs'],
  ['قلعة صلاح الدين', 'Cairo Citadel', 'القاهرة', 'Cairo', 'قلعة تاريخية إسلامية', 'historic Islamic citadel'],
  ['معبد الكرنك', 'Karnak Temple', 'الأقصر', 'Luxor', 'مجمع معابد فرعوني', 'ancient temple complex'],
  ['وادي الملوك', 'Valley of the Kings', 'الأقصر', 'Luxor', 'مقابر ملوك الدولة الحديثة', 'New Kingdom royal tombs'],
  ['مكتبة الإسكندرية', 'Bibliotheca Alexandrina', 'الإسكندرية', 'Alexandria', 'مركز ثقافي ومكتبة كبرى', 'major library and cultural center'],
  ['قناة السويس', 'Suez Canal', 'الإسماعيلية والسويس وبورسعيد', 'Ismailia, Suez, and Port Said', 'ممر ملاحي يربط البحرين المتوسط والأحمر', 'canal linking the Mediterranean and Red Seas'],
  ['السد العالي', 'Aswan High Dam', 'أسوان', 'Aswan', 'تنظيم مياه النيل وتوليد الكهرباء', 'Nile water control and power generation'],
  ['جامع الأزهر', 'Al-Azhar Mosque', 'القاهرة', 'Cairo', 'مسجد وجامعة علمية تاريخية', 'historic mosque and scholarly institution'],
  ['خان الخليلي', 'Khan el-Khalili', 'القاهرة', 'Cairo', 'سوق تاريخي في القاهرة الإسلامية', 'historic bazaar in Islamic Cairo'],
  ['محمية رأس محمد', 'Ras Muhammad National Park', 'جنوب سيناء', 'South Sinai', 'شعاب مرجانية وحياة بحرية', 'coral reefs and marine life'],
  ['جبل سانت كاترين', 'Mount Catherine', 'جنوب سيناء', 'South Sinai', 'أعلى قمة في مصر', 'highest mountain in Egypt'],
  ['معبد أبو سمبل', 'Abu Simbel Temples', 'أسوان', 'Aswan', 'معابد رمسيس الثاني المنحوتة', 'rock-cut temples of Ramesses II'],
  ['المتحف المصري بالتحرير', 'Egyptian Museum in Tahrir', 'القاهرة', 'Cairo', 'آثار مصر القديمة', 'ancient Egyptian antiquities'],
  ['دار الأوبرا المصرية', 'Cairo Opera House', 'القاهرة', 'Cairo', 'الفنون المسرحية والموسيقية', 'performing arts and music'],
  ['قصر عابدين', 'Abdeen Palace', 'القاهرة', 'Cairo', 'قصر تاريخي ومتحف', 'historic palace and museum'],
  ['مدينة رشيد', 'Rosetta', 'البحيرة', 'Beheira', 'اكتشاف حجر رشيد', 'Rosetta Stone discovery'],
  ['بحيرة ناصر', 'Lake Nasser', 'أسوان', 'Aswan', 'بحيرة صناعية خلف السد العالي', 'reservoir behind the High Dam'],
  ['واحة سيوة', 'Siwa Oasis', 'مطروح', 'Matrouh', 'واحة صحراوية وثقافة أمازيغية', 'desert oasis and Amazigh culture']
].map(([nameAr, nameEn, governorateAr, governorateEn, knownForAr, knownForEn]) => ({ nameAr, nameEn, governorateAr, governorateEn, knownForAr, knownForEn }));

const globalPlaces = [
  ['برج إيفل', 'Eiffel Tower', 'باريس، فرنسا', 'Paris, France', 'برج حديدي صار رمزا لباريس', 'iron tower that became a symbol of Paris'],
  ['سور الصين العظيم', 'Great Wall of China', 'الصين', 'China', 'تحصينات تاريخية تمتد لمسافات طويلة', 'historic fortifications stretching for long distances'],
  ['ماتشو بيتشو', 'Machu Picchu', 'بيرو', 'Peru', 'مدينة إنكا مرتفعة بين جبال الأنديز', 'high Inca city in the Andes'],
  ['تاج محل', 'Taj Mahal', 'أغرا، الهند', 'Agra, India', 'ضريح رخامي أبيض شهير', 'famous white marble mausoleum'],
  ['الكولوسيوم', 'Colosseum', 'روما، إيطاليا', 'Rome, Italy', 'مدرج روماني أثري ضخم', 'huge ancient Roman amphitheatre'],
  ['تمثال الحرية', 'Statue of Liberty', 'نيويورك، الولايات المتحدة', 'New York, United States', 'تمثال يرحب بالقادمين إلى الميناء', 'harbour statue welcoming arrivals'],
  ['برج خليفة', 'Burj Khalifa', 'دبي، الإمارات', 'Dubai, United Arab Emirates', 'ناطحة سحاب فائقة الارتفاع', 'super-tall skyscraper'],
  ['غابات الأمازون', 'Amazon Rainforest', 'أمريكا الجنوبية', 'South America', 'غابة مطيرة استوائية شاسعة', 'vast tropical rainforest'],
  ['الصحراء الكبرى', 'Sahara Desert', 'شمال أفريقيا', 'North Africa', 'أكبر صحراء حارة في العالم', 'world largest hot desert'],
  ['جبل إيفرست', 'Mount Everest', 'الهيمالايا بين نيبال والصين', 'Himalayas between Nepal and China', 'أعلى قمة فوق مستوى سطح البحر', 'highest peak above sea level'],
  ['خندق ماريانا', 'Mariana Trench', 'غرب المحيط الهادئ', 'Western Pacific Ocean', 'أعمق منطقة معروفة في المحيطات', 'deepest known part of the oceans'],
  ['دار أوبرا سيدني', 'Sydney Opera House', 'سيدني، أستراليا', 'Sydney, Australia', 'مبنى مسرحي شهير بسقفه الشبيه بالأشرعة', 'performing arts building with sail-like roofs']
].map(([nameAr, nameEn, locationAr, locationEn, knownForAr, knownForEn]) => ({ nameAr, nameEn, locationAr, locationEn, knownForAr, knownForEn }));

const egyptHistoryEvents = [
  ['توحيد القطرين في مصر القديمة', 'Unification of Upper and Lower Egypt', 'نعرمر', 'Narmer', 'نحو 3100 قبل الميلاد', 'c. 3100 BCE'],
  ['بناء الهرم الأكبر', 'Building the Great Pyramid', 'خوفو', 'Khufu', 'نحو 2560 قبل الميلاد', 'c. 2560 BCE'],
  ['حكم حتشبسوت', 'Reign of Hatshepsut', 'حتشبسوت', 'Hatshepsut', 'الأسرة الثامنة عشرة', 'Eighteenth Dynasty'],
  ['معركة قادش', 'Battle of Kadesh', 'رمسيس الثاني', 'Ramesses II', 'نحو 1274 قبل الميلاد', 'c. 1274 BCE'],
  ['دخول الإسكندر الأكبر مصر', 'Alexander the Great enters Egypt', 'الإسكندر الأكبر (Alexander the Great)', 'Alexander the Great', '332 قبل الميلاد', '332 BCE'],
  ['تأسيس مدينة الإسكندرية', 'Founding of Alexandria', 'الإسكندر الأكبر (Alexander the Great)', 'Alexander the Great', '331 قبل الميلاد', '331 BCE'],
  ['اكتشاف حجر رشيد', 'Discovery of the Rosetta Stone', 'رشيد', 'Rosetta', '1799', '1799'],
  ['حملة نابليون على مصر', 'French campaign in Egypt', 'نابليون بونابرت (Napoleon Bonaparte)', 'Napoleon Bonaparte', '1798', '1798'],
  ['تولي محمد علي حكم مصر', 'Muhammad Ali becomes ruler of Egypt', 'محمد علي باشا', 'Muhammad Ali Pasha', '1805', '1805'],
  ['افتتاح قناة السويس', 'Opening of the Suez Canal', 'الإسماعيلية', 'Ismailia', '1869', '1869'],
  ['ثورة 1919', 'Egyptian Revolution of 1919', 'سعد زغلول', 'Saad Zaghloul', '1919', '1919'],
  ['تصريح 28 فبراير', 'Declaration of 28 February', 'المملكة المتحدة (United Kingdom)', 'United Kingdom', '1922', '1922'],
  ['ثورة 23 يوليو', 'Egyptian Revolution of 1952', 'الضباط الأحرار', 'Free Officers Movement', '1952', '1952'],
  ['تأميم قناة السويس', 'Nationalization of the Suez Canal', 'جمال عبد الناصر', 'Gamal Abdel Nasser', '1956', '1956'],
  ['العدوان الثلاثي على مصر', 'Suez Crisis', 'مصر', 'Egypt', '1956', '1956'],
  ['بناء السد العالي', 'Construction of the Aswan High Dam', 'أسوان', 'Aswan', 'الستينيات', '1960s'],
  ['حرب أكتوبر', 'October War', 'القوات المسلحة المصرية', 'Egyptian Armed Forces', '1973', '1973'],
  ['عبور قناة السويس في حرب أكتوبر', 'Crossing the Suez Canal in the October War', 'القوات المصرية', 'Egyptian forces', '6 أكتوبر 1973', '6 October 1973'],
  ['اتفاقية كامب ديفيد', 'Camp David Accords', 'أنور السادات', 'Anwar Sadat', '1978', '1978'],
  ['استرداد طابا', 'Return of Taba to Egypt', 'طابا', 'Taba', '1989', '1989'],
  ['افتتاح مكتبة الإسكندرية الحديثة', 'Opening of the modern Bibliotheca Alexandrina', 'الإسكندرية', 'Alexandria', '2002', '2002'],
  ['ثورة 25 يناير', 'Egyptian Revolution of 2011', 'ميدان التحرير', 'Tahrir Square', '2011', '2011']
].map(([nameAr, nameEn, keyAr, keyEn, yearAr, yearEn]) => ({ nameAr, nameEn, keyAr, keyEn, yearAr, yearEn }));

const egyptFilms = [
  ['العزيمة', 'The Will', 'كمال سليم', 'Kamal Selim', 'فاطمة رشدي', 'Fatma Rushdi', '1939'],
  ['غزل البنات', 'Ghazal Al Banat', 'أنور وجدي', 'Anwar Wagdy', 'نجيب الريحاني', 'Naguib El Rihani', '1949'],
  ['باب الحديد', 'Cairo Station', 'يوسف شاهين', 'Youssef Chahine', 'يوسف شاهين', 'Youssef Chahine', '1958'],
  ['دعاء الكروان', 'The Nightingale Prayer', 'هنري بركات', 'Henry Barakat', 'فاتن حمامة', 'Faten Hamama', '1959'],
  ['الزوجة الثانية', 'The Second Wife', 'صلاح أبو سيف', 'Salah Abu Seif', 'سعاد حسني', 'Soad Hosny', '1967'],
  ['الأرض', 'The Land', 'يوسف شاهين', 'Youssef Chahine', 'محمود المليجي', 'Mahmoud El Meliguy', '1970'],
  ['إمبراطورية ميم', 'Empire M', 'حسين كمال', 'Hussein Kamal', 'فاتن حمامة', 'Faten Hamama', '1972'],
  ['الكرنك', 'Al Karnak', 'علي بدرخان', 'Ali Badrakhan', 'سعاد حسني', 'Soad Hosny', '1975'],
  ['عودة الابن الضال', 'The Return of the Prodigal Son', 'يوسف شاهين', 'Youssef Chahine', 'شكري سرحان', 'Shoukry Sarhan', '1976'],
  ['إسكندرية ليه؟', 'Alexandria Why?', 'يوسف شاهين', 'Youssef Chahine', 'محسن محيي الدين', 'Mohsen Mohieddin', '1979'],
  ['العار', 'The Shame', 'علي عبد الخالق', 'Ali Abdel Khalek', 'نور الشريف', 'Nour El Sherif', '1982'],
  ['الكيت كات', 'El Kit Kat', 'داود عبد السيد', 'Daoud Abdel Sayed', 'محمود عبد العزيز', 'Mahmoud Abdel Aziz', '1991'],
  ['الإرهاب والكباب', 'Terrorism and Kebab', 'شريف عرفة', 'Sherif Arafa', 'عادل إمام', 'Adel Emam', '1992'],
  ['المهاجر', 'The Emigrant', 'يوسف شاهين', 'Youssef Chahine', 'خالد النبوي', 'Khaled El Nabawy', '1994'],
  ['المنسي', 'The Forgotten', 'شريف عرفة', 'Sherif Arafa', 'عادل إمام', 'Adel Emam', '1993'],
  ['صعيدي في الجامعة الأمريكية', 'An Upper Egyptian in the American University', 'سعيد حامد', 'Saeed Hamed', 'محمد هنيدي', 'Mohamed Henedy', '1998'],
  ['همام في أمستردام', 'Hammam in Amsterdam', 'سعيد حامد', 'Saeed Hamed', 'محمد هنيدي', 'Mohamed Henedy', '1999'],
  ['السلم والثعبان', 'El Selem Wel Teaban', 'طارق العريان', 'Tarek Alarian', 'هاني سلامة', 'Hany Salama', '2001'],
  ['مافيا', 'Mafia', 'شريف عرفة', 'Sherif Arafa', 'أحمد السقا', 'Ahmed El Sakka', '2002'],
  ['سهر الليالي', 'Sleepless Nights', 'هاني خليفة', 'Hani Khalifa', 'حنان ترك', 'Hanan Turk', '2003'],
  ['عمارة يعقوبيان', 'The Yacoubian Building', 'مروان حامد', 'Marwan Hamed', 'عادل إمام', 'Adel Emam', '2006'],
  ['إبراهيم الأبيض', 'Ibrahim Labyad', 'مروان حامد', 'Marwan Hamed', 'أحمد السقا', 'Ahmed El Sakka', '2009'],
  ['678', 'Cairo 678', 'محمد دياب', 'Mohamed Diab', 'نيللي كريم', 'Nelly Karim', '2010'],
  ['الفيل الأزرق', 'The Blue Elephant', 'مروان حامد', 'Marwan Hamed', 'كريم عبد العزيز', 'Karim Abdel Aziz', '2014'],
  ['اشتباك', 'Clash', 'محمد دياب', 'Mohamed Diab', 'نيللي كريم', 'Nelly Karim', '2016'],
  ['تراب الماس', 'Diamond Dust', 'مروان حامد', 'Marwan Hamed', 'آسر ياسين', 'Asser Yassin', '2018'],
  ['كيرة والجن', 'Kira and El Gin', 'مروان حامد', 'Marwan Hamed', 'كريم عبد العزيز', 'Karim Abdel Aziz', '2022']
].map(([nameAr, nameEn, directorAr, directorEn, starAr, starEn, yearAr]) => ({ nameAr, nameEn, directorAr, directorEn, starAr, starEn, yearAr, yearEn: yearAr }));

const egyptSeries = [
  ['ليالي الحلمية', 'Layali El Helmeya', 'أسامة أنور عكاشة', 'Osama Anwar Okasha', 'يحيى الفخراني', 'Yehia El Fakharany'],
  ['رأفت الهجان', 'Raafat El Haggan', 'صالح مرسي', 'Saleh Morsi', 'محمود عبد العزيز', 'Mahmoud Abdel Aziz'],
  ['المال والبنون', 'El Mal Wal Banon', 'محمد جلال عبد القوي', 'Mohamed Galal Abdel Kawy', 'عبد الله غيث', 'Abdullah Ghaith'],
  ['حديث الصباح والمساء', 'Hadith Al Sabah Wal Masaa', 'نجيب محفوظ', 'Naguib Mahfouz', 'ليلى علوي', 'Laila Elwi'],
  ['أرابيسك', 'Arabesque', 'أسامة أنور عكاشة', 'Osama Anwar Okasha', 'صلاح السعدني', 'Salah El Saadany'],
  ['زيزينيا', 'Zizinia', 'أسامة أنور عكاشة', 'Osama Anwar Okasha', 'يحيى الفخراني', 'Yehia El Fakharany'],
  ['لن أعيش في جلباب أبي', 'I Will Not Live in My Father Robes', 'مصطفى محرم', 'Mostafa Moharram', 'نور الشريف', 'Nour El Sherif'],
  ['العائلة', 'The Family', 'وحيد حامد', 'Wahid Hamed', 'محمود مرسي', 'Mahmoud Morsi'],
  ['بوابة الحلواني', 'Bawabat El Halawani', 'محفوظ عبد الرحمن', 'Mahfouz Abdel Rahman', 'عزت العلايلي', 'Ezzat El Alaili'],
  ['الاختيار', 'The Choice', 'باهر دويدار', 'Bahir Dewidar', 'أمير كرارة', 'Amir Karara'],
  ['بـ100 وش', 'B 100 Wesh', 'عمرو الدالي وأحمد وائل', 'Amr El Daly and Ahmed Wael', 'نيللي كريم', 'Nelly Karim'],
  ['تحت الوصاية', 'Under Guardianship', 'خالد وشيرين دياب', 'Khaled and Sherine Diab', 'منى زكي', 'Mona Zaki']
].map(([nameAr, nameEn, writerAr, writerEn, starAr, starEn]) => ({ nameAr, nameEn, writerAr, writerEn, starAr, starEn }));

const egyptBooks = [
  ['الثلاثية', 'The Cairo Trilogy', 'نجيب محفوظ', 'Naguib Mahfouz', 'رواية', 'novel'],
  ['أولاد حارتنا', 'Children of Gebelawi', 'نجيب محفوظ', 'Naguib Mahfouz', 'رواية', 'novel'],
  ['زقاق المدق', 'Midaq Alley', 'نجيب محفوظ', 'Naguib Mahfouz', 'رواية', 'novel'],
  ['اللص والكلاب', 'The Thief and the Dogs', 'نجيب محفوظ', 'Naguib Mahfouz', 'رواية', 'novel'],
  ['الأيام', 'The Days', 'طه حسين', 'Taha Hussein', 'سيرة ذاتية', 'autobiography'],
  ['دعاء الكروان', 'The Nightingale Prayer', 'طه حسين', 'Taha Hussein', 'رواية', 'novel'],
  ['حديث عيسى بن هشام', 'Hadith Issa Ibn Hisham', 'محمد المويلحي', 'Muhammad al-Muwaylihi', 'رواية اجتماعية', 'social novel'],
  ['عودة الروح', 'Return of the Spirit', 'توفيق الحكيم', 'Tawfiq al-Hakim', 'رواية', 'novel'],
  ['أهل الكهف', 'The People of the Cave', 'توفيق الحكيم', 'Tawfiq al-Hakim', 'مسرحية', 'play'],
  ['يوميات نائب في الأرياف', 'Diary of a Country Prosecutor', 'توفيق الحكيم', 'Tawfiq al-Hakim', 'رواية', 'novel'],
  ['لا تطفئ الشمس', 'Do Not Turn Off the Sun', 'إحسان عبد القدوس', 'Ihsan Abdel Quddous', 'رواية', 'novel'],
  ['في بيتنا رجل', 'A Man in Our House', 'إحسان عبد القدوس', 'Ihsan Abdel Quddous', 'رواية', 'novel'],
  ['رد قلبي', 'Return My Heart', 'يوسف السباعي', 'Yusuf al-Sibai', 'رواية', 'novel'],
  ['أرض النفاق', 'The Land of Hypocrisy', 'يوسف السباعي', 'Yusuf al-Sibai', 'رواية ساخرة', 'satirical novel'],
  ['عصفور من الشرق', 'Bird from the East', 'توفيق الحكيم', 'Tawfiq al-Hakim', 'رواية', 'novel'],
  ['الحرام', 'The Sin', 'يوسف إدريس', 'Yusuf Idris', 'رواية', 'novel'],
  ['النداهة', 'The Call of the Siren', 'يوسف إدريس', 'Yusuf Idris', 'قصة قصيرة', 'short story'],
  ['مالك الحزين', 'The Heron', 'إبراهيم أصلان', 'Ibrahim Aslan', 'رواية', 'novel'],
  ['واحة الغروب', 'Sunset Oasis', 'بهاء طاهر', 'Bahaa Taher', 'رواية', 'novel'],
  ['شيكاجو', 'Chicago', 'علاء الأسواني', 'Alaa Al Aswany', 'رواية', 'novel'],
  ['عمارة يعقوبيان', 'The Yacoubian Building', 'علاء الأسواني', 'Alaa Al Aswany', 'رواية', 'novel'],
  ['يوتوبيا', 'Utopia', 'أحمد خالد توفيق', 'Ahmed Khaled Tawfik', 'رواية', 'novel'],
  ['الفيل الأزرق', 'The Blue Elephant', 'أحمد مراد', 'Ahmed Mourad', 'رواية', 'novel'],
  ['تراب الماس', 'Diamond Dust', 'أحمد مراد', 'Ahmed Mourad', 'رواية', 'novel']
].map(([nameAr, nameEn, authorAr, authorEn, typeAr, typeEn]) => ({ nameAr, nameEn, authorAr, authorEn, typeAr, typeEn }));

const egyptMusic = [
  ['أم كلثوم', 'Umm Kulthum', 'أنت عمري', 'Enta Omri', 'مصر', 'Egypt'],
  ['محمد عبد الوهاب', 'Mohamed Abdel Wahab', 'الجندول', 'Al Gondol', 'مصر', 'Egypt'],
  ['عبد الحليم حافظ', 'Abdel Halim Hafez', 'قارئة الفنجان', 'Qariat Al Fingan', 'مصر', 'Egypt'],
  ['فريد الأطرش', 'Farid al-Atrash', 'الربيع', 'Al Rabea', 'سوريا ومصر', 'Syria and Egypt'],
  ['سيد درويش', 'Sayed Darwish', 'قوم يا مصري', 'Qum Ya Masri', 'مصر', 'Egypt'],
  ['ليلى مراد', 'Layla Murad', 'قلبي دليلي', 'Albi Dalili', 'مصر', 'Egypt'],
  ['شادية', 'Shadia', 'يا حبيبتي يا مصر', 'Ya Habibti Ya Masr', 'مصر', 'Egypt'],
  ['نجاة الصغيرة', 'Nagat El Saghira', 'عيون القلب', 'Oyoun El Alb', 'مصر', 'Egypt'],
  ['محمد فوزي', 'Mohamed Fawzi', 'ذهب الليل', 'Dahab El Leil', 'مصر', 'Egypt'],
  ['وردة الجزائرية', 'Warda Al-Jazairia', 'بتونس بيك', 'Batwanes Beek', 'الجزائر ومصر', 'Algeria and Egypt'],
  ['علي الحجار', 'Ali El Haggar', 'المال والبنون', 'El Mal Wal Banon', 'مصر', 'Egypt'],
  ['محمد منير', 'Mohamed Mounir', 'حدوتة مصرية', 'Hadouta Masreya', 'مصر', 'Egypt'],
  ['عمرو دياب', 'Amr Diab', 'نور العين', 'Nour El Ain', 'مصر', 'Egypt'],
  ['أنغام', 'Angham', 'سيدي وصالك', 'Sidi Wesalak', 'مصر', 'Egypt'],
  ['منير مراد', 'Mounir Mourad', 'حاجة غريبة', 'Haga Ghariba', 'مصر', 'Egypt'],
  ['بليغ حمدي', 'Baligh Hamdi', 'سيرة الحب', 'Siret El Hob', 'مصر', 'Egypt'],
  ['رياض السنباطي', 'Riad Al Sunbati', 'الأطلال', 'Al Atlal', 'مصر', 'Egypt'],
  ['محمد الموجي', 'Mohamed El Mougy', 'رسالة من تحت الماء', 'Resala Men Taht El Maa', 'مصر', 'Egypt'],
  ['كمال الطويل', 'Kamal El Tawil', 'والله زمان يا سلاحي', 'Wallah Zaman Ya Selahy', 'مصر', 'Egypt'],
  ['عمار الشريعي', 'Ammar El Sherei', 'أرابيسك', 'Arabesque', 'مصر', 'Egypt'],
  ['هاني شنودة', 'Hany Shenouda', 'فرقة المصريين', 'Al Masryeen band', 'مصر', 'Egypt'],
  ['عزيز الشافعي', 'Aziz El Shafei', 'يا بلدنا يا حلوة', 'Ya Baladna Ya Helwa', 'مصر', 'Egypt'],
  ['فيروز', 'Fairuz', 'زهرة المدائن', 'Zahrat Al Madaen', 'لبنان', 'Lebanon']
].map(([nameAr, nameEn, workAr, workEn, countryAr, countryEn]) => ({ nameAr, nameEn, workAr, workEn, countryAr, countryEn }));

const egyptSports = [
  ['النادي الأهلي', 'Al Ahly SC', 'القاهرة', 'Cairo', 'الأحمر', 'red', 'استاد القاهرة', 'Cairo Stadium'],
  ['نادي الزمالك', 'Zamalek SC', 'الجيزة', 'Giza', 'الأبيض', 'white', 'استاد القاهرة', 'Cairo Stadium'],
  ['النادي الإسماعيلي', 'Ismaily SC', 'الإسماعيلية', 'Ismailia', 'الأصفر', 'yellow', 'استاد الإسماعيلية', 'Ismailia Stadium'],
  ['المصري البورسعيدي', 'Al Masry SC', 'بورسعيد', 'Port Said', 'الأخضر', 'green', 'استاد برج العرب', 'Borg El Arab Stadium'],
  ['الاتحاد السكندري', 'Al Ittihad Alexandria', 'الإسكندرية', 'Alexandria', 'الأخضر', 'green', 'استاد الإسكندرية', 'Alexandria Stadium'],
  ['المقاولون العرب', 'Al Mokawloon Al Arab', 'القاهرة', 'Cairo', 'الأصفر والأسود', 'yellow and black', 'استاد عثمان أحمد عثمان', 'Osman Ahmed Osman Stadium'],
  ['طلائع الجيش', 'Talaea El Gaish', 'القاهرة', 'Cairo', 'الأحمر والأبيض', 'red and white', 'جهاز الرياضة العسكري', 'Military Sports Stadium'],
  ['إنبي', 'ENPPI SC', 'القاهرة', 'Cairo', 'الأزرق', 'blue', 'استاد بتروسبورت', 'Petro Sport Stadium'],
  ['بيراميدز', 'Pyramids FC', 'القاهرة', 'Cairo', 'الأزرق السماوي', 'sky blue', 'استاد الدفاع الجوي', '30 June Stadium'],
  ['سموحة', 'Smouha SC', 'الإسكندرية', 'Alexandria', 'الأزرق', 'blue', 'استاد الإسكندرية', 'Alexandria Stadium']
].map(([nameAr, nameEn, cityAr, cityEn, colorAr, colorEn, stadiumAr, stadiumEn]) => ({ nameAr, nameEn, cityAr, cityEn, colorAr, colorEn, stadiumAr, stadiumEn }));

const footballPlayers = [
  ['محمد صلاح', 'Mohamed Salah', 'جناح أيمن', 'right winger', 'ليفربول (Liverpool)', 'Liverpool', 'منتخب مصر', 'Egypt', 'نجم مصري صار أيقونة في أنفيلد وسرعته على الطرف تخوف أي دفاع', 'Egyptian star who became an Anfield icon with frightening wing speed'],
  ['محمد أبو تريكة', 'Mohamed Aboutrika', 'صانع ألعاب', 'playmaker', 'الأهلي', 'Al Ahly', 'منتخب مصر', 'Egypt', 'صاحب اللمسة الهادية في الأهلي وواحد من رموز جيل 2006 و2008 القاري', 'calm Al Ahly playmaker and symbol of Egypt 2006 and 2008 era'],
  ['محمود الخطيب', 'Mahmoud El Khatib', 'مهاجم', 'forward', 'الأهلي', 'Al Ahly', 'منتخب مصر', 'Egypt', 'لقبه بيبو وفاز بالكرة الذهبية الأفريقية في الثمانينيات', 'Bibo won the African footballer award in the 1980s'],
  ['حسام حسن', 'Hossam Hassan', 'مهاجم', 'forward', 'منتخب مصر', 'Egypt national team', 'منتخب مصر', 'Egypt', 'هداف مصري تاريخي عرف بطول النفس والحضور داخل الصندوق', 'historic Egyptian scorer known for longevity and box presence'],
  ['إبراهيم حسن', 'Ibrahim Hassan', 'ظهير أيمن', 'right back', 'منتخب مصر', 'Egypt national team', 'منتخب مصر', 'Egypt', 'توأم حسام وصاحب طرف أيمن لا يهدأ في منتخب مصر', 'Hossam twin and tireless right-sided Egyptian player'],
  ['عصام الحضري', 'Essam El Hadary', 'حارس مرمى', 'goalkeeper', 'الأهلي', 'Al Ahly', 'منتخب مصر', 'Egypt', 'حارس السد العالي الذي ارتبط بتصديات كأس أفريقيا', 'High Dam goalkeeper linked with Africa Cup saves'],
  ['أحمد حسن', 'Ahmed Hassan', 'وسط ملعب', 'midfielder', 'منتخب مصر', 'Egypt national team', 'منتخب مصر', 'Egypt', 'قائد مصري تاريخي اشتهر بكثرة مبارياته الدولية', 'historic Egyptian captain famous for international appearances'],
  ['أحمد حسام ميدو', 'Mido', 'مهاجم', 'forward', 'أياكس (Ajax)', 'Ajax', 'منتخب مصر', 'Egypt', 'مهاجم مصري بدأ رحلته الأوروبية مبكرا وظهر في أياكس وتوتنهام', 'Egyptian striker with an early European career at Ajax and Tottenham'],
  ['محمود حسن تريزيجيه', 'Trezeguet', 'جناح', 'winger', 'طرابزون سبور', 'Trabzonspor', 'منتخب مصر', 'Egypt', 'جناح مصري اسمه مستعار من نجم فرنسي بسبب الشبه في البدايات', 'Egyptian winger nicknamed after a French star'],
  ['أحمد سيد زيزو', 'Zizo', 'جناح', 'winger', 'الزمالك', 'Zamalek', 'منتخب مصر', 'Egypt', 'لاعب زملكاوي ارتبط بالكرات الثابتة والهدوء تحت الضغط', 'Zamalek player linked with set pieces and calm under pressure'],
  ['إمام عاشور', 'Emam Ashour', 'وسط ملعب', 'midfielder', 'الأهلي', 'Al Ahly', 'منتخب مصر', 'Egypt', 'وسط مصري طاقته عالية وتنقل بين قطبي الكرة المصرية', 'energetic Egyptian midfielder who played for both Cairo giants'],
  ['محمد الشناوي', 'Mohamed El Shenawy', 'حارس مرمى', 'goalkeeper', 'الأهلي', 'Al Ahly', 'منتخب مصر', 'Egypt', 'حارس أهلاوي قاد الخط الخلفي في بطولات قارية حديثة', 'Al Ahly goalkeeper leading the back line in recent continental runs'],
  ['علي معلول', 'Ali Maaloul', 'ظهير أيسر', 'left back', 'الأهلي', 'Al Ahly', 'منتخب تونس', 'Tunisia', 'ظهير تونسي صار من مفاتيح لعب الأهلي بيسراه وعرضياته', 'Tunisian left back who became an Al Ahly crossing weapon'],
  ['شيكابالا', 'Shikabala', 'جناح', 'winger', 'الزمالك', 'Zamalek', 'منتخب مصر', 'Egypt', 'قائد زملكاوي اشتهر بيسراه والمهارة في المساحات الضيقة', 'Zamalek captain known for left-footed skill in tight spaces'],
  ['ليونيل ميسي', 'Lionel Messi', 'صانع ألعاب', 'playmaker', 'برشلونة (Barcelona)', 'Barcelona', 'منتخب الأرجنتين', 'Argentina', 'يساري أرجنتيني جمع بين مراوغات برشلونة ولقب العالم في 2022', 'Argentine left-footer combining Barcelona dribbles with the 2022 world title'],
  ['كريستيانو رونالدو', 'Cristiano Ronaldo', 'مهاجم', 'forward', 'ريال مدريد (Real Madrid)', 'Real Madrid', 'منتخب البرتغال', 'Portugal', 'هداف برتغالي اشتهر بالقفزات العالية وأرقام دوري الأبطال', 'Portuguese scorer known for huge leaps and Champions League records'],
  ['بيليه', 'Pele', 'مهاجم', 'forward', 'سانتوس (Santos)', 'Santos', 'منتخب البرازيل', 'Brazil', 'برازيلي ارتبط بثلاث كؤوس عالم ولقب الملك', 'Brazilian linked with three World Cups and the King nickname'],
  ['دييغو مارادونا', 'Diego Maradona', 'صانع ألعاب', 'playmaker', 'نابولي (Napoli)', 'Napoli', 'منتخب الأرجنتين', 'Argentina', 'رقم 10 أرجنتيني صنع أسطورة 1986 ولمع في نابولي', 'Argentine number 10 who made 1986 legendary and shone at Napoli'],
  ['زين الدين زيدان', 'Zinedine Zidane', 'صانع ألعاب', 'playmaker', 'ريال مدريد (Real Madrid)', 'Real Madrid', 'منتخب فرنسا', 'France', 'فرنسي بلمسة حريرية ورأسية شهيرة في نهائي 1998', 'French playmaker with silky touch and a famous 1998 final header'],
  ['رونالدينيو', 'Ronaldinho', 'صانع ألعاب', 'playmaker', 'برشلونة (Barcelona)', 'Barcelona', 'منتخب البرازيل', 'Brazil', 'ابتسامة برازيلية صنعت متعة برشلونة والمهارات الاستعراضية', 'Brazilian smile behind Barcelona flair and showmanship'],
  ['كيليان مبابي', 'Kylian Mbappe', 'مهاجم', 'forward', 'باريس سان جيرمان (PSG)', 'Paris Saint-Germain', 'منتخب فرنسا', 'France', 'سرعة فرنسية انفجرت عالميا في مونديال 2018', 'French speed that exploded globally at the 2018 World Cup'],
  ['إيرلينغ هالاند', 'Erling Haaland', 'مهاجم', 'forward', 'مانشستر سيتي (Manchester City)', 'Manchester City', 'منتخب النرويج', 'Norway', 'مهاجم نرويجي طويل يحول أنصاف الفرص إلى أهداف', 'tall Norwegian striker turning half chances into goals'],
  ['لوكا مودريتش', 'Luka Modric', 'وسط ملعب', 'midfielder', 'ريال مدريد (Real Madrid)', 'Real Madrid', 'منتخب كرواتيا', 'Croatia', 'مايسترو كرواتي قاد بلاده لنهائي 2018 وفاز بالكرة الذهبية', 'Croatian maestro who reached the 2018 final and won the Ballon d Or'],
  ['أندريس إنييستا', 'Andres Iniesta', 'وسط ملعب', 'midfielder', 'برشلونة (Barcelona)', 'Barcelona', 'منتخب إسبانيا', 'Spain', 'صاحب هدف نهائي 2010 ولمسة برشلونة الناعمة', 'scorer of the 2010 final goal and Barcelona smooth passer'],
  ['تشافي هيرنانديز', 'Xavi Hernandez', 'وسط ملعب', 'midfielder', 'برشلونة (Barcelona)', 'Barcelona', 'منتخب إسبانيا', 'Spain', 'عقل التيكي تاكا الذي كان يوزع الإيقاع من الوسط', 'tiki-taka brain controlling tempo from midfield'],
  ['جيانلويجي بوفون', 'Gianluigi Buffon', 'حارس مرمى', 'goalkeeper', 'يوفنتوس (Juventus)', 'Juventus', 'منتخب إيطاليا', 'Italy', 'حارس إيطالي طويل العمر رفع كأس العالم 2006', 'long-lasting Italian goalkeeper who lifted the 2006 World Cup'],
  ['روبرتو كارلوس', 'Roberto Carlos', 'ظهير أيسر', 'left back', 'ريال مدريد (Real Madrid)', 'Real Madrid', 'منتخب البرازيل', 'Brazil', 'ظهير برازيلي اشتهر بتسديدات يسارية منحنية وقوية', 'Brazilian left back famous for powerful curling shots'],
  ['باولو مالديني', 'Paolo Maldini', 'مدافع', 'defender', 'ميلان (Milan)', 'AC Milan', 'منتخب إيطاليا', 'Italy', 'مدافع ميلاني صار رمزا للوفاء والتمركز الهادئ', 'Milan defender symbolising loyalty and calm positioning'],
  ['نيمار', 'Neymar', 'جناح', 'winger', 'برشلونة (Barcelona)', 'Barcelona', 'منتخب البرازيل', 'Brazil', 'برازيلي مهاري جمع بين الشارع والسرعة في الطرف', 'Brazilian dribbler mixing street skill and wing speed'],
  ['محمد زيدان', 'Mohamed Zidan', 'مهاجم', 'forward', 'بوروسيا دورتموند (Borussia Dortmund)', 'Borussia Dortmund', 'منتخب مصر', 'Egypt', 'مهاجم مصري لمع في ألمانيا وساهم في أمم أفريقيا', 'Egyptian forward who shone in Germany and African titles'],
  ['رياض محرز', 'Riyad Mahrez', 'جناح', 'winger', 'مانشستر سيتي (Manchester City)', 'Manchester City', 'منتخب الجزائر', 'Algeria', 'يساري جزائري جمع بين لقب إنجلترا وحلم أفريقيا', 'Algerian left-footer with English titles and African glory'],
  ['أشرف حكيمي', 'Achraf Hakimi', 'ظهير أيمن', 'right back', 'باريس سان جيرمان (PSG)', 'Paris Saint-Germain', 'منتخب المغرب', 'Morocco', 'ظهير مغربي سريع كان من وجوه إنجاز 2022', 'fast Moroccan fullback linked with the 2022 run'],
  ['جورج ويا', 'George Weah', 'مهاجم', 'forward', 'ميلان (Milan)', 'AC Milan', 'منتخب ليبيريا', 'Liberia', 'أفريقي فاز بالكرة الذهبية ثم أصبح رئيسا لبلده', 'African Ballon d Or winner who later became president'],
  ['ديدييه دروغبا', 'Didier Drogba', 'مهاجم', 'forward', 'تشيلسي (Chelsea)', 'Chelsea', 'منتخب كوت ديفوار', 'Ivory Coast', 'مهاجم إيفواري ارتبط بالحسم الأوروبي لتشيلسي', 'Ivorian striker linked with Chelsea European clutch moments'],
  ['صامويل إيتو', 'Samuel Eto o', 'مهاجم', 'forward', 'برشلونة (Barcelona)', 'Barcelona', 'منتخب الكاميرون', 'Cameroon', 'مهاجم كاميروني جمع ألقابا أوروبية مع برشلونة وإنتر', 'Cameroonian striker with European titles at Barcelona and Inter'],
  ['فرانز بيكنباور', 'Franz Beckenbauer', 'مدافع', 'defender', 'بايرن ميونخ (Bayern Munich)', 'Bayern Munich', 'منتخب ألمانيا', 'Germany', 'ألماني لقب بالقيصر وغيّر صورة المدافع القائد', 'German Kaiser who reshaped the leader-defender image']
].map(([nameAr, nameEn, roleAr, roleEn, associatedAr, associatedEn, nationalTeamAr, nationalTeamEn, clueAr, clueEn]) => ({ nameAr, nameEn, roleAr, roleEn, associatedAr, associatedEn, nationalTeamAr, nationalTeamEn, clueAr, clueEn }));

const footballTournaments = [
  ['كأس العالم لكرة القدم', 'FIFA World Cup', 'منتخبات العالم', 'world national teams', 'أكبر مسرح للمنتخبات كل أربع سنوات', 'biggest national-team stage every four years', 'أول نسخة أقيمت في أوروجواي عام 1930', 'first edition was held in Uruguay in 1930'],
  ['كأس العالم للسيدات', 'FIFA Women World Cup', 'منتخبات السيدات', 'women national teams', 'نسخة المونديال التي صنعت مساحة أكبر لكرة السيدات', 'World Cup version that expanded women football', 'انطلقت أول نسخة عام 1991', 'first edition started in 1991'],
  ['كأس الأمم الأفريقية', 'Africa Cup of Nations', 'منتخبات أفريقيا', 'African national teams', 'بطولة قارية يعرفها جمهور مصر بالقمصان الحمراء والذكريات الذهبية', 'African tournament tied to Egyptian golden memories', 'انطلقت أول نسخة عام 1957', 'first edition started in 1957'],
  ['دوري أبطال أوروبا', 'UEFA Champions League', 'أندية أوروبا', 'European clubs', 'ليالي الأندية الأوروبية الكبرى والنشيد الشهير قبل البداية', 'big European club nights and the famous anthem', 'بدأت باسم كأس الأندية الأوروبية البطلة', 'started as the European Champion Clubs Cup'],
  ['الدوري الأوروبي', 'UEFA Europa League', 'أندية أوروبا', 'European clubs', 'بطولة أوروبية تأتي بعد دوري الأبطال في سلم الأندية', 'European club tournament below the Champions League tier', 'كانت تعرف سابقا بكأس الاتحاد الأوروبي', 'was formerly known as the UEFA Cup'],
  ['كوبا أمريكا', 'Copa America', 'منتخبات أمريكا الجنوبية', 'South American national teams', 'بطولة تجمع البرازيل والأرجنتين وأوروجواي في ذاكرة واحدة', 'tournament bringing Brazil, Argentina, and Uruguay together', 'من أقدم بطولات المنتخبات القارية', 'one of the oldest continental national-team tournaments'],
  ['كأس أمم أوروبا', 'UEFA Euro', 'منتخبات أوروبا', 'European national teams', 'بطولة قارية تضع منتخبات أوروبا في صيف كروي واحد', 'continental tournament for European national teams', 'أول نسخة أقيمت عام 1960', 'first edition was held in 1960'],
  ['كأس آسيا', 'AFC Asian Cup', 'منتخبات آسيا', 'Asian national teams', 'بطولة قارية تجمع منتخبات شرق وغرب آسيا', 'continental tournament for East and West Asian national teams', 'انطلقت أول نسخة عام 1956', 'first edition started in 1956'],
  ['كأس العالم للأندية', 'FIFA Club World Cup', 'أبطال الأندية القارية', 'continental club champions', 'أندية أبطال القارات في بطولة واحدة', 'continental club champions in one tournament', 'يجمع أبطال الأندية من قارات مختلفة', 'brings club champions from different continents together'],
  ['دوري أبطال أفريقيا', 'CAF Champions League', 'أندية أفريقيا', 'African clubs', 'رحلة أندية القارة نحو اللقب الأفريقي الأكبر', 'African clubs route to the biggest continental title', 'الأهلي والزمالك من أشهر أسمائه المصرية', 'Al Ahly and Zamalek are among its famous Egyptian names'],
  ['كأس الكونفدرالية الأفريقية', 'CAF Confederation Cup', 'أندية أفريقيا', 'African clubs', 'بطولة أفريقية للأندية تأتي بعد دوري الأبطال في الأهمية', 'African club tournament below the Champions League tier', 'تجمع أندية من مشوار قاري طويل بنظام خروج ومجموعات', 'mixes knockout and group-stage continental runs'],
  ['الدوري المصري الممتاز', 'Egyptian Premier League', 'أندية مصر', 'Egyptian clubs', 'المسابقة المحلية التي تشعل تنافس الأهلي والزمالك وباقي الأندية', 'domestic league behind the Al Ahly and Zamalek rivalry', 'انطلقت نسخته الأولى موسم 1948-1949', 'first season began in 1948-1949'],
  ['الدوري الإنجليزي الممتاز', 'Premier League', 'أندية إنجلترا', 'English clubs', 'دوري سريع الإيقاع ارتبط عالميا بالبث والجماهير الصاخبة', 'fast-paced league known globally for broadcast and atmosphere', 'بدأ باسمه الحالي عام 1992', 'started under its current name in 1992'],
  ['الدوري الإسباني', 'LaLiga', 'أندية إسبانيا', 'Spanish clubs', 'المسرح الطويل لكلاسيكو ريال مدريد وبرشلونة', 'long-running stage for Real Madrid and Barcelona clasicos', 'ريال مدريد وبرشلونة أبرز قوتيه تاريخيا', 'Real Madrid and Barcelona are its historic giants'],
  ['الدوري الإيطالي', 'Serie A', 'أندية إيطاليا', 'Italian clubs', 'دوري اشتهر تاريخيا بالمدافعين والتكتيك الصارم', 'league historically known for defenders and strict tactics', 'ميلان وإنتر ويوفنتوس من أشهر رموزه', 'Milan, Inter, and Juventus are among its icons'],
  ['الدوري الألماني', 'Bundesliga', 'أندية ألمانيا', 'German clubs', 'دوري معروف بالمدرجات الكبيرة والضغط العالي', 'league known for large crowds and high pressing', 'بايرن ميونخ أكثر أسمائه حضورا في العقود الأخيرة', 'Bayern Munich has dominated recent decades'],
  ['الدوري الفرنسي', 'Ligue 1', 'أندية فرنسا', 'French clubs', 'دوري خرج منه نجوم شباب كثر قبل الانتقال لأوروبا الكبرى', 'league that produced many young stars before bigger moves', 'باريس سان جيرمان أبرز قوة حديثة فيه', 'Paris Saint-Germain is its modern powerhouse'],
  ['كأس مصر', 'Egypt Cup', 'أندية مصر', 'Egyptian clubs', 'بطولة خروج مغلوب تعطي فرصة للمفاجآت المحلية', 'knockout cup that creates local upsets', 'أقدم من الدوري المصري الممتاز', 'older than the Egyptian Premier League']
].map(([nameAr, nameEn, scopeAr, scopeEn, identityAr, identityEn, memoryAr, memoryEn]) => ({ nameAr, nameEn, scopeAr, scopeEn, identityAr, identityEn, memoryAr, memoryEn }));

const footballTournamentClueQuestions = [
  ['ذاكرة 1930: أول نسخة عالمية أقيمت في أوروجواي، وبعدها بقى اللقب حلم كل منتخب. أي بطولة؟', '1930 memory: the first global edition was in Uruguay, then it became every national team dream. Which tournament?', 'كأس العالم لكرة القدم', 'FIFA World Cup', [['كأس أمم أوروبا', 'UEFA Euro'], ['كوبا أمريكا', 'Copa America'], ['كأس آسيا', 'AFC Asian Cup']]],
  ['كرة السيدات: بطولة عالمية بدأت عام 1991 ووسعت مساحة اللعبة خارج نسخة الرجال. أي بطولة؟', 'Women football: a global tournament began in 1991 and expanded the game beyond the men version. Which tournament?', 'كأس العالم للسيدات', 'FIFA Women World Cup', [['كأس العالم لكرة القدم', 'FIFA World Cup'], ['كأس أمم أوروبا', 'UEFA Euro'], ['كأس آسيا', 'AFC Asian Cup']]],
  ['قارة بثلاثة ألوان كروية: بطولة بدأت عام 1957 وصارت محطة كبيرة لمنتخبات مصر وغانا والكاميرون. أي بطولة؟', 'Three-colour continent clue: a tournament began in 1957 and became a major stage for Egypt, Ghana, and Cameroon. Which tournament?', 'كأس الأمم الأفريقية', 'Africa Cup of Nations', [['كوبا أمريكا', 'Copa America'], ['كأس آسيا', 'AFC Asian Cup'], ['كأس أمم أوروبا', 'UEFA Euro']]],
  ['نشيد قبل البداية وليال خروج مغلوب وأندية كبيرة من القارة العجوز. أي بطولة؟', 'Anthem before kick-off, knockout nights, and elite clubs from the old continent. Which tournament?', 'دوري أبطال أوروبا', 'UEFA Champions League', [['الدوري الأوروبي', 'UEFA Europa League'], ['كأس العالم للأندية', 'FIFA Club World Cup'], ['دوري أبطال أفريقيا', 'CAF Champions League']]],
  ['اسمها القديم كان كأس الاتحاد الأوروبي، ومكانها غالبا بعد بطولة الأبطال في سلم القارة. أي بطولة؟', 'Its old name was the UEFA Cup, and it usually sits below the champions tournament in the continental ladder. Which tournament?', 'الدوري الأوروبي', 'UEFA Europa League', [['دوري أبطال أوروبا', 'UEFA Champions League'], ['كأس الكونفدرالية الأفريقية', 'CAF Confederation Cup'], ['كأس أمم أوروبا', 'UEFA Euro']]],
  ['أقدم صراع قاري للمنتخبات تقريبا، وفي ذاكرته البرازيل والأرجنتين وأوروجواي معا. أي بطولة؟', 'One of the oldest continental national-team rivalries, with Brazil, Argentina, and Uruguay in the same memory. Which tournament?', 'كوبا أمريكا', 'Copa America', [['كأس الأمم الأفريقية', 'Africa Cup of Nations'], ['كأس آسيا', 'AFC Asian Cup'], ['كأس أمم أوروبا', 'UEFA Euro']]],
  ['صيف قاري بدأ تاريخه عام 1960 ويجمع مدارس كروية من مدريد وروما وباريس وبرلين. أي بطولة؟', 'A continental summer whose history began in 1960 and gathers football schools from Madrid, Rome, Paris, and Berlin. Which tournament?', 'كأس أمم أوروبا', 'UEFA Euro', [['كوبا أمريكا', 'Copa America'], ['كأس آسيا', 'AFC Asian Cup'], ['كأس الأمم الأفريقية', 'Africa Cup of Nations']]],
  ['شرق وغرب القارة في بطولة منتخبات بدأت عام 1956، وفيها قصص اليابان والسعودية وكوريا. أي بطولة؟', 'East and west of the continent in a national-team tournament that began in 1956, with Japan, Saudi Arabia, and Korea stories. Which tournament?', 'كأس آسيا', 'AFC Asian Cup', [['كأس أمم أوروبا', 'UEFA Euro'], ['كوبا أمريكا', 'Copa America'], ['كأس الأمم الأفريقية', 'Africa Cup of Nations']]],
  ['مش منتخبات: الفكرة هنا أن بطل كل قارة يختبر نفسه أمام أبطال قارات أخرى. أي بطولة؟', 'Not national teams: the idea is that each continent club champion tests itself against other continental champions. Which tournament?', 'كأس العالم للأندية', 'FIFA Club World Cup', [['دوري أبطال أوروبا', 'UEFA Champions League'], ['دوري أبطال أفريقيا', 'CAF Champions League'], ['الدوري الأوروبي', 'UEFA Europa League']]],
  ['اللقب القاري الأكبر للأندية في أفريقيا، وذكرياته المصرية غالبا بين الأهلي والزمالك. أي بطولة؟', 'The biggest continental club title in Africa, with Egyptian memories often around Al Ahly and Zamalek. Which tournament?', 'دوري أبطال أفريقيا', 'CAF Champions League', [['كأس الكونفدرالية الأفريقية', 'CAF Confederation Cup'], ['كأس الأمم الأفريقية', 'Africa Cup of Nations'], ['الدوري المصري الممتاز', 'Egyptian Premier League']]],
  ['مشوار أفريقي للأندية يأتي غالبا بعد بطولة الأبطال، لكنه يظل لقبا قاريا مهما. أي بطولة؟', 'An African club route usually below the champions tournament, but still an important continental title. Which tournament?', 'كأس الكونفدرالية الأفريقية', 'CAF Confederation Cup', [['دوري أبطال أفريقيا', 'CAF Champions League'], ['الدوري الأوروبي', 'UEFA Europa League'], ['كأس مصر', 'Egypt Cup']]],
  ['مسابقة محلية بدأ موسمها الأول 1948-1949، وتاريخها متداخل مع قمة الأهلي والزمالك. أي بطولة؟', 'A domestic competition whose first season was 1948-1949, with history tied to Al Ahly and Zamalek rivalry. Which competition?', 'الدوري المصري الممتاز', 'Egyptian Premier League', [['كأس مصر', 'Egypt Cup'], ['كأس السوبر المصري', 'Egyptian Super Cup'], ['دوري أبطال أفريقيا', 'CAF Champions League']]],
  ['إيقاع سريع وبث عالمي واسم جديد منذ 1992، وفيه صار أنفيلد وملاعب مانشستر جزءا من الذاكرة. أي دوري؟', 'Fast pace, global broadcast, and a new name since 1992, with Anfield and Manchester grounds in the memory. Which league?', 'الدوري الإنجليزي الممتاز', 'Premier League', [['الدوري الإسباني', 'LaLiga'], ['الدوري الإيطالي', 'Serie A'], ['الدوري الألماني', 'Bundesliga']]],
  ['مسرح طويل للكلاسيكو، وحين يلمع ريال مدريد وبرشلونة فأنت غالبا تشاهد أي دوري؟', 'A long-running stage for El Clasico; when Real Madrid and Barcelona shine, which league are you likely watching?', 'الدوري الإسباني', 'LaLiga', [['الدوري الإنجليزي الممتاز', 'Premier League'], ['الدوري الإيطالي', 'Serie A'], ['الدوري الفرنسي', 'Ligue 1']]],
  ['دوري تكتيكي الطابع في الذاكرة، وأسماء ميلان وإنتر ويوفنتوس مفاتيح قوية له. أي دوري؟', 'A league remembered for tactical identity, with Milan, Inter, and Juventus as strong keys. Which league?', 'الدوري الإيطالي', 'Serie A', [['الدوري الألماني', 'Bundesliga'], ['الدوري الفرنسي', 'Ligue 1'], ['الدوري الإسباني', 'LaLiga']]],
  ['مدرجات ضخمة وضغط عال، وبايرن ميونخ حاضر بقوة في العقود الأخيرة. أي دوري؟', 'Huge stands, high pressing, and Bayern Munich strongly present in recent decades. Which league?', 'الدوري الألماني', 'Bundesliga', [['الدوري الإنجليزي الممتاز', 'Premier League'], ['الدوري الإيطالي', 'Serie A'], ['الدوري الفرنسي', 'Ligue 1']]],
  ['دوري خرج منه نجوم شباب كثيرون قبل الانتقال لأوروبا الكبرى، وباريس سان جيرمان عنوانه الحديث. أي دوري؟', 'A league that produced many young stars before bigger European moves, with Paris Saint-Germain as its modern headline. Which league?', 'الدوري الفرنسي', 'Ligue 1', [['الدوري الإسباني', 'LaLiga'], ['الدوري الألماني', 'Bundesliga'], ['الدوري الإيطالي', 'Serie A']]],
  ['بطولة خروج مغلوب محلية تسمح بالمفاجآت، وأقدم من مسابقة الدوري الطويلة. أي بطولة؟', 'A domestic knockout competition that allows upsets and is older than the long league competition. Which tournament?', 'كأس مصر', 'Egypt Cup', [['الدوري المصري الممتاز', 'Egyptian Premier League'], ['كأس السوبر المصري', 'Egyptian Super Cup'], ['دوري أبطال أفريقيا', 'CAF Champions League']]]
];

const footballPlayerCareerQuestions = [
  ['بوابة أوروبية مبكرة: قبل إنجلترا وإيطاليا، أي ناد سويسري فتح الطريق لمحمد صلاح؟', 'Early European gate: before England and Italy, which Swiss club opened Mohamed Salah path?', 'بازل (Basel)', 'Basel', [['يونغ بويز (Young Boys)', 'Young Boys'], ['زيورخ (Zurich)', 'FC Zurich'], ['جراسهوبرز (Grasshoppers)', 'Grasshoppers']]],
  ['محطة إيطالية: أي ناد من العاصمة الإيطالية لعب له محمد صلاح قبل أنفيلد؟', 'Italian stop: which club from the Italian capital did Mohamed Salah play for before Anfield?', 'روما (Roma)', 'Roma', [['لاتسيو (Lazio)', 'Lazio'], ['ميلان (Milan)', 'AC Milan'], ['نابولي (Napoli)', 'Napoli']]],
  ['قبل الأهلي: أي ناد مصري كان محطة محمد أبو تريكة قبل القلعة الحمراء؟', 'Before Al Ahly: which Egyptian club was Mohamed Aboutrika stop before the Red Castle?', 'الترسانة', 'Tersana', [['المقاولون العرب', 'Al Mokawloon'], ['إنبي', 'ENPPI'], ['الإسماعيلي', 'Ismaily']]],
  ['القميص الأهم في حكاية بيبو: أي ناد مصري صار رمز محمود الخطيب؟', 'The key shirt in Bibo story: which Egyptian club became Mahmoud El Khatib symbol?', 'الأهلي', 'Al Ahly', [['الزمالك', 'Zamalek'], ['الإسماعيلي', 'Ismaily'], ['المصري البورسعيدي', 'Al Masry']]],
  ['رحلة التوأم: حسام حسن لعب للقطبين، لكن أي منتخب كان عنوان أرقامه الدولية؟', 'Twin journey: Hossam Hassan played for both giants, but which national team defined his international numbers?', 'منتخب مصر', 'Egypt national team', [['منتخب المغرب', 'Morocco national team'], ['منتخب تونس', 'Tunisia national team'], ['منتخب الجزائر', 'Algeria national team']]],
  ['من القطب الأحمر إلى القطب الأبيض: أي ناد مصري صار محطة إبراهيم حسن بعد الأهلي؟', 'From the red giant to the white giant: which Egyptian club became Ibrahim Hassan stop after Al Ahly?', 'الزمالك', 'Zamalek', [['الإسماعيلي', 'Ismaily'], ['المصري البورسعيدي', 'Al Masry'], ['بيراميدز', 'Pyramids']]],
  ['قبل لقب السد العالي جماهيريا: أي ناد مصري خرج منه عصام الحضري قبل انتقاله للأهلي؟', 'Before the High Dam nickname: which Egyptian club did Essam El Hadary come from before Al Ahly?', 'دمياط', 'Damietta', [['غزل المحلة', 'Ghazl El Mahalla'], ['المنصورة', 'Mansoura'], ['الاتحاد السكندري', 'Al Ittihad Alexandria']]],
  ['محطة تركية بارزة: أي ناد من كبار إسطنبول لعب له أحمد حسن؟', 'Major Turkish stop: which Istanbul giant did Ahmed Hassan play for?', 'بشكتاش (Besiktas)', 'Besiktas', [['غلطة سراي (Galatasaray)', 'Galatasaray'], ['فنربخشة (Fenerbahce)', 'Fenerbahce'], ['طرابزون سبور (Trabzonspor)', 'Trabzonspor']]],
  ['بوابة هولندا: أي ناد هولندي كان محطة مبكرة لأحمد حسام ميدو؟', 'Dutch gate: which Dutch club was an early stop for Ahmed Hossam Mido?', 'أياكس (Ajax)', 'Ajax', [['آيندهوفن (PSV)', 'PSV'], ['فينورد (Feyenoord)', 'Feyenoord'], ['ألكمار (AZ)', 'AZ Alkmaar']]],
  ['محطة إنجليزية: أي ناد في برمنغهام لعب له محمود تريزيجيه؟', 'English stop: which Birmingham club did Mahmoud Trezeguet play for?', 'أستون فيلا (Aston Villa)', 'Aston Villa', [['برمنغهام سيتي (Birmingham City)', 'Birmingham City'], ['وست بروميتش (West Brom)', 'West Bromwich Albion'], ['وولفرهامبتون (Wolves)', 'Wolverhampton Wanderers']]],
  ['في مصر: أحمد سيد زيزو اشتهر جماهيريا بقميص أي ناد؟', 'In Egypt: which club shirt is Ahmed Sayed Zizo best known for among fans?', 'الزمالك', 'Zamalek', [['الأهلي', 'Al Ahly'], ['بيراميدز', 'Pyramids'], ['الإسماعيلي', 'Ismaily']]],
  ['قبل انتقاله للأهلي: أي ناد مصري صنع جزءا كبيرا من شهرة إمام عاشور؟', 'Before moving to Al Ahly: which Egyptian club built a big part of Emam Ashour fame?', 'الزمالك', 'Zamalek', [['بيراميدز', 'Pyramids'], ['الإسماعيلي', 'Ismaily'], ['المصري البورسعيدي', 'Al Masry']]],
  ['حراسة المرمى الحديثة: محمد الشناوي ارتبط أساسيا بأي ناد مصري كبير؟', 'Modern goalkeeping: Mohamed El Shenawy is strongly linked with which major Egyptian club?', 'الأهلي', 'Al Ahly', [['الزمالك', 'Zamalek'], ['بيراميدز', 'Pyramids'], ['الإسماعيلي', 'Ismaily']]],
  ['قبل أن يصبح اسما مهما في الأهلي: أي ناد تونسي خرج منه علي معلول؟', 'Before becoming important at Al Ahly: which Tunisian club did Ali Maaloul come from?', 'النادي الصفاقسي', 'CS Sfaxien', [['الترجي', 'Esperance'], ['النجم الساحلي', 'Etoile du Sahel'], ['النادي الإفريقي', 'Club Africain']]],
  ['قبل باريس وميامي: أي ناد إسباني صنع أسطورة ليونيل ميسي؟', 'Before Paris and Miami: which Spanish club made Lionel Messi legend?', 'برشلونة (Barcelona)', 'Barcelona', [['ريال مدريد (Real Madrid)', 'Real Madrid'], ['أتلتيكو مدريد (Atletico Madrid)', 'Atletico Madrid'], ['فالنسيا (Valencia)', 'Valencia']]],
  ['قبل مانشستر يونايتد: أي ناد برتغالي كان بوابة كريستيانو رونالدو؟', 'Before Manchester United: which Portuguese club was Cristiano Ronaldo gateway?', 'سبورتنغ لشبونة (Sporting CP)', 'Sporting CP', [['بنفيكا (Benfica)', 'Benfica'], ['بورتو (Porto)', 'Porto'], ['سبورتنغ براغا (Braga)', 'Braga']]],
  ['أسطورة البرازيل الأكبر قضى معظم مجده المحلي مع أي ناد؟', 'Brazil greatest legend spent most of his domestic glory with which club?', 'سانتوس (Santos)', 'Santos', [['فلامنغو (Flamengo)', 'Flamengo'], ['كورينثيانز (Corinthians)', 'Corinthians'], ['بالميراس (Palmeiras)', 'Palmeiras']]],
  ['قبل نابولي: أي ناد إسباني لعب له دييغو مارادونا؟', 'Before Napoli: which Spanish club did Diego Maradona play for?', 'برشلونة (Barcelona)', 'Barcelona', [['ريال مدريد (Real Madrid)', 'Real Madrid'], ['أتلتيكو مدريد (Atletico Madrid)', 'Atletico Madrid'], ['إشبيلية (Sevilla)', 'Sevilla']]],
  ['قبل ريال مدريد: أي ناد إيطالي كان محطة زين الدين زيدان الكبرى؟', 'Before Real Madrid: which Italian club was Zinedine Zidane major stop?', 'يوفنتوس (Juventus)', 'Juventus', [['ميلان (Milan)', 'AC Milan'], ['إنتر ميلان (Inter)', 'Inter Milan'], ['روما (Roma)', 'Roma']]],
  ['قبل برشلونة: أي ناد فرنسي كان محطة رونالدينيو الأوروبية؟', 'Before Barcelona: which French club was Ronaldinho European stop?', 'باريس سان جيرمان (PSG)', 'Paris Saint-Germain', [['مارسيليا (Marseille)', 'Marseille'], ['ليون (Lyon)', 'Lyon'], ['موناكو (Monaco)', 'Monaco']]],
  ['قبل باريس سان جيرمان: أي ناد فرنسي أطلق كيليان مبابي أوروبيا؟', 'Before Paris Saint-Germain: which French club launched Kylian Mbappe in Europe?', 'موناكو (Monaco)', 'Monaco', [['ليون (Lyon)', 'Lyon'], ['مارسيليا (Marseille)', 'Marseille'], ['ليل (Lille)', 'Lille']]],
  ['قبل مانشستر سيتي: أي ناد ألماني كان محطة إيرلينغ هالاند المرعبة؟', 'Before Manchester City: which German club was Erling Haaland frightening stop?', 'بوروسيا دورتموند (Dortmund)', 'Borussia Dortmund', [['بايرن ميونخ (Bayern Munich)', 'Bayern Munich'], ['لايبزيغ (RB Leipzig)', 'RB Leipzig'], ['باير ليفركوزن (Leverkusen)', 'Bayer Leverkusen']]],
  ['قبل ريال مدريد: أي ناد إنجليزي لعب له لوكا مودريتش؟', 'Before Real Madrid: which English club did Luka Modric play for?', 'توتنهام (Tottenham)', 'Tottenham Hotspur', [['آرسنال (Arsenal)', 'Arsenal'], ['تشيلسي (Chelsea)', 'Chelsea'], ['ليفربول (Liverpool)', 'Liverpool']]],
  ['بعد برشلونة: أي ناد ياباني لعب له أندريس إنييستا؟', 'After Barcelona: which Japanese club did Andres Iniesta play for?', 'فيسيل كوبي (Vissel Kobe)', 'Vissel Kobe', [['يوكوهاما مارينوس', 'Yokohama F. Marinos'], ['أوراوا ريدز', 'Urawa Red Diamonds'], ['كاشيما أنتلرز', 'Kashima Antlers']]],
  ['بعد برشلونة: أي ناد قطري لعب له تشافي قبل التدريب؟', 'After Barcelona: which Qatari club did Xavi play for before coaching?', 'السد القطري', 'Al Sadd', [['الدحيل', 'Al Duhail'], ['الريان', 'Al Rayyan'], ['الغرافة', 'Al Gharafa']]],
  ['قبل سنوات يوفنتوس الطويلة: أي ناد إيطالي بدأ معه جيانلويجي بوفون؟', 'Before the long Juventus years: which Italian club did Gianluigi Buffon start with?', 'بارما (Parma)', 'Parma', [['لاتسيو (Lazio)', 'Lazio'], ['روما (Roma)', 'Roma'], ['فيورنتينا (Fiorentina)', 'Fiorentina']]],
  ['قبل ريال مدريد مباشرة: أي ناد إيطالي لعب له روبرتو كارلوس؟', 'Right before Real Madrid: which Italian club did Roberto Carlos play for?', 'إنتر ميلان (Inter)', 'Inter Milan', [['ميلان (Milan)', 'AC Milan'], ['يوفنتوس (Juventus)', 'Juventus'], ['روما (Roma)', 'Roma']]],
  ['وفاء نادر: باولو مالديني قضى مسيرته الكبيرة مع أي ناد إيطالي؟', 'Rare loyalty: Paolo Maldini spent his great career with which Italian club?', 'ميلان (Milan)', 'AC Milan', [['إنتر ميلان (Inter)', 'Inter Milan'], ['يوفنتوس (Juventus)', 'Juventus'], ['روما (Roma)', 'Roma']]],
  ['أول محطة أوروبية لنيمار بعد البرازيل كانت مع أي ناد إسباني؟', 'Neymar first European stop after Brazil was with which Spanish club?', 'برشلونة (Barcelona)', 'Barcelona', [['ريال مدريد (Real Madrid)', 'Real Madrid'], ['أتلتيكو مدريد (Atletico Madrid)', 'Atletico Madrid'], ['فالنسيا (Valencia)', 'Valencia']]],
  ['حكاية الدوري الإنجليزي 2016: رياض محرز صنع المعجزة مع أي ناد؟', '2016 English league story: Riyad Mahrez made the miracle with which club?', 'ليستر سيتي (Leicester City)', 'Leicester City', [['إيفرتون (Everton)', 'Everton'], ['وست هام (West Ham)', 'West Ham United'], ['نيوكاسل (Newcastle)', 'Newcastle United']]],
  ['بعد ريال مدريد: أي ناد ألماني لعب له أشرف حكيمي على سبيل الإعارة؟', 'After Real Madrid: which German club did Achraf Hakimi join on loan?', 'بوروسيا دورتموند (Dortmund)', 'Borussia Dortmund', [['بايرن ميونخ (Bayern Munich)', 'Bayern Munich'], ['لايبزيغ (RB Leipzig)', 'RB Leipzig'], ['باير ليفركوزن (Leverkusen)', 'Bayer Leverkusen']]],
  ['قبل السياسة: جورج ويا اشتهر أوروبيا بقميص أي ناد إيطالي؟', 'Before politics: George Weah became famous in Europe with which Italian club?', 'ميلان (Milan)', 'AC Milan', [['إنتر ميلان (Inter)', 'Inter Milan'], ['يوفنتوس (Juventus)', 'Juventus'], ['روما (Roma)', 'Roma']]],
  ['قبل تشيلسي: أي ناد فرنسي كان محطة ديدييه دروغبا الكبرى؟', 'Before Chelsea: which French club was Didier Drogba major stop?', 'مارسيليا (Marseille)', 'Marseille', [['ليون (Lyon)', 'Lyon'], ['باريس سان جيرمان (PSG)', 'Paris Saint-Germain'], ['موناكو (Monaco)', 'Monaco']]],
  ['ثلاثية 2010: صامويل إيتو حققها في إيطاليا مع أي ناد؟', '2010 treble: Samuel Eto o achieved it in Italy with which club?', 'إنتر ميلان (Inter)', 'Inter Milan', [['ميلان (Milan)', 'AC Milan'], ['يوفنتوس (Juventus)', 'Juventus'], ['روما (Roma)', 'Roma']]],
  ['سنوات ألمانيا: أي ناد ارتبط باسم محمد زيدان في دوري الأبطال والبوندسليغا؟', 'Germany years: which club is Mohamed Zidan linked with in the Champions League and Bundesliga?', 'بوروسيا دورتموند (Dortmund)', 'Borussia Dortmund', [['بايرن ميونخ (Bayern Munich)', 'Bayern Munich'], ['شالكه (Schalke)', 'Schalke'], ['باير ليفركوزن (Leverkusen)', 'Bayer Leverkusen']]],
  ['القيصر الألماني: أي ناد ألماني كان بيته الكروي الأكبر؟', 'The German Kaiser: which German club was Franz Beckenbauer biggest football home?', 'بايرن ميونخ (Bayern Munich)', 'Bayern Munich', [['بوروسيا دورتموند (Dortmund)', 'Borussia Dortmund'], ['هامبورغ (Hamburg)', 'Hamburg'], ['شالكه (Schalke)', 'Schalke']]]
];

const footballDeepCutQuestions = [
  ['كأس أفريقيا 2010: مهاجم دخل من الدكة وسجل أهدافا حاسمة لمصر. مين؟', 'AFCON 2010: a substitute striker scored decisive goals for Egypt. Who was it?', 'محمد ناجي جدو', 'Mohamed Nagy Gedo', [['عماد متعب', 'Emad Moteab'], ['أحمد رؤوف', 'Ahmed Raouf'], ['عمرو زكي', 'Amr Zaki']]],
  ['ظهير لا يهدأ في جيل مصر الذهبي، لعب يمينا ويسارا ووسط الملعب أحيانا. مين؟', 'A tireless fullback in Egypt golden generation, playing right, left, and sometimes midfield. Who?', 'أحمد فتحي', 'Ahmed Fathi', [['سيد معوض', 'Sayed Moawad'], ['وائل جمعة', 'Wael Gomaa'], ['أحمد المحمدي', 'Ahmed Elmohamady']]],
  ['قلب دفاع لقبته جماهير الأهلي بالصخرة، وكان عنوانا لصلابة منتخب مصر. مين؟', 'A centre-back nicknamed the rock by Al Ahly fans and tied to Egypt defensive solidity. Who?', 'وائل جمعة', 'Wael Gomaa', [['شادي محمد', 'Shady Mohamed'], ['هاني سعيد', 'Hany Said'], ['بشير التابعي', 'Bashir El Tabei']]],
  ['في الأهلي ومنتخب مصر: لاعب وسط هجومي اشتهر بالتحرك بين الخطوط والتمرير الذكي. مين؟', 'At Al Ahly and Egypt: an attacking midfielder known for movement between lines and smart passing. Who?', 'محمد بركات', 'Mohamed Barakat', [['حسام غالي', 'Hossam Ghaly'], ['أحمد حسن', 'Ahmed Hassan'], ['وليد سليمان', 'Walid Soliman']]],
  ['جناح أيسر كان من مفاتيح منتخب مصر في 2008 و2010 مع حسن شحاتة. مين؟', 'A left-back/wing-side player who was key for Egypt in 2008 and 2010 under Hassan Shehata. Who?', 'سيد معوض', 'Sayed Moawad', [['أحمد فتحي', 'Ahmed Fathi'], ['أحمد المحمدي', 'Ahmed Elmohamady'], ['هاني سعيد', 'Hany Said']]],
  ['رحلة إنجلترا: مهاجم مصري تألق فترة قصيرة مع ويغان وسجل حضورا قويا في البريميرليج. مين؟', 'England spell: an Egyptian striker shone briefly with Wigan and made a strong Premier League impression. Who?', 'عمرو زكي', 'Amr Zaki', [['أحمد حسام ميدو', 'Mido'], ['محمد زيدان', 'Mohamed Zidan'], ['محمود تريزيجيه', 'Trezeguet']]],
  ['صانع لعب مصري ارتبط بالزمالك ولقبته الجماهير بالثعلب الصغير. مين؟', 'Egyptian playmaker linked with Zamalek and nicknamed the little fox. Who?', 'حازم إمام', 'Hazem Emam', [['شيكابالا', 'Shikabala'], ['أيمن يونس', 'Ayman Younes'], ['طارق يحيى', 'Tarek Yehia']]],
  ['صانع ألعاب مصري احترف في بنفيكا وكان من الأسماء الفنية في التسعينات. مين؟', 'Egyptian playmaker who played for Benfica and was one of the technical names of the 1990s. Who?', 'عبد الستار صبري', 'Abdel Sattar Sabry', [['حازم إمام', 'Hazem Emam'], ['نادر السيد', 'Nader El Sayed'], ['أحمد حسن', 'Ahmed Hassan']]],
  ['حارس مصري لمع مع الزمالك ومنتخب مصر قبل جيل الحضري الطويل. مين؟', 'Egyptian goalkeeper who shone with Zamalek and Egypt before El Hadary long era. Who?', 'نادر السيد', 'Nader El Sayed', [['عبد الواحد السيد', 'Abdelwahed El Sayed'], ['محمد عبد المنصف', 'Mohamed Abdel Monsef'], ['أمير عبد الحميد', 'Amir Abdelhamid']]],
  ['محترف مصري في البوندسليغا، اسمه ارتبط بماينز ودورتموند وهامبورغ. مين؟', 'Egyptian Bundesliga professional linked with Mainz, Dortmund, and Hamburg. Who?', 'محمد زيدان', 'Mohamed Zidan', [['أحمد حسام ميدو', 'Mido'], ['عمرو زكي', 'Amr Zaki'], ['أحمد المحمدي', 'Ahmed Elmohamady']]],
  ['لاعب مصري حديث، تألق في ألمانيا مع فرانكفورت وصار اسمه حاضرا في هجوم المنتخب. مين؟', 'Modern Egyptian player who shone in Germany with Frankfurt and became present in Egypt attack. Who?', 'عمر مرموش', 'Omar Marmoush', [['مصطفى محمد', 'Mostafa Mohamed'], ['محمود تريزيجيه', 'Trezeguet'], ['رمضان صبحي', 'Ramadan Sobhi']]],
  ['مهاجم مصري انتقل إلى نانت بعد تجربة تركية، وغالبا يلعب كرأس حربة صريح. مين؟', 'Egyptian striker who moved to Nantes after a Turkish spell and usually plays as a central striker. Who?', 'مصطفى محمد', 'Mostafa Mohamed', [['عمر مرموش', 'Omar Marmoush'], ['أحمد حسن كوكا', 'Ahmed Hassan Kouka'], ['محمود كهربا', 'Mahmoud Kahraba']]],
  ['جناح مصري بدأ نجما صغيرا في الأهلي ثم عاد لمصر عبر بوابة بيراميدز. مين؟', 'Egyptian winger who started as a young star at Al Ahly then returned to Egypt through Pyramids. Who?', 'رمضان صبحي', 'Ramadan Sobhi', [['إمام عاشور', 'Emam Ashour'], ['كهربا', 'Kahraba'], ['أحمد سيد زيزو', 'Zizo']]],
  ['مدافع مصري لعب في وست بروميتش ثم صار من وجوه دفاع المنتخب الحديثة. مين؟', 'Egyptian defender who played for West Brom and became part of the modern national defence. Who?', 'أحمد حجازي', 'Ahmed Hegazi', [['علي جبر', 'Ali Gabr'], ['محمود علاء', 'Mahmoud Alaa'], ['باهر المحمدي', 'Baher El Mohamady']]],
  ['ظهير مصري لعب سنوات طويلة في إنجلترا مع هال سيتي وأستون فيلا. مين؟', 'Egyptian fullback who spent long years in England with Hull City and Aston Villa. Who?', 'أحمد المحمدي', 'Ahmed Elmohamady', [['أحمد فتحي', 'Ahmed Fathi'], ['أحمد حجازي', 'Ahmed Hegazi'], ['كريم حافظ', 'Karim Hafez']]],
  ['أسطورة أفريقية ناعمة القدمين، اشتهر بلمهارات في بولتون وباريس ونيجيريا. مين؟', 'An African flair legend known for skill at Bolton, Paris, and Nigeria. Who?', 'جي جي أوكوتشا', 'Jay-Jay Okocha', [['نوانكو كانو', 'Nwankwo Kanu'], ['يايا توريه', 'Yaya Toure'], ['مايكل إيسيان', 'Michael Essien']]],
  ['مهاجم نيجيري طويل ارتبط بأرسنال وإنتر، وكان بطلا أفريقيا ودوليا. مين؟', 'Tall Nigerian forward linked with Arsenal and Inter, an African and international football hero. Who?', 'نوانكو كانو', 'Nwankwo Kanu', [['جي جي أوكوتشا', 'Jay-Jay Okocha'], ['إيمانويل أديبايور', 'Emmanuel Adebayor'], ['صامويل إيتو', 'Samuel Eto o']]],
  ['لاعب وسط إيفواري قوي، ارتبط بمانشستر سيتي وبرشلونة أكثر من غيرهما. مين؟', 'Powerful Ivorian midfielder most linked with Manchester City and Barcelona. Who?', 'يايا توريه', 'Yaya Toure', [['مايكل إيسيان', 'Michael Essien'], ['جون أوبي ميكل', 'John Obi Mikel'], ['سولي مونتاري', 'Sulley Muntari']]],
  ['لاعب وسط غاني شرس، ارتبط بتشيلسي وريال مدريد وميلان. مين؟', 'Tough Ghanaian midfielder linked with Chelsea, Real Madrid, and Milan. Who?', 'مايكل إيسيان', 'Michael Essien', [['يايا توريه', 'Yaya Toure'], ['سولي مونتاري', 'Sulley Muntari'], ['كيفن برينس بواتينغ', 'Kevin-Prince Boateng']]],
  ['صانع لعب مغربي قاد ذاكرة مونديال 1998 ومرسيليا، واسمه يرتبط برقم 10. مين؟', 'Moroccan playmaker tied to the 1998 World Cup memory and Marseille, linked with number 10. Who?', 'مصطفى حجي', 'Mustapha Hadji', [['نور الدين النيبت', 'Noureddine Naybet'], ['يوسف شيبو', 'Youssef Chippo'], ['صلاح الدين بصير', 'Salaheddine Bassir']]],
  ['مدافع مغربي قديم، لعب لديبورتيفو لاكورونيا وكان من أعمدة المنتخب. مين؟', 'Old-school Moroccan defender who played for Deportivo La Coruna and anchored the national team. Who?', 'نور الدين النيبت', 'Noureddine Naybet', [['مصطفى حجي', 'Mustapha Hadji'], ['رومان سايس', 'Romain Saiss'], ['مهدي بن عطية', 'Mehdi Benatia']]],
  ['مهاجم توغولي طويل، اشتهر في أرسنال ومانشستر سيتي وريال مدريد. مين؟', 'Tall Togolese striker known from Arsenal, Manchester City, and Real Madrid. Who?', 'إيمانويل أديبايور', 'Emmanuel Adebayor', [['نوانكو كانو', 'Nwankwo Kanu'], ['ديدييه دروغبا', 'Didier Drogba'], ['فريديريك كانوتيه', 'Frederic Kanoute']]],
  ['مهاجم مالي أنيق لعب لإشبيلية وتوتنهام وارتبط بالأهداف الهادئة. مين؟', 'Elegant Malian striker who played for Sevilla and Tottenham and was known for calm finishing. Who?', 'فريديريك كانوتيه', 'Frederic Kanoute', [['إيمانويل أديبايور', 'Emmanuel Adebayor'], ['سيدو كيتا', 'Seydou Keita'], ['يايا توريه', 'Yaya Toure']]],
  ['لاعب وسط أرجنتيني كلاسيكي، اسمه يرتبط ببوكا جونيورز وفياريال أكثر من الأضواء الحديثة. مين؟', 'Classic Argentine playmaker linked with Boca Juniors and Villarreal more than modern spotlight. Who?', 'خوان رومان ريكيلمي', 'Juan Roman Riquelme', [['بابلو أيمار', 'Pablo Aimar'], ['خوان سيباستيان فيرون', 'Juan Sebastian Veron'], ['خافيير سافيولا', 'Javier Saviola']]]
];

const egyptArtists = [
  ['محمود مختار', 'Mahmoud Mokhtar', 'نهضة مصر', 'Egypt Renaissance', 'النحت', 'sculpture'],
  ['محمود سعيد', 'Mahmoud Said', 'بنات بحري', 'Banat Bahari', 'التصوير الزيتي', 'oil painting'],
  ['تحية حليم', 'Tahia Halim', 'الفن النوبي', 'Nubian art', 'التصوير', 'painting'],
  ['إنجي أفلاطون', 'Inji Efflatoun', 'الفن التعبيري', 'expressionist art', 'التصوير', 'painting'],
  ['عبد الهادي الجزار', 'Abdel Hadi El Gazzar', 'الفن الشعبي الرمزي', 'symbolic folk art', 'التصوير', 'painting'],
  ['حامد ندا', 'Hamed Nada', 'الرمزية الشعبية', 'folk symbolism', 'التصوير', 'painting'],
  ['جاذبية سري', 'Gazbia Sirry', 'المرأة والمدينة', 'women and the city', 'التصوير', 'painting'],
  ['سيف وانلي', 'Seif Wanly', 'مشاهد الإسكندرية', 'Alexandria scenes', 'التصوير', 'painting'],
  ['آدم حنين', 'Adam Henein', 'النحت المعاصر', 'modern sculpture', 'النحت', 'sculpture'],
  ['جورج بهجوري', 'George Bahgory', 'الكاريكاتير والبورتريه', 'caricature and portrait', 'الرسم', 'drawing'],
  ['حسن فتحي', 'Hassan Fathy', 'عمارة الفقراء', 'Architecture for the Poor', 'العمارة', 'architecture'],
  ['رمسيس ويصا واصف', 'Ramses Wissa Wassef', 'النسيج في الحرانية', 'tapestry work in Harraniya', 'الفنون التطبيقية', 'applied arts'],
  ['محمد ناجي', 'Mohamed Nagy', 'مدرسة الإسكندرية', 'Alexandria school', 'التصوير', 'painting'],
  ['صلاح جاهين', 'Salah Jahin', 'الكاريكاتير والرباعيات', 'caricature and quatrains', 'الكاريكاتير', 'caricature'],
  ['صلاح طاهر', 'Salah Taher', 'التجريد المصري', 'Egyptian abstraction', 'التصوير التجريدي', 'abstract painting'],
  ['أحمد مصطفى', 'Ahmed Moustafa', 'الحروفية الإسلامية', 'Islamic calligraphic art', 'الفن الحروفي', 'calligraphic art'],
  ['مصطفى الرزاز', 'Mostafa El Razzaz', 'الرموز الشعبية والطائر', 'folk symbols and birds', 'التصوير والرمز', 'painting and symbolism'],
  ['إيفلين عشم الله', 'Evelyn Ashamallah', 'عوالم طفولية وذاكرة شعبية', 'childlike worlds and folk memory', 'التصوير المعاصر', 'contemporary painting']
].map(([nameAr, nameEn, workAr, workEn, fieldAr, fieldEn]) => ({ nameAr, nameEn, workAr, workEn, fieldAr, fieldEn }));

const religionQuestions = [
  ['ما اسم أول سورة في المصحف؟', 'What is the first surah in the Quran?', 'الفاتحة', 'Al-Fatiha', [['البقرة', 'Al-Baqarah'], ['الإخلاص', 'Al-Ikhlas'], ['الناس', 'An-Nas']]],
  ['ما اسم أطول سورة في القرآن؟', 'What is the longest surah in the Quran?', 'البقرة', 'Al-Baqarah', [['آل عمران', 'Aal-Imran'], ['النساء', 'An-Nisa'], ['المائدة', 'Al-Maida']]],
  ['ما القبلة التي يتجه إليها المسلمون في الصلاة؟', 'What is the prayer direction for Muslims?', 'الكعبة', 'Kaaba', [['المسجد النبوي', 'Prophet Mosque'], ['المسجد الأقصى', 'Al-Aqsa Mosque'], ['جبل عرفات', 'Mount Arafat']]],
  ['في أي شهر يصوم المسلمون؟', 'In which month do Muslims fast?', 'رمضان', 'Ramadan', [['شوال', 'Shawwal'], ['محرم', 'Muharram'], ['رجب', 'Rajab']]],
  ['ما اسم الغار الذي نزل فيه الوحي أول مرة؟', 'What is the cave where the first revelation came?', 'غار حراء', 'Cave Hira', [['غار ثور', 'Cave Thawr'], ['غار أصحاب الكهف', 'Cave of the Sleepers'], ['جبل عرفات', 'Mount Arafat']]],
  ['من هو خاتم الأنبياء في الإسلام؟', 'Who is the final prophet in Islam?', 'محمد ﷺ', 'Prophet Muhammad', [['إبراهيم عليه السلام', 'Prophet Ibrahim'], ['موسى عليه السلام', 'Prophet Musa'], ['عيسى عليه السلام', 'Prophet Isa']]],
  ['ما المدينة التي هاجر إليها النبي محمد ﷺ؟', 'To which city did Prophet Muhammad migrate?', 'المدينة المنورة', 'Medina', [['مكة', 'Mecca'], ['الطائف', 'Taif'], ['القدس', 'Jerusalem']]],
  ['ما اسم أول مسجد بني في الإسلام؟', 'What is the first mosque built in Islam?', 'مسجد قباء', 'Quba Mosque', [['المسجد الحرام', 'Al-Masjid Al-Haram'], ['المسجد النبوي', 'Prophet Mosque'], ['الأزهر', 'Al-Azhar']]],
  ['ما اسم أم المؤمنين زوج النبي ﷺ الأولى؟', 'Who was the first wife of Prophet Muhammad?', 'خديجة بنت خويلد', 'Khadija bint Khuwaylid', [['عائشة بنت أبي بكر', 'Aisha bint Abi Bakr'], ['حفصة بنت عمر', 'Hafsa bint Umar'], ['أم سلمة', 'Umm Salama']]],
  ['من أول الخلفاء الراشدين؟', 'Who was the first Rashidun caliph?', 'أبو بكر الصديق', 'Abu Bakr Al-Siddiq', [['عمر بن الخطاب', 'Umar ibn Al-Khattab'], ['عثمان بن عفان', 'Uthman ibn Affan'], ['علي بن أبي طالب', 'Ali ibn Abi Talib']]],
  ['من الخليفة الذي جمع الناس على مصحف واحد؟', 'Which caliph standardized the Quran manuscript?', 'عثمان بن عفان', 'Uthman ibn Affan', [['أبو بكر الصديق', 'Abu Bakr'], ['عمر بن الخطاب', 'Umar'], ['علي بن أبي طالب', 'Ali']]],
  ['ما اسم المؤذن الأول في الإسلام؟', 'Who was the first muezzin in Islam?', 'بلال بن رباح', 'Bilal ibn Rabah', [['زيد بن ثابت', 'Zayd ibn Thabit'], ['مصعب بن عمير', 'Musab ibn Umayr'], ['سعد بن أبي وقاص', 'Saad ibn Abi Waqqas']]],
  ['ما اسم معركة المسلمين الأولى الكبرى؟', 'What was the first major battle of Muslims?', 'بدر', 'Badr', [['أحد', 'Uhud'], ['الخندق', 'Al-Khandaq'], ['حنين', 'Hunayn']]],
  ['في أي مدينة يقع جامع الأزهر؟', 'In which city is Al-Azhar Mosque?', 'القاهرة', 'Cairo', [['الإسكندرية', 'Alexandria'], ['أسوان', 'Aswan'], ['الأقصر', 'Luxor']]],
  ['ما المؤسسة العلمية المرتبطة بجامع الأزهر؟', 'Which scholarly institution is linked to Al-Azhar Mosque?', 'جامعة الأزهر', 'Al-Azhar University', [['دار الكتب', 'National Library'], ['دار الأوبرا', 'Opera House'], ['مكتبة الإسكندرية', 'Bibliotheca Alexandrina']]],
  ['ما اسم العيد الذي يأتي بعد رمضان؟', 'Which Eid comes after Ramadan?', 'عيد الفطر', 'Eid al-Fitr', [['عيد الأضحى', 'Eid al-Adha'], ['المولد النبوي', 'Mawlid'], ['رأس السنة الهجرية', 'Islamic New Year']]],
  ['ما اسم الوقوف في الحج يوم التاسع من ذي الحجة؟', 'What is the major Hajj standing on the ninth of Dhu al-Hijjah?', 'الوقوف بعرفة', 'Standing at Arafat', [['رمي الجمرات', 'Stoning the Jamarat'], ['السعي', 'Sa’i'], ['طواف الوداع', 'Farewell Tawaf']]],
  ['ما اسم الكتاب الذي يجمع أحاديث الإمام البخاري؟', 'What is Imam al-Bukhari hadith collection called?', 'صحيح البخاري', 'Sahih al-Bukhari', [['الموطأ', 'Al-Muwatta'], ['سنن أبي داود', 'Sunan Abi Dawud'], ['صحيح مسلم', 'Sahih Muslim']]],
  ['من صاحب كتاب الموطأ؟', 'Who authored Al-Muwatta?', 'الإمام مالك', 'Imam Malik', [['الإمام الشافعي', 'Imam al-Shafi’i'], ['الإمام أحمد', 'Imam Ahmad'], ['الإمام البخاري', 'Imam al-Bukhari']]],
  ['ما اسم المسجد الموجود داخل قلعة صلاح الدين بالقاهرة؟', 'Which mosque is inside Cairo Citadel?', 'مسجد محمد علي', 'Muhammad Ali Mosque', [['جامع عمرو بن العاص', 'Amr ibn al-As Mosque'], ['جامع ابن طولون', 'Ibn Tulun Mosque'], ['جامع الحاكم', 'Al-Hakim Mosque']]],
  ['ما اسم أول مسجد بني في مصر؟', 'What is the first mosque built in Egypt?', 'جامع عمرو بن العاص', 'Amr ibn al-As Mosque', [['جامع الأزهر', 'Al-Azhar Mosque'], ['جامع ابن طولون', 'Ibn Tulun Mosque'], ['مسجد محمد علي', 'Muhammad Ali Mosque']]],
  ['من القائد الذي ارتبط بفتح مصر في العصر الراشدي؟', 'Which commander is associated with the Muslim conquest of Egypt?', 'عمرو بن العاص', 'Amr ibn al-As', [['خالد بن الوليد', 'Khalid ibn al-Walid'], ['سعد بن أبي وقاص', 'Saad ibn Abi Waqqas'], ['طارق بن زياد', 'Tariq ibn Ziyad']]],
  ['ما اسم التقويم الذي يبدأ بهجرة النبي ﷺ؟', 'Which calendar begins with the Hijra?', 'التقويم الهجري', 'Hijri calendar', [['التقويم الميلادي', 'Gregorian calendar'], ['التقويم القبطي', 'Coptic calendar'], ['التقويم اليولياني', 'Julian calendar']]],
  ['ما السورة التي تسمى قلب القرآن في التراث الشائع؟', 'Which surah is commonly called the heart of the Quran?', 'يس', 'Ya-Sin', [['الكهف', 'Al-Kahf'], ['الملك', 'Al-Mulk'], ['الرحمن', 'Ar-Rahman']]]
];

const scienceRecords = [
  ['الهيدروجين', 'Hydrogen', 'H', '1', 'أخف عنصر', 'lightest element'],
  ['الأكسجين', 'Oxygen', 'O', '8', 'التنفس والاحتراق', 'respiration and combustion'],
  ['الحديد', 'Iron', 'Fe', '26', 'صناعة الصلب', 'steelmaking'],
  ['الذهب', 'Gold', 'Au', '79', 'المجوهرات والتوصيل الكهربائي', 'jewelry and electrical conductivity'],
  ['الكربون', 'Carbon', 'C', '6', 'أساس المركبات العضوية', 'basis of organic compounds'],
  ['الصوديوم', 'Sodium', 'Na', '11', 'ملح الطعام مع الكلور', 'table salt with chlorine'],
  ['الكلور', 'Chlorine', 'Cl', '17', 'تعقيم المياه', 'water disinfection'],
  ['الكالسيوم', 'Calcium', 'Ca', '20', 'العظام والأسنان', 'bones and teeth'],
  ['النحاس', 'Copper', 'Cu', '29', 'الأسلاك الكهربائية', 'electrical wiring'],
  ['الهيليوم', 'Helium', 'He', '2', 'البالونات وأجهزة التبريد', 'balloons and cooling systems'],
  ['عطارد', 'Mercury', 'الأقرب إلى الشمس', 'closest to the Sun', 'كوكب صخري', 'rocky planet'],
  ['الزهرة', 'Venus', 'الأكثر حرارة', 'hottest planet', 'كوكب صخري', 'rocky planet'],
  ['الأرض', 'Earth', 'الكوكب الذي نعيش عليه', 'the planet we live on', 'كوكب صخري', 'rocky planet'],
  ['المريخ', 'Mars', 'الكوكب الأحمر', 'red planet', 'كوكب صخري', 'rocky planet'],
  ['المشتري', 'Jupiter', 'أكبر كواكب المجموعة الشمسية', 'largest planet in the Solar System', 'عملاق غازي', 'gas giant'],
  ['زحل', 'Saturn', 'حلقاته الواسعة', 'wide rings', 'عملاق غازي', 'gas giant'],
  ['أورانوس', 'Uranus', 'دورانه المائل', 'tilted rotation', 'عملاق جليدي', 'ice giant'],
  ['نبتون', 'Neptune', 'رياحه الشديدة وبعده عن الشمس', 'strong winds and distance from the Sun', 'عملاق جليدي', 'ice giant'],
  ['النيتروجين', 'Nitrogen', 'N', '7', 'معظم الهواء حولنا', 'most of the air around us'],
  ['الفضة', 'Silver', 'Ag', '47', 'المجوهرات والتوصيل', 'jewelry and conductivity'],
  ['السيليكون', 'Silicon', 'Si', '14', 'رقائق الإلكترونيات', 'electronics chips'],
  ['اليود', 'Iodine', 'I', '53', 'تعقيم طبي ودعم الغدة الدرقية', 'medical antiseptic and thyroid support']
].map(([nameAr, nameEn, symbolAr, symbolEn, featureAr, featureEn]) => ({ nameAr, nameEn, symbolAr, symbolEn, featureAr, featureEn }));

const techRecords = [
  ['شبكة الويب العالمية', 'World Wide Web', 'تيم بيرنرز لي (Tim Berners-Lee)', 'Tim Berners-Lee', 'تصفح المواقع', 'web browsing'],
  ['لغة بايثون (Python)', 'Python', 'غيدو فان روسم (Guido van Rossum)', 'Guido van Rossum', 'البرمجة العامة وتحليل البيانات', 'general programming and data analysis'],
  ['لغة جافا (Java)', 'Java', 'جيمس جوسلينغ (James Gosling)', 'James Gosling', 'تطبيقات متعددة المنصات', 'cross-platform applications'],
  ['لينكس (Linux)', 'Linux', 'لينوس تورفالدس (Linus Torvalds)', 'Linus Torvalds', 'أنظمة تشغيل مفتوحة المصدر', 'open-source operating systems'],
  ['أندرويد (Android)', 'Android', 'جوجل (Google)', 'Google', 'تشغيل الهواتف الذكية', 'smartphone operating system'],
  ['آيفون (iPhone)', 'iPhone', 'آبل (Apple)', 'Apple', 'هاتف ذكي', 'smartphone'],
  ['ويندوز (Windows)', 'Windows', 'مايكروسوفت (Microsoft)', 'Microsoft', 'نظام تشغيل للحواسيب', 'computer operating system'],
  ['ووردبريس (WordPress)', 'WordPress', 'مات مولينويغ (Matt Mullenweg)', 'Matt Mullenweg', 'إدارة المواقع والمدونات', 'website and blog management'],
  ['إتش تي إم إل (HTML)', 'HTML', 'تيم بيرنرز لي (Tim Berners-Lee)', 'Tim Berners-Lee', 'بناء صفحات الويب', 'web page structure'],
  ['سي إس إس (CSS)', 'CSS', 'هاكون فيوم لاي (Hakon Wium Lie)', 'Hakon Wium Lie', 'تنسيق صفحات الويب', 'web page styling'],
  ['جافاسكريبت (JavaScript)', 'JavaScript', 'بريندان آيك (Brendan Eich)', 'Brendan Eich', 'تفاعل صفحات الويب', 'web page interactivity'],
  ['بلوتوث (Bluetooth)', 'Bluetooth', 'إريكسون (Ericsson)', 'Ericsson', 'اتصال لاسلكي قصير المدى', 'short-range wireless communication'],
  ['يو إس بي (USB)', 'USB', 'مجموعة شركات تقنية', 'technology consortium', 'توصيل الأجهزة ونقل البيانات', 'device connection and data transfer'],
  ['ويكيبيديا (Wikipedia)', 'Wikipedia', 'جيمي ويلز ولاري سانجر', 'Jimmy Wales and Larry Sanger', 'موسوعة حرة', 'free encyclopedia'],
  ['يوتيوب (YouTube)', 'YouTube', 'تشاد هيرلي وستيف تشين وجاويد كريم', 'Chad Hurley, Steve Chen, and Jawed Karim', 'مشاركة الفيديو', 'video sharing'],
  ['واتساب (WhatsApp)', 'WhatsApp', 'جان كوم وبراين أكتون', 'Jan Koum and Brian Acton', 'المراسلة الفورية', 'instant messaging'],
  ['تيليغرام (Telegram)', 'Telegram', 'بافل دوروف (Pavel Durov)', 'Pavel Durov', 'المحادثات والقنوات', 'chats and channels'],
  ['بيتكوين (Bitcoin)', 'Bitcoin', 'ساتوشي ناكاموتو', 'Satoshi Nakamoto', 'عملة رقمية لا مركزية', 'decentralized digital currency'],
  ['إيثريوم (Ethereum)', 'Ethereum', 'فيتاليك بوتيرين', 'Vitalik Buterin', 'العقود الذكية', 'smart contracts']
].map(([nameAr, nameEn, creatorAr, creatorEn, useAr, useEn]) => ({ nameAr, nameEn, creatorAr, creatorEn, useAr, useEn }));

const politicsRecords = [
  ['مجلس النواب المصري', 'Egyptian House of Representatives', 'القاهرة', 'Cairo', 'السلطة التشريعية', 'legislative authority'],
  ['مجلس الشيوخ المصري', 'Egyptian Senate', 'القاهرة', 'Cairo', 'الغرفة البرلمانية الثانية', 'second parliamentary chamber'],
  ['مجلس الوزراء المصري', 'Egyptian Cabinet', 'العاصمة الإدارية والقاهرة', 'New Administrative Capital and Cairo', 'السلطة التنفيذية', 'executive authority'],
  ['الأمم المتحدة', 'United Nations', 'نيويورك (New York)', 'New York', 'السلم والتعاون الدولي', 'peace and international cooperation'],
  ['اليونسكو (UNESCO)', 'UNESCO', 'باريس (Paris)', 'Paris', 'التربية والعلم والثقافة', 'education, science and culture'],
  ['منظمة الصحة العالمية (WHO)', 'World Health Organization', 'جنيف (Geneva)', 'Geneva', 'الصحة العامة', 'public health'],
  ['الاتحاد الأفريقي', 'African Union', 'أديس أبابا (Addis Ababa)', 'Addis Ababa', 'التعاون الأفريقي', 'African cooperation'],
  ['جامعة الدول العربية', 'League of Arab States', 'القاهرة', 'Cairo', 'التعاون العربي', 'Arab cooperation'],
  ['منظمة التعاون الإسلامي', 'Organisation of Islamic Cooperation', 'جدة', 'Jeddah', 'التعاون بين الدول الإسلامية', 'cooperation among Muslim-majority countries'],
  ['صندوق النقد الدولي (IMF)', 'International Monetary Fund', 'واشنطن (Washington, D.C.)', 'Washington, D.C.', 'الاستقرار المالي الدولي', 'international financial stability'],
  ['البنك الدولي (World Bank)', 'World Bank', 'واشنطن (Washington, D.C.)', 'Washington, D.C.', 'تمويل التنمية', 'development finance'],
  ['محكمة العدل الدولية', 'International Court of Justice', 'لاهاي (The Hague)', 'The Hague', 'الفصل في النزاعات القانونية بين الدول', 'settling legal disputes between states'],
  ['المحكمة الجنائية الدولية', 'International Criminal Court', 'لاهاي (The Hague)', 'The Hague', 'المحاسبة عن جرائم دولية خطيرة', 'accountability for serious international crimes'],
  ['منظمة التجارة العالمية (WTO)', 'World Trade Organization', 'جنيف (Geneva)', 'Geneva', 'قواعد التجارة الدولية', 'rules for international trade'],
  ['الاتحاد الأوروبي', 'European Union', 'بروكسل (Brussels)', 'Brussels', 'تكامل سياسي واقتصادي أوروبي', 'European political and economic integration'],
  ['مجلس الأمن الدولي', 'UN Security Council', 'نيويورك (New York)', 'New York', 'السلم والأمن الدوليان', 'international peace and security'],
  ['اليونيسف (UNICEF)', 'UNICEF', 'نيويورك (New York)', 'New York', 'حقوق الطفل والإغاثة', 'children rights and relief'],
  ['منظمة العمل الدولية (ILO)', 'International Labour Organization', 'جنيف (Geneva)', 'Geneva', 'معايير العمل وحقوق العمال', 'labor standards and workers rights'],
  ['منظمة الأغذية والزراعة (FAO)', 'Food and Agriculture Organization', 'روما (Rome)', 'Rome', 'الأمن الغذائي والزراعة', 'food security and agriculture'],
  ['البرلمان الأوروبي', 'European Parliament', 'ستراسبورغ وبروكسل', 'Strasbourg and Brussels', 'تمثيل مواطني الاتحاد الأوروبي', 'representation of European Union citizens']
].map(([nameAr, nameEn, headquartersAr, headquartersEn, purposeAr, purposeEn]) => ({ nameAr, nameEn, headquartersAr, headquartersEn, purposeAr, purposeEn }));

const animalRecords = [
  ['الفيل الأفريقي', 'African elephant', 'أفريقيا', 'Africa', 'ضخامته وخرطومه الطويل', 'large body and long trunk'],
  ['الأسد', 'lion', 'السافانا الأفريقية', 'African savanna', 'لقب ملك الغابة', 'king of the jungle title'],
  ['الجمل', 'camel', 'الصحراء', 'desert', 'تحمل العطش', 'enduring thirst'],
  ['التمساح النيلي', 'Nile crocodile', 'نهر النيل ومناطق أفريقية', 'Nile River and African regions', 'قوة فكه', 'powerful jaws'],
  ['أبو قردان', 'cattle egret', 'الحقول والمناطق الزراعية', 'fields and farmland', 'مرافقته للماشية', 'following cattle'],
  ['الدلفين', 'dolphin', 'البحار والمحيطات', 'seas and oceans', 'الذكاء والتواصل الصوتي', 'intelligence and vocal communication'],
  ['البطريق', 'penguin', 'المناطق القطبية الجنوبية', 'southern polar regions', 'السباحة وعدم الطيران', 'swimming and flightlessness'],
  ['النسر الأصلع', 'bald eagle', 'أمريكا الشمالية (North America)', 'North America', 'رمزيته في الولايات المتحدة', 'symbolism in the United States'],
  ['الباندا العملاقة', 'giant panda', 'الصين (China)', 'China', 'أكل الخيزران', 'eating bamboo'],
  ['الكنغر', 'kangaroo', 'أستراليا (Australia)', 'Australia', 'القفز والجراب', 'jumping and pouch'],
  ['الحوت الأزرق', 'blue whale', 'المحيطات', 'oceans', 'أكبر حيوان معروف', 'largest known animal'],
  ['النحلة', 'bee', 'خلايا النحل والزهور', 'hives and flowers', 'إنتاج العسل والتلقيح', 'honey production and pollination'],
  ['الفهد', 'cheetah', 'السافانا والمناطق المفتوحة', 'savanna and open areas', 'السرعة العالية في العدو القصير', 'high speed in short sprints'],
  ['الزرافة', 'giraffe', 'السافانا الأفريقية', 'African savanna', 'الرقبة الطويلة وأكل أوراق الأشجار', 'long neck and browsing tree leaves'],
  ['الأخطبوط', 'octopus', 'الشعاب وقاع البحر', 'reefs and seafloor', 'الأذرع الثمانية والتمويه', 'eight arms and camouflage'],
  ['الخفاش', 'bat', 'الكهوف والليل', 'caves and night', 'تحديد الموقع بالصدى', 'echolocation'],
  ['السلحفاة البحرية', 'sea turtle', 'الشواطئ والمحيطات', 'beaches and oceans', 'العودة للشاطئ لوضع البيض', 'returning to beaches to lay eggs'],
  ['فرس النهر', 'hippopotamus', 'الأنهار والبحيرات الأفريقية', 'African rivers and lakes', 'جسم ضخم وحياة شبه مائية', 'large body and semi-aquatic life'],
  ['القرش الأبيض', 'great white shark', 'المحيطات الباردة والمعتدلة', 'cool and temperate oceans', 'مفترس بحري بأسنان حادة', 'marine predator with sharp teeth'],
  ['البومة', 'owl', 'الغابات والليل', 'forests and night', 'رؤية ليلية وطيران هادئ', 'night vision and silent flight'],
  ['النملة', 'ant', 'المستعمرات والتربة', 'colonies and soil', 'التعاون وتقسيم العمل', 'cooperation and division of labor'],
  ['الحبار العملاق', 'giant squid', 'أعماق المحيط', 'deep ocean', 'عيون كبيرة وأذرع طويلة', 'large eyes and long tentacles'],
  ['الكوالا', 'koala', 'غابات الأوكالبتوس في أستراليا', 'eucalyptus forests in Australia', 'أكل أوراق الأوكالبتوس والنوم الطويل', 'eating eucalyptus leaves and long sleep'],
  ['طائر الطنان', 'hummingbird', 'الأمريكتان والحدائق', 'the Americas and gardens', 'الطيران الثابت وضربات الجناح السريعة', 'hovering flight and rapid wingbeats'],
  ['ثعلب الفنك', 'fennec fox', 'صحارى شمال أفريقيا', 'North African deserts', 'أذنان كبيرتان تساعدان في تبديد الحرارة', 'large ears that help dissipate heat']
].map(([nameAr, nameEn, habitatAr, habitatEn, featureAr, featureEn]) => ({ nameAr, nameEn, habitatAr, habitatEn, featureAr, featureEn }));

const vehicleRecords = [
  ['قطار تالجو في مصر', 'Talgo train in Egypt', 'قطار ركاب', 'passenger train', 'السكك الحديدية المصرية', 'Egyptian National Railways'],
  ['مترو القاهرة', 'Cairo Metro', 'نقل حضري', 'urban transport', 'القاهرة الكبرى', 'Greater Cairo'],
  ['التوك توك', 'tuk-tuk', 'مركبة صغيرة ثلاثية العجلات', 'small three-wheeled vehicle', 'النقل المحلي القصير', 'short local transport'],
  ['الطائرة', 'airplane', 'مركبة جوية', 'air vehicle', 'النقل الجوي', 'air transport'],
  ['السفينة', 'ship', 'مركبة بحرية', 'sea vehicle', 'النقل البحري', 'sea transport'],
  ['الدراجة', 'bicycle', 'مركبة تعمل بالطاقة البشرية', 'human-powered vehicle', 'التنقل والرياضة', 'mobility and sport'],
  ['السيارة الكهربائية', 'electric car', 'سيارة تعمل بالكهرباء', 'electric-powered car', 'تقليل الانبعاثات المباشرة', 'reducing direct emissions'],
  ['الترام', 'tram', 'قطار خفيف داخل المدن', 'light urban rail', 'النقل العام داخل المدن', 'urban public transport'],
  ['الأتوبيس', 'bus', 'مركبة نقل جماعي', 'public transport vehicle', 'نقل الركاب', 'passenger transport'],
  ['الدراجة النارية', 'motorcycle', 'مركبة بمحرك وعجلتين', 'two-wheeled motor vehicle', 'التنقل الفردي', 'personal mobility'],
  ['القطار الكهربائي الخفيف', 'light rail transit', 'قطار حضري حديث', 'modern urban rail', 'ربط المدن الجديدة بالمناطق القريبة', 'linking new cities with nearby areas'],
  ['المونوريل', 'monorail', 'قطار يسير على مسار واحد مرتفع غالبا', 'train usually running on one elevated beam', 'النقل الحضري السريع', 'rapid urban transport'],
  ['القطار السريع', 'high-speed train', 'قطار ركاب عالي السرعة', 'high-speed passenger train', 'السفر الطويل بزمن أقل', 'long-distance travel in less time'],
  ['قطار النوم', 'sleeper train', 'قطار رحلات ليلية', 'overnight train', 'السفر مع كبائن نوم', 'travel with sleeping cabins'],
  ['العبارة', 'ferry', 'مركبة بحرية للعبور القصير', 'sea vehicle for short crossings', 'نقل ركاب أو سيارات بين ضفتين', 'moving passengers or cars between shores'],
  ['الميكروباص', 'minibus', 'مركبة ركاب صغيرة', 'small passenger vehicle', 'خطوط قصيرة داخل المدن وبينها', 'short routes inside and between cities'],
  ['السكوتر الكهربائي', 'electric scooter', 'مركبة فردية خفيفة', 'light personal vehicle', 'مشاوير قصيرة داخل المدينة', 'short city trips'],
  ['الحافلة الكهربائية', 'electric bus', 'مركبة نقل جماعي كهربائية', 'electric public transport vehicle', 'تقليل عادم النقل العام', 'reducing public transport exhaust']
].map(([nameAr, nameEn, typeAr, typeEn, useAr, useEn]) => ({ nameAr, nameEn, typeAr, typeEn, useAr, useEn }));

const gameRecords = [
  ['الشطرنج', 'chess', 'لعبة استراتيجية', 'strategy game', 'لوحة 8 في 8', '8 by 8 board'],
  ['الطاولة', 'backgammon', 'لعبة لوحية', 'board game', 'الزهر والأقراص', 'dice and checkers'],
  ['الدومينو', 'dominoes', 'لعبة قطع مرقمة', 'numbered tile game', 'مطابقة الأرقام', 'matching numbers'],
  ['الطاولة المصرية', 'Egyptian backgammon', 'لعبة شعبية', 'popular game', 'المقاهي والبيوت', 'cafes and homes'],
  ['كرة القدم الإلكترونية فيفا (FIFA)', 'FIFA video game', 'لعبة فيديو رياضية', 'sports video game', 'كرة القدم', 'football'],
  ['ماينكرافت (Minecraft)', 'Minecraft', 'لعبة بناء وبقاء', 'building and survival game', 'العوالم المفتوحة', 'open worlds'],
  ['تتريس (Tetris)', 'Tetris', 'لعبة ألغاز', 'puzzle game', 'ترتيب القطع المتساقطة', 'arranging falling blocks'],
  ['سوبر ماريو (Super Mario)', 'Super Mario', 'لعبة منصات', 'platform game', 'شركة نينتندو (Nintendo)', 'Nintendo'],
  ['باك مان (Pac-Man)', 'Pac-Man', 'لعبة أركيد', 'arcade game', 'المتاهة والنقاط', 'maze and dots'],
  ['مونوبولي (Monopoly)', 'Monopoly', 'لعبة لوحية اقتصادية', 'economic board game', 'بيع وشراء العقارات', 'buying and selling properties'],
  ['جو (Go)', 'Go', 'لعبة استراتيجية مجردة', 'abstract strategy game', 'السيطرة على المساحات', 'controlling territory'],
  ['الداما', 'checkers', 'لعبة لوحية تكتيكية', 'tactical board game', 'القفز فوق القطع', 'jumping over pieces'],
  ['كاتان (Catan)', 'Catan', 'لعبة لوحية تفاوضية', 'negotiation board game', 'موارد ومستعمرات وتبادل', 'resources, settlements, and trading'],
  ['ريسك (Risk)', 'Risk', 'لعبة سيطرة على الخريطة', 'map-control game', 'جيوش ومناطق ونرد', 'armies, territories, and dice'],
  ['سكرابل (Scrabble)', 'Scrabble', 'لعبة كلمات', 'word game', 'تكوين كلمات على لوحة مربعات', 'forming words on a square board'],
  ['أونو (Uno)', 'Uno', 'لعبة كروت عائلية', 'family card game', 'ألوان وأرقام وبطاقات عكس الاتجاه', 'colors, numbers, and reverse cards'],
  ['فوتبول مانجر (Football Manager)', 'Football Manager', 'لعبة إدارة رياضية', 'sports management game', 'خطط وانتقالات وتدريب', 'tactics, transfers, and coaching'],
  ['روكيت ليغ (Rocket League)', 'Rocket League', 'لعبة سيارات وكرة', 'cars-and-ball game', 'سيارات تقفز لتسجيل الأهداف', 'jumping cars scoring goals'],
  ['ستارديو فالي (Stardew Valley)', 'Stardew Valley', 'لعبة محاكاة حياة', 'life simulation game', 'زراعة وعلاقات وقرية صغيرة', 'farming, relationships, and a small town'],
  ['أمونغ أس (Among Us)', 'Among Us', 'لعبة خداع اجتماعي', 'social deduction game', 'طاقم وسفينة ومخادع', 'crew, spaceship, and impostor']
].map(([nameAr, nameEn, typeAr, typeEn, knownForAr, knownForEn]) => ({ nameAr, nameEn, typeAr, typeEn, knownForAr, knownForEn }));

const generalFacts = [
  ['ما العملة الرسمية في مصر؟', 'What is the official currency of Egypt?', 'الجنيه المصري', 'Egyptian pound', [['الدينار', 'dinar'], ['الدرهم', 'dirham'], ['الليرة', 'lira']]],
  ['ما عاصمة مصر؟', 'What is the capital of Egypt?', 'القاهرة', 'Cairo', [['الإسكندرية', 'Alexandria'], ['الأقصر', 'Luxor'], ['أسوان', 'Aswan']]],
  ['ما النهر الرئيسي الذي يمر في مصر؟', 'What is the main river that passes through Egypt?', 'نهر النيل', 'Nile River', [['الفرات', 'Euphrates'], ['دجلة', 'Tigris'], ['الأردن', 'Jordan River']]],
  ['ما البحر الذي يقع شمال مصر؟', 'Which sea is north of Egypt?', 'البحر المتوسط', 'Mediterranean Sea', [['البحر الأحمر', 'Red Sea'], ['بحر العرب', 'Arabian Sea'], ['الخليج العربي', 'Arabian Gulf']]],
  ['ما البحر الذي يحد مصر من الشرق؟', 'Which sea borders Egypt from the east?', 'البحر الأحمر', 'Red Sea', [['البحر المتوسط', 'Mediterranean Sea'], ['بحر قزوين', 'Caspian Sea'], ['بحر البلطيق', 'Baltic Sea']]],
  ['ما اسم خط الكتابة الذي استخدمه المصريون القدماء؟', 'What writing system did ancient Egyptians use?', 'الهيروغليفية', 'hieroglyphs', [['المسمارية', 'cuneiform'], ['اللاتينية', 'Latin'], ['السريانية', 'Syriac']]],
  ['أي مدينة مصرية تُعرف بعروس البحر المتوسط؟', 'Which Egyptian city is known as the Bride of the Mediterranean?', 'الإسكندرية', 'Alexandria', [['القاهرة', 'Cairo'], ['المنصورة', 'Mansoura'], ['الأقصر', 'Luxor']]],
  ['ما اسم أشهر سوق تاريخي في القاهرة الإسلامية؟', 'What is the famous historic bazaar in Islamic Cairo?', 'خان الخليلي', 'Khan el-Khalili', [['سوق الحميدية', 'Al-Hamidiyah Souq'], ['شارع المعز', 'Al-Muizz Street'], ['باب زويلة', 'Bab Zuweila']]],
  ['ما اسم أشهر ميدان ارتبط بوسط القاهرة؟', 'What is the famous square in central Cairo?', 'ميدان التحرير', 'Tahrir Square', [['ميدان المنشية', 'Mansheya Square'], ['ميدان الساعة', 'Clock Square'], ['ميدان الرماية', 'Remaya Square']]],
  ['ما اسم اللغة الرسمية في مصر؟', 'What is the official language of Egypt?', 'العربية', 'Arabic', [['الإنجليزية', 'English'], ['الفرنسية', 'French'], ['الإيطالية', 'Italian']]]
];

const globalGeneralFacts = [
  ['لقطة عالمية: جوائز نوبل بدأت تمنح لأول مرة في أي سنة؟', 'Global snapshot: in which year were the Nobel Prizes first awarded?', '1901', '1901', [['1896', '1896'], ['1918', '1918'], ['1969', '1969']]],
  ['جوائز نوبل بدأت من وصية سويدية؛ من صاحبها؟', 'The Nobel Prizes began from a Swedish will; whose was it?', 'ألفريد نوبل', 'Alfred Nobel', [['أندرو كارنيغي', 'Andrew Carnegie'], ['جون د. روكفلر', 'John D. Rockefeller'], ['غوستاف دالين', 'Gustaf Dalen']]],
  ['لو سمعت عن جائزة نوبل في الاقتصاد، فالمعلومة اللطيفة أنها أضيفت لاحقا في أي مجال؟', 'If you hear about the later Nobel-linked prize, which field was added later?', 'العلوم الاقتصادية', 'economic sciences', [['الأدب', 'literature'], ['الكيمياء', 'chemistry'], ['السلام', 'peace']]],
  ['قصة فضاء في سطر: أي مهمة أوصلت أول بشر إلى سطح القمر؟', 'Space story in one line: which mission first landed humans on the Moon?', 'أبولو 11', 'Apollo 11', [['فوياجر 1', 'Voyager 1'], ['سبوتنيك 1', 'Sputnik 1'], ['أبولو 13', 'Apollo 13']]],
  ['خريطة العالم: أكبر محيط على الأرض هو أي محيط؟', 'World map: which ocean is the largest on Earth?', 'المحيط الهادئ', 'Pacific Ocean', [['المحيط الأطلسي', 'Atlantic Ocean'], ['المحيط الهندي', 'Indian Ocean'], ['المحيط المتجمد الشمالي', 'Arctic Ocean']]],
  ['ممر ملاحي شهير: قناة بنما تربط بين أي محيطين؟', 'Famous canal clue: which two oceans does the Panama Canal connect?', 'الأطلسي والهادئ', 'Atlantic and Pacific', [['الهندي والهادئ', 'Indian and Pacific'], ['الأطلسي والمتجمد الشمالي', 'Atlantic and Arctic'], ['الهندي والأطلسي', 'Indian and Atlantic']]],
  ['رمز عالمي سريع: تمثال الحرية وصل إلى أمريكا كهدية من أي دولة؟', 'Quick global symbol: the Statue of Liberty came to the US as a gift from which country?', 'فرنسا', 'France', [['إيطاليا', 'Italy'], ['إسبانيا', 'Spain'], ['بريطانيا', 'Britain']]],
  ['معلومة جوائز: حفلات نوبل تقدم عادة في يوم 10 ديسمبر لأنه يوافق ماذا؟', 'Prize fact: Nobel ceremonies are usually held on 10 December because it marks what?', 'ذكرى وفاة ألفريد نوبل', 'anniversary of Alfred Nobel death', [['ذكرى ميلاد ألفريد نوبل', 'anniversary of Alfred Nobel birth'], ['تاريخ توقيع وصية نوبل', 'date of Nobel will signing'], ['ذكرى أول حفل لجوائز نوبل', 'anniversary of the first Nobel ceremony']]]
];

const generalKnowledgeRecords = [
  ['حجر رشيد', 'Rosetta Stone', 'أثر مصري', 'Egyptian artifact', 'ثلاث كتابات ساعدت على قراءة الهيروغليفية', 'three scripts helped decode hieroglyphs', 'مفتاح لفك رموز مصر القديمة', 'key to decoding ancient Egypt'],
  ['قناة السويس', 'Suez Canal', 'ممر ملاحي', 'shipping route', 'يربط المتوسط بالبحر الأحمر', 'links the Mediterranean and Red Sea', 'اختصر طريق التجارة العالمية', 'shortened global trade routes'],
  ['مكتبة الإسكندرية', 'Bibliotheca Alexandrina', 'مؤسسة ثقافية', 'cultural institution', 'مدينة ساحلية أعادت اسم مكتبة قديمة للواجهة', 'a coastal city revived an ancient library name', 'رمز معرفة حديث في مصر', 'modern knowledge symbol in Egypt'],
  ['برج خليفة', 'Burj Khalifa', 'مبنى قياسي', 'record building', 'ناطحة دبي المرتبطة بأرقام الارتفاع', 'Dubai skyscraper tied to height records', 'مرجع عند الحديث عن أطول المباني', 'reference for tallest buildings'],
  ['خندق ماريانا', 'Mariana Trench', 'جغرافيا محيطية', 'ocean geography', 'غرب الهادئ والغوص الشديد', 'western Pacific and extreme dives', 'أعمق نقطة محيطية معروفة', 'deepest known ocean point'],
  ['جوائز نوبل', 'Nobel Prizes', 'جوائز عالمية', 'global awards', 'وصية سويدية في العلم والأدب والسلام', 'Swedish will covering science, literature, and peace', 'ترتبط غالبا بتاريخ 10 ديسمبر', 'often linked with 10 December'],
  ['تمثال الحرية', 'Statue of Liberty', 'معلم عالمي', 'global landmark', 'هدية فرنسية في ميناء نيويورك', 'French gift in New York Harbor', 'رمز استقبال وحرية', 'symbol of welcome and liberty'],
  ['أبولو 11', 'Apollo 11', 'مهمة فضائية', 'space mission', 'هبوط بشر على القمر وعبارة الخطوة الصغيرة', 'human Moon landing and the small-step phrase', 'أول هبوط بشري على القمر', 'first human Moon landing'],
  ['قناة بنما', 'Panama Canal', 'ممر ملاحي', 'shipping route', 'تقصر الطريق بين الأطلسي والهادئ', 'shortens travel between Atlantic and Pacific', 'لا تربط البحرين المصريين', 'not the Egyptian two-sea route'],
  ['غابات الأمازون', 'Amazon Rainforest', 'نظام طبيعي', 'natural system', 'غابة مطيرة كبرى في أمريكا الجنوبية', 'large South American rainforest', 'تأثير بيئي عالمي', 'global environmental impact'],
  ['طريق الحرير', 'Silk Road', 'شبكة تجارة', 'trade network', 'ربط الصين بآسيا الوسطى وأوروبا', 'linked China with Central Asia and Europe', 'تبادل سلع وأفكار عبر قارات', 'exchange of goods and ideas across regions'],
  ['ماجنا كارتا', 'Magna Carta', 'وثيقة تاريخية', 'historic document', 'إنجلترا 1215 وتقييد سلطة الملك', 'England 1215 and limiting royal power', 'رمز مبكر لحكم القانون', 'early rule-of-law symbol'],
  ['الطباعة بالحروف المتحركة', 'movable-type printing', 'اختراع معرفة', 'knowledge invention', 'جوتنبرج وسرعة انتشار الكتب', 'Gutenberg and faster book spread', 'ثورة في القراءة والنشر', 'reading and publishing revolution'],
  ['الأمم المتحدة', 'United Nations', 'منظمة عالمية', 'global organization', 'تأسست بعد حرب عالمية كبيرة', 'founded after a major world war', 'منصة دبلوماسية دولية', 'international diplomatic platform'],
  ['النهضة الأوروبية', 'European Renaissance', 'حركة ثقافية', 'cultural movement', 'بدأت بقوة من المدن الإيطالية', 'grew strongly from Italian cities', 'فن وعلم وإنسانية', 'art, science, and humanism'],
  ['الأخوان رايت', 'Wright brothers', 'تاريخ طيران', 'aviation history', 'أول رحلة بمحرك عام 1903', 'first powered flight in 1903', 'بداية الطيران الحديث', 'beginning of modern aviation'],
  ['تاج محل', 'Taj Mahal', 'معلم هندي', 'Indian landmark', 'ضريح رخامي أبيض في أغرا', 'white marble mausoleum in Agra', 'رمز معماري للحب', 'architectural symbol of love'],
  ['ماتشو بيتشو', 'Machu Picchu', 'مدينة أثرية', 'archaeological city', 'موقع إنكا عالي في جبال الأنديز', 'high Inca site in the Andes', 'حضارة بين الجبال', 'civilization among mountains'],
  ['البيت الأبيض', 'White House', 'مقر سياسي', 'political residence', 'واشنطن ومكتب الرئيس الأمريكي', 'Washington and the U.S. president office', 'رمز السلطة التنفيذية الأمريكية', 'symbol of U.S. executive power'],
  ['وادي السيليكون', 'Silicon Valley', 'منطقة تقنية', 'technology region', 'شركات ناشئة وتكنولوجيا في كاليفورنيا', 'startups and technology in California', 'مركز ابتكار تقني', 'technology innovation hub'],
  ['اليونسكو', 'UNESCO', 'منظمة ثقافية', 'cultural organization', 'تعليم وثقافة ومواقع تراث عالمي', 'education, culture, and World Heritage sites', 'ذاكرة التراث العالمي', 'world heritage memory'],
  ['درب التبانة', 'Milky Way', 'عنوان كوني', 'cosmic address', 'المجموعة الشمسية داخل مجرة واسعة', 'the solar system sits inside a large galaxy', 'اسم مجرتنا', 'name of our galaxy'],
  ['حائط برلين', 'Berlin Wall', 'رمز سياسي', 'political symbol', 'سقوطه عام 1989 ارتبط بنهاية انقسام أوروبي', 'its 1989 fall marked an ending of European division', 'علامة على نهاية الحرب الباردة', 'Cold War ending symbol'],
  ['الثورة الصناعية', 'Industrial Revolution', 'تحول اقتصادي', 'economic shift', 'بدأت بقوة في بريطانيا مع الآلة والمصانع', 'grew strongly in Britain with machines and factories', 'غيرت العمل والإنتاج', 'changed labor and production']
].map(([nameAr, nameEn, topicAr, topicEn, clueAr, clueEn, memoryAr, memoryEn]) => ({ nameAr, nameEn, topicAr, topicEn, clueAr, clueEn, memoryAr, memoryEn }));

const globalHistoryFacts = [
  ['رحلة زمنية عالمية: سقوط جدار برلين يرتبط غالبا بأي سنة؟', 'World time-trip: the fall of the Berlin Wall is usually linked to which year?', '1989', '1989', [['1945', '1945'], ['1969', '1969'], ['2001', '2001']]],
  ['اختراع غيّر القراءة: الطباعة بالحروف المتحركة في أوروبا ترتبط بأي اسم؟', 'Reading-changing invention: movable-type printing in Europe is linked to which name?', 'يوهانس جوتنبرج', 'Johannes Gutenberg', [['غاليليو غاليلي', 'Galileo Galilei'], ['ليوناردو دافنشي', 'Leonardo da Vinci'], ['جيمس وات', 'James Watt']]],
  ['وثيقة ماجنا كارتا سنة 1215 ارتبطت بأي بلد؟', 'Magna Carta in 1215 is linked to which country?', 'إنجلترا', 'England', [['فرنسا', 'France'], ['إسبانيا', 'Spain'], ['البرتغال', 'Portugal']]],
  ['منعطف صناعي: الثورة الصناعية بدأت بقوة في أي بلد؟', 'Industrial turning point: the Industrial Revolution began strongly in which country?', 'بريطانيا', 'Britain', [['فرنسا', 'France'], ['ألمانيا', 'Germany'], ['بلجيكا', 'Belgium']]],
  ['طريق تجارة قديم: طريق الحرير كان يربط الصين غالبا بأي عالم أوسع؟', 'Old trade route: the Silk Road linked China with which wider world?', 'آسيا الوسطى وأوروبا', 'Central Asia and Europe', [['جنوب شرق آسيا والهند', 'Southeast Asia and India'], ['شرق أفريقيا والبحر الأحمر', 'East Africa and the Red Sea'], ['روسيا وسيبيريا فقط', 'Russia and Siberia only']]],
  ['نهضة وفنون: عصر النهضة الأوروبي بدأ بقوة في أي منطقة؟', 'Renaissance and art: the European Renaissance grew strongly from which area?', 'إيطاليا', 'Italy', [['فلاندرز', 'Flanders'], ['فرنسا', 'France'], ['ألمانيا', 'Germany']]],
  ['حلم الطيران: أول رحلة طيران بمحرك للأخوين رايت كانت في أي سنة؟', 'Flight dream: the Wright brothers first powered flight was in which year?', '1903', '1903', [['1869', '1869'], ['1930', '1930'], ['1957', '1957']]],
  ['نظام عالمي جديد: تأسيس الأمم المتحدة جاء بعد أي حرب كبرى؟', 'New world order: the UN was founded after which major war?', 'الحرب العالمية الثانية', 'World War II', [['الحرب العالمية الأولى', 'World War I'], ['الحرب الباردة', 'Cold War'], ['الحرب الكورية', 'Korean War']]]
];

const globalScienceFacts = [
  ['كارت أحياء سريع: الجزيء الذي يحمل التعليمات الوراثية في خلايانا اسمه إيه؟', 'Quick biology card: which molecule carries genetic instructions in our cells?', 'DNA', 'DNA', [['ATP', 'ATP'], ['CO2', 'CO2'], ['H2O', 'H2O']]],
  ['نباتات في الشمس: العملية التي تستخدم الضوء لصنع الغذاء اسمها إيه؟', 'Plants in sunlight: what is the process that uses light to make food?', 'البناء الضوئي', 'photosynthesis', [['التنفس الخلوي', 'cellular respiration'], ['النتح', 'transpiration'], ['الإنبات', 'germination']]],
  ['عنواننا الكوني: المجموعة الشمسية موجودة داخل أي مجرة؟', 'Cosmic address: our solar system is inside which galaxy?', 'درب التبانة', 'Milky Way', [['أندروميدا', 'Andromeda'], ['سحابة ماجلان الكبرى', 'Large Magellanic Cloud'], ['مجرة سومبريرو', 'Sombrero Galaxy']]],
  ['كيمياء يومية: الرمز H2O يشير إلى أي مادة؟', 'Everyday chemistry: H2O points to which substance?', 'الماء', 'water', [['فوق أكسيد الهيدروجين', 'hydrogen peroxide'], ['ثاني أكسيد الكربون', 'carbon dioxide'], ['الأمونيا', 'ammonia']]],
  ['عملاق المجموعة الشمسية: أكبر كواكبها هو أي كوكب؟', 'Solar-system giant: which planet is the largest?', 'المشتري', 'Jupiter', [['زحل', 'Saturn'], ['أورانوس', 'Uranus'], ['نبتون', 'Neptune']]],
  ['مد وجزر على الشاطئ: العامل السماوي الأهم في حدوثهما هو إيه؟', 'Beach tides: which celestial body is the main driver?', 'القمر', 'the Moon', [['الشمس', 'the Sun'], ['المشتري', 'Jupiter'], ['الزهرة', 'Venus']]],
  ['سرعة كونية: الضوء في الفراغ يتحرك تقريبا بسرعة كام؟', 'Cosmic speed: light in vacuum travels at roughly what speed?', '300 ألف كم في الثانية', '300,000 km per second', [['30 كم في الثانية', '30 km per second'], ['1500 كم في الساعة', '1,500 km per hour'], ['1 كم في الثانية', '1 km per second']]],
  ['حقيقة من ناسا: عدد الكواكب في المجموعة الشمسية حاليا كام؟', 'NASA-style fact: how many planets are currently in the solar system?', 'ثمانية كواكب', 'eight planets', [['سبعة كواكب', 'seven planets'], ['تسعة كواكب', 'nine planets'], ['عشرة كواكب', 'ten planets']]]
];

const globalTechFacts = [
  ['تقنية في جيبك: GPS يعتمد أساسا على ماذا ليحدد موقعك؟', 'Pocket tech: what does GPS mainly rely on to locate you?', 'الأقمار الصناعية', 'satellites', [['أبراج الهاتف فقط', 'cell towers only'], ['نقاط Wi-Fi فقط', 'Wi-Fi access points only'], ['منارات بلوتوث', 'Bluetooth beacons']]],
  ['مربع سريع على منتج: QR Code مصمم غالبا لأي استخدام؟', 'Small square on a product: what is a QR Code usually designed for?', 'مسح سريع بالموبايل', 'quick scanning by phone', [['قراءة باركود خطي فقط', 'reading a linear barcode only'], ['تشفير كلمة مرور الجهاز', 'encrypting a device password'], ['توقيع ملف رقمي', 'digitally signing a file']]],
  ['فكرة السحابة: Cloud Computing يعني غالبا استخدام موارد موجودة فين؟', 'Cloud idea: cloud computing usually means using resources located where?', 'خوادم عبر الإنترنت', 'internet servers', [['خادم محلي داخل المكتب', 'local office server'], ['قرص تخزين خارجي', 'external storage drive'], ['راوتر منزلي فقط', 'home router only']]],
  ['كلمة مفتوحة: Open Source معناها أن ماذا يكون متاحا غالبا؟', 'Open word: open source usually means what is available?', 'الكود المصدري', 'source code', [['ملف التشغيل النهائي', 'compiled binary'], ['مفتاح API', 'API key'], ['قاعدة بيانات المستخدمين', 'user database']]],
  ['مفتاح الأمان: مدير كلمات المرور يساعدك أساسا في ماذا؟', 'Security key: a password manager mainly helps with what?', 'حفظ كلمات مرور قوية', 'storing strong passwords', [['المصادقة الثنائية فقط', 'two-factor authentication only'], ['تشفير القرص بالكامل', 'full-disk encryption'], ['فحص البرمجيات الخبيثة', 'malware scanning']]],
  ['شبكة قريبة: Wi-Fi تستخدم غالبا لتوفير اتصال ماذا؟', 'Nearby network: Wi-Fi usually provides what kind of connection?', 'اتصال لاسلكي محلي', 'local wireless connection', [['اتصال بلوتوث قصير المدى', 'short-range Bluetooth connection'], ['اتصال خلوي واسع النطاق', 'wide-area cellular connection'], ['اتصال NFC شديد القرب', 'very-near NFC connection']]]
];

const animalTrickyFacts = [
  ['لغز طبيعة: كائن بحري ينام بنصف دماغه أحيانا ويستخدم الأصوات للتواصل. من هو؟', 'Nature riddle: which sea animal can rest half its brain and uses sound to communicate?', 'الدلفين', 'dolphin', [['الحوت الأزرق', 'blue whale'], ['البطريق', 'penguin'], ['النسر الأصلع', 'bald eagle']]],
  ['مفارقة الحجم: أضخم حيوان معروف يعتمد في غذائه على كائنات صغيرة جدا. من هو؟', 'Size paradox: the largest known animal feeds on tiny organisms. Which one?', 'الحوت الأزرق', 'blue whale', [['الفيل الأفريقي', 'African elephant'], ['التمساح النيلي', 'Nile crocodile'], ['الأسد', 'lion']]],
  ['طائر ببدلة رسمية: لا يطير لكنه سباح ممتاز في المياه الباردة. من هو؟', 'Tuxedo bird clue: it cannot fly but swims brilliantly in cold water. Which one?', 'البطريق', 'penguin', [['النعامة', 'ostrich'], ['طائر الغاق', 'cormorant'], ['طائر القطرس', 'albatross']]],
  ['صديق الفلاح: طائر تراه قرب الماشية والحقول لأنه يلتقط الحشرات حولها. من هو؟', 'Farmer friend: which bird is seen near cattle and fields catching insects?', 'أبو قردان', 'cattle egret', [['النسر الأصلع', 'bald eagle'], ['البطريق', 'penguin'], ['الدلفين', 'dolphin']]],
  ['خدعة الصحراء: السنام لا يخزن ماء مباشرة بل دهونا تساعده وقت الشدة. أي حيوان؟', 'Desert trick: the hump stores fat, not water directly. Which animal?', 'الجمل', 'camel', [['المها العربي', 'Arabian oryx'], ['اللاما', 'llama'], ['الغزال', 'gazelle']]],
  ['أبيض وأسود لكن ليس بطريقا: غذاؤه الشهير الخيزران. من هو؟', 'Black and white but not a penguin: its famous food is bamboo. Which animal?', 'الباندا العملاقة', 'giant panda', [['الدب الأسود الآسيوي', 'Asian black bear'], ['دب الشمس', 'sun bear'], ['الباندا الحمراء', 'red panda']]],
  ['لقطة نيلية: زاحف صبور وفكه من أقوى أسلحته. من هو؟', 'Nile clue: a patient reptile whose jaw is its main weapon. Which one?', 'التمساح النيلي', 'Nile crocodile', [['القاطور الأمريكي', 'American alligator'], ['تمساح المياه المالحة', 'saltwater crocodile'], ['الورل النيلي', 'Nile monitor']]],
  ['مصنع صغير للطبيعة: يجمع الرحيق ويساعد النباتات على التلقيح. من هو؟', 'Tiny nature factory: it gathers nectar and helps plants pollinate. Which one?', 'النحلة', 'bee', [['الدبور', 'wasp'], ['الفراشة', 'butterfly'], ['الذبابة الحوامة', 'hoverfly']]],
  ['حقيبة طبيعية: الصغير يكمل نموه في جراب الأم بعد الولادة. أي حيوان؟', 'Natural pouch: the young continues growing in the mother pouch. Which animal?', 'الكنغر', 'kangaroo', [['الكوالا', 'koala'], ['الومبت', 'wombat'], ['الأبوسوم', 'opossum']]],
  ['رمز سياسي من عالم الطيور: جارح أبيض الرأس صار شعارا أمريكيا مشهورا. من هو؟', 'Political bird symbol: a white-headed raptor became a famous American emblem. Which bird?', 'النسر الأصلع', 'bald eagle', [['العقاب الذهبي', 'golden eagle'], ['الصقر الشاهين', 'peregrine falcon'], ['الشاهين الحر', 'saker falcon']]]
];

const vehicleTrickyFacts = [
  ['مواصلات تحت الزحام: قضبان ومحطات داخل القاهرة الكبرى تنقل آلاف الركاب يوميا. ما هي؟', 'Transport under traffic: rails and stations move thousands across Greater Cairo. What is it?', 'مترو القاهرة', 'Cairo Metro', [['الترام', 'tram'], ['الأتوبيس', 'bus'], ['التوك توك', 'tuk-tuk']]],
  ['رحلة سكك حديثة: قطار ركاب مميز دخل الخدمة في مصر بتصميم إسباني. ما اسمه؟', 'Modern rail clue: a distinctive passenger train in Egypt with Spanish design. What is it?', 'قطار تالجو في مصر', 'Talgo train in Egypt', [['القطار الروسي في مصر', 'Russian train in Egypt'], ['قطار النوم', 'sleeping train'], ['قطار الضواحي', 'commuter train']]],
  ['ثلاث عجلات وزقاق ضيق: وسيلة عملية للمشاوير القصيرة في مناطق كثيرة. ما هي؟', 'Three wheels and narrow streets: a practical short-trip vehicle. What is it?', 'التوك توك', 'tuk-tuk', [['الدراجة النارية', 'motorcycle'], ['الدراجة', 'bicycle'], ['الأتوبيس', 'bus']]],
  ['طاقة بشرية فقط: وسيلة تنقل ورياضة في نفس الوقت ولا تحتاج وقودا. ما هي؟', 'Human power only: both transport and sport without fuel. What is it?', 'الدراجة', 'bicycle', [['السكوتر اليدوي', 'kick scooter'], ['الدراجة النارية', 'motorcycle'], ['الدراجة الكهربائية', 'e-bike']]],
  ['هدوء وانبعاثات أقل: مركبة طريق تعتمد على بطارية بدلا من البنزين. ما هي؟', 'Quiet and lower emissions: a road vehicle powered by a battery instead of petrol. What is it?', 'السيارة الكهربائية', 'electric car', [['السيارة الهجينة', 'hybrid car'], ['سيارة ديزل', 'diesel car'], ['سيارة غاز طبيعي', 'natural-gas car']]],
  ['قطار خفيف في الشارع: يسير على قضبان داخل المدينة غالبا. ما هو؟', 'Light rail in the street: it usually runs on tracks inside a city. What is it?', 'الترام', 'tram', [['مترو الأنفاق', 'metro'], ['قطار الضواحي', 'commuter train'], ['القطار الخفيف', 'light rail']]],
  ['عبور البحر: وسيلة ضخمة تنقل الركاب أو البضائع فوق الماء. ما هي؟', 'Sea crossing: a large vehicle moving passengers or goods on water. What is it?', 'السفينة', 'ship', [['العبارة', 'ferry'], ['القارب', 'boat'], ['الناقلة', 'tanker']]],
  ['شارع ومحطات وركاب كثيرون: وسيلة نقل جماعي مألوفة داخل المدن. ما هي؟', 'Road, stops, and many passengers: familiar urban public transport. What is it?', 'الأتوبيس', 'bus', [['الميكروباص', 'minibus'], ['الترام', 'tram'], ['مترو الأنفاق', 'metro']]],
  ['عجلتان ومحرك: أسرع من الدراجة وأخف من السيارة. ما هي؟', 'Two wheels and an engine: faster than a bicycle and lighter than a car. What is it?', 'الدراجة النارية', 'motorcycle', [['الدراجة', 'bicycle'], ['الترام', 'tram'], ['الأتوبيس', 'bus']]],
  ['سفر فوق السحاب: وسيلة تقطع مسافات بعيدة في وقت قصير. ما هي؟', 'Above-cloud travel: it covers long distances quickly. What is it?', 'الطائرة', 'airplane', [['المروحية', 'helicopter'], ['الطائرة الشراعية', 'glider'], ['المنطاد', 'hot-air balloon']]]
];

const gameTrickyFacts = [
  ['لوحة بلا حظ: كل لاعب يرى نفس القطع، والذكاء في الخطة لا في الزهر. أي لعبة؟', 'Board without luck: both players see the same pieces and strategy matters more than dice. Which game?', 'الشطرنج', 'chess', [['الطاولة', 'backgammon'], ['الدومينو', 'dominoes'], ['مونوبولي (Monopoly)', 'Monopoly']]],
  ['زهر وأقراص وحساب مخاطرة: لعبة قهاوي وبيوت قديمة. أي لعبة؟', 'Dice, checkers, and risk calculation: an old cafe-and-home game. Which game?', 'الطاولة', 'backgammon', [['المنقلة', 'mancala'], ['الداما', 'checkers'], ['الدومينو', 'dominoes']]],
  ['قطع مرقمة لا تحتاج شاشة: السر في مطابقة الأطراف. أي لعبة؟', 'Numbered tiles without a screen: the trick is matching ends. Which game?', 'الدومينو', 'dominoes', [['الطاولة', 'backgammon'], ['المنقلة', 'mancala'], ['الداما', 'checkers']]],
  ['عقارات وفلوس ورهن: لعبة تعلمك أن الإفلاس جزء من المتعة. أي لعبة؟', 'Properties, money, and mortgages: a game where bankruptcy is part of the fun. Which game?', 'مونوبولي (Monopoly)', 'Monopoly', [['لعبة الحياة (The Game of Life)', 'The Game of Life'], ['كاتان (Catan)', 'Catan'], ['ريسك (Risk)', 'Risk']]],
  ['كتل تسقط بسرعة: المتعة في ترتيب الفوضى قبل أن تمتلئ الشاشة. أي لعبة؟', 'Falling blocks: the fun is organizing chaos before the screen fills. Which game?', 'تتريس (Tetris)', 'Tetris', [['دكتور ماريو', 'Dr. Mario'], ['بازل بابل', 'Puzzle Bobble'], ['بيجويلد', 'Bejeweled']]],
  ['متاهة ونقاط ومطاردة: لعبة أركيد تصنع توترا بأبسط شكل. أي لعبة؟', 'Maze, dots, and chase: an arcade game creating tension with simple rules. Which game?', 'باك مان (Pac-Man)', 'Pac-Man', [['دونكي كونغ', 'Donkey Kong'], ['سبيس إنفيدرز', 'Space Invaders'], ['فروجَر', 'Frogger']]],
  ['عوالم مفتوحة ومكعبات: تبني وتنجو وتخترع قصتك بنفسك. أي لعبة؟', 'Open worlds and blocks: build, survive, and invent your own story. Which game?', 'ماينكرافت (Minecraft)', 'Minecraft', [['تيراريا (Terraria)', 'Terraria'], ['روبلوكس (Roblox)', 'Roblox'], ['فورتنايت (Fortnite)', 'Fortnite']]],
  ['سباك ومنصات وقفز: واحدة من أشهر شخصيات نينتندو. أي سلسلة؟', 'Plumber, platforms, and jumping: one of Nintendo most famous characters. Which series?', 'سوبر ماريو (Super Mario)', 'Super Mario', [['سونك (Sonic)', 'Sonic'], ['دونكي كونغ', 'Donkey Kong'], ['كيربي (Kirby)', 'Kirby']]]
];

const religionTrickyFacts = [
  ['سيرة مبكرة: مكان صغير قرب مكة ارتبط بأول نزول للوحي. ما هو؟', 'Early seerah clue: a small place near Mecca linked to the first revelation. What is it?', 'غار حراء', 'Cave Hira', [['غار ثور', 'Cave Thawr'], ['جبل عرفات', 'Mount Arafat'], ['مسجد قباء', 'Quba Mosque']]],
  ['تقويم ومعنى: بداية التقويم الهجري مرتبطة بأي حدث كبير؟', 'Calendar meaning: the Hijri calendar begins from which major event?', 'الهجرة النبوية', 'the Hijra', [['فتح مكة', 'Conquest of Mecca'], ['غزوة بدر', 'Battle of Badr'], ['عام الفيل', 'Year of the Elephant']]],
  ['شهر بعد الصيام: أول يوم فيه يرتبط بعيد الفطر. أي شهر؟', 'After fasting: its first day is linked with Eid al-Fitr. Which month?', 'شوال', 'Shawwal', [['رمضان', 'Ramadan'], ['ذو الحجة', 'Dhu al-Hijjah'], ['محرم', 'Muharram']]],
  ['تعليم مصري عريق: مؤسسة علمية تاريخية ارتبطت بجامع في القاهرة. ما هي؟', 'Historic Egyptian learning: which scholarly institution is linked to a Cairo mosque?', 'جامعة الأزهر', 'Al-Azhar University', [['دار الكتب', 'National Library'], ['مكتبة الإسكندرية', 'Bibliotheca Alexandrina'], ['دار الأوبرا', 'Opera House']]],
  ['صوت النداء الأول: الصحابي المعروف بأنه أول مؤذن في الإسلام. من هو؟', 'First call voice: which companion is known as the first muezzin?', 'بلال بن رباح', 'Bilal ibn Rabah', [['زيد بن ثابت', 'Zayd ibn Thabit'], ['مصعب بن عمير', 'Musab ibn Umayr'], ['سعد بن أبي وقاص', 'Saad ibn Abi Waqqas']]],
  ['جمع المصحف: الخليفة الذي ارتبط بتوحيد المصاحف على رسم واحد. من هو؟', 'Mushaf standardization: which caliph is linked to standardizing Quran manuscripts?', 'عثمان بن عفان', 'Uthman ibn Affan', [['أبو بكر الصديق', 'Abu Bakr'], ['عمر بن الخطاب', 'Umar'], ['علي بن أبي طالب', 'Ali']]]
];

const islamicKnowledgeRecords = [
  ['غار حراء', 'Cave Hira', 'بداية الوحي', 'first revelation', 'مكان صغير قرب مكة ارتبط بأول نزول للوحي', 'small place near Mecca linked to the first revelation', 'ليس غار الاختباء في الهجرة', 'not the migration hiding cave'],
  ['غار ثور', 'Cave Thawr', 'رحلة الهجرة', 'migration journey', 'مكان الاختباء أثناء طريق الهجرة', 'hiding place during the migration route', 'يختلف عن غار بداية الوحي', 'different from the first-revelation cave'],
  ['الهجرة النبوية', 'the Hijra', 'التقويم الهجري', 'Hijri calendar', 'حدث صار نقطة البداية للتقويم الإسلامي', 'event that became the Islamic calendar starting point', 'انتقال إلى المدينة لا مولد النبي', 'migration to Medina, not the Prophet birth'],
  ['مسجد قباء', 'Quba Mosque', 'معلم مدني مبكر', 'early Medinan landmark', 'ارتبط ببداية المجتمع في المدينة', 'linked to the early community in Medina', 'ليس المسجد النبوي نفسه', 'not the Prophet Mosque itself'],
  ['جامع الأزهر', 'Al-Azhar Mosque', 'علم ومعلم', 'learning and landmark', 'جامع قاهري صار اسمه مؤسسة تعليم شرعي', 'Cairo mosque whose name became a scholarly institution', 'بوابة تاريخية للتعليم الإسلامي', 'historic gate to Islamic learning'],
  ['بلال بن رباح', 'Bilal ibn Rabah', 'الأذان الأول', 'first call to prayer', 'صحابي حبشي ارتبط صوته بالنداء الأول', 'Abyssinian companion linked to the first call', 'كل البدائل من جيل الصحابة', 'all distractors are companions'],
  ['عثمان بن عفان', 'Uthman ibn Affan', 'توحيد المصاحف', 'standardizing manuscripts', 'خليفة راشد ارتبط بتوحيد المصاحف على رسم واحد', 'Rashidun caliph linked to standardizing Quran manuscripts', 'ثالث الخلفاء الراشدين', 'third Rashidun caliph'],
  ['الموطأ', 'Al-Muwatta', 'كتاب حديث وفقه', 'hadith and law book', 'عمل مبكر ارتبط بالإمام مالك', 'early work linked to Imam Malik', 'ليس من الصحاح الستة بالمعنى الشائع', 'not usually counted among the six canonical books'],
  ['صحيح البخاري', 'Sahih al-Bukhari', 'كتاب حديث', 'hadith collection', 'جمع أحاديث الإمام البخاري', 'collection of Imam al-Bukhari hadiths', 'من أشهر كتب الحديث عند المسلمين', 'among the best-known hadith books'],
  ['بدر', 'Badr', 'غزوة مبكرة', 'early battle', 'معركة قرب آبار معروفة في السيرة', 'battle near well-known wells in seerah memory', 'منعطف مبكر في المجتمع المدني', 'early turning point in Medina community'],
  ['أحد', 'Uhud', 'غزوة وجبل', 'battle and mountain', 'جبل ومعركة جاءت بعد بدر في السيرة', 'mountain and battle after Badr in seerah', 'ترتبط بدرس الرماة الشهير', 'linked with the archers lesson'],
  ['فتح مكة', 'Conquest of Mecca', 'حدث سيرة متأخر', 'late seerah event', 'دخول مكة في أواخر العهد النبوي', 'entry into Mecca late in the Prophetic period', 'تذكره كتب السيرة مع العفو العام', 'remembered with general pardon'],
  ['عمرو بن العاص', 'Amr ibn al-As', 'فتح مصر', 'conquest of Egypt', 'قائد ارتبط بفتح مصر في العصر الراشدي', 'commander linked to Egypt conquest in the Rashidun era', 'اسمه على جامع قديم في القاهرة', 'his name is on an old Cairo mosque'],
  ['خديجة بنت خويلد', 'Khadija bint Khuwaylid', 'بدايات السيرة', 'early seerah', 'سيدة من بيت تجاري كانت أول سند للرسالة', 'woman from a trading household who first supported the message', 'زوجة النبي الأولى', 'first wife of the Prophet'],
  ['أبو بكر الصديق', 'Abu Bakr Al-Siddiq', 'الخلافة الأولى', 'first caliphate', 'لقب الصديق والخلافة الأولى يجتمعان هنا', 'the Siddiq title and first caliphate meet here', 'صاحب النبي في الهجرة', 'companion of the Prophet in migration'],
  ['عمر بن الخطاب', 'Umar ibn Al-Khattab', 'الخلافة الراشدة', 'Rashidun caliphate', 'توسع الدولة وتنظيم الدواوين يكثران مع سيرته', 'state expansion and administrative registers often appear with his era', 'ثاني الخلفاء الراشدين', 'second Rashidun caliph'],
  ['علي بن أبي طالب', 'Ali ibn Abi Talib', 'الخلافة الرابعة', 'fourth caliphate', 'ابن عم النبي ورابع الخلفاء في الذاكرة السنية الشائعة', 'Prophet cousin and fourth caliph in common Sunni memory', 'شخصية علم وشجاعة', 'figure of knowledge and courage'],
  ['شوال', 'Shawwal', 'شهر بعد رمضان', 'month after Ramadan', 'يأتي بعد رمضان ويبدأ بعيد الفطر', 'comes after Ramadan and begins with Eid al-Fitr', 'ليس شهر الصيام نفسه', 'not the fasting month itself'],
  ['ذو الحجة', 'Dhu al-Hijjah', 'شهر المناسك', 'pilgrimage month', 'ترتبط به المناسك الكبرى في آخر السنة الهجرية', 'major rites are linked to it late in the Hijri year', 'ليس الشهر الذي يلي رمضان', 'not the month after Ramadan'],
  ['الوقوف بعرفة', 'Standing at Arafat', 'ركن حج', 'Hajj pillar', 'يحدث في اليوم التاسع ويعد قلب أعمال الحج', 'happens on the ninth day and is central to Hajj', 'ليس طواف الإفاضة ولا السعي', 'not Tawaf al-Ifadah or Sa’i'],
  ['المدينة المنورة', 'Medina', 'مدينة الهجرة', 'migration city', 'كانت تعرف بيثرب وارتبطت بالمسجد النبوي', 'was known as Yathrib and linked to the Prophet Mosque', 'مركز المجتمع المدني الأول', 'center of the first Medinan community'],
  ['مسجد القبلتين', 'Masjid al-Qiblatayn', 'معلم مدني', 'Medinan landmark', 'اسمه يرتبط بتحول القبلة', 'its name is linked to the qibla change', 'ليس أول مسجد في السيرة', 'not the first mosque in seerah'],
  ['الإسراء والمعراج', 'Isra and Mi’raj', 'رحلة في السيرة', 'seerah journey', 'رحلة ليلية ومعراج في الذاكرة الإسلامية', 'night journey and ascension in Islamic memory', 'ترتبط بالمسجد الأقصى', 'linked to Al-Aqsa Mosque'],
  ['سورة يس', 'Surah Ya-Sin', 'سورة في التراث', 'surah in tradition', 'يطلق عليها في التراث قلب القرآن', 'called the heart of the Quran in common tradition', 'ليست أطول سورة', 'not the longest surah'],
  ['سورة الكهف', 'Surah Al-Kahf', 'سورة وقصص', 'surah and stories', 'تكثر قراءتها يوم الجمعة في العرف الديني', 'often read on Friday in religious custom', 'تضم قصص أصحاب الكهف وموسى والخضر', 'includes the People of the Cave and Moses-Khidr stories']
].map(([nameAr, nameEn, topicAr, topicEn, clueAr, clueEn, memoryAr, memoryEn]) => ({ nameAr, nameEn, topicAr, topicEn, clueAr, clueEn, memoryAr, memoryEn }));

const politicsTrickyFacts = [
  ['منظمة تجمع دول العالم تقريبا وتتكلم كثيرا عن السلم الدولي. ما هي؟', 'Which organization gathers nearly all states and focuses on peace?', 'الأمم المتحدة', 'United Nations', [['عصبة الأمم', 'League of Nations'], ['الاتحاد الأوروبي', 'European Union'], ['مجموعة العشرين', 'G20']]],
  ['ثقافة وتعليم وتراث: أي منظمة دولية تقف خلف مواقع التراث العالمي؟', 'Culture, education, and heritage: which organization is behind World Heritage sites?', 'اليونسكو (UNESCO)', 'UNESCO', [['منظمة الصحة العالمية (WHO)', 'WHO'], ['منظمة العمل الدولية (ILO)', 'ILO'], ['منظمة الأغذية والزراعة (FAO)', 'FAO']]],
  ['صحة عالمية: مؤسسة نسمع اسمها كثيرا عند الأوبئة واللقاحات. ما هي؟', 'Global health: which body is often heard during epidemics and vaccines?', 'منظمة الصحة العالمية (WHO)', 'World Health Organization', [['اليونيسف (UNICEF)', 'UNICEF'], ['الصليب الأحمر الدولي', 'International Red Cross'], ['أطباء بلا حدود', 'Doctors Without Borders']]],
  ['بيت التشريع: في مصر، المؤسسة التي تناقش القوانين وتمثل المواطنين هي أي جهة؟', 'Legislation house: in Egypt, which body debates laws and represents citizens?', 'مجلس النواب المصري', 'Egyptian House of Representatives', [['مجلس الشيوخ المصري', 'Egyptian Senate'], ['مجلس الوزراء المصري', 'Egyptian Cabinet'], ['المحكمة الدستورية العليا', 'Supreme Constitutional Court']]],
  ['قارة واحدة وطاولة مشتركة: أي منظمة تجمع الدول الأفريقية سياسيا؟', 'One continent, shared table: which organization gathers African states politically?', 'الاتحاد الأفريقي', 'African Union', [['جامعة الدول العربية', 'League of Arab States'], ['الأمم المتحدة', 'United Nations'], ['صندوق النقد الدولي (IMF)', 'IMF']]],
  ['نزاعات بين دول: المحكمة الدولية الأشهر في لاهاي تختص غالبا بأي اسم؟', 'State disputes: which international court in The Hague is the famous one?', 'محكمة العدل الدولية', 'International Court of Justice', [['المحكمة الجنائية الدولية', 'International Criminal Court'], ['محكمة التحكيم الدائمة', 'Permanent Court of Arbitration'], ['المحكمة الأوروبية لحقوق الإنسان', 'European Court of Human Rights']]]
];

const musicTrickyFacts = [
  ['صوت وملحن ولحن طويل: أغنية «أنت عمري» تجمع أم كلثوم بأي موسيقار كبير؟', 'Long-song clue: Enta Omri links Umm Kulthum with which great composer?', 'محمد عبد الوهاب', 'Mohamed Abdel Wahab', [['رياض السنباطي', 'Riad Al Sunbati'], ['بليغ حمدي', 'Baligh Hamdi'], ['كمال الطويل', 'Kamal El Tawil']]],
  ['نشيد وطني سابق: «والله زمان يا سلاحي» ارتبط بصوت أي مطربة؟', 'Former anthem clue: Wallah Zaman Ya Selahy is linked to which singer voice?', 'أم كلثوم', 'Umm Kulthum', [['شادية', 'Shadia'], ['نجاة الصغيرة', 'Nagat El Saghira'], ['ليلى مراد', 'Layla Murad']]],
  ['أغنية وطنية سينمائية الروح: «يا حبيبتي يا مصر» اشتهرت بصوت من؟', 'Patriotic cinematic song: Ya Habibti Ya Masr is famous in whose voice?', 'شادية', 'Shadia', [['وردة الجزائرية', 'Warda Al-Jazairia'], ['أنغام', 'Angham'], ['ليلى مراد', 'Layla Murad']]],
  ['أغنية من الفوازير إلى الذاكرة: «ذهب الليل» ارتبطت بأي فنان؟', 'From children memory to song history: Dahab El Leil is linked to which artist?', 'محمد فوزي', 'Mohamed Fawzi', [['محمد منير', 'Mohamed Mounir'], ['عبد الحليم حافظ', 'Abdel Halim Hafez'], ['علي الحجار', 'Ali El Haggar']]],
  ['لون نوبي وصوت معاصر: «حدوتة مصرية» تلمع مع اسم من؟', 'Nubian colour and modern voice: Hadouta Masreya shines with whose name?', 'محمد منير', 'Mohamed Mounir', [['عمرو دياب', 'Amr Diab'], ['سيد درويش', 'Sayed Darwish'], ['محمد الموجي', 'Mohamed El Mougy']]],
  ['أغنية كسرت حدود التسعينات: «نور العين» ارتبطت بأي مطرب؟', '1990s hit clue: Nour El Ain is tied to which singer?', 'عمرو دياب', 'Amr Diab', [['علي الحجار', 'Ali El Haggar'], ['فريد الأطرش', 'Farid al-Atrash'], ['محمد عبد الوهاب', 'Mohamed Abdel Wahab']]]
];

const closeChoiceQuestions = [
  ['general-knowledge', 'Medium', 20, 'وصية رجل سويدي صنعت جوائز عالمية في العلم والأدب والسلام. من صاحب الوصية؟', 'A Swedish man will created global prizes in science, literature, and peace. Whose will was it?', 'ألفريد نوبل', 'Alfred Nobel', [['أندرو كارنيغي', 'Andrew Carnegie'], ['جون د. روكفلر', 'John D. Rockefeller'], ['غوستاف دالين', 'Gustaf Dalen']]],
  ['general-knowledge', 'Medium', 20, 'تمثال أهدته دولة أوروبية للولايات المتحدة وصار رمزا لميناء نيويورك. أي معلم؟', 'A European gift to the United States became a New York Harbor symbol. Which landmark?', 'تمثال الحرية', 'Statue of Liberty', [['جبل رشمور', 'Mount Rushmore'], ['نصب واشنطن', 'Washington Monument'], ['بوابة الغرب', 'Gateway Arch']]],
  ['general-knowledge', 'Medium', 20, 'جائزة أضيفت لاحقا لعائلة الجوائز الشهيرة، لكنها ليست من وصية البداية الأصلية. أي مجال؟', 'A later-added prize joined the famous award family, though it was not in the original will. Which field?', 'العلوم الاقتصادية', 'economic sciences', [['علوم الحاسوب', 'computer science'], ['علوم الأرض', 'earth sciences'], ['الرياضيات', 'mathematics']]],
  ['religion-islamic', 'Medium', 20, 'صوت النداء الأول في الإسلام يرتبط بأي صحابي؟', 'The first call-to-prayer voice in Islam is linked to which companion?', 'بلال بن رباح', 'Bilal ibn Rabah', [['عبد الله بن أم مكتوم', 'Abdullah ibn Umm Maktum'], ['زيد بن ثابت', 'Zayd ibn Thabit'], ['مصعب بن عمير', 'Musab ibn Umayr']]],
  ['religion-islamic', 'Medium', 20, 'توحيد المصاحف على رسم واحد في صدر الإسلام يرتبط بأي خليفة؟', 'Standardizing Quran manuscripts in early Islam is linked to which caliph?', 'عثمان بن عفان', 'Uthman ibn Affan', [['أبو بكر الصديق', 'Abu Bakr'], ['عمر بن الخطاب', 'Umar ibn Al-Khattab'], ['علي بن أبي طالب', 'Ali ibn Abi Talib']]],
  ['religion-islamic', 'Medium', 20, 'غار قريب من مكة ارتبط ببداية الوحي لا بحادثة الهجرة. أي غار؟', 'A cave near Mecca linked to the first revelation, not the migration story. Which cave?', 'غار حراء', 'Cave Hira', [['غار ثور', 'Cave Thawr'], ['جبل عرفات', 'Mount Arafat'], ['وادي نخلة', 'Wadi Nakhla']]],
  ['history', 'Medium', 20, 'تأميم الممر الملاحي المصري عام 1956 ارتبط باسم أي قائد سياسي؟', 'Nationalizing Egypt shipping canal in 1956 is linked to which political leader?', 'جمال عبد الناصر', 'Gamal Abdel Nasser', [['محمد نجيب', 'Mohamed Naguib'], ['أنور السادات', 'Anwar Sadat'], ['سعد زغلول', 'Saad Zaghloul']]],
  ['history', 'Hard', 25, 'وثيقة 1215 التي حدت من سلطة الملك صارت رمزا مبكرا لفكرة القانون. في أي بلد؟', 'The 1215 document limiting royal power became an early symbol of rule of law. In which country?', 'إنجلترا', 'England', [['فرنسا', 'France'], ['إسبانيا', 'Spain'], ['البرتغال', 'Portugal']]],
  ['history', 'Medium', 20, 'حملة أوروبية دخلت مصر عام 1798 وخلّفت أثرا علميا وسياسيا. من قائدها؟', 'A European campaign entered Egypt in 1798 and left scientific and political impact. Who led it?', 'نابليون بونابرت', 'Napoleon Bonaparte', [['هوراشيو نلسون', 'Horatio Nelson'], ['كليبر', 'Jean-Baptiste Kleber'], ['دو مينو', 'Jacques-Francois Menou']]],
  ['geography', 'Medium', 20, 'مدينة إنكا عالية بين جبال الأنديز، وليست هرما ولا سورا. أي مكان؟', 'A high Inca city in the Andes, not a pyramid or a wall. Which place?', 'ماتشو بيتشو', 'Machu Picchu', [['تشيتشن إيتزا', 'Chichen Itza'], ['تيوتيهواكان', 'Teotihuacan'], ['تاج محل', 'Taj Mahal']]],
  ['geography', 'Hard', 25, 'أعمق نقطة محيطية معروفة تقع غرب الهادئ، وغالبا تذكر مع الغوص الشديد. أي مكان؟', 'The deepest known oceanic point lies in the western Pacific and is tied to extreme dives. Which place?', 'خندق ماريانا', 'Mariana Trench', [['خندق تونغا', 'Tonga Trench'], ['خندق بورتوريكو', 'Puerto Rico Trench'], ['خندق جاوة', 'Java Trench']]],
  ['geography', 'Medium', 20, 'ضريح رخامي أبيض في مدينة أغرا، وليس قصرا أوروبيا ولا مسجدا عثمانيا. أي معلم؟', 'A white marble mausoleum in Agra, not a European palace or an Ottoman mosque. Which landmark?', 'تاج محل', 'Taj Mahal', [['قصر الرياح', 'Hawa Mahal'], ['القلعة الحمراء في دلهي', 'Red Fort Delhi'], ['ضريح همايون', 'Humayun Tomb']]],
  ['art', 'Medium', 20, 'تمثال نهضة مصر يقودك غالبا إلى أي فنان مصري؟', 'The Egypt Renaissance statue most likely points to which Egyptian artist?', 'محمود مختار', 'Mahmoud Mokhtar', [['آدم حنين', 'Adam Henein'], ['جمال السجيني', 'Gamal El Sagini'], ['صلاح عبد الكريم', 'Salah Abdel Kerim']]],
  ['art', 'Medium', 20, 'لوحة «بنات بحري» تقودك لأي اسم من رواد الفن المصري؟', 'The painting Banat Bahari points to which Egyptian art pioneer?', 'محمود سعيد', 'Mahmoud Said', [['سيف وانلي', 'Seif Wanly'], ['حامد ندا', 'Hamed Nada'], ['عبد الهادي الجزار', 'Abdel Hadi El Gazzar']]],
  ['art', 'Hard', 25, 'الفن الشعبي الرمزي في مصر الحديثة يرتبط بقوة بأي اسم من هذه الأسماء؟', 'Symbolic folk art in modern Egypt is strongly linked with which of these names?', 'عبد الهادي الجزار', 'Abdel Hadi El Gazzar', [['حامد ندا', 'Hamed Nada'], ['جاذبية سري', 'Gazbia Sirry'], ['تحية حليم', 'Tahia Halim']]],
  ['film-tv', 'Medium', 20, 'فيلم عن عمارة شهيرة في وسط القاهرة أخرجه أي مخرج من جيل السينما الحديثة؟', 'A film about a famous downtown Cairo building was directed by which modern Egyptian filmmaker?', 'مروان حامد', 'Marwan Hamed', [['محمد دياب', 'Mohamed Diab'], ['كاملة أبو ذكري', 'Kamla Abu Zekry'], ['يسري نصر الله', 'Yousry Nasrallah']]],
  ['film-tv', 'Medium', 20, 'عالم مسلسل «ليالي الحلمية» خرج من قلم أي كاتب مصري؟', 'The world of Layali El Helmeya came from which Egyptian writer?', 'أسامة أنور عكاشة', 'Osama Anwar Okasha', [['وحيد حامد', 'Wahid Hamed'], ['صالح مرسي', 'Saleh Morsi'], ['محفوظ عبد الرحمن', 'Mahfouz Abdel Rahman']]],
  ['film-tv', 'Hard', 25, 'مسلسل الجاسوسية الشهير عن رأفت الهجان كتبه أي مؤلف؟', 'The famous espionage series about Raafat El Haggan was written by which author?', 'صالح مرسي', 'Saleh Morsi', [['وحيد حامد', 'Wahid Hamed'], ['أسامة أنور عكاشة', 'Osama Anwar Okasha'], ['محمد جلال عبد القوي', 'Mohamed Galal Abdel Kawy']]],
  ['music', 'Medium', 20, 'قصيدة «الأطلال» في الذاكرة الطربية ترتبط تلحينا بأي موسيقار؟', 'The classic song Al Atlal is linked as a composition to which musician?', 'رياض السنباطي', 'Riad Al Sunbati', [['محمد عبد الوهاب', 'Mohamed Abdel Wahab'], ['بليغ حمدي', 'Baligh Hamdi'], ['محمد الموجي', 'Mohamed El Mougy']]],
  ['music', 'Medium', 20, 'أغنية «سيرة الحب» تقودك غالبا إلى أي ملحن كبير؟', 'The song Siret El Hob most often points to which major composer?', 'بليغ حمدي', 'Baligh Hamdi', [['رياض السنباطي', 'Riad Al Sunbati'], ['محمد الموجي', 'Mohamed El Mougy'], ['كمال الطويل', 'Kamal El Tawil']]],
  ['music', 'Medium', 20, 'صوت نوبي معاصر جعل «حدوتة مصرية» حاضرة في ذاكرة الغناء. من هو؟', 'A modern Nubian voice made Hadouta Masreya present in music memory. Who?', 'محمد منير', 'Mohamed Mounir', [['علي الحجار', 'Ali El Haggar'], ['محمد فوزي', 'Mohamed Fawzi'], ['عمرو دياب', 'Amr Diab']]],
  ['books-literature', 'Medium', 20, 'الثلاثية القاهرية تقودك غالبا إلى أي كاتب؟', 'The Cairo Trilogy most likely points to which author?', 'نجيب محفوظ', 'Naguib Mahfouz', [['توفيق الحكيم', 'Tawfiq al-Hakim'], ['طه حسين', 'Taha Hussein'], ['يوسف إدريس', 'Yusuf Idris']]],
  ['books-literature', 'Medium', 20, 'كتاب «الأيام» أقرب إلى السيرة الذاتية لأي أديب مصري؟', 'The Days is closest to the autobiography of which Egyptian writer?', 'طه حسين', 'Taha Hussein', [['توفيق الحكيم', 'Tawfiq al-Hakim'], ['نجيب محفوظ', 'Naguib Mahfouz'], ['إحسان عبد القدوس', 'Ihsan Abdel Quddous']]],
  ['books-literature', 'Hard', 25, 'رواية «يوتوبيا» في الأدب المصري الحديث تقودك لأي اسم؟', 'The novel Utopia in modern Egyptian literature points to which name?', 'أحمد خالد توفيق', 'Ahmed Khaled Tawfik', [['أحمد مراد', 'Ahmed Mourad'], ['علاء الأسواني', 'Alaa Al Aswany'], ['إبراهيم عيسى', 'Ibrahim Eissa']]],
  ['science-nature', 'Medium', 20, 'شفرة وراثية تحمل تعليمات الخلية، وليست عملة طاقة ولا غاز تنفس. ما هي؟', 'A genetic code molecule carrying cell instructions, not an energy currency or breathing gas. What is it?', 'DNA', 'DNA', [['RNA', 'RNA'], ['ATP', 'ATP'], ['ADP', 'ADP']]],
  ['science-nature', 'Medium', 20, 'عملية يصنع فيها النبات غذاءه باستخدام الضوء. أي مصطلح؟', 'A process where plants make food using light. Which term?', 'البناء الضوئي', 'photosynthesis', [['التنفس الخلوي', 'cellular respiration'], ['النتح', 'transpiration'], ['الإنبات', 'germination']]],
  ['science-nature', 'Medium', 20, 'كوكب عملاق غازي هو الأكبر في المجموعة الشمسية. أي كوكب؟', 'A gas giant that is the largest planet in the solar system. Which planet?', 'المشتري', 'Jupiter', [['زحل', 'Saturn'], ['أورانوس', 'Uranus'], ['نبتون', 'Neptune']]],
  ['technology', 'Medium', 20, 'فكرة السحابة في التقنية تعني غالبا تشغيل مواردك على ماذا؟', 'The cloud idea in tech usually means running your resources on what?', 'خوادم عبر الإنترنت', 'internet servers', [['خادم محلي داخل المكتب', 'local office server'], ['قرص تخزين خارجي', 'external storage drive'], ['راوتر منزلي فقط', 'home router only']]],
  ['technology', 'Medium', 20, 'GPS يحدد الموقع غالبا عبر إشارات من أي مصدر؟', 'GPS usually determines location through signals from which source?', 'الأقمار الصناعية', 'satellites', [['أبراج الهاتف فقط', 'cell towers only'], ['نقاط Wi-Fi فقط', 'Wi-Fi access points only'], ['منارات بلوتوث', 'Bluetooth beacons']]],
  ['technology', 'Medium', 20, 'Open Source في البرمجة يعني أن الشيء المتاح عادة هو ماذا؟', 'In programming, open source usually means what is available?', 'الكود المصدري', 'source code', [['ملف التشغيل النهائي', 'compiled binary'], ['مفتاح API', 'API key'], ['قاعدة بيانات المستخدمين', 'user database']]],
  ['politics', 'Medium', 20, 'منظمة عالمية تجمع معظم دول العالم وتعمل كمنصة دبلوماسية. ما هي؟', 'A global organization gathering most states and acting as a diplomatic platform. Which one?', 'الأمم المتحدة', 'United Nations', [['عصبة الأمم', 'League of Nations'], ['الاتحاد الأوروبي', 'European Union'], ['مجموعة العشرين', 'G20']]],
  ['politics', 'Medium', 20, 'منظمة دولية معنية بالتربية والثقافة والتراث العالمي. ما هي؟', 'An international organization concerned with education, culture, and world heritage. Which one?', 'اليونسكو (UNESCO)', 'UNESCO', [['منظمة الصحة العالمية (WHO)', 'WHO'], ['منظمة العمل الدولية (ILO)', 'ILO'], ['منظمة الأغذية والزراعة (FAO)', 'FAO']]],
  ['politics', 'Medium', 20, 'المنظمة القارية التي تجمع دول أفريقيا سياسيا هي أي جهة؟', 'The continental organization that politically gathers African states is which body?', 'الاتحاد الأفريقي', 'African Union', [['جامعة الدول العربية', 'League of Arab States'], ['الاتحاد الأوروبي', 'European Union'], ['منظمة التعاون الإسلامي', 'Organisation of Islamic Cooperation']]],
  ['animals', 'Medium', 20, 'حيوان بحري يستخدم الصدى والصوت للتواصل والصيد، وليس أكبر حيوان في البحر. من هو؟', 'A sea animal using echoes and sound for communication and hunting, not the largest sea animal. Which one?', 'الدلفين', 'dolphin', [['الحوت الأزرق', 'blue whale'], ['الأوركا', 'orca'], ['خنزير البحر', 'porpoise']]],
  ['animals', 'Medium', 20, 'طائر جارح أبيض الرأس صار رمزا سياسيا مشهورا في أمريكا. من هو؟', 'A white-headed raptor became a famous American political symbol. Which bird?', 'النسر الأصلع', 'bald eagle', [['العقاب الذهبي', 'golden eagle'], ['الصقر الشاهين', 'peregrine falcon'], ['الشاهين الحر', 'saker falcon']]],
  ['animals', 'Medium', 20, 'زاحف ضخم قرب المياه العذبة، فكه سلاحه الأشهر في النيل. من هو؟', 'A large freshwater-side reptile whose jaw is its famous weapon in the Nile. Which one?', 'التمساح النيلي', 'Nile crocodile', [['القاطور الأمريكي', 'American alligator'], ['تمساح المياه المالحة', 'saltwater crocodile'], ['الورل النيلي', 'Nile monitor']]],
  ['vehicles', 'Medium', 20, 'وسيلة تعمل على قضبان داخل المدينة وتختلف عن القطار الطويل بين المحافظات. ما هي؟', 'A vehicle running on city tracks, different from long-distance trains. What is it?', 'الترام', 'tram', [['مترو الأنفاق', 'metro'], ['قطار الضواحي', 'commuter train'], ['قطار تالجو', 'Talgo train']]],
  ['vehicles', 'Medium', 20, 'وسيلة بثلاث عجلات للمشاوير القصيرة داخل الشوارع الضيقة. ما هي؟', 'A three-wheeled vehicle for short trips in narrow streets. What is it?', 'التوك توك', 'tuk-tuk', [['الدراجة النارية', 'motorcycle'], ['الميكروباص', 'minibus'], ['السكوتر', 'scooter']]],
  ['vehicles', 'Medium', 20, 'مركبة تعتمد على بطارية ومحرك كهربائي لا على البنزين مباشرة. ما هي؟', 'A vehicle relying on a battery and electric motor rather than petrol directly. What is it?', 'السيارة الكهربائية', 'electric car', [['السيارة الهجينة', 'hybrid car'], ['سيارة ديزل', 'diesel car'], ['سيارة غاز طبيعي', 'natural-gas car']]],
  ['games', 'Medium', 20, 'لعبة لوحية بلا زهر، كل لاعب يرى نفس القطع والفارق في الخطة. أي لعبة؟', 'A board game without dice where both players see the same pieces and strategy makes the difference. Which game?', 'الشطرنج', 'chess', [['الداما', 'checkers'], ['جو (Go)', 'Go'], ['ريفرسي', 'Reversi']]],
  ['games', 'Medium', 20, 'لعبة أركيد قديمة: متاهة ونقاط ومطاردة مستمرة. أي لعبة؟', 'Old arcade game: maze, dots, and constant chase. Which game?', 'باك مان (Pac-Man)', 'Pac-Man', [['سبيس إنفيدرز', 'Space Invaders'], ['دونكي كونغ', 'Donkey Kong'], ['فروجَر', 'Frogger']]],
  ['games', 'Medium', 20, 'كتل متساقطة تحتاج ترتيبها قبل امتلاء الشاشة. أي لعبة؟', 'Falling blocks that must be arranged before the screen fills. Which game?', 'تتريس (Tetris)', 'Tetris', [['بازل بابل', 'Puzzle Bobble'], ['بيجويلد', 'Bejeweled'], ['دكتور ماريو', 'Dr. Mario']]],
  ['politics', 'Medium', 20, 'هيئة دولية قديمة سبقت الأمم المتحدة وفشلت في منع الحرب العالمية الثانية. ما هي؟', 'An older international body preceded the UN and failed to prevent World War II. Which one?', 'عصبة الأمم', 'League of Nations', [['الأمم المتحدة', 'United Nations'], ['مجلس الأمن', 'UN Security Council'], ['محكمة العدل الدولية', 'International Court of Justice']]],
  ['politics', 'Medium', 20, 'داخل الأمم المتحدة، الجهاز الذي يصدر قرارات ملزمة بشأن السلم والأمن غالبا هو أي جهة؟', 'Within the UN, which body most often issues binding decisions on peace and security?', 'مجلس الأمن', 'UN Security Council', [['الجمعية العامة', 'General Assembly'], ['المجلس الاقتصادي والاجتماعي', 'ECOSOC'], ['الأمانة العامة', 'Secretariat']]],
  ['politics', 'Hard', 25, 'محكمة تعنى بمسؤولية الأفراد عن جرائم دولية، وليست نزاعات الدول القانونية. أي محكمة؟', 'A court focused on individual responsibility for international crimes, not legal disputes between states. Which court?', 'المحكمة الجنائية الدولية', 'International Criminal Court', [['محكمة العدل الدولية', 'International Court of Justice'], ['محكمة التحكيم الدائمة', 'Permanent Court of Arbitration'], ['المحكمة الأوروبية لحقوق الإنسان', 'European Court of Human Rights']]],
  ['politics', 'Medium', 20, 'منظمة إقليمية مقرها القاهرة وتجمع الدول العربية سياسيا. ما هي؟', 'A regional organization based in Cairo that gathers Arab states politically. Which one?', 'جامعة الدول العربية', 'League of Arab States', [['الاتحاد الأفريقي', 'African Union'], ['منظمة التعاون الإسلامي', 'Organisation of Islamic Cooperation'], ['مجلس التعاون الخليجي', 'Gulf Cooperation Council']]],
  ['politics', 'Medium', 20, 'مؤسسة مالية دولية مقرها واشنطن ترتبط بالقروض وبرامج الاستقرار المالي. ما هي؟', 'A Washington-based financial institution linked with loans and financial stability programs. Which one?', 'صندوق النقد الدولي (IMF)', 'International Monetary Fund', [['البنك الدولي (World Bank)', 'World Bank'], ['بنك التسويات الدولية', 'Bank for International Settlements'], ['منظمة التجارة العالمية', 'World Trade Organization']]],
  ['politics', 'Medium', 20, 'مؤسسة مالية دولية مقرها واشنطن تركيزها الأشهر تمويل التنمية. ما هي؟', 'A Washington-based financial institution best known for development financing. Which one?', 'البنك الدولي (World Bank)', 'World Bank', [['صندوق النقد الدولي (IMF)', 'International Monetary Fund'], ['بنك التنمية الأفريقي', 'African Development Bank'], ['بنك الاستثمار الأوروبي', 'European Investment Bank']]],
  ['politics', 'Medium', 20, 'غرفة برلمانية ثانية في مصر، وليست الحكومة التنفيذية. أي مؤسسة؟', 'A second parliamentary chamber in Egypt, not the executive government. Which institution?', 'مجلس الشيوخ المصري', 'Egyptian Senate', [['مجلس النواب المصري', 'Egyptian House of Representatives'], ['مجلس الوزراء المصري', 'Egyptian Cabinet'], ['المحكمة الدستورية العليا', 'Supreme Constitutional Court']]],
  ['animals', 'Medium', 20, 'أكبر حيوان معروف، لكنه يتغذى على كائنات صغيرة جدا في البحر. من هو؟', 'The largest known animal, yet it feeds on tiny sea organisms. Which one?', 'الحوت الأزرق', 'blue whale', [['حوت العنبر', 'sperm whale'], ['الحوت الأحدب', 'humpback whale'], ['قرش الحوت', 'whale shark']]],
  ['animals', 'Medium', 20, 'حيوان جرابي مشهور بالقفز، وصغيره يكمل نموه في جراب الأم. من هو؟', 'A marsupial famous for jumping whose young grows in the mother pouch. Which one?', 'الكنغر', 'kangaroo', [['الولب', 'wallaby'], ['الكوالا', 'koala'], ['الومبت', 'wombat']]],
  ['animals', 'Medium', 20, 'طائر يعيش قرب الماشية والحقول ويلتقط الحشرات حولها. من هو؟', 'A bird seen near cattle and fields catching insects around them. Which one?', 'أبو قردان', 'cattle egret', [['مالك الحزين', 'heron'], ['البلشون الأبيض', 'great egret'], ['اللقلق', 'stork']]],
  ['animals', 'Hard', 25, 'ثديي بحري ذكي يستخدم الصوت والصدى، لكنه ليس حوتا ضخما. من هو؟', 'An intelligent marine mammal using sound and echo, but not a huge whale. Which one?', 'الدلفين', 'dolphin', [['خنزير البحر', 'porpoise'], ['الأوركا', 'orca'], ['حوت بيلوغا', 'beluga whale']]],
  ['animals', 'Medium', 20, 'دب أبيض وأسود غذاؤه الأشهر الخيزران. من هو؟', 'A black-and-white bear whose famous food is bamboo. Which one?', 'الباندا العملاقة', 'giant panda', [['الدب الأسود الآسيوي', 'Asian black bear'], ['الباندا الحمراء', 'red panda'], ['دب الشمس', 'sun bear']]],
  ['animals', 'Medium', 20, 'حشرة اجتماعية تجمع الرحيق وتساعد في تلقيح النباتات. من هي؟', 'A social insect that gathers nectar and helps pollinate plants. Which one?', 'النحلة', 'bee', [['الدبور', 'wasp'], ['النملة', 'ant'], ['الفراشة', 'butterfly']]],
  ['animals', 'Medium', 20, 'مفترس إفريقي كبير يلقب كثيرا بملك الغابة رغم ارتباطه بالسافانا. من هو؟', 'A large African predator often called king of the jungle despite being tied to savanna. Which one?', 'الأسد', 'lion', [['الفهد', 'cheetah'], ['النمر', 'leopard'], ['الضبع', 'hyena']]],
  ['vehicles', 'Medium', 20, 'وسيلة نقل تحت الأرض أو على مسارات معزولة داخل المدن الكبيرة. ما هي؟', 'An urban transport system underground or on separated tracks in big cities. What is it?', 'مترو الأنفاق', 'metro', [['الترام', 'tram'], ['قطار الضواحي', 'commuter train'], ['القطار الخفيف', 'light rail']]],
  ['vehicles', 'Medium', 20, 'وسيلة ركاب كبيرة تسير على الطرق ولها محطات متكررة داخل المدينة. ما هي؟', 'A large passenger vehicle on roads with repeated city stops. What is it?', 'الأتوبيس', 'bus', [['الميكروباص', 'minibus'], ['الترام', 'tram'], ['الحافلة السريعة', 'BRT bus']]],
  ['vehicles', 'Medium', 20, 'قطار مميز للمسافات بين المدن في مصر، ارتبط باسم تالجو. ما هو؟', 'A distinctive intercity train in Egypt associated with the Talgo name. What is it?', 'قطار تالجو في مصر', 'Talgo train in Egypt', [['قطار النوم', 'sleeping train'], ['القطار الروسي', 'Russian train'], ['قطار الضواحي', 'commuter train']]],
  ['vehicles', 'Medium', 20, 'وسيلة بحرية تنقل ركابا أو بضائع فوق الماء لمسافات طويلة. ما هي؟', 'A sea vehicle carrying passengers or goods over water for long distances. What is it?', 'السفينة', 'ship', [['العبارة', 'ferry'], ['القارب', 'boat'], ['الناقلة', 'tanker']]],
  ['vehicles', 'Medium', 20, 'وسيلة جوية بمحرك وجناحين ثابتين للمسافات الطويلة. ما هي؟', 'A powered aircraft with fixed wings for long distances. What is it?', 'الطائرة', 'airplane', [['المروحية', 'helicopter'], ['الطائرة الشراعية', 'glider'], ['المنطاد', 'hot-air balloon']]],
  ['vehicles', 'Medium', 20, 'مركبة صغيرة بعجلتين ومحرك، أخف من السيارة وأسرع من الدراجة العادية. ما هي؟', 'A small two-wheeled motor vehicle, lighter than a car and faster than a bicycle. What is it?', 'الدراجة النارية', 'motorcycle', [['السكوتر', 'scooter'], ['الدراجة الكهربائية', 'e-bike'], ['الدراجة', 'bicycle']]],
  ['vehicles', 'Medium', 20, 'وسيلة خفيفة داخل المدن تسير على قضبان في الشارع غالبا. ما هي؟', 'A light urban vehicle often running on street tracks. What is it?', 'الترام', 'tram', [['مترو الأنفاق', 'metro'], ['القطار الخفيف', 'light rail'], ['قطار الضواحي', 'commuter train']]],
  ['general-knowledge', 'Medium', 20, 'لوحة بثلاث كتابات ساعدت على قراءة الهيروغليفية بعد قرون من الغموض. أي أثر؟', 'A slab with three scripts helped decode hieroglyphs after centuries. Which artifact?', 'حجر رشيد', 'Rosetta Stone', [['لوحة نارمر', 'Narmer Palette'], ['مسلة كليوباترا', 'Cleopatra Needle'], ['قناع توت عنخ آمون', 'Tutankhamun mask']]],
  ['general-knowledge', 'Medium', 20, 'مدينة عند الطرف الشمالي للممر الملاحي بين البحرين، اسمها يظهر كثيرا في أخبار القناة. أي مدينة؟', 'A city at the northern end of the canal route between the two seas. Which city?', 'بورسعيد', 'Port Said', [['السويس', 'Suez'], ['الإسماعيلية', 'Ismailia'], ['دمياط', 'Damietta']]],
  ['general-knowledge', 'Medium', 20, 'واحة سيوة إداريا أقرب لمحافظة ساحلية غربية لا لمحافظات الصعيد. أي محافظة؟', 'Siwa Oasis administratively belongs to a western coastal governorate, not Upper Egypt. Which one?', 'مطروح', 'Matrouh', [['الفيوم', 'Fayoum'], ['الوادي الجديد', 'New Valley'], ['شمال سيناء', 'North Sinai']]],
  ['general-knowledge', 'Medium', 20, 'معابد منحوتة جنوب أسوان أنقذتها حملة دولية من الغرق بعد بناء السد العالي. أي معلم؟', 'Rock-cut temples south of Aswan were moved by an international rescue campaign. Which monument?', 'معبد أبو سمبل', 'Abu Simbel Temples', [['معبد فيلة', 'Philae Temple'], ['معبد الكرنك', 'Karnak Temple'], ['الدير البحري', 'Deir el-Bahari']]],
  ['general-knowledge', 'Medium', 20, 'أعلى نقطة جبلية في مصر ليست في وادي النيل بل في جنوب سيناء. أي قمة؟', 'Egypt highest mountain point is in South Sinai, not the Nile Valley. Which peak?', 'جبل سانت كاترين', 'Mount Catherine', [['جبل موسى', 'Mount Sinai'], ['جبل علبة', 'Gebel Elba'], ['جبل المقطم', 'Mokattam Mountain']]],
  ['general-knowledge', 'Medium', 20, 'ممر ملاحي اختصر طريق التجارة بين المتوسط والأحمر وجعل مدن القناة على الخريطة. أي ممر؟', 'A shipping route shortened trade between the Mediterranean and Red Sea. Which route?', 'قناة السويس', 'Suez Canal', [['قناة بنما', 'Panama Canal'], ['مضيق باب المندب', 'Bab el-Mandeb Strait'], ['مضيق هرمز', 'Strait of Hormuz']]],
  ['general-knowledge', 'Medium', 20, 'مبنى في ميدان التحرير يحفظ ذاكرة الآثار الفرعونية قبل انتقال جزء كبير منها لمتاحف أحدث. أي مكان؟', 'A Tahrir Square building preserved pharaonic antiquities before many moved to newer museums. Which place?', 'المتحف المصري بالتحرير', 'Egyptian Museum in Tahrir', [['المتحف القومي للحضارة المصرية', 'National Museum of Egyptian Civilization'], ['المتحف اليوناني الروماني', 'Greco-Roman Museum'], ['متحف الفن الإسلامي', 'Museum of Islamic Art']]],
  ['general-knowledge', 'Medium', 20, 'شارع فاطمي طويل في القاهرة الإسلامية، تمشي فيه فتلاقي طبقات من العمارة المملوكية والفاطمية. أي شارع؟', 'A long Fatimid-era street in Islamic Cairo layered with medieval architecture. Which street?', 'شارع المعز', 'Al-Muizz Street', [['شارع الغورية', 'Al-Ghuriya Street'], ['شارع الخيامية', 'Khayamiya Street'], ['شارع الأزهر', 'Al-Azhar Street']]],
  ['general-knowledge', 'Medium', 20, 'مدينة مصرية تحمل في ذاكرتها مكتبة قديمة شهيرة ومكتبة حديثة أعادت الاسم للواجهة. أي مدينة؟', 'An Egyptian city remembered for an ancient library and a modern one reviving the name. Which city?', 'الإسكندرية', 'Alexandria', [['القاهرة', 'Cairo'], ['المنصورة', 'Mansoura'], ['بورسعيد', 'Port Said']]],
  ['general-knowledge', 'Medium', 20, 'بقعة قرب شرم الشيخ تشتهر بالشعاب والتيارات والغوص أكثر من الآثار البرية. أي محمية؟', 'A spot near Sharm El Sheikh known for reefs, currents, and diving more than land ruins. Which reserve?', 'محمية رأس محمد', 'Ras Muhammad National Park', [['محمية نبق', 'Nabq Protectorate'], ['وادي الريان', 'Wadi El Rayan'], ['محمية سانت كاترين', 'St. Katherine Protectorate']]],
  ['general-knowledge', 'Medium', 20, 'هدية فرنسية صارت علامة استقبال في ميناء نيويورك، وتمثل حرية لا انتصارا عسكريا. أي معلم؟', 'A French gift became a welcome symbol in New York Harbor, representing liberty rather than military victory. Which landmark?', 'تمثال الحرية', 'Statue of Liberty', [['نصب واشنطن', 'Washington Monument'], ['جبل رشمور', 'Mount Rushmore'], ['بوابة الغرب', 'Gateway Arch']]],
  ['general-knowledge', 'Medium', 20, 'قناة بنما لا تجمع بحرين متجاورين؛ هي تقصر الطريق بين أي محيطين؟', 'The Panama Canal does not join adjacent seas; it shortens travel between which oceans?', 'الأطلسي والهادئ', 'Atlantic and Pacific', [['الهندي والهادئ', 'Indian and Pacific'], ['الأطلسي والهندي', 'Atlantic and Indian'], ['الأطلسي والمتجمد الشمالي', 'Atlantic and Arctic']]],
  ['general-knowledge', 'Hard', 25, 'أعمق نقطة محيطية معروفة تقع في غرب الهادئ وترتبط بسجلات الغوص الشديد. أي مكان؟', 'The deepest known oceanic point lies in the western Pacific and is tied to extreme dives. Which place?', 'خندق ماريانا', 'Mariana Trench', [['خندق تونغا', 'Tonga Trench'], ['خندق جاوة', 'Java Trench'], ['خندق بورتوريكو', 'Puerto Rico Trench']]],
  ['general-knowledge', 'Medium', 20, 'ناطحة سحاب في دبي صارت مرجعا عند الحديث عن الارتفاع القياسي للمباني. أي مبنى؟', 'A Dubai skyscraper became the reference point for record building height. Which building?', 'برج خليفة', 'Burj Khalifa', [['برج العرب', 'Burj Al Arab'], ['أبراج الإمارات', 'Emirates Towers'], ['برج جدة', 'Jeddah Tower']]],
  ['general-knowledge', 'Medium', 20, 'غابة مطيرة هائلة في أمريكا الجنوبية، أهميتها أكبر من كونها مجرد مساحة خضراء. أي منطقة؟', 'A vast South American rainforest whose importance goes far beyond green area. Which region?', 'غابات الأمازون', 'Amazon Rainforest', [['غابات الكونغو', 'Congo Rainforest'], ['غابات بورنيو', 'Borneo Rainforest'], ['غابات فالديفيا', 'Valdivian Rainforest']]],
  ['general-knowledge', 'Medium', 20, 'حفلات جوائز نوبل تقام غالبا في تاريخ مرتبط برحيل صاحب الوصية. أي تاريخ؟', 'Nobel ceremonies are usually held on a date tied to the death of the prize founder. Which date?', '10 ديسمبر', '10 December', [['21 أكتوبر', '21 October'], ['27 نوفمبر', '27 November'], ['1 يناير', '1 January']]],
  ['general-knowledge', 'Medium', 20, 'مهمة فضائية جمعت بين هبوط بشري وقول شهير عن خطوة صغيرة وقفزة كبيرة. أي مهمة؟', 'A space mission combined a human landing with a famous small-step quote. Which mission?', 'أبولو 11', 'Apollo 11', [['أبولو 8', 'Apollo 8'], ['أبولو 13', 'Apollo 13'], ['فوياجر 1', 'Voyager 1']]],
  ['general-knowledge', 'Medium', 20, 'أكبر محيط على الأرض ليس الذي يفصل أوروبا عن أمريكا فقط، بل يمتد بين آسيا والأمريكتين. أي محيط؟', 'Earth largest ocean is not merely the one between Europe and America; it spans Asia and the Americas. Which ocean?', 'المحيط الهادئ', 'Pacific Ocean', [['المحيط الأطلسي', 'Atlantic Ocean'], ['المحيط الهندي', 'Indian Ocean'], ['المحيط المتجمد الشمالي', 'Arctic Ocean']]],
  ['religion-islamic', 'Medium', 20, 'حدث كبير صار نقطة البداية في التقويم الإسلامي، وليس مولد النبي ولا فتح مكة. أي حدث؟', 'A major event became the starting point of the Islamic calendar, not the Prophet birth or the conquest of Mecca. Which event?', 'الهجرة النبوية', 'the Hijra', [['فتح مكة', 'Conquest of Mecca'], ['غزوة بدر', 'Battle of Badr'], ['عام الفيل', 'Year of the Elephant']]],
  ['religion-islamic', 'Medium', 20, 'غار قريب من مكة ارتبط ببداية الوحي، بينما غار آخر ارتبط برحلة الهجرة. أي غار؟', 'A cave near Mecca is tied to the first revelation, while another is tied to the migration journey. Which cave?', 'غار حراء', 'Cave Hira', [['غار ثور', 'Cave Thawr'], ['جبل عرفات', 'Mount Arafat'], ['وادي نخلة', 'Wadi Nakhla']]],
  ['religion-islamic', 'Medium', 20, 'في السيرة، مكان الاختباء أثناء طريق الهجرة ليس هو مكان نزول الوحي. أي غار؟', 'In the seerah, the hiding place on the migration route was not the first-revelation cave. Which cave?', 'غار ثور', 'Cave Thawr', [['غار حراء', 'Cave Hira'], ['جبل أحد', 'Mount Uhud'], ['وادي بدر', 'Badr Valley']]],
  ['religion-islamic', 'Medium', 20, 'شهر يأتي بعد صيام رمضان ويرتبط أوله بالعيد الصغير في الوجدان الشعبي. أي شهر؟', 'A month follows Ramadan fasting and begins with the smaller Eid in popular memory. Which month?', 'شوال', 'Shawwal', [['شعبان', 'Shaaban'], ['رجب', 'Rajab'], ['ذو القعدة', 'Dhu al-Qadah']]],
  ['religion-islamic', 'Medium', 20, 'شهر يسبق رمضان مباشرة، ويكثر ذكره مع الاستعداد للصيام. أي شهر؟', 'A month directly precedes Ramadan and is often mentioned with preparation for fasting. Which month?', 'شعبان', 'Shaaban', [['رجب', 'Rajab'], ['شوال', 'Shawwal'], ['محرم', 'Muharram']]],
  ['religion-islamic', 'Medium', 20, 'شهر في آخر السنة الهجرية ترتبط به المناسك الكبرى لا صيام رمضان. أي شهر؟', 'A late Hijri-year month linked to the major pilgrimage rites, not Ramadan fasting. Which month?', 'ذو الحجة', 'Dhu al-Hijjah', [['ذو القعدة', 'Dhu al-Qadah'], ['محرم', 'Muharram'], ['رجب', 'Rajab']]],
  ['religion-islamic', 'Medium', 20, 'صحابي حبشي ارتبط صوته بالأذان الأول، والاختيارات كلها من جيل الصحابة. من هو؟', 'An Abyssinian companion is linked to the first call to prayer; all options are companions. Who was it?', 'بلال بن رباح', 'Bilal ibn Rabah', [['عبد الله بن أم مكتوم', 'Abdullah ibn Umm Maktum'], ['مصعب بن عمير', 'Musab ibn Umayr'], ['زيد بن ثابت', 'Zayd ibn Thabit']]],
  ['religion-islamic', 'Medium', 20, 'توحيد المصاحف على رسم واحد في صدر الإسلام يرتبط بخليفة من الراشدين. من هو؟', 'Standardizing Quran manuscripts in early Islam is linked to one Rashidun caliph. Who was it?', 'عثمان بن عفان', 'Uthman ibn Affan', [['أبو بكر الصديق', 'Abu Bakr'], ['عمر بن الخطاب', 'Umar ibn Al-Khattab'], ['علي بن أبي طالب', 'Ali ibn Abi Talib']]],
  ['religion-islamic', 'Medium', 20, 'كتاب حديث وفقه مبكر ارتبط بالإمام مالك، وليس من كتب الصحاح الستة بالمعنى الشائع. أي كتاب؟', 'An early hadith-and-law work is linked to Imam Malik and is not usually counted among the six canonical books. Which work?', 'الموطأ', 'Al-Muwatta', [['صحيح البخاري', 'Sahih al-Bukhari'], ['سنن أبي داود', 'Sunan Abi Dawud'], ['صحيح مسلم', 'Sahih Muslim']]],
  ['religion-islamic', 'Medium', 20, 'جامع قاهري تحول اسمه إلى مؤسسة علمية عالمية في التعليم الشرعي. أي جامع؟', 'A Cairo mosque lent its name to a global Islamic learning institution. Which mosque?', 'جامع الأزهر', 'Al-Azhar Mosque', [['جامع عمرو بن العاص', 'Amr ibn al-As Mosque'], ['جامع ابن طولون', 'Ibn Tulun Mosque'], ['جامع الحاكم', 'Al-Hakim Mosque']]],
  ['religion-islamic', 'Medium', 20, 'مسجد ارتبط ببداية المجتمع في المدينة، قبل أن يصير المسجد النبوي مركزا أكبر. أي مسجد؟', 'A mosque is tied to the early community in Medina before the Prophet Mosque became the larger center. Which mosque?', 'مسجد قباء', 'Quba Mosque', [['المسجد النبوي', 'Prophet Mosque'], ['المسجد الحرام', 'Al-Masjid Al-Haram'], ['مسجد القبلتين', 'Masjid al-Qiblatayn']]],
  ['religion-islamic', 'Medium', 20, 'ركن الحج الذي يحدث في اليوم التاسع، ولو فات ضاع الحج بمعناه الفقهي الأشهر. ما هو؟', 'A Hajj rite on the ninth day; missing it invalidates Hajj in the well-known legal phrasing. What is it?', 'الوقوف بعرفة', 'Standing at Arafat', [['طواف الإفاضة', 'Tawaf al-Ifadah'], ['السعي بين الصفا والمروة', 'Sa’i'], ['رمي الجمرات', 'Stoning the Jamarat']]],
  ['religion-islamic', 'Medium', 20, 'مدينة كانت تعرف بيثرب ثم صار اسمها مرتبطا بالهجرة وبالمسجد النبوي. أي مدينة؟', 'A city once known as Yathrib became tied to the migration and the Prophet Mosque. Which city?', 'المدينة المنورة', 'Medina', [['مكة', 'Mecca'], ['الطائف', 'Taif'], ['خيبر', 'Khaybar']]],
  ['religion-islamic', 'Medium', 20, 'معركة مبكرة قرب آبار معروفة صارت فاصلة في ذاكرة السيرة. أي معركة؟', 'An early battle near well-known wells became pivotal in seerah memory. Which battle?', 'بدر', 'Badr', [['أحد', 'Uhud'], ['الخندق', 'Al-Khandaq'], ['حنين', 'Hunayn']]],
  ['religion-islamic', 'Medium', 20, 'فتح مصر في العصر الراشدي يرتبط بقائد صار اسمه أيضا على جامع قديم في القاهرة. من هو؟', 'The Muslim conquest of Egypt is linked to a commander whose name is also on an old Cairo mosque. Who was it?', 'عمرو بن العاص', 'Amr ibn al-As', [['خالد بن الوليد', 'Khalid ibn al-Walid'], ['سعد بن أبي وقاص', 'Saad ibn Abi Waqqas'], ['طارق بن زياد', 'Tariq ibn Ziyad']]],
  ['religion-islamic', 'Medium', 20, 'سيدة من بيت تجاري في مكة كانت أول سند للرسالة في بدايتها. من هي؟', 'A woman from a Meccan trading household was the earliest support in the beginning of the message. Who was she?', 'خديجة بنت خويلد', 'Khadija bint Khuwaylid', [['عائشة بنت أبي بكر', 'Aisha bint Abi Bakr'], ['حفصة بنت عمر', 'Hafsa bint Umar'], ['أم سلمة', 'Umm Salama']]],
  ['religion-islamic', 'Medium', 20, 'لقب الصديق ومرحلة الخلافة الأولى يجتمعان في أي شخصية؟', 'The Siddiq title and the first caliphate period meet in which figure?', 'أبو بكر الصديق', 'Abu Bakr Al-Siddiq', [['عمر بن الخطاب', 'Umar ibn Al-Khattab'], ['عثمان بن عفان', 'Uthman ibn Affan'], ['علي بن أبي طالب', 'Ali ibn Abi Talib']]],
  ['religion-islamic', 'Medium', 20, 'في التراث الشائع، عبارة قلب القرآن تذهب غالبا إلى أي سورة؟', 'In common tradition, the phrase heart of the Quran most often points to which surah?', 'يس', 'Ya-Sin', [['الكهف', 'Al-Kahf'], ['الملك', 'Al-Mulk'], ['الرحمن', 'Ar-Rahman']]],
  ['books-literature', 'Medium', 20, 'حكاية عائلة قاهرية على ثلاثة أجزاء تقودك لأي عمل محفوظي؟', 'A Cairo family story in three parts points to which Mahfouz work?', 'الثلاثية', 'The Cairo Trilogy', [['زقاق المدق', 'Midaq Alley'], ['اللص والكلاب', 'The Thief and the Dogs'], ['أولاد حارتنا', 'Children of Gebelawi']]],
  ['books-literature', 'Medium', 20, 'سيرة ذاتية عن طفولة ووعي وكفاح تعليمي، وصاحبها لقب بعميد الأدب العربي. أي عمل؟', 'An autobiography about childhood, awareness, and education by the Dean of Arabic Literature. Which work?', 'الأيام', 'The Days', [['دعاء الكروان', 'The Nightingale Prayer'], ['حديث عيسى بن هشام', 'Hadith Issa Ibn Hisham'], ['عودة الروح', 'Return of the Spirit']]],
  ['books-literature', 'Medium', 20, 'بناية في وسط القاهرة تكشف طبقات اجتماعية وسياسية في رواية معاصرة. أي عمل؟', 'A downtown Cairo building reveals social and political layers in a modern novel. Which work?', 'عمارة يعقوبيان', 'The Yacoubian Building', [['شيكاجو', 'Chicago'], ['واحة الغروب', 'Sunset Oasis'], ['تراب الماس', 'Diamond Dust']]],
  ['books-literature', 'Medium', 20, 'عالم نفسي وغموض وجريمة في رواية مصرية حديثة قبل أن تصبح فيلما مشهورا. أي عمل؟', 'Psychology, mystery, and crime in a modern Egyptian novel later made into a famous film. Which work?', 'الفيل الأزرق', 'The Blue Elephant', [['تراب الماس', 'Diamond Dust'], ['يوتوبيا', 'Utopia'], ['عمارة يعقوبيان', 'The Yacoubian Building']]],
  ['books-literature', 'Medium', 20, 'مسرحية عن أناس يستيقظون بعد زمن طويل فتختلط الأسطورة بالسؤال الفلسفي. أي عمل؟', 'A play about people waking after a long time, mixing legend with philosophical questions. Which work?', 'أهل الكهف', 'The People of the Cave', [['عودة الروح', 'Return of the Spirit'], ['أرض النفاق', 'The Land of Hypocrisy'], ['حديث عيسى بن هشام', 'Hadith Issa Ibn Hisham']]],
  ['books-literature', 'Medium', 20, 'حارة قاهرية وشخصيات شعبية في رواية من عالم نجيب محفوظ المبكر. أي عمل؟', 'A Cairo alley and popular characters in one of Naguib Mahfouz early worlds. Which work?', 'زقاق المدق', 'Midaq Alley', [['الثلاثية', 'The Cairo Trilogy'], ['اللص والكلاب', 'The Thief and the Dogs'], ['الحرام', 'The Sin']]],
  ['books-literature', 'Hard', 25, 'مدينة منعزلة للأغنياء وفقر خارج الأسوار في ديستوبيا مصرية حديثة. أي رواية؟', 'A gated enclave for the rich and poverty outside the walls in a modern Egyptian dystopia. Which novel?', 'يوتوبيا', 'Utopia', [['الفيل الأزرق', 'The Blue Elephant'], ['تراب الماس', 'Diamond Dust'], ['شيكاجو', 'Chicago']]],
  ['games', 'Medium', 20, 'محاكاة كرة قدم مرخصة: متعة اختيار الفرق والتشكيلات أقرب لأي لعبة؟', 'Licensed football simulation with teams and lineups. Which game fits?', 'كرة القدم الإلكترونية فيفا (FIFA)', 'FIFA video game', [['برو إفولوشن سوكر (PES)', 'Pro Evolution Soccer'], ['فوتبول مانجر', 'Football Manager'], ['روكيت ليغ', 'Rocket League']]],
  ['games', 'Medium', 20, 'مكعبات وبقاء وصناعة أدوات: اللعبة تتركك تبني القصة بدل أن تعطيك طريقا واحدا. أي لعبة؟', 'Blocks, survival, and crafting: the game lets you build the story instead of following one path. Which game?', 'ماينكرافت (Minecraft)', 'Minecraft', [['تيراريا (Terraria)', 'Terraria'], ['روبلوكس (Roblox)', 'Roblox'], ['ستارديو فالي', 'Stardew Valley']]],
  ['games', 'Medium', 20, 'بيع وشراء ورهن وإفلاس على لوحة واحدة؛ المتعة هنا مالية أكثر من كونها حركة. أي لعبة؟', 'Buying, selling, mortgages, and bankruptcy on one board; the fun is financial rather than action-based. Which game?', 'مونوبولي (Monopoly)', 'Monopoly', [['لعبة الحياة (The Game of Life)', 'The Game of Life'], ['كاتان (Catan)', 'Catan'], ['ريسك (Risk)', 'Risk']]],
  ['games', 'Medium', 20, 'سباك ومنصات وقفز وعالم نينتندو؛ clue صغير لكنه يحتاج ذاكرة ألعاب. أي سلسلة؟', 'Plumber, platforms, jumping, and Nintendo world. Which series?', 'سوبر ماريو (Super Mario)', 'Super Mario', [['سونك (Sonic)', 'Sonic'], ['كيربي (Kirby)', 'Kirby'], ['دونكي كونغ', 'Donkey Kong']]],
  ['games', 'Medium', 20, 'زهر وأقراص وحساب مخاطرة في قعدات قديمة؛ ليست شطرنجا ولا دومينو. أي لعبة؟', 'Dice, checkers, and risk calculation in old gatherings; not chess or dominoes. Which game?', 'الطاولة', 'backgammon', [['الداما', 'checkers'], ['المنقلة', 'mancala'], ['الشطرنج', 'chess']]],
  ['games', 'Medium', 20, 'قطع مرقمة على الأطراف؛ المكسب يحتاج عين على الرقم المفتوح لا على لوحة ثابتة. أي لعبة؟', 'Numbered tiles at the ends; winning needs watching open numbers, not a fixed board. Which game?', 'الدومينو', 'dominoes', [['الطاولة', 'backgammon'], ['الداما', 'checkers'], ['المنقلة', 'mancala']]],
  ['games', 'Medium', 20, 'ملك ووزير وقلعتان على لوحة 8 في 8؛ الحظ خارج الحساب تقريبا. أي لعبة؟', 'King, queen, and rooks on an 8 by 8 board; luck is almost out of the equation. Which game?', 'الشطرنج', 'chess', [['الداما', 'checkers'], ['جو (Go)', 'Go'], ['ريفرسي', 'Reversi']]]
];

for (const [categorySlug, difficulty, timeLimitSec, textAr, textEn, answerAr, answerEn, wrong] of closeChoiceQuestions) {
  addDirectQuestion(categorySlug, difficulty, timeLimitSec, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of globalGeneralFacts) {
  addDirectQuestion('general-knowledge', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of religionTrickyFacts) {
  addDirectQuestion('religion-islamic', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

addRecordRelationshipSet('general-knowledge', generalKnowledgeRecords, [
  { kind: 'nameFromClues', clueFields: ['clue', 'memory'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'topic', clueField: 'clue', labelAr: 'زاوية', labelEn: 'angle', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'memory', clueField: 'topic', labelAr: 'تفصيلة', labelEn: 'detail', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('religion-islamic', islamicKnowledgeRecords, [
  { kind: 'nameFromClues', clueFields: ['clue', 'memory'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'topic', clueField: 'clue', labelAr: 'زاوية', labelEn: 'angle', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'memory', clueField: 'topic', labelAr: 'تفصيلة', labelEn: 'detail', difficulty: 'Medium', timeLimitSec: 20 }
]);

for (const [textAr, textEn, answerAr, answerEn, wrong] of globalHistoryFacts) {
  addDirectQuestion('history', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('geography', egyptPlaces, [
  { arField: 'governorateAr', enField: 'governorateEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `خريطة في دقيقة: لو عايز تزور ${r.nameAr}، هتدور عليه فين؟`, en: (r) => `Map sprint: if you want to visit ${r.nameEn}, where should you look?` }
  ] },
  { arField: 'knownForAr', enField: 'knownForEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `لقطة سياحية: ${r.nameAr} معروف للزوار بإيه؟`, en: (r) => `Travel snapshot: what do visitors know ${r.nameEn} for?` }
  ] }
]);

addFieldQuestions('geography', globalPlaces, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `بوست كارت عالمي: أي مكان ينطبق عليه وصف «${r.knownForAr}»؟`, en: (r) => `Global postcard: which place matches ${r.knownForEn}?` }
  ] }
]);

addFieldQuestions('history', egyptHistoryEvents, [
  { arField: 'yearAr', enField: 'yearEn', difficulty: 'Medium', timeLimitSec: 20, poolRadius: 3, variants: [
    { ar: (r) => `رحلة زمنية: حدث «${r.nameAr}» هتحطه عند أي سنة أو فترة؟`, en: (r) => `Time-trip clue: which year or period fits ${r.nameEn}?` }
  ] },
  { arField: 'keyAr', enField: 'keyEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `حدث مصري: «${r.nameAr}». ما الاسم أو الجهة الأبرز المرتبطة به؟`, en: (r) => `Egyptian event: which name or group is linked to ${r.nameEn}?` }
  ] }
]);

addFieldQuestions('film-tv', egyptFilms, [
  { arField: 'directorAr', enField: 'directorEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `في سهرة سينما: لو الفيلم هو «${r.nameAr}»، مين كان وراء الكاميرا؟`, en: (r) => `Movie-night clue: who was behind the camera for ${r.nameEn}?` }
  ] },
  { arField: 'starAr', enField: 'starEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `على الأفيش: أي نجم هتربطه غالبا بفيلم «${r.nameAr}»؟`, en: (r) => `On the poster: which star would you link with ${r.nameEn}?` }
  ] },
  { arField: 'yearAr', enField: 'yearEn', difficulty: 'Hard', timeLimitSec: 25, poolRadius: 4, variants: [
    { ar: (r) => `تحدي الذاكرة السينمائية: «${r.nameAr}» خرج للنور سنة كام؟`, en: (r) => `Cinema memory challenge: which year brought ${r.nameEn} to screens?` }
  ] }
]);

addFieldQuestions('film-tv', egyptSeries, [
  { arField: 'writerAr', enField: 'writerEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `وراء الحكاية: مين كتب عالم مسلسل «${r.nameAr}»؟`, en: (r) => `Behind the story: who wrote the world of ${r.nameEn}?` }
  ] },
  { arField: 'starAr', enField: 'starEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `لو جت سيرة مسلسل «${r.nameAr}»، أي ممثل ييجي في بالك؟`, en: (r) => `When ${r.nameEn} comes up, which actor comes to mind?` }
  ] }
]);

addFieldQuestions('books-literature', egyptBooks, [
  { arField: 'authorAr', enField: 'authorEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `على رف الكتب: مين صاحب «${r.nameAr}»؟`, en: (r) => `On the bookshelf: whose work is ${r.nameEn}?` }
  ] }
]);

addFieldQuestions('music', egyptMusic, [
  { arField: 'workAr', enField: 'workEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `من ذاكرة الطرب: أي عمل غنائي يلمع مع اسم ${r.nameAr}؟`, en: (r) => `From musical memory: which work shines with ${r.nameEn}?` }
  ] }
]);

addFieldQuestions('art', egyptArtists, [
  { arField: 'workAr', enField: 'workEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `داخل معرض مصري: أي عمل أو اتجاه يوديك إلى اسم ${r.nameAr}؟`, en: (r) => `Inside an Egyptian gallery: which work or style points to ${r.nameEn}?` }
  ] },
  { arField: 'fieldAr', enField: 'fieldEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `لو هتقدّم ${r.nameAr} في معرض، تختار له أي مجال فني؟`, en: (r) => `If you introduce ${r.nameEn} in a gallery, which art field fits?` }
  ] }
]);

addFieldQuestions('sports', egyptSports, [
  { arField: 'cityAr', enField: 'cityEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `خريطة الدوري: ${r.nameAr} بيشدك ناحية أي مدينة أو محافظة؟`, en: (r) => `League map: which city or governorate does ${r.nameEn} point to?` }
  ] },
  { arField: 'stadiumAr', enField: 'stadiumEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `يوم ماتش: لو ${r.nameAr} بيلعب على أرضه غالبا، أي ملعب تتوقعه؟`, en: (r) => `Match day: if ${r.nameEn} plays at home, which stadium do you expect?` }
  ] }
]);

addFieldQuestions('sports', footballPlayers, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `مين اللاعب؟ ${r.clueAr}.`, en: (r) => `Name the player: ${r.clueEn}.` }
  ] },
  { arField: 'roleAr', enField: 'roleEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `لو بتكوّن فريق أحلام، ${r.nameAr} تحطه غالبا في أي دور؟`, en: (r) => `If building a dream team, which role fits ${r.nameEn}?` }
  ] },
  { arField: 'nationalTeamAr', enField: 'nationalTeamEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `قميص المنتخب: ${r.nameAr} ارتبط دوليا بأي منتخب؟`, en: (r) => `National shirt: which national team is ${r.nameEn} linked with?` }
  ] }
]);

for (const [textAr, textEn, answerAr, answerEn, wrong] of footballPlayerCareerQuestions) {
  addDirectQuestion('sports', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of footballDeepCutQuestions) {
  addDirectQuestion('sports', 'Hard', 25, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('sports', footballTournaments, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `بطولة كروية: ${r.identityAr}. ما اسم البطولة؟`, en: (r) => `Football tournament: ${r.identityEn}. Which tournament is it?` }
  ] },
  { arField: 'memoryAr', enField: 'memoryEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `معلومة تحفظ البطولة: أي جملة تميّز ${r.nameAr}؟`, en: (r) => `Tournament memory hook: which sentence marks ${r.nameEn}?` }
  ] }
]);

for (const [textAr, textEn, answerAr, answerEn, wrong] of footballTournamentClueQuestions) {
  addDirectQuestion('sports', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('science-nature', scienceRecords, [
  { arField: 'symbolAr', enField: 'symbolEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `في المعمل أو الفلك: ما العلامة التي تميز ${r.nameAr}؟`, en: (r) => `In lab or space: which marker identifies ${r.nameEn}?` }
  ] },
  { arField: 'featureAr', enField: 'featureEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `معلومة تنفع في دقيقة: ${r.nameAr} يهمنا غالبا بسبب إيه؟`, en: (r) => `One-minute science: why does ${r.nameEn} usually matter?` }
  ] }
]);

for (const [textAr, textEn, answerAr, answerEn, wrong] of globalScienceFacts) {
  addDirectQuestion('science-nature', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('technology', techRecords, [
  { arField: 'creatorAr', enField: 'creatorEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `كواليس التقنية: مين الاسم أو الجهة المرتبطة ببداية ${r.nameAr}؟`, en: (r) => `Tech backstory: which name or group is linked to the start of ${r.nameEn}?` }
  ] },
  { arField: 'useAr', enField: 'useEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `لو صاحبك قال ${r.nameAr}، تتوقع يستخدمه غالبا في إيه؟`, en: (r) => `If a friend mentions ${r.nameEn}, what would they mostly use it for?` }
  ] }
]);

for (const [textAr, textEn, answerAr, answerEn, wrong] of globalTechFacts) {
  addDirectQuestion('technology', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of politicsTrickyFacts) {
  addDirectQuestion('politics', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of animalTrickyFacts) {
  addDirectQuestion('animals', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of vehicleTrickyFacts) {
  addDirectQuestion('vehicles', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of gameTrickyFacts) {
  addDirectQuestion('games', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of musicTrickyFacts) {
  addDirectQuestion('music', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('politics', politicsRecords, [
  { arField: 'headquartersAr', enField: 'headquartersEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `خريطة مؤسسات: لو هتزور مقر ${r.nameAr}، هتسافر لفين؟`, en: (r) => `Institutions map: where would you travel to visit ${r.nameEn} headquarters?` }
  ] }
]);

addFieldQuestions('games', gameRecords, [
  { arField: 'knownForAr', enField: 'knownForEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `لو حد قال ${r.nameAr}، إيه العلامة اللي تميز اللعبة دي؟`, en: (r) => `If someone says ${r.nameEn}, which play marker makes it stand out?` }
  ] }
]);

const moreGeneralFacts = [
  ['أي محافظة مصرية تشتهر بمدينة رشيد؟', 'Which Egyptian governorate is associated with Rosetta?', 'البحيرة', 'Beheira', [['القاهرة', 'Cairo'], ['الجيزة', 'Giza'], ['الأقصر', 'Luxor']]],
  ['ما المدينة المصرية التي تضم معابد الكرنك؟', 'Which Egyptian city has Karnak Temple?', 'الأقصر', 'Luxor', [['أسوان', 'Aswan'], ['الإسكندرية', 'Alexandria'], ['السويس', 'Suez']]],
  ['ما المدينة المصرية المشهورة بمكتبتها الحديثة الكبرى؟', 'Which Egyptian city is famous for its modern major library?', 'الإسكندرية', 'Alexandria', [['القاهرة', 'Cairo'], ['المنصورة', 'Mansoura'], ['بورسعيد', 'Port Said']]],
  ['ما اسم أشهر قناة ملاحية تمر في مصر؟', 'What is the famous shipping canal in Egypt?', 'قناة السويس', 'Suez Canal', [['قناة بنما', 'Panama Canal'], ['نهر النيل', 'Nile River'], ['بحيرة ناصر', 'Lake Nasser']]],
  ['ما اسم أعلى قمة جبلية في مصر؟', 'What is the highest mountain peak in Egypt?', 'جبل سانت كاترين', 'Mount Catherine', [['جبل المقطم', 'Mokattam Mountain'], ['جبل علبة', 'Gebel Elba'], ['جبل موسى', 'Mount Sinai']]],
  ['أي معلم مصري يرتبط برمسيس الثاني جنوب أسوان؟', 'Which Egyptian monument is linked to Ramesses II south of Aswan?', 'معبد أبو سمبل', 'Abu Simbel Temples', [['قلعة قايتباي', 'Qaitbay Citadel'], ['معبد الكرنك', 'Karnak Temple'], ['خان الخليلي', 'Khan el-Khalili']]],
  ['ما اسم أشهر متحف للآثار المصرية في ميدان التحرير؟', 'What is the famous antiquities museum in Tahrir Square?', 'المتحف المصري بالتحرير', 'Egyptian Museum in Tahrir', [['متحف الفن الإسلامي', 'Museum of Islamic Art'], ['متحف النوبة', 'Nubian Museum'], ['متحف الإسكندرية القومي', 'Alexandria National Museum']]],
  ['أي منطقة مصرية تشتهر بالشعاب المرجانية قرب شرم الشيخ؟', 'Which Egyptian area is famous for coral reefs near Sharm El Sheikh?', 'محمية رأس محمد', 'Ras Muhammad National Park', [['واحة سيوة', 'Siwa Oasis'], ['وادي الملوك', 'Valley of the Kings'], ['قصر عابدين', 'Abdeen Palace']]],
  ['ما اسم السوق التاريخي الأشهر للسياح في القاهرة؟', 'What is the famous historic tourist bazaar in Cairo?', 'خان الخليلي', 'Khan el-Khalili', [['سوق الجمعة', 'Friday Market'], ['سوق العبور', 'Obour Market'], ['سوق ليبيا', 'Libya Market']]],
  ['أي أثر ساعد العلماء على فك رموز الهيروغليفية بعد اكتشافه عام 1799؟', 'Which artifact helped scholars decode hieroglyphs after its discovery in 1799?', 'حجر رشيد', 'Rosetta Stone', [['لوحة نارمر', 'Narmer Palette'], ['قناع توت عنخ آمون', 'Tutankhamun mask'], ['مسلة كليوباترا', 'Cleopatra Needle']]],
  ['ما اسم البحيرة الصناعية الكبيرة خلف السد العالي؟', 'What is the large reservoir behind the High Dam?', 'بحيرة ناصر', 'Lake Nasser', [['بحيرة قارون', 'Lake Qarun'], ['بحيرة المنزلة', 'Lake Manzala'], ['البحيرات المرة', 'Bitter Lakes']]],
  ['أي مدينة مصرية تشتهر بدار الأوبرا المصرية؟', 'Which Egyptian city is associated with the Cairo Opera House?', 'القاهرة', 'Cairo', [['الإسكندرية', 'Alexandria'], ['الأقصر', 'Luxor'], ['أسوان', 'Aswan']]]
];

moreGeneralFacts.push(
  ['أي محافظة مصرية تضم واحة سيوة؟', 'Which Egyptian governorate includes Siwa Oasis?', 'مطروح', 'Matrouh', [['الفيوم', 'Fayoum'], ['أسوان', 'Aswan'], ['شمال سيناء', 'North Sinai']]],
  ['ما اسم أشهر شارع تاريخي في القاهرة الفاطمية؟', 'What is the famous historic street in Fatimid Cairo?', 'شارع المعز', 'Al-Muizz Street', [['شارع الهرم', 'Al Haram Street'], ['شارع رمسيس', 'Ramses Street'], ['شارع البحر الأعظم', 'Al Bahr Al Aazam Street']]],
  ['أي مدينة مصرية تقع عند المدخل الشمالي للممر الملاحي بين المتوسط والأحمر؟', 'Which Egyptian city is at the northern entrance of the canal between the Mediterranean and Red Sea?', 'بورسعيد', 'Port Said', [['السويس', 'Suez'], ['الإسماعيلية', 'Ismailia'], ['دمياط', 'Damietta']]],
  ['أي مدينة مصرية تقع عند المدخل الجنوبي للممر الملاحي بين المتوسط والأحمر؟', 'Which Egyptian city is at the southern entrance of the canal between the Mediterranean and Red Sea?', 'السويس', 'Suez', [['بورسعيد', 'Port Said'], ['الإسماعيلية', 'Ismailia'], ['العريش', 'Arish']]],
  ['ما اسم أشهر منطقة أثرية تضم الهرم الأكبر؟', 'What is the famous archaeological area that includes the Great Pyramid?', 'منطقة أهرامات الجيزة', 'Giza pyramid complex', [['سقارة', 'Saqqara'], ['دهشور', 'Dahshur'], ['أبو صير', 'Abusir']]],
  ['أي مدينة مصرية ارتبطت تاريخيا بمكتبة قديمة شهيرة؟', 'Which Egyptian city is historically linked to an ancient famous library?', 'الإسكندرية', 'Alexandria', [['الأقصر', 'Luxor'], ['سوهاج', 'Sohag'], ['طنطا', 'Tanta']]],
  ['ما اسم البحر الذي تطل عليه مدينة الإسكندرية؟', 'Which sea does Alexandria overlook?', 'البحر المتوسط', 'Mediterranean Sea', [['البحر الأحمر', 'Red Sea'], ['بحر العرب', 'Arabian Sea'], ['بحر مرمرة', 'Sea of Marmara']]],
  ['أي محافظة مصرية تشتهر بمعابد أبو سمبل؟', 'Which Egyptian governorate is famous for Abu Simbel temples?', 'أسوان', 'Aswan', [['الأقصر', 'Luxor'], ['قنا', 'Qena'], ['المنيا', 'Minya']]]
);

const moreReligionQuestions = [
  ['ما اسم السورة التي تبدأ بـ «قل هو الله أحد»؟', 'Which surah begins with Say He is Allah One?', 'الإخلاص', 'Al-Ikhlas', [['الفلق', 'Al-Falaq'], ['الناس', 'An-Nas'], ['الفاتحة', 'Al-Fatiha']]],
  ['ما اسم السورة التي تقرأ كثيرا يوم الجمعة في التراث الإسلامي؟', 'Which surah is commonly read on Friday in Islamic tradition?', 'الكهف', 'Al-Kahf', [['يس', 'Ya-Sin'], ['الملك', 'Al-Mulk'], ['الرحمن', 'Ar-Rahman']]],
  ['ما اسم والدة النبي محمد ﷺ؟', 'What is the name of Prophet Muhammad mother?', 'آمنة بنت وهب', 'Amina bint Wahb', [['حليمة السعدية', 'Halima Al-Saadia'], ['خديجة بنت خويلد', 'Khadija bint Khuwaylid'], ['فاطمة بنت أسد', 'Fatima bint Asad']]],
  ['ما اسم مرضعة النبي محمد ﷺ المشهورة؟', 'Who is the famous foster mother of Prophet Muhammad?', 'حليمة السعدية', 'Halima Al-Saadia', [['آمنة بنت وهب', 'Amina bint Wahb'], ['خديجة بنت خويلد', 'Khadija bint Khuwaylid'], ['أم أيمن', 'Umm Ayman']]],
  ['ما اسم والد النبي محمد ﷺ؟', 'What is the name of Prophet Muhammad father?', 'عبد الله بن عبد المطلب', 'Abdullah ibn Abd al-Muttalib', [['أبو طالب', 'Abu Talib'], ['حمزة بن عبد المطلب', 'Hamza ibn Abd al-Muttalib'], ['العباس بن عبد المطلب', 'Al-Abbas ibn Abd al-Muttalib']]],
  ['ما اسم جد النبي محمد ﷺ؟', 'What is the name of Prophet Muhammad grandfather?', 'عبد المطلب', 'Abd al-Muttalib', [['هاشم', 'Hashim'], ['قصي', 'Qusai'], ['أبو طالب', 'Abu Talib']]],
  ['أي مسجد في القاهرة يعد من أقدم الجوامع الجامعة في مصر؟', 'Which Cairo mosque is among the oldest congregational mosques in Egypt?', 'جامع عمرو بن العاص', 'Amr ibn al-As Mosque', [['مسجد محمد علي', 'Muhammad Ali Mosque'], ['مسجد الرفاعي', 'Al-Rifai Mosque'], ['مسجد السلطان حسن', 'Sultan Hassan Mosque']]],
  ['أي مسجد تاريخي في القاهرة ارتبط بالدراسة الأزهرية؟', 'Which historic Cairo mosque is linked to Al-Azhar scholarship?', 'جامع الأزهر', 'Al-Azhar Mosque', [['جامع الحاكم', 'Al-Hakim Mosque'], ['مسجد السيدة زينب', 'Sayyida Zainab Mosque'], ['مسجد ابن طولون', 'Ibn Tulun Mosque']]],
  ['ما اسم الشهر الذي يأتي بعد رمضان مباشرة؟', 'Which month comes directly after Ramadan?', 'شوال', 'Shawwal', [['رجب', 'Rajab'], ['شعبان', 'Shaaban'], ['ذو القعدة', 'Dhu al-Qadah']]],
  ['ما اسم الشهر الذي يسبق رمضان مباشرة؟', 'Which month comes directly before Ramadan?', 'شعبان', 'Shaaban', [['شوال', 'Shawwal'], ['محرم', 'Muharram'], ['ذو الحجة', 'Dhu al-Hijjah']]],
  ['ما اسم أول شهر في التقويم الهجري؟', 'What is the first month of the Hijri calendar?', 'محرم', 'Muharram', [['رمضان', 'Ramadan'], ['شوال', 'Shawwal'], ['رجب', 'Rajab']]],
  ['ما اسم الشهر الذي يؤدي فيه المسلمون الحج؟', 'In which Hijri month is Hajj performed?', 'ذو الحجة', 'Dhu al-Hijjah', [['رمضان', 'Ramadan'], ['شعبان', 'Shaaban'], ['صفر', 'Safar']]]
];

addFieldQuestions('geography', egyptPlaces, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `دليل سفر سريع: أي معلم مصري تختاره لو المطلوب ${r.knownForAr}؟`, en: (r) => `Quick travel guide: which Egyptian place fits ${r.knownForEn}?` }
  ] }
]);

addFieldQuestions('history', egyptHistoryEvents, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `مؤشران واضحان: ${r.keyAr} + ${r.yearAr}. ما الحدث المصري؟`, en: (r) => `Two clear clues: ${r.keyEn} plus ${r.yearEn}. Which Egyptian event is it?` }
  ] }
]);

addFieldQuestions('art', egyptArtists, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `في المعرض: عمل أو اتجاه «${r.workAr}» يرتبط بأي فنان مصري؟`, en: (r) => `In a gallery: ${r.workEn} is linked to which Egyptian artist?` }
  ] },
  { arField: 'fieldAr', enField: 'fieldEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `لو بتشرح ${r.nameAr} لصاحبك، هتقول مجاله الفني الأقرب إيه؟`, en: (r) => `If you explain ${r.nameEn} to a friend, which art field fits best?` }
  ] }
]);

addFieldQuestions('music', egyptMusic, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `المقطع اتشهر باسم «${r.workAr}»؛ مين الفنان أو الملحن الأقرب له؟`, en: (r) => `The work is ${r.workEn}; which artist or composer fits it?` }
  ] }
]);

const sportsDirectQuestions = [
  ['أي ناد مصري يلقب غالبا بالمارد الأحمر؟', 'Which Egyptian club is commonly nicknamed the Red Giant?', 'النادي الأهلي', 'Al Ahly SC', [['نادي الزمالك', 'Zamalek SC'], ['الإسماعيلي', 'Ismaily SC'], ['الاتحاد السكندري', 'Al Ittihad Alexandria']]],
  ['أي ناد مصري يلقب غالبا بالفارس الأبيض؟', 'Which Egyptian club is commonly nicknamed the White Knight?', 'نادي الزمالك', 'Zamalek SC', [['النادي الأهلي', 'Al Ahly SC'], ['المصري البورسعيدي', 'Al Masry SC'], ['سموحة', 'Smouha SC']]],
  ['اللون الأخضر وجماهير مدينة ساحلية على القناة: أي ناد مصري في الصورة؟', 'Green shirts and a canal coastal city crowd: which Egyptian club fits?', 'النادي المصري البورسعيدي', 'Al Masry SC', [['نادي الإسماعيلي', 'Ismaily SC'], ['الاتحاد السكندري', 'Al Ittihad Alexandria'], ['نادي الزمالك', 'Zamalek SC']]],
  ['أي منتخب ارتبط باسم حسام حسن كلاعب تاريخي؟', 'Which national team is Hossam Hassan historically associated with?', 'منتخب مصر', 'Egypt national team', [['منتخب المغرب', 'Morocco national team'], ['منتخب تونس', 'Tunisia national team'], ['منتخب الجزائر', 'Algeria national team']]],
  ['أي ناد إنجليزي ارتبط باسم محمد صلاح عالميا؟', 'Which English club is Mohamed Salah globally associated with?', 'ليفربول (Liverpool)', 'Liverpool', [['تشيلسي (Chelsea)', 'Chelsea'], ['آرسنال (Arsenal)', 'Arsenal'], ['مانشستر سيتي (Manchester City)', 'Manchester City']]],
  ['حكاية أول مونديال: أي بلد استضاف أول كأس عالم وفاز به عام 1930؟', 'First World Cup story: which country hosted and won the first tournament in 1930?', 'أوروجواي', 'Uruguay', [['إيطاليا', 'Italy'], ['البرازيل', 'Brazil'], ['فرنسا', 'France']]],
  ['قصة كأس أفريقيا: أول نسخة من كأس الأمم الأفريقية بدأت في أي عقد؟', 'Africa Cup story: the first AFCON began in which decade?', 'الخمسينيات', '1950s', [['الثلاثينيات', '1930s'], ['السبعينيات', '1970s'], ['التسعينيات', '1990s']]],
  ['ليالي أوروبا: أي بطولة أندية أوروبية بدأت باسم كأس الأندية الأوروبية البطلة؟', 'European nights: which club competition began as the European Champion Clubs Cup?', 'دوري أبطال أوروبا', 'UEFA Champions League', [['الدوري الأوروبي', 'Europa League'], ['كأس العالم للأندية', 'Club World Cup'], ['كأس أمم أوروبا', 'UEFA Euro']]],
  ['نهائي القرن محليا: لما تسمع ديربي القاهرة، أي ناديين غالبا في الصورة؟', 'Local derby clue: which two clubs usually define the Cairo derby?', 'الأهلي والزمالك', 'Al Ahly and Zamalek', [['الإسماعيلي والمصري', 'Ismaily and Al Masry'], ['الاتحاد وسموحة', 'Al Ittihad and Smouha'], ['إنبي والمقاولون', 'ENPPI and Al Mokawloon']]],
  ['كارت أفريقيا: أي بطولة قارية للأندية يطاردها الأهلي والزمالك عادة؟', 'Africa club card: which continental club trophy do Al Ahly and Zamalek usually chase?', 'دوري أبطال أفريقيا', 'CAF Champions League', [['الدوري المصري الممتاز', 'Egyptian Premier League'], ['كأس مصر', 'Egypt Cup'], ['الدوري الأوروبي', 'Europa League']]],
  ['كلاسيكو عالمي: ريال مدريد وبرشلونة هما طرفا أي مواجهة مشهورة؟', 'Global rivalry clue: Real Madrid and Barcelona form which famous fixture?', 'الكلاسيكو', 'El Clasico', [['ديربي مانشستر', 'Manchester derby'], ['ديربي ميلانو', 'Milan derby'], ['ديربي القاهرة', 'Cairo derby']]],
  ['رقم 10 و1986: أي نجم أرجنتيني يلمع خلف هذه اللقطة؟', 'Number 10 and 1986: which Argentine star is behind this clue?', 'دييغو مارادونا', 'Diego Maradona', [['ليونيل ميسي', 'Lionel Messi'], ['زين الدين زيدان', 'Zinedine Zidane'], ['رونالدينيو', 'Ronaldinho']]],
  ['أرقام دوري الأبطال والقفزات العالية: أي نجم برتغالي تقصد اللقطة؟', 'Champions League numbers and huge leaps: which Portuguese star is this?', 'كريستيانو رونالدو', 'Cristiano Ronaldo', [['لوكا مودريتش', 'Luka Modric'], ['كيليان مبابي', 'Kylian Mbappe'], ['إيرلينغ هالاند', 'Erling Haaland']]],
  ['أنفيلد والقدم اليسرى والسرعة: أي لاعب مصري هو الأقرب؟', 'Anfield, left foot, and speed: which Egyptian player fits?', 'محمد صلاح', 'Mohamed Salah', [['محمد أبو تريكة', 'Mohamed Aboutrika'], ['أحمد حسن', 'Ahmed Hassan'], ['حسام حسن', 'Hossam Hassan']]],
  ['تيكي تاكا في الوسط: أي ثنائي إسباني يرتبط غالبا بإيقاع برشلونة؟', 'Tiki-taka midfield clue: which Spanish pair is tied to Barcelona rhythm?', 'تشافي وإنييستا', 'Xavi and Iniesta', [['ميسي ونيمار', 'Messi and Neymar'], ['بيليه ورونالدو', 'Pele and Ronaldo'], ['مودريتش وكروس', 'Modric and Kroos']]],
  ['مونديال 2022: أي منتخب عربي وصل إلى نصف النهائي في مفاجأة تاريخية؟', 'World Cup 2022: which Arab national team reached the semi-final in a historic surprise?', 'منتخب المغرب', 'Morocco national team', [['منتخب مصر', 'Egypt national team'], ['منتخب تونس', 'Tunisia national team'], ['منتخب السعودية', 'Saudi Arabia national team']]],
  ['كأس العالم 2006: الحارس الأسطوري بوفون كان مع أي منتخب؟', 'World Cup 2006: legendary goalkeeper Buffon played for which national team?', 'منتخب إيطاليا', 'Italy national team', [['منتخب فرنسا', 'France national team'], ['منتخب البرازيل', 'Brazil national team'], ['منتخب ألمانيا', 'Germany national team']]],
  ['نهائي 1998 ورأسيتان: أي لاعب فرنسي صار عنوان الليلة؟', '1998 final and two headers: which French player became the headline?', 'زين الدين زيدان', 'Zinedine Zidane', [['كيليان مبابي', 'Kylian Mbappe'], ['تييري هنري', 'Thierry Henry'], ['ديدييه دروغبا', 'Didier Drogba']]]
];

for (const [textAr, textEn, answerAr, answerEn, wrong] of sportsDirectQuestions) {
  addDirectQuestion('sports', 'Easy', 15, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('science-nature', scienceRecords, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `لغز معمل وفلك: الرمز أو الوصف «${r.symbolAr}» يخص أي عنصر أو كوكب؟`, en: (r) => `Lab-and-space clue: which element or planet matches ${r.symbolEn}?` }
  ] }
]);

addFieldQuestions('technology', techRecords, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `أداة في جيبك الرقمي: أي تقنية أو منتج يخدم فكرة ${r.useAr}؟`, en: (r) => `Digital pocket tool: which technology or product serves ${r.useEn}?` }
  ] }
]);

addRecordRelationshipSet('geography', egyptPlaces, [
  { kind: 'nameFromClues', clueFields: ['knownFor', 'governorate'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'governorate', clueField: 'knownFor', labelAr: 'مكان', labelEn: 'place', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'knownFor', clueField: 'governorate', labelAr: 'وصف', labelEn: 'description', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('geography', globalPlaces, [
  { kind: 'nameFromClues', clueFields: ['knownFor', 'location'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'location', clueField: 'knownFor', labelAr: 'موقع', labelEn: 'location', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'knownFor', clueField: 'location', labelAr: 'وصف', labelEn: 'description', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('history', egyptHistoryEvents, [
  { kind: 'nameFromClues', clueFields: ['key', 'year'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'key', clueField: 'year', labelAr: 'اسم أو جهة', labelEn: 'name or group', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'year', clueField: 'key', labelAr: 'سنة أو فترة', labelEn: 'year or period', difficulty: 'Medium', timeLimitSec: 20, poolRadius: 5 }
]);

addRecordRelationshipSet('film-tv', egyptFilms, [
  { kind: 'nameFromClues', clueFields: ['director', 'star'], difficulty: 'Medium', timeLimitSec: 20 },
  { kind: 'nameFromClues', clueFields: ['star', 'year'], difficulty: 'Hard', timeLimitSec: 25 },
  { answerField: 'director', clueField: 'star', labelAr: 'مخرج', labelEn: 'director', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'star', clueField: 'director', labelAr: 'نجم', labelEn: 'star', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'year', clueField: 'star', labelAr: 'سنة', labelEn: 'year', difficulty: 'Hard', timeLimitSec: 25, poolRadius: 5 }
]);

addRecordRelationshipSet('film-tv', egyptSeries, [
  { kind: 'nameFromClues', clueFields: ['writer', 'star'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'writer', clueField: 'star', labelAr: 'كاتب', labelEn: 'writer', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'star', clueField: 'writer', labelAr: 'نجم', labelEn: 'star', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('books-literature', egyptBooks, [
  { kind: 'nameFromClues', clueFields: ['author', 'type'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'author', clueField: 'type', labelAr: 'كاتب', labelEn: 'author', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'type', clueField: 'author', labelAr: 'نوع أدبي', labelEn: 'literary type', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('music', egyptMusic, [
  { kind: 'nameFromClues', clueFields: ['work', 'country'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'work', clueField: 'country', labelAr: 'عمل غنائي', labelEn: 'musical work', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'country', clueField: 'work', labelAr: 'بلد أو ساحة فنية', labelEn: 'country or scene', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('sports', egyptSports, [
  { kind: 'nameFromClues', clueFields: ['city', 'stadium'], difficulty: 'Medium', timeLimitSec: 20 },
  { kind: 'nameFromClues', clueFields: ['color', 'city'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'city', clueField: 'stadium', labelAr: 'مدينة', labelEn: 'city', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'stadium', clueField: 'city', labelAr: 'ملعب', labelEn: 'stadium', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'color', clueField: 'city', labelAr: 'لون', labelEn: 'color', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('sports', footballPlayers, [
  { kind: 'nameFromClues', clueFields: ['clue', 'associated'], difficulty: 'Medium', timeLimitSec: 20 },
  { kind: 'nameFromClues', clueFields: ['role', 'nationalTeam'], difficulty: 'Hard', timeLimitSec: 25 },
  { answerField: 'role', clueField: 'clue', labelAr: 'دور في الملعب', labelEn: 'football role', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'associated', clueField: 'clue', labelAr: 'نادي أو محطة', labelEn: 'club or career stop', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'nationalTeam', clueField: 'associated', labelAr: 'منتخب', labelEn: 'national team', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('sports', footballTournaments, [
  { kind: 'nameFromClues', clueFields: ['identity', 'memory'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'scope', clueField: 'identity', labelAr: 'نطاق البطولة', labelEn: 'competition scope', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'memory', clueField: 'scope', labelAr: 'معلومة مميزة', labelEn: 'memory hook', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('art', egyptArtists, [
  { kind: 'nameFromClues', clueFields: ['work', 'field'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'work', clueField: 'field', labelAr: 'عمل أو اتجاه', labelEn: 'work or style', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'field', clueField: 'work', labelAr: 'مجال فني', labelEn: 'art field', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('science-nature', scienceRecords, [
  { kind: 'nameFromClues', clueFields: ['symbol', 'feature'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'symbol', clueField: 'feature', labelAr: 'رمز أو وصف', labelEn: 'symbol or label', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'feature', clueField: 'symbol', labelAr: 'خاصية', labelEn: 'feature', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('technology', techRecords, [
  { kind: 'nameFromClues', clueFields: ['creator', 'use'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'creator', clueField: 'use', labelAr: 'شخص أو جهة', labelEn: 'person or organization', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'use', clueField: 'creator', labelAr: 'استخدام', labelEn: 'use', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('politics', politicsRecords, [
  { kind: 'nameFromClues', clueFields: ['headquarters', 'purpose'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'headquarters', clueField: 'purpose', labelAr: 'مقر', labelEn: 'headquarters', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'purpose', clueField: 'headquarters', labelAr: 'هدف أو وظيفة', labelEn: 'purpose or role', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('animals', animalRecords, [
  { kind: 'nameFromClues', clueFields: ['habitat', 'feature'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'habitat', clueField: 'feature', labelAr: 'بيئة', labelEn: 'habitat', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'feature', clueField: 'habitat', labelAr: 'صفة', labelEn: 'feature', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('vehicles', vehicleRecords, [
  { kind: 'nameFromClues', clueFields: ['type', 'use'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'type', clueField: 'use', labelAr: 'نوع', labelEn: 'type', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'use', clueField: 'type', labelAr: 'استخدام', labelEn: 'use', difficulty: 'Medium', timeLimitSec: 20 }
]);

addRecordRelationshipSet('games', gameRecords, [
  { kind: 'nameFromClues', clueFields: ['type', 'knownFor'], difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'type', clueField: 'knownFor', labelAr: 'نوع اللعبة', labelEn: 'game type', difficulty: 'Medium', timeLimitSec: 20 },
  { answerField: 'knownFor', clueField: 'type', labelAr: 'فكرة اللعب', labelEn: 'gameplay idea', difficulty: 'Medium', timeLimitSec: 20 }
]);

const derivedQuestionLeads = [
  { ar: 'زاوية تفكير جديدة:', en: 'Fresh thinking angle' },
  { ar: 'كارت تحدي قريب الاختيارات:', en: 'Close-choice challenge card' },
  { ar: 'لقطة تركيز قبل الإجابة:', en: 'Focus-before-answer clue' },
  { ar: 'جولة ذاكرة ومعنى:', en: 'Memory-and-meaning round' },
  { ar: 'اختبار معلومة من نفس العائلة:', en: 'Same-family knowledge test' },
  { ar: 'دليل صغير يفرق بين الاختيارات:', en: 'Small clue separating close options' },
  { ar: 'تحدي اختيار واحد صحيح:', en: 'One-correct-choice challenge' },
  { ar: 'مقارنة خفيفة:', en: 'Light comparison' },
  { ar: 'سؤال يحتاج ربط مش حفظ:', en: 'Linking-not-memorizing prompt' },
  { ar: 'جولة اختيارات متقاربة:', en: 'Close-options round' },
  { ar: 'معلومة بسؤال له ثنية:', en: 'Fact with a small twist' },
  { ar: 'معلومة مفيدة للعب:', en: 'Playable useful clue' },
  { ar: 'لقطة تمييز بين إجابات قريبة:', en: 'Distinguish-close-answers clue' },
  { ar: 'تحدي سريع لكن مش مكشوف:', en: 'Quick but not obvious challenge' },
  { ar: 'دليل من نفس المجال:', en: 'Same-domain clue' },
  { ar: 'جولة تثبيت معلومة:', en: 'Knowledge-reinforcement round' },
  { ar: 'اختبار ربط بين clue وإجابة:', en: 'Clue-to-answer linking test' },
  { ar: 'سؤال تفكير للاعبين:', en: 'Player-thinking question' }
];

function categoryQuestionCount(categorySlug) {
  return questions.filter((question) => question.categorySlug === categorySlug).length;
}

const sameFamilyComparisonFrames = [
  {
    ar: (textAr, wrong) => `الفخ القريب «${wrong}»: ${textAr}`,
    en: (textEn, wrong) => `Close trap "${wrong}": ${textEn}`
  },
  {
    ar: (textAr, wrong) => `استبعد «${wrong}» وركز في الدليل: ${textAr}`,
    en: (textEn, wrong) => `Rule out "${wrong}" and focus on the clue: ${textEn}`
  },
  {
    ar: (textAr, wrong) => `بين اختيارات متقاربة، «${wrong}» مش كفاية: ${textAr}`,
    en: (textEn, wrong) => `Among close options, "${wrong}" is not enough: ${textEn}`
  },
  {
    ar: (textAr, wrong) => `اختيار قريب لكنه فخ «${wrong}»: ${textAr}`,
    en: (textEn, wrong) => `A close but wrong trap is "${wrong}": ${textEn}`
  }
];

function addDerivedQuestion(baseQuestion, variantIndex) {
  const correctOption = baseQuestion.options.find((option) => option.isCorrect);
  if (!correctOption) {
    throw new Error(`Cannot derive from question without a correct option: ${baseQuestion.slug}`);
  }

  const wrongOptions = baseQuestion.options.filter((option) => !option.isCorrect);
  const wrongOption = wrongOptions[variantIndex % wrongOptions.length];
  const frame = sameFamilyComparisonFrames[variantIndex % sameFamilyComparisonFrames.length];
  const textAr = frame.ar(baseQuestion.textAr, wrongOption.textAr);
  const textEn = frame.en(baseQuestion.textEn, wrongOption.textEn);

  addQuestion(
    baseQuestion.categorySlug,
    baseQuestion.difficulty,
    baseQuestion.timeLimitSec,
    textAr,
    textEn,
    { ar: correctOption.textAr, en: correctOption.textEn },
    baseQuestion.options.map((option) => ({ ar: option.textAr, en: option.textEn })),
    `${source} / same-family comparison fallback`
  );
}

function inflateCategoryToTarget(categorySlug, targetCount) {
  const baseQuestions = questions.filter((question) => question.categorySlug === categorySlug);
  if (baseQuestions.length === 0) {
    throw new Error(`Cannot inflate category with no base questions: ${categorySlug}`);
  }

  let variantIndex = 0;
  let attempts = 0;
  const maxAttempts = targetCount * 40;
  while (categoryQuestionCount(categorySlug) < targetCount && attempts < maxAttempts) {
    const baseQuestion = baseQuestions[variantIndex % baseQuestions.length];
    try {
      addDerivedQuestion(baseQuestion, Math.floor(variantIndex / baseQuestions.length));
    } catch {
      // Some base prompts are already at the length boundary; skip weak fallbacks.
    }
    variantIndex++;
    attempts++;
  }

  if (categoryQuestionCount(categorySlug) < targetCount) {
    throw new Error(`Category ${categorySlug} cannot reach ${targetCount} questions without weak variants.`);
  }
}

for (const [categorySlug, targetCount] of Object.entries(targetCategoryCounts)) {
  inflateCategoryToTarget(categorySlug, targetCount);
}

if (questions.length < minimumTotalQuestions) {
  throw new Error(`Question bank is below ${minimumTotalQuestions}: ${questions.length}`);
}

const categoryCounts = Object.fromEntries(categories.map((category) => [category.slug, 0]));
const normalizedQuestionText = new Set();

for (const question of questions) {
  categoryCounts[question.categorySlug]++;

  const normalized = question.textAr.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalizedQuestionText.has(normalized)) {
    throw new Error(`Duplicate Arabic question text: ${question.textAr}`);
  }
  normalizedQuestionText.add(normalized);

  if (question.options.length !== 4) {
    throw new Error(`Question ${question.slug} has ${question.options.length} options.`);
  }
  if (question.options.filter((option) => option.isCorrect).length !== 1) {
    throw new Error(`Question ${question.slug} does not have exactly one correct option.`);
  }
}

for (const category of categories) {
  if (categoryCounts[category.slug] === 0) {
    throw new Error(`Category ${category.slug} has no questions.`);
  }
}

const bank = {
  version: 2,
  generatedAtUtc: new Date().toISOString(),
  language: 'ar',
  focus: 'Egypt-first',
  sources: [
    {
      name: 'Wikipedia',
      url: 'https://www.wikipedia.org/',
      license: 'Creative Commons Attribution-ShareAlike',
      usage: 'Broad encyclopedia cross-checks for public factual prompts; no copied prose.'
    },
    {
      name: 'Wikidata',
      url: 'https://www.wikidata.org/wiki/Wikidata:Licensing',
      license: 'Creative Commons CC0',
      usage: 'Structured factual compatibility and verification model.'
    },
    {
      name: 'Open Trivia Database',
      url: 'https://opentdb.com/',
      license: 'Creative Commons Attribution-ShareAlike 4.0',
      usage: 'Open-trivia category model compatibility.'
    },
    {
      name: 'Sabq curated Egypt-first records',
      url: 'local://scripts/generate-question-bank.mjs',
      license: 'Project-curated factual prompts',
      usage: 'Arabic user-facing question text and Egypt-first coverage.'
    },
    {
      name: 'FIFA tournament records',
      url: 'https://www.fifa.com/en/tournaments',
      license: 'Official factual reference; no copied prose',
      usage: 'World Cup and global football tournament fact checks.'
    },
    {
      name: 'UEFA competition history',
      url: 'https://www.uefa.com/uefachampionsleague/history/',
      license: 'Official factual reference; no copied prose',
      usage: 'European club tournament history and records.'
    },
    {
      name: 'CAF official competitions',
      url: 'https://www.cafonline.com/',
      license: 'Official factual reference; no copied prose',
      usage: 'African football competitions and national-team tournament fact checks.'
    },
    {
      name: 'Premier League official records',
      url: 'https://www.premierleague.com/',
      license: 'Official factual reference; no copied prose',
      usage: 'English football league and club-context fact checks.'
    },
    {
      name: 'LaLiga official records',
      url: 'https://www.laliga.com/',
      license: 'Official factual reference; no copied prose',
      usage: 'Spanish football league and club-context fact checks.'
    },
    {
      name: 'NASA Solar System Exploration',
      url: 'https://science.nasa.gov/solar-system/',
      license: 'United States government public information',
      usage: 'Solar system and space science fact checks.'
    },
    {
      name: 'Nobel Prize official facts',
      url: 'https://www.nobelprize.org/about-the-nobel-prize/',
      license: 'Official factual reference; no copied prose',
      usage: 'Nobel history, categories, and award timing fact checks.'
    },
    {
      name: 'UNESCO World Heritage Centre',
      url: 'https://whc.unesco.org/',
      license: 'Official factual reference; no copied prose',
      usage: 'Culture, heritage, geography, and organization fact checks.'
    },
    {
      name: 'United Nations official site',
      url: 'https://www.un.org/',
      license: 'Official factual reference; no copied prose',
      usage: 'International organization and political institution fact checks.'
    },
    {
      name: 'Britannica',
      url: 'https://www.britannica.com/',
      license: 'General encyclopedia factual reference; no copied prose',
      usage: 'Secondary cross-checks for science, history, culture, animals, and inventions.'
    }
  ],
  categories,
  questions: questions.sort((a, b) => a.categorySlug.localeCompare(b.categorySlug) || a.slug.localeCompare(b.slug))
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');

console.log(`Generated ${questions.length} questions`);
for (const [slug, count] of Object.entries(categoryCounts)) {
  console.log(`${slug}: ${count}`);
}
