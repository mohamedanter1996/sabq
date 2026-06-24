import { generationConfig } from './question-generation.config.mjs';

export function normalizeQuestionText(value) {
  return String(value ?? '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[ـ"“”'’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function countWords(value) {
  const normalized = normalizeQuestionText(value);
  return normalized ? normalized.split(' ').length : 0;
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function includesEnglishForbiddenTerm(text, term) {
  const normalizedTerm = normalizeQuestionText(term);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, 'i')
    .test(normalizeQuestionText(text));
}

export function answerAppearsInQuestionText(questionOrText, correctOption) {
  const textAr = typeof questionOrText === 'string'
    ? questionOrText
    : questionOrText?.textAr;
  const answerAr = correctOption?.ar ?? correctOption?.textAr ?? '';
  const normalizedAnswer = normalizeQuestionText(answerAr);

  return normalizedAnswer.length >= 4 &&
    normalizeQuestionText(textAr).includes(normalizedAnswer);
}

export function findObviousAnswerPair(questionOrText, correctOption) {
  const textAr = typeof questionOrText === 'string'
    ? questionOrText
    : questionOrText?.textAr;
  const answerAr = correctOption?.ar ?? correctOption?.textAr ?? '';
  const normalizedText = normalizeQuestionText(textAr);
  const normalizedAnswer = normalizeQuestionText(answerAr);

  return generationConfig.obviousAnswerPairs.find(([subject, answer]) =>
    normalizedText.includes(normalizeQuestionText(subject)) &&
    normalizedAnswer.includes(normalizeQuestionText(answer)));
}

export function findObviousQuestionPair(questionOrText) {
  const textAr = typeof questionOrText === 'string'
    ? questionOrText
    : questionOrText?.textAr;
  const normalizedText = normalizeQuestionText(textAr);

  return generationConfig.obviousAnswerPairs.find(([subject, answer]) =>
    normalizedText.includes(normalizeQuestionText(subject)) &&
    normalizedText.includes(normalizeQuestionText(answer)));
}

function correctOptionFor(question) {
  return question.options?.find((option) => option.isCorrect);
}

export function getQuestionQualityFailures(question) {
  const failures = [];
  const options = Array.isArray(question.options) ? question.options : [];
  const correctOption = correctOptionFor(question);
  const normalizedText = normalizeQuestionText(question.textAr);
  const normalizedSource = normalizeQuestionText(question.source);
  const textRules = generationConfig.questionText;

  if (!normalizedText) {
    failures.push('Missing Arabic question text');
  }

  if (question.textAr && question.textAr.length < textRules.minArabicChars) {
    failures.push(`Question is too short: ${question.textAr.length} chars`);
  }

  if (question.textAr && question.textAr.length > textRules.maxArabicChars) {
    failures.push(`Question is too long: ${question.textAr.length} chars`);
  }

  const wordCount = countWords(question.textAr);
  if (wordCount > textRules.maxArabicWords) {
    failures.push(`Question has too many words: ${wordCount}`);
  }

  const bannedPhrase = generationConfig.bannedQuestionPhrases
    .find((phrase) => normalizedText.includes(normalizeQuestionText(phrase)));
  if (bannedPhrase) {
    failures.push(`Banned dry stem: ${bannedPhrase}`);
  }

  const shortDirectEnding = generationConfig.shortDirectEndings
    .find((ending) => normalizedText.endsWith(normalizeQuestionText(ending)));
  if (shortDirectEnding && wordCount <= 11) {
    failures.push(`Short direct ending: ${shortDirectEnding}`);
  }

  const genericPrefix = generationConfig.bannedGenericVariantPrefixes
    .find((prefix) => normalizedText.startsWith(normalizeQuestionText(prefix)));
  if (genericPrefix) {
    failures.push(`Generic derived prefix: ${genericPrefix}`);
  }

  const weakSource = generationConfig.weakSources
    .find((source) => normalizedSource.includes(normalizeQuestionText(source)));
  if (weakSource) {
    failures.push(`Weak generated source: ${weakSource}`);
  }

  if (options.length !== 4) {
    failures.push(`Question must have 4 options, found ${options.length}`);
    return failures;
  }

  if (options.filter((option) => option.isCorrect).length !== 1) {
    failures.push('Question must have exactly one correct option');
    return failures;
  }

  if (correctOption && answerAppearsInQuestionText(question, correctOption)) {
    failures.push('Correct answer appears in question text');
  }

  const obviousPair = correctOption ? findObviousAnswerPair(question, correctOption) : null;
  if (obviousPair) {
    failures.push(`Obvious clue/answer pair: ${obviousPair.join(' / ')}`);
  }

  const obviousQuestionPair = findObviousQuestionPair(question);
  if (obviousQuestionPair) {
    failures.push(`Obvious clue pair in question text: ${obviousQuestionPair.join(' / ')}`);
  }

  const uniqueOptions = new Set(options.map((option) => normalizeQuestionText(option.textAr)));
  if (uniqueOptions.size !== 4) {
    failures.push('Options must be unique after normalization');
  }

  if (question.categorySlug === 'sports') {
    const arabicSportsHaystack = normalizeQuestionText(
      `${question.textAr} ${options.map((option) => option.textAr).join(' ')}`);
    const forbiddenSportsTerm = generationConfig.sportsForbiddenTerms
      .find((term) => arabicSportsHaystack.includes(normalizeQuestionText(term)));
    if (forbiddenSportsTerm) {
      failures.push(`Non-football sports term: ${forbiddenSportsTerm}`);
    }

    const englishSportsHaystack = `${question.textEn ?? ''} ${options.map((option) => option.textEn ?? '').join(' ')}`;
    const forbiddenEnglishSportsTerm = generationConfig.sportsForbiddenEnglishTerms
      .find((term) => includesEnglishForbiddenTerm(englishSportsHaystack, term));
    if (forbiddenEnglishSportsTerm) {
      failures.push(`Non-football English sports term: ${forbiddenEnglishSportsTerm}`);
    }

  }

  return failures;
}

export function assertQuestionQuality(question) {
  const failures = getQuestionQualityFailures(question);
  if (failures.length > 0) {
    throw new Error(`${failures.join('; ')}: ${question.textAr}`);
  }
}
