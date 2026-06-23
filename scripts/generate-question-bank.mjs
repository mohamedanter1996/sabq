import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'src', 'Sabq.Infrastructure', 'Data', 'QuestionBank', 'questions.ar.json');

const source = 'Curated Egypt-first factual bank / Wikidata-compatible open facts';
const directQuestionFrames = {
  'general-knowledge': {
    ar: 'معلومة سريعة تنفع في القعدة: ',
    en: 'Quick useful table fact: '
  },
  'religion-islamic': {
    ar: 'معرفة هادئة بلا جدل: ',
    en: 'Calm non-disputed knowledge: '
  },
  sports: {
    ar: 'لقطة رياضية سريعة: ',
    en: 'Quick sports moment: '
  }
};
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
  'ما الرمز أو الوصف المختصر'
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
  { slug: 'sports', nameAr: 'رياضة', nameEn: 'Sports', description: 'كرة مصرية ورياضات وبطولات محلية وعالمية.', displayOrder: 9 },
  { slug: 'science-nature', nameAr: 'علوم وطبيعة', nameEn: 'Science and Nature', description: 'علوم وطبيعة وكيمياء وفلك بأسئلة مباشرة.', displayOrder: 10 },
  { slug: 'technology', nameAr: 'تكنولوجيا', nameEn: 'Technology', description: 'برمجة واختراعات وشركات تقنية مع أسماء أصلية عند الحاجة.', displayOrder: 11 },
  { slug: 'politics', nameAr: 'سياسة', nameEn: 'Politics', description: 'مؤسسات مصرية ومنظمات دولية ومفاهيم سياسية عامة.', displayOrder: 12 },
  { slug: 'animals', nameAr: 'حيوانات', nameEn: 'Animals', description: 'حيوانات وبيئاتها وصفاتها.', displayOrder: 13 },
  { slug: 'vehicles', nameAr: 'مركبات', nameEn: 'Vehicles', description: 'سيارات وطائرات وقطارات ووسائل نقل.', displayOrder: 14 },
  { slug: 'games', nameAr: 'ألعاب', nameEn: 'Games', description: 'ألعاب فيديو وألعاب لوحية وكلاسيكيات اللعب.', displayOrder: 15 }
];

const questions = [];
const usedSlugs = new Set();

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
  questions.push({ slug, categorySlug, difficulty, timeLimitSec, textAr, textEn, options, source: questionSource });
}

function addDirectQuestion(categorySlug, difficulty, timeLimitSec, textAr, textEn, answerAr, answerEn, wrongOptions, questionSource = source) {
  const framed = frameDirectQuestion(categorySlug, textAr, textEn);
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
}

function fieldPool(records, arField, enField) {
  return records.map((record) => ({ ar: record[arField], en: record[enField] }));
}

