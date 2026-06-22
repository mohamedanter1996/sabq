# Sabq Question Bank Sources

The local Arabic question bank is stored in `questions.ar.json` and is loaded by `DbSeeder`.

## Source Policy

- Normal database seeding does not fetch questions from the internet.
- The checked-in JSON is the source of truth for startup seeding.
- Version 2 is Egypt-first: Egyptian film, football, literature, art, music, history, geography, and general knowledge are prioritized.
- `religion-islamic` contains informational Islam-related questions about Quran, seerah, companions, Islamic history, Al-Azhar, and Egyptian Islamic landmarks. It avoids fatwas, sectarian framing, and disputed rulings.
- Filler prompts such as "اختر الإجابة الصحيحة المرتبطة بـ..." are rejected by the generator and must not appear in the bank.
- The optional monthly refresh job is disabled by default and only imports from configured open/structured providers after validation.
- Existing questions that are not in the JSON bank are disabled, not deleted, to preserve game history.
- Every active question must have exactly four options and exactly one correct answer.

## Open Sources and Attribution

- Open Trivia Database: https://opentdb.com/
  - License: Creative Commons Attribution-ShareAlike 4.0.
  - Used as the open-trivia source model, category reference, and optional future import source.
- OpenTriviaQA: https://github.com/uberspot/OpenTriviaQA
  - License: Creative Commons Attribution-ShareAlike 4.0.
  - Used as a multiple-choice dataset format reference.
- Wikidata: https://www.wikidata.org/wiki/Wikidata:Licensing
  - License: Creative Commons CC0 for structured data.
  - Used for factual verification and open-data compatibility.
- Curated Egypt-first local records:
  - Locally generated from structured factual records checked into `scripts/generate-question-bank.mjs`.
  - Used for the current Arabic user-facing v2 bank.

## Regeneration

Run this from the repository root:

```powershell
node scripts\generate-question-bank.mjs
```

Then validate with:

```powershell
node -e "const fs=require('fs'); const bank=JSON.parse(fs.readFileSync('src/Sabq.Infrastructure/Data/QuestionBank/questions.ar.json','utf8')); const bad=bank.questions.filter(q=>q.options.length!==4 || q.options.filter(o=>o.isCorrect).length!==1); console.log({questions: bank.questions.length, bad: bad.length});"
```

The generator also rejects duplicate slugs, duplicate Arabic question text, missing category questions, and the banned filler phrase.

## Monthly Refresh Job

`QuestionBankRefreshScheduler` can be enabled from `src/Sabq.Api/appsettings.json`:

- `QuestionBankRefresh:Enabled`: starts the monthly job.
- `QuestionBankRefresh:Wikidata:Enabled`: imports Arabic factual questions from Wikidata structured data.
- `QuestionBankRefresh:OpenTriviaDb:Enabled`: can import OpenTDB multiple-choice questions only when `AllowEnglishFallback` is enabled or a translation layer is added later.
- `QuestionBankRefresh:GoogleCustomSearch`: uses official Google Custom Search API only to discover candidate open sources. It does not scrape pages or import unverified/licensed content automatically.
