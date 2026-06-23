# Sabq Question Bank Sources

The local Arabic question bank is stored in `questions.ar.json` and is loaded by `DbSeeder`.

## Source Policy

- Normal database seeding does not fetch questions from the internet.
- The checked-in JSON is the source of truth for startup seeding.
- The bank uses a curated static model: facts are checked from Wikipedia, Wikidata, official sites, and reputable references, then rewritten as original Arabic prompts.
- Sources are documentation and audit metadata only. `DbSeeder` does not read per-question `source` values today.
- Sports is football-only in this version: Egyptian football, global football players, clubs, national teams, and football competitions.
- Non-football sports prompts are rejected from `sports`, including tennis, basketball, Olympics, Formula 1, cricket, rugby, handball, NFL, and similar topics.
- Questions should feel playable first: every category should use a small scene, clue, memory hook, comparison, or practical context instead of a bare dictionary prompt.
- Good prompts should teach while they play by exposing why the fact matters: cultural memory, travel context, historical clue, everyday tech use, tournament identity, or an unexpected comparison.
- `religion-islamic` contains informational Islam-related questions about Quran, seerah, companions, Islamic history, Al-Azhar, and Egyptian Islamic landmarks. It avoids fatwas, sectarian framing, and disputed rulings.
- Filler prompts such as "اختر الإجابة الصحيحة المرتبطة بـ..." are rejected by the generator and must not appear in the bank.
- Dry repeated stems such as "بماذا يشتهر", "ما الاستخدام الأشهر", "ما نوع", and plain year/author templates are rejected when produced from generated field templates.
- Sports tournament prompts that ask the player to infer a basic team type from the tournament name, such as "تخص غالبا أي نوع فرق؟", are rejected as too obvious.
- Direct classification prompts such as "تحت أي نوع؟" or "تتحسب من أي نوع ألعاب؟" are rejected unless they are rewritten into a clue-based question with close same-family options.
- Memorization-only prompts such as "ما اسم أول...", "ما اسم أطول...", "ما اسم أشهر...", "كل كام سنة؟", and very basic ritual/date questions are removed when they feel answerable without thinking.
- Prompts are rejected when the correct answer appears literally inside the Arabic question text.
- Over-obvious clue/answer pairs are rejected, such as asking about "الفيل الأفريقي" with "أفريقيا" as the answer.
- Distractors should match the answer type: player with players, tournament with tournaments, country with countries, animal trait with animal traits, and organization with organizations.
- Distractors should also be close enough to create a real decision: clubs from the same league or country, players from a similar era or role, scientific terms from the same topic, and landmarks or institutions from the same family.
- The optional monthly refresh job is disabled by default and only imports from configured open or structured providers after validation.
- Existing questions that are not in the JSON bank are disabled, not deleted, to preserve game history.
- Every active question must have exactly four options and exactly one correct answer.

## Open Sources and Attribution

- Wikipedia: https://www.wikipedia.org/
  - Used for broad encyclopedia cross-checks. Question wording is original and no prose is copied.
- Wikidata: https://www.wikidata.org/wiki/Wikidata:Licensing
  - License: Creative Commons CC0 for structured data.
  - Used for factual verification and open-data compatibility.
- Open Trivia Database: https://opentdb.com/
  - License: Creative Commons Attribution-ShareAlike 4.0.
  - Used as the open-trivia source model, category reference, and optional future import source.
- OpenTriviaQA: https://github.com/uberspot/OpenTriviaQA
  - License: Creative Commons Attribution-ShareAlike 4.0.
  - Used as a multiple-choice dataset format reference.
- Curated Egypt-first local records:
  - Locally generated from structured factual records checked into `scripts/generate-question-bank.mjs`.
  - Used for the current Arabic user-facing v2 bank.
- FIFA tournament records: https://www.fifa.com/en/tournaments
  - Used only as official factual reference for World Cup and global football tournament questions.
- UEFA competition history: https://www.uefa.com/uefachampionsleague/history/
  - Used only as official factual reference for European club competition history.
- CAF official competitions: https://www.cafonline.com/
  - Used only as official factual reference for African football competitions.
- Premier League official records: https://www.premierleague.com/
  - Used only as official factual reference for English football league and club-context questions.
- LaLiga official records: https://www.laliga.com/
  - Used only as official factual reference for Spanish football league and club-context questions.
- NASA Solar System Exploration: https://science.nasa.gov/solar-system/
  - Used for public space and solar-system facts.
- Nobel Prize official facts: https://www.nobelprize.org/about-the-nobel-prize/
  - Used only as official factual reference for Nobel history, categories, and award timing.
- UNESCO World Heritage Centre: https://whc.unesco.org/
  - Used for culture, heritage, geography, and organization fact checks.
- United Nations official site: https://www.un.org/
  - Used for international organization and political institution fact checks.
- Britannica: https://www.britannica.com/
  - Used as a secondary factual cross-check for science, history, culture, animals, and inventions.

## Regeneration

Run this from the repository root:

```powershell
node scripts\generate-question-bank.mjs
```

Then validate with:

```powershell
node -e "const fs=require('fs'); const bank=JSON.parse(fs.readFileSync('src/Sabq.Infrastructure/Data/QuestionBank/questions.ar.json','utf8')); const bad=bank.questions.filter(q=>q.options.length!==4 || q.options.filter(o=>o.isCorrect).length!==1); console.log({questions: bank.questions.length, bad: bad.length}); if (bad.length) process.exit(1);"
```

The generator also rejects duplicate slugs, duplicate Arabic question text, missing category questions, banned filler phrases, correct answers inside question text, obvious clue/answer pairs, and non-football sports prompts.

## Monthly Refresh Job

`QuestionBankRefreshScheduler` can be enabled from `src/Sabq.Api/appsettings.json`:

- `QuestionBankRefresh:Enabled`: starts the monthly job.
- `QuestionBankRefresh:Wikidata:Enabled`: imports Arabic factual questions from Wikidata structured data.
- `QuestionBankRefresh:OpenTriviaDb:Enabled`: can import OpenTDB multiple-choice questions only when `AllowEnglishFallback` is enabled or a translation layer is added later.
- `QuestionBankRefresh:GoogleCustomSearch`: uses official Google Custom Search API only to discover candidate open sources. It does not scrape pages or import unverified/licensed content automatically.