function addFieldQuestions(categorySlug, records, specs, questionSource = source) {
  for (const record of records) {
    for (const spec of specs) {
      const correct = { ar: record[spec.arField], en: record[spec.enField] };
      const pool = fieldPool(records, spec.arField, spec.enField);
      for (const variant of spec.variants) {
        addQuestion(
          categorySlug,
          spec.difficulty,
          spec.timeLimitSec,
          variant.ar(record),
          variant.en(record),
          correct,
          pool,
          questionSource
        );
      }
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
  ['كمال الطويل', 'Kamal El Tawil', 'والله زمان يا سلاحي', 'Wallah Zaman Ya Selahy', 'مصر', 'Egypt']
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

const egyptSportsPeople = [
  ['محمد صلاح', 'Mohamed Salah', 'كرة القدم', 'football', 'ليفربول (Liverpool)', 'Liverpool'],
  ['محمود الخطيب', 'Mahmoud El Khatib', 'كرة القدم', 'football', 'الأهلي', 'Al Ahly'],
  ['حسام حسن', 'Hossam Hassan', 'كرة القدم', 'football', 'منتخب مصر', 'Egypt national team'],
  ['عصام الحضري', 'Essam El Hadary', 'كرة القدم', 'football', 'حراسة المرمى', 'goalkeeping'],
  ['أحمد حسن', 'Ahmed Hassan', 'كرة القدم', 'football', 'منتخب مصر', 'Egypt national team'],
  ['محمد أبو تريكة', 'Mohamed Aboutrika', 'كرة القدم', 'football', 'الأهلي', 'Al Ahly'],
  ['نور الشربيني', 'Nour El Sherbini', 'الإسكواش', 'squash', 'مصر', 'Egypt'],
  ['رامي عاشور', 'Ramy Ashour', 'الإسكواش', 'squash', 'مصر', 'Egypt'],
  ['هداية ملاك', 'Hedaya Malak', 'التايكوندو', 'taekwondo', 'مصر', 'Egypt'],
  ['فريال أشرف', 'Feryal Abdelaziz', 'الكاراتيه', 'karate', 'مصر', 'Egypt'],
  ['كرم جابر', 'Karam Gaber', 'المصارعة', 'wrestling', 'مصر', 'Egypt'],
  ['علاء أبو القاسم', 'Alaaeldin Abouelkassem', 'السلاح', 'fencing', 'مصر', 'Egypt']
].map(([nameAr, nameEn, sportAr, sportEn, knownForAr, knownForEn]) => ({ nameAr, nameEn, sportAr, sportEn, knownForAr, knownForEn }));

const worldSportsTournaments = [
  ['كأس العالم لكرة القدم', 'FIFA World Cup', 'كرة القدم', 'football', 'أكبر مسرح للمنتخبات كل أربع سنوات', 'biggest national-team stage every four years', 'أول نسخة أقيمت في أوروجواي عام 1930', 'first edition was held in Uruguay in 1930'],
  ['كأس العالم للسيدات', 'FIFA Women World Cup', 'كرة القدم', 'football', 'نسخة المنتخبات النسائية من المونديال', 'women national-team version of the World Cup', 'انطلقت أول نسخة عام 1991', 'first edition started in 1991'],
  ['كأس الأمم الأفريقية', 'Africa Cup of Nations', 'كرة القدم', 'football', 'بطولة تجمع منتخبات أفريقيا', 'tournament for African national teams', 'انطلقت أول نسخة عام 1957', 'first edition started in 1957'],
  ['دوري أبطال أوروبا', 'UEFA Champions League', 'كرة القدم', 'football', 'ليالي الأندية الأوروبية الكبرى', 'big European club nights', 'بدأت باسم كأس الأندية الأوروبية البطلة', 'started as the European Champion Clubs Cup'],
  ['كوبا أمريكا', 'Copa America', 'كرة القدم', 'football', 'بطولة منتخبات أمريكا الجنوبية التاريخية', 'historic South American national-team tournament', 'من أقدم بطولات المنتخبات القارية', 'one of the oldest continental national-team tournaments'],
  ['كأس آسيا', 'AFC Asian Cup', 'كرة القدم', 'football', 'بطولة منتخبات القارة الآسيوية', 'Asian national-team tournament', 'انطلقت أول نسخة عام 1956', 'first edition started in 1956'],
  ['كأس العالم للأندية', 'FIFA Club World Cup', 'كرة القدم', 'football', 'أندية أبطال القارات في بطولة واحدة', 'continental club champions in one tournament', 'يجمع أبطال الأندية من قارات مختلفة', 'brings club champions from different continents together'],
  ['الألعاب الأولمبية الحديثة', 'Modern Olympic Games', 'رياضات متعددة', 'multi-sport', 'حدث عالمي يجمع رياضات كثيرة تحت الحلقات الخمس', 'global event with many sports under the five rings', 'أول نسخة حديثة كانت في أثينا عام 1896', 'first modern edition was in Athens in 1896'],
  ['الألعاب البارالمبية', 'Paralympic Games', 'رياضات متعددة', 'multi-sport', 'حدث عالمي للرياضيين ذوي الإعاقة', 'global event for athletes with disabilities', 'أول ألعاب بارالمبية رسمية كانت في روما عام 1960', 'first official Paralympic Games were in Rome in 1960'],
  ['ويمبلدون', 'Wimbledon', 'التنس', 'tennis', 'بطولة تنس عريقة على الملاعب العشبية', 'historic tennis tournament on grass courts', 'تشتهر بالملاعب العشبية والتقاليد البيضاء', 'known for grass courts and white-clothing traditions'],
  ['رولان جاروس', 'Roland-Garros', 'التنس', 'tennis', 'بطولة تنس فرنسية على الملاعب الترابية', 'French tennis tournament on clay courts', 'تقام في باريس على ملاعب ترابية', 'played in Paris on clay courts'],
  ['سباق فرنسا للدراجات', 'Tour de France', 'الدراجات', 'cycling', 'رحلة طويلة وقميص أصفر حول فرنسا', 'long race and yellow jersey around France', 'القميص الأصفر يميز متصدر الترتيب العام', 'yellow jersey marks the general classification leader'],
  ['جائزة موناكو الكبرى', 'Monaco Grand Prix', 'فورمولا 1', 'Formula 1', 'سيارات فورمولا 1 في شوارع ضيقة قرب الميناء', 'Formula 1 cars on narrow streets near the harbour', 'تقام على حلبة شوارع داخل موناكو', 'held on a street circuit inside Monaco'],
  ['كأس العالم للكريكيت', 'Cricket World Cup', 'الكريكيت', 'cricket', 'بطولة عالمية في لعبة المضرب والويكيت', 'global tournament for bat-and-wicket cricket', 'أول نسخة أقيمت في إنجلترا عام 1975', 'first edition was held in England in 1975'],
  ['كأس العالم للرجبي', 'Rugby World Cup', 'الرجبي', 'rugby', 'بطولة عالمية للعبة الكرة البيضاوية', 'global tournament for the oval-ball game', 'أول نسخة كانت عام 1987', 'first edition was in 1987'],
  ['كأس العالم لكرة السلة', 'FIBA Basketball World Cup', 'كرة السلة', 'basketball', 'بطولة منتخبات كرة السلة عالميا', 'global national-team basketball tournament', 'بدأت في الأرجنتين عام 1950', 'started in Argentina in 1950'],
  ['نهائيات NBA', 'NBA Finals', 'كرة السلة', 'basketball', 'سلسلة حسم لقب دوري السلة الأمريكي', 'series deciding the American basketball league title', 'الفائز يحصل على كأس لاري أوبراين', 'winner receives the Larry O Brien Trophy'],
  ['بطولة العالم لكرة اليد', 'World Men Handball Championship', 'كرة اليد', 'handball', 'بطولة للعبة السريعة ذات السبعة لاعبين', 'tournament for the fast seven-player game', 'أول بطولة للرجال أقيمت عام 1938', 'first men tournament was held in 1938'],
  ['السوبر بول', 'Super Bowl', 'كرة القدم الأمريكية', 'American football', 'نهائي كبير يجمع الرياضة والعرض الموسيقي', 'big final mixing sport and halftime show', 'يحسم بطل دوري NFL', 'decides the NFL champion'],
  ['بطولة العالم لألعاب القوى', 'World Athletics Championships', 'ألعاب القوى', 'athletics', 'مضمار وميدان وميداليات خارج الأولمبياد', 'track, field, and medals outside the Olympics', 'بطولة عالمية للعدو والرمي والقفز', 'global championship for running, throwing, and jumping']
].map(([nameAr, nameEn, sportAr, sportEn, identityAr, identityEn, memoryAr, memoryEn]) => ({ nameAr, nameEn, sportAr, sportEn, identityAr, identityEn, memoryAr, memoryEn }));

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
  ['جورج بهجوري', 'George Bahgory', 'الكاريكاتير والبورتريه', 'caricature and portrait', 'الرسم', 'drawing']
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
  ['نبتون', 'Neptune', 'رياحه الشديدة وبعده عن الشمس', 'strong winds and distance from the Sun', 'عملاق جليدي', 'ice giant']
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
  ['يوتيوب (YouTube)', 'YouTube', 'تشاد هيرلي وستيف تشين وجاويد كريم', 'Chad Hurley, Steve Chen, and Jawed Karim', 'مشاركة الفيديو', 'video sharing']
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
  ['محكمة العدل الدولية', 'International Court of Justice', 'لاهاي (The Hague)', 'The Hague', 'الفصل في النزاعات القانونية بين الدول', 'settling legal disputes between states']
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
  ['النحلة', 'bee', 'خلايا النحل والزهور', 'hives and flowers', 'إنتاج العسل والتلقيح', 'honey production and pollination']
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
  ['الدراجة النارية', 'motorcycle', 'مركبة بمحرك وعجلتين', 'two-wheeled motor vehicle', 'التنقل الفردي', 'personal mobility']
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
  ['مونوبولي (Monopoly)', 'Monopoly', 'لعبة لوحية اقتصادية', 'economic board game', 'بيع وشراء العقارات', 'buying and selling properties']
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
  ['بطاقة اسم: وصية أي شخص كانت وراء فكرة جوائز نوبل؟', 'Name card: whose will inspired the Nobel Prizes?', 'ألفريد نوبل', 'Alfred Nobel', [['ألبرت أينشتاين', 'Albert Einstein'], ['ماري كوري', 'Marie Curie'], ['إسحاق نيوتن', 'Isaac Newton']]],
  ['لو سمعت عن جائزة نوبل في الاقتصاد، فالمعلومة اللطيفة أنها أضيفت لاحقا في أي مجال؟', 'If you hear about the later Nobel-linked prize, which field was added later?', 'العلوم الاقتصادية', 'economic sciences', [['الأدب', 'literature'], ['الكيمياء', 'chemistry'], ['السلام', 'peace']]],
  ['قصة فضاء في سطر: أي مهمة أوصلت أول بشر إلى سطح القمر؟', 'Space story in one line: which mission first landed humans on the Moon?', 'أبولو 11', 'Apollo 11', [['فوياجر 1', 'Voyager 1'], ['سبوتنيك 1', 'Sputnik 1'], ['أبولو 13', 'Apollo 13']]],
  ['خريطة العالم: أكبر محيط على الأرض هو أي محيط؟', 'World map: which ocean is the largest on Earth?', 'المحيط الهادئ', 'Pacific Ocean', [['المحيط الأطلسي', 'Atlantic Ocean'], ['المحيط الهندي', 'Indian Ocean'], ['المحيط المتجمد الشمالي', 'Arctic Ocean']]],
  ['ممر ملاحي شهير: قناة بنما تربط بين أي محيطين؟', 'Famous canal clue: which two oceans does the Panama Canal connect?', 'الأطلسي والهادئ', 'Atlantic and Pacific', [['الهندي والهادئ', 'Indian and Pacific'], ['الأطلسي والمتجمد الشمالي', 'Atlantic and Arctic'], ['الهندي والأطلسي', 'Indian and Atlantic']]],
  ['رمز عالمي سريع: تمثال الحرية وصل إلى أمريكا كهدية من أي دولة؟', 'Quick global symbol: the Statue of Liberty came to the US as a gift from which country?', 'فرنسا', 'France', [['إيطاليا', 'Italy'], ['إسبانيا', 'Spain'], ['بريطانيا', 'Britain']]],
  ['معلومة جوائز: حفلات نوبل تقدم عادة في يوم 10 ديسمبر لأنه يوافق ماذا؟', 'Prize fact: Nobel ceremonies are usually held on 10 December because it marks what?', 'ذكرى وفاة ألفريد نوبل', 'anniversary of Alfred Nobel death', [['بداية السنة الدراسية', 'start of the school year'], ['نهاية الحرب العالمية الأولى', 'end of World War I'], ['افتتاح أولمبياد حديث', 'opening of the modern Olympics']]]
];

const globalHistoryFacts = [
  ['رحلة زمنية عالمية: سقوط جدار برلين يرتبط غالبا بأي سنة؟', 'World time-trip: the fall of the Berlin Wall is usually linked to which year?', '1989', '1989', [['1945', '1945'], ['1969', '1969'], ['2001', '2001']]],
  ['اختراع غيّر القراءة: الطباعة بالحروف المتحركة في أوروبا ترتبط بأي اسم؟', 'Reading-changing invention: movable-type printing in Europe is linked to which name?', 'يوهانس جوتنبرج', 'Johannes Gutenberg', [['غاليليو غاليلي', 'Galileo Galilei'], ['ليوناردو دافنشي', 'Leonardo da Vinci'], ['جيمس وات', 'James Watt']]],
  ['بطاقة قانون قديمة: وثيقة ماجنا كارتا سنة 1215 ارتبطت بأي بلد؟', 'Old law card: Magna Carta in 1215 is linked to which country?', 'إنجلترا', 'England', [['فرنسا', 'France'], ['إيطاليا', 'Italy'], ['الصين', 'China']]],
  ['منعطف صناعي: الثورة الصناعية بدأت بقوة في أي بلد؟', 'Industrial turning point: the Industrial Revolution began strongly in which country?', 'بريطانيا', 'Britain', [['اليابان', 'Japan'], ['البرازيل', 'Brazil'], ['كندا', 'Canada']]],
  ['طريق تجارة قديم: طريق الحرير كان يربط الصين غالبا بأي عالم أوسع؟', 'Old trade route: the Silk Road linked China with which wider world?', 'آسيا الوسطى وأوروبا', 'Central Asia and Europe', [['أستراليا فقط', 'Australia only'], ['القطب الجنوبي', 'Antarctica'], ['جزر الكاريبي فقط', 'Caribbean islands only']]],
  ['نهضة وفنون: عصر النهضة الأوروبي بدأ بقوة في أي منطقة؟', 'Renaissance and art: the European Renaissance grew strongly from which area?', 'إيطاليا', 'Italy', [['النرويج', 'Norway'], ['المكسيك', 'Mexico'], ['جنوب أفريقيا', 'South Africa']]],
  ['حلم الطيران: أول رحلة طيران بمحرك للأخوين رايت كانت في أي سنة؟', 'Flight dream: the Wright brothers first powered flight was in which year?', '1903', '1903', [['1869', '1869'], ['1930', '1930'], ['1957', '1957']]],
  ['نظام عالمي جديد: تأسيس الأمم المتحدة جاء بعد أي حرب كبرى؟', 'New world order: the UN was founded after which major war?', 'الحرب العالمية الثانية', 'World War II', [['حرب القرم', 'Crimean War'], ['حرب المئة عام', 'Hundred Years War'], ['الحرب الباردة', 'Cold War']]]
];

const globalScienceFacts = [
  ['كارت أحياء سريع: الجزيء الذي يحمل التعليمات الوراثية في خلايانا اسمه إيه؟', 'Quick biology card: which molecule carries genetic instructions in our cells?', 'DNA', 'DNA', [['ATP', 'ATP'], ['CO2', 'CO2'], ['H2O', 'H2O']]],
  ['نباتات في الشمس: العملية التي تستخدم الضوء لصنع الغذاء اسمها إيه؟', 'Plants in sunlight: what is the process that uses light to make food?', 'البناء الضوئي', 'photosynthesis', [['التبخر', 'evaporation'], ['الصدأ', 'rusting'], ['التجمد', 'freezing']]],
  ['عنواننا الكوني: المجموعة الشمسية موجودة داخل أي مجرة؟', 'Cosmic address: our solar system is inside which galaxy?', 'درب التبانة', 'Milky Way', [['أندروميدا', 'Andromeda'], ['سحابة ماجلان الكبرى', 'Large Magellanic Cloud'], ['مجرة سومبريرو', 'Sombrero Galaxy']]],
  ['كيمياء يومية: الرمز H2O يشير إلى أي مادة؟', 'Everyday chemistry: H2O points to which substance?', 'الماء', 'water', [['الأكسجين', 'oxygen'], ['ثاني أكسيد الكربون', 'carbon dioxide'], ['ملح الطعام', 'table salt']]],
  ['عملاق المجموعة الشمسية: أكبر كواكبها هو أي كوكب؟', 'Solar-system giant: which planet is the largest?', 'المشتري', 'Jupiter', [['المريخ', 'Mars'], ['الزهرة', 'Venus'], ['عطارد', 'Mercury']]],
  ['مد وجزر على الشاطئ: العامل السماوي الأهم في حدوثهما هو إيه؟', 'Beach tides: which celestial body is the main driver?', 'القمر', 'the Moon', [['المريخ', 'Mars'], ['زحل', 'Saturn'], ['نجم الشعرى', 'Sirius']]],
  ['سرعة كونية: الضوء في الفراغ يتحرك تقريبا بسرعة كام؟', 'Cosmic speed: light in vacuum travels at roughly what speed?', '300 ألف كم في الثانية', '300,000 km per second', [['30 كم في الثانية', '30 km per second'], ['1500 كم في الساعة', '1,500 km per hour'], ['1 كم في الثانية', '1 km per second']]],
  ['حقيقة من ناسا: عدد الكواكب في المجموعة الشمسية حاليا كام؟', 'NASA-style fact: how many planets are currently in the solar system?', 'ثمانية كواكب', 'eight planets', [['خمسة كواكب', 'five planets'], ['تسعة عشر كوكبا', 'nineteen planets'], ['كوكبان فقط', 'two planets']]]
];

const globalTechFacts = [
  ['تقنية في جيبك: GPS يعتمد أساسا على ماذا ليحدد موقعك؟', 'Pocket tech: what does GPS mainly rely on to locate you?', 'الأقمار الصناعية', 'satellites', [['الأشرطة المغناطيسية', 'magnetic tapes'], ['الفاكس', 'fax'], ['الأقراص المدمجة فقط', 'CDs only']]],
  ['مربع سريع على منتج: QR Code مصمم غالبا لأي استخدام؟', 'Small square on a product: what is a QR Code usually designed for?', 'مسح سريع بالموبايل', 'quick scanning by phone', [['تشغيل محرك سيارة', 'starting a car engine'], ['تبريد الطعام', 'cooling food'], ['قياس ضغط الدم', 'measuring blood pressure']]],
  ['فكرة السحابة: Cloud Computing يعني غالبا استخدام موارد موجودة فين؟', 'Cloud idea: cloud computing usually means using resources located where?', 'خوادم عبر الإنترنت', 'internet servers', [['دفتر ورقي', 'paper notebook'], ['بطارية الهاتف فقط', 'phone battery only'], ['كابل كهرباء منزلي', 'home power cable']]],
  ['كلمة مفتوحة: Open Source معناها أن ماذا يكون متاحا غالبا؟', 'Open word: open source usually means what is available?', 'الكود المصدري', 'source code', [['رقم الهاتف الشخصي', 'personal phone number'], ['كلمة السر', 'password'], ['عنوان المنزل', 'home address']]],
  ['مفتاح الأمان: مدير كلمات المرور يساعدك أساسا في ماذا؟', 'Security key: a password manager mainly helps with what?', 'حفظ كلمات مرور قوية', 'storing strong passwords', [['زيادة سرعة الإنترنت وحده', 'only increasing internet speed'], ['طباعة الصور', 'printing photos'], ['شحن البطارية', 'charging the battery']]],
  ['شبكة قريبة: Wi-Fi تستخدم غالبا لتوفير اتصال ماذا؟', 'Nearby network: Wi-Fi usually provides what kind of connection?', 'اتصال لاسلكي محلي', 'local wireless connection', [['وقود للطائرات', 'aircraft fuel'], ['ورق للطباعة', 'printing paper'], ['عدسة كاميرا', 'camera lens']]]
];

for (const [textAr, textEn, answerAr, answerEn, wrong] of generalFacts) {
  addDirectQuestion('general-knowledge', 'Easy', 15, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of globalGeneralFacts) {
  addDirectQuestion('general-knowledge', 'Medium', 20, textAr, textEn, answerAr, answerEn, wrong);
}

for (const [textAr, textEn, answerAr, answerEn, wrong] of religionQuestions) {
  addDirectQuestion('religion-islamic', 'Easy', 15, textAr, textEn, answerAr, answerEn, wrong);
}

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
  { arField: 'locationAr', enField: 'locationEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `جولة حول العالم: لو عايز تشوف ${r.nameAr}، هتحجز ناحية فين؟`, en: (r) => `World tour: where would you go to see ${r.nameEn}?` }
  ] },
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `بوست كارت عالمي: أي مكان ينطبق عليه وصف «${r.knownForAr}»؟`, en: (r) => `Global postcard: which place matches ${r.knownForEn}?` }
  ] }
]);

addFieldQuestions('history', egyptHistoryEvents, [
  { arField: 'yearAr', enField: 'yearEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `رحلة زمنية: حدث «${r.nameAr}» هتحطه عند أي سنة أو فترة؟`, en: (r) => `Time-trip clue: which year or period fits ${r.nameEn}?` }
  ] },
  { arField: 'keyAr', enField: 'keyEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `بطاقة حدث ناقصة: «${r.nameAr}» محتاجة الاسم أو الجهة الأبرز. تختار مين؟`, en: (r) => `Missing event card: which name or group completes ${r.nameEn}?` }
  ] }
]);

addFieldQuestions('film-tv', egyptFilms, [
  { arField: 'directorAr', enField: 'directorEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `في سهرة سينما: لو الفيلم هو «${r.nameAr}»، مين كان وراء الكاميرا؟`, en: (r) => `Movie-night clue: who was behind the camera for ${r.nameEn}?` }
  ] },
  { arField: 'starAr', enField: 'starEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `على الأفيش: أي نجم هتربطه غالبا بفيلم «${r.nameAr}»؟`, en: (r) => `On the poster: which star would you link with ${r.nameEn}?` }
  ] },
  { arField: 'yearAr', enField: 'yearEn', difficulty: 'Hard', timeLimitSec: 25, variants: [
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
  ] },
  { arField: 'typeAr', enField: 'typeEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `أمين مكتبة بيسألك: تحط «${r.nameAr}» تحت أي نوع؟`, en: (r) => `A librarian asks: which shelf type fits ${r.nameEn}?` }
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

addFieldQuestions('sports', egyptSportsPeople, [
  { arField: 'sportAr', enField: 'sportEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `بطاقة بطل مصري: ${r.nameAr} اسمه اتلمع في أي رياضة؟`, en: (r) => `Egyptian champion card: which sport made ${r.nameEn} stand out?` }
  ] },
  { arField: 'knownForAr', enField: 'knownForEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `في نقاش رياضي سريع: اسم ${r.nameAr} مرتبط بإيه أكتر؟`, en: (r) => `Quick sports debate: what is ${r.nameEn} most linked with?` }
  ] }
]);

addFieldQuestions('sports', worldSportsTournaments, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `بطاقة بطولة عالمية: ${r.identityAr}. أي بطولة نقصد؟`, en: (r) => `Global tournament card: ${r.identityEn}. Which tournament is it?` }
  ] },
  { arField: 'sportAr', enField: 'sportEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `ريموت الرياضة معاك: لما تشغل ${r.nameAr}، أنت داخل على أي رياضة؟`, en: (r) => `Sports remote in hand: which sport are you watching with ${r.nameEn}?` }
  ] },
  { arField: 'memoryAr', enField: 'memoryEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `معلومة تحفظ البطولة: أي جملة تميّز ${r.nameAr}؟`, en: (r) => `Tournament memory hook: which sentence marks ${r.nameEn}?` }
  ] }
]);

addFieldQuestions('science-nature', scienceRecords, [
  { arField: 'symbolAr', enField: 'symbolEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `بطاقة معمل صغيرة: لو العنصر أو الكوكب هو ${r.nameAr}، إيه العلامة اللي تميزه؟`, en: (r) => `Tiny lab card: which marker identifies ${r.nameEn}?` }
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

addFieldQuestions('politics', politicsRecords, [
  { arField: 'headquartersAr', enField: 'headquartersEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `خريطة مؤسسات: لو هتزور مقر ${r.nameAr}، هتسافر لفين؟`, en: (r) => `Institutions map: where would you travel to visit ${r.nameEn} headquarters?` }
  ] },
  { arField: 'purposeAr', enField: 'purposeEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `بطاقة تعريف مختصرة: ${r.nameAr} شغله الأساسي في أي مجال؟`, en: (r) => `Short ID card: which field is central to ${r.nameEn}?` }
  ] }
]);

addFieldQuestions('animals', animalRecords, [
  { arField: 'habitatAr', enField: 'habitatEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `رحلة برية: لو بتدور على ${r.nameAr} في بيئته، هتفتش فين؟`, en: (r) => `Wildlife trip: where would you look for the ${r.nameEn}?` }
  ] },
  { arField: 'featureAr', enField: 'featureEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `كارت معلومة سريع: شهرة ${r.nameAr} جاية من إيه؟`, en: (r) => `Quick fact card: what gives the ${r.nameEn} its fame?` }
  ] }
]);

addFieldQuestions('vehicles', vehicleRecords, [
  { arField: 'typeAr', enField: 'typeEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `في جراج خيالي: بطاقة ${r.nameAr} تتحط تحت أي نوع من وسائل النقل؟`, en: (r) => `In an imaginary garage: which vehicle type fits ${r.nameEn}?` }
  ] },
  { arField: 'useAr', enField: 'useEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `لقطة مواصلات: ${r.nameAr} نستخدمه غالبا في إيه؟`, en: (r) => `Transport snapshot: what is ${r.nameEn} mainly used for?` }
  ] }
]);

addFieldQuestions('games', gameRecords, [
  { arField: 'typeAr', enField: 'typeEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `في قعدة لعب: ${r.nameAr} تتحسب من أي نوع ألعاب؟`, en: (r) => `In a game night: which game type is ${r.nameEn}?` }
  ] },
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
  ['أي مدينة مصرية ارتبطت تاريخيا بحجر رشيد؟', 'Which Egyptian city is historically linked to the Rosetta Stone?', 'رشيد', 'Rosetta', [['دمياط', 'Damietta'], ['طنطا', 'Tanta'], ['الفيوم', 'Fayoum']]],
  ['ما اسم البحيرة الصناعية الكبيرة خلف السد العالي؟', 'What is the large reservoir behind the High Dam?', 'بحيرة ناصر', 'Lake Nasser', [['بحيرة قارون', 'Lake Qarun'], ['بحيرة المنزلة', 'Lake Manzala'], ['البحيرات المرة', 'Bitter Lakes']]],
  ['أي مدينة مصرية تشتهر بدار الأوبرا المصرية؟', 'Which Egyptian city is associated with the Cairo Opera House?', 'القاهرة', 'Cairo', [['الإسكندرية', 'Alexandria'], ['الأقصر', 'Luxor'], ['أسوان', 'Aswan']]]
];

moreGeneralFacts.push(
  ['أي محافظة مصرية تضم واحة سيوة؟', 'Which Egyptian governorate includes Siwa Oasis?', 'مطروح', 'Matrouh', [['الفيوم', 'Fayoum'], ['أسوان', 'Aswan'], ['شمال سيناء', 'North Sinai']]],
  ['ما اسم أشهر شارع تاريخي في القاهرة الفاطمية؟', 'What is the famous historic street in Fatimid Cairo?', 'شارع المعز', 'Al-Muizz Street', [['شارع الهرم', 'Al Haram Street'], ['شارع رمسيس', 'Ramses Street'], ['شارع البحر الأعظم', 'Al Bahr Al Aazam Street']]],
  ['أي مدينة مصرية تقع عند المدخل الشمالي لقناة السويس؟', 'Which Egyptian city is at the northern entrance of the Suez Canal?', 'بورسعيد', 'Port Said', [['السويس', 'Suez'], ['الإسماعيلية', 'Ismailia'], ['دمياط', 'Damietta']]],
  ['أي مدينة مصرية تقع عند المدخل الجنوبي لقناة السويس؟', 'Which Egyptian city is at the southern entrance of the Suez Canal?', 'السويس', 'Suez', [['بورسعيد', 'Port Said'], ['الإسماعيلية', 'Ismailia'], ['العريش', 'Arish']]],
  ['ما اسم أشهر منطقة أثرية تضم الهرم الأكبر؟', 'What is the famous archaeological area that includes the Great Pyramid?', 'منطقة أهرامات الجيزة', 'Giza pyramid complex', [['سقارة', 'Saqqara'], ['دهشور', 'Dahshur'], ['أبو صير', 'Abusir']]],
  ['أي مدينة مصرية ارتبطت تاريخيا بمكتبة قديمة شهيرة؟', 'Which Egyptian city is historically linked to an ancient famous library?', 'الإسكندرية', 'Alexandria', [['الأقصر', 'Luxor'], ['سوهاج', 'Sohag'], ['طنطا', 'Tanta']]],
  ['ما اسم البحر الذي تطل عليه مدينة الإسكندرية؟', 'Which sea does Alexandria overlook?', 'البحر المتوسط', 'Mediterranean Sea', [['البحر الأحمر', 'Red Sea'], ['بحر العرب', 'Arabian Sea'], ['بحر مرمرة', 'Sea of Marmara']]],
  ['أي محافظة مصرية تشتهر بمعابد أبو سمبل؟', 'Which Egyptian governorate is famous for Abu Simbel temples?', 'أسوان', 'Aswan', [['الأقصر', 'Luxor'], ['قنا', 'Qena'], ['المنيا', 'Minya']]]
);

for (const [textAr, textEn, answerAr, answerEn, wrong] of moreGeneralFacts) {
  addDirectQuestion('general-knowledge', 'Easy', 15, textAr, textEn, answerAr, answerEn, wrong);
}

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

for (const [textAr, textEn, answerAr, answerEn, wrong] of moreReligionQuestions) {
  addDirectQuestion('religion-islamic', 'Easy', 15, textAr, textEn, answerAr, answerEn, wrong);
}

addFieldQuestions('geography', egyptPlaces, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `دليل سفر سريع: أي معلم مصري تختاره لو المطلوب ${r.knownForAr}؟`, en: (r) => `Quick travel guide: which Egyptian place fits ${r.knownForEn}?` }
  ] }
]);

addFieldQuestions('history', egyptHistoryEvents, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `مؤشران في بطاقة واحدة: ${r.keyAr} + ${r.yearAr}. أي حدث مصري ده؟`, en: (r) => `Two clues on one card: ${r.keyEn} plus ${r.yearEn}. Which Egyptian event is it?` }
  ] }
]);

addFieldQuestions('art', egyptArtists, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `شايف عمل أو اتجاه «${r.workAr}» على بطاقة المعرض؛ أي فنان مصري وراه؟`, en: (r) => `A gallery card says ${r.workEn}; which Egyptian artist is behind it?` }
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
  ['أي مدينة يرتبط بها النادي المصري البورسعيدي؟', 'Which city is associated with Al Masry SC?', 'بورسعيد', 'Port Said', [['الإسماعيلية', 'Ismailia'], ['القاهرة', 'Cairo'], ['الإسكندرية', 'Alexandria']]],
  ['أي رياضة اشتهرت فيها نور الشربيني؟', 'Which sport is Nour El Sherbini known for?', 'الإسكواش', 'squash', [['التنس', 'tennis'], ['الكاراتيه', 'karate'], ['كرة اليد', 'handball']]],
  ['أي رياضة اشتهر فيها كرم جابر؟', 'Which sport is Karam Gaber known for?', 'المصارعة', 'wrestling', [['الإسكواش', 'squash'], ['الجودو', 'judo'], ['رفع الأثقال', 'weightlifting']]],
  ['أي رياضة اشتهر فيها علاء أبو القاسم؟', 'Which sport is Alaaeldin Abouelkassem known for?', 'السلاح', 'fencing', [['المصارعة', 'wrestling'], ['السباحة', 'swimming'], ['كرة السلة', 'basketball']]],
  ['ما مركز عصام الحضري الشهير في كرة القدم؟', 'What was Essam El Hadary famous position in football?', 'حراسة المرمى', 'goalkeeping', [['قلب الدفاع', 'center back'], ['رأس الحربة', 'striker'], ['الجناح الأيسر', 'left winger']]],
  ['أي منتخب ارتبط باسم حسام حسن كلاعب تاريخي؟', 'Which national team is Hossam Hassan historically associated with?', 'منتخب مصر', 'Egypt national team', [['منتخب المغرب', 'Morocco national team'], ['منتخب تونس', 'Tunisia national team'], ['منتخب الجزائر', 'Algeria national team']]],
  ['أي ناد إنجليزي ارتبط باسم محمد صلاح عالميا؟', 'Which English club is Mohamed Salah globally associated with?', 'ليفربول (Liverpool)', 'Liverpool', [['تشيلسي (Chelsea)', 'Chelsea'], ['آرسنال (Arsenal)', 'Arsenal'], ['مانشستر سيتي (Manchester City)', 'Manchester City']]],
  ['أي رياضة جماعية تشتهر بها بطولة كأس العالم لكرة القدم؟', 'Which team sport is FIFA World Cup associated with?', 'كرة القدم', 'football', [['كرة اليد', 'handball'], ['كرة السلة', 'basketball'], ['الكرة الطائرة', 'volleyball']]],
  ['حكاية أول مونديال: أي بلد استضاف أول كأس عالم وفاز به عام 1930؟', 'First World Cup story: which country hosted and won the first tournament in 1930?', 'أوروجواي', 'Uruguay', [['إيطاليا', 'Italy'], ['البرازيل', 'Brazil'], ['فرنسا', 'France']]],
  ['معلومة مونديالية سهلة الحفظ: كأس العالم للمنتخبات يقام غالبا كل كام سنة؟', 'Easy World Cup memory hook: how often is the national-team World Cup usually held?', 'كل أربع سنوات', 'every four years', [['كل سنة', 'every year'], ['كل سنتين', 'every two years'], ['كل عشر سنوات', 'every ten years']]],
  ['قصة كأس أفريقيا: أول نسخة من كأس الأمم الأفريقية بدأت في أي عقد؟', 'Africa Cup story: the first AFCON began in which decade?', 'الخمسينيات', '1950s', [['الثلاثينيات', '1930s'], ['السبعينيات', '1970s'], ['التسعينيات', '1990s']]],
  ['ليالي أوروبا: أي بطولة أندية أوروبية بدأت باسم كأس الأندية الأوروبية البطلة؟', 'European nights: which club competition began as the European Champion Clubs Cup?', 'دوري أبطال أوروبا', 'UEFA Champions League', [['الدوري الأوروبي', 'Europa League'], ['كأس العالم للأندية', 'Club World Cup'], ['كأس أمم أوروبا', 'UEFA Euro']]],
  ['تنس بسرعة: أي بطولة كبرى مشهورة بالملاعب العشبية والملابس البيضاء؟', 'Fast tennis clue: which major tournament is known for grass courts and white clothing?', 'ويمبلدون', 'Wimbledon', [['رولان جاروس', 'Roland-Garros'], ['أمريكا المفتوحة', 'US Open'], ['أستراليا المفتوحة', 'Australian Open']]],
  ['رياضة بمذاق سباق: القميص الأصفر رمز مشهور في أي بطولة؟', 'Race-flavoured sport clue: the yellow jersey is famous in which competition?', 'سباق فرنسا للدراجات', 'Tour de France', [['جائزة موناكو الكبرى', 'Monaco Grand Prix'], ['السوبر بول', 'Super Bowl'], ['نهائيات NBA', 'NBA Finals']]]
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

addFieldQuestions('politics', politicsRecords, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `مجال العمل هو ${r.purposeAr}. أي مؤسسة أو منظمة تنطبق عليها البطاقة؟`, en: (r) => `The work field is ${r.purposeEn}. Which institution or organization fits the card?` }
  ] }
]);

addFieldQuestions('animals', animalRecords, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `الوصف يقول: ${r.featureAr}. أي حيوان تختاره بسرعة؟`, en: (r) => `The clue says ${r.featureEn}. Which animal would you pick quickly?` }
  ] }
]);

addFieldQuestions('vehicles', vehicleRecords, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Easy', timeLimitSec: 15, variants: [
    { ar: (r) => `مهمة تنقل: لو المطلوب ${r.useAr}، أي وسيلة أقرب للاختيار؟`, en: (r) => `Transport mission: if you need ${r.useEn}, which vehicle is the closest choice?` }
  ] }
]);

addFieldQuestions('games', gameRecords, [
  { arField: 'nameAr', enField: 'nameEn', difficulty: 'Medium', timeLimitSec: 20, variants: [
    { ar: (r) => `على الترابيزة أو الشاشة: العلامة هي ${r.knownForAr}. أي لعبة نقصد؟`, en: (r) => `On the table or screen: the marker is ${r.knownForEn}. Which game is it?` }
  ] }
]);

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
      name: 'International Olympic Committee records',
      url: 'https://olympics.com/ioc',
      license: 'Official factual reference; no copied prose',
      usage: 'Olympic and Paralympic history and symbol fact checks.'
    },
    {
      name: 'UEFA competition history',
      url: 'https://www.uefa.com/uefachampionsleague/history/',
      license: 'Official factual reference; no copied prose',
      usage: 'European club tournament history and records.'
    },
    {
      name: 'FIBA events history',
      url: 'https://www.fiba.basketball/en/history',
      license: 'Official factual reference; no copied prose',
      usage: 'Basketball tournament history and event references.'
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
