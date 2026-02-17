using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;

namespace Sabq.Infrastructure.Data;

public static class DbSeeder
{
    private static readonly Random _random = new(42); // Fixed seed for reproducibility

    public static async Task SeedAsync(SabqDbContext context)
    {
        // Check if already seeded
        if (await context.Categories.AnyAsync())
            return;

        // Create Islamic Category
        var islamicCategory = new Category
        {
            Id = Guid.NewGuid(),
            NameAr = "ديني - إسلامي",
            NameEn = "Islamic",
            Slug = "islamic",
            IsActive = true
        };
        context.Categories.Add(islamicCategory);

        // Create Sports Category
        var sportsCategory = new Category
        {
            Id = Guid.NewGuid(),
            NameAr = "رياضة",
            NameEn = "Sports",
            Slug = "sports",
            IsActive = true
        };
        context.Categories.Add(sportsCategory);

        await context.SaveChangesAsync();

        // Generate 50,000 Islamic Questions
        await GenerateIslamicQuestionsAsync(context, islamicCategory.Id, 50000);

        // Generate 50,000 Sports Questions
        await GenerateSportsQuestionsAsync(context, sportsCategory.Id, 50000);
    }

    private static async Task GenerateIslamicQuestionsAsync(SabqDbContext context, Guid categoryId, int count)
    {
        int generated = 0;
        int batchSize = 500;
        int makkiMadaniGenerated = 0; // Track total "Makki/Madani" questions across loop iterations
        const int maxMakkiMadaniQuestions = 5; // Limit to 5 max
        
        // Quran Surahs (114 total)
        var surahs = new[] { "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس" };
        
        var surahAyats = new Dictionary<string, int> { {"الفاتحة", 7}, {"البقرة", 286}, {"آل عمران", 200}, {"النساء", 176}, {"المائدة", 120}, {"الأنعام", 165}, {"الأعراف", 206}, {"الأنفال", 75}, {"التوبة", 129}, {"يونس", 109}, {"هود", 123}, {"يوسف", 111}, {"الرعد", 43}, {"إبراهيم", 52}, {"الحجر", 99}, {"النحل", 128}, {"الإسراء", 111}, {"الكهف", 110}, {"مريم", 98}, {"طه", 135}, {"الأنبياء", 112}, {"الحج", 78}, {"المؤمنون", 118}, {"النور", 64}, {"الفرقان", 77}, {"الشعراء", 227}, {"النمل", 93}, {"القصص", 88}, {"العنكبوت", 69}, {"الروم", 60}, {"لقمان", 34}, {"السجدة", 30}, {"الأحزاب", 73}, {"سبأ", 54}, {"فاطر", 45}, {"يس", 83}, {"الصافات", 182}, {"ص", 88}, {"الزمر", 75}, {"غافر", 85}, {"فصلت", 54}, {"الشورى", 53}, {"الزخرف", 89}, {"الدخان", 59}, {"الجاثية", 37}, {"الأحقاف", 35}, {"محمد", 38}, {"الفتح", 29}, {"الحجرات", 18}, {"ق", 45}, {"الذاريات", 60}, {"الطور", 49}, {"النجم", 62}, {"القمر", 55}, {"الرحمن", 78}, {"الواقعة", 96}, {"الحديد", 29}, {"المجادلة", 22}, {"الحشر", 24}, {"الممتحنة", 13}, {"الصف", 14}, {"الجمعة", 11}, {"المنافقون", 11}, {"التغابن", 18}, {"الطلاق", 12}, {"التحريم", 12}, {"الملك", 30}, {"القلم", 52}, {"الحاقة", 52}, {"المعارج", 44}, {"نوح", 28}, {"الجن", 28}, {"المزمل", 20}, {"المدثر", 56}, {"القيامة", 40}, {"الإنسان", 31}, {"المرسلات", 50}, {"النبأ", 40}, {"النازعات", 46}, {"عبس", 42}, {"التكوير", 29}, {"الانفطار", 19}, {"المطففين", 36}, {"الانشقاق", 25}, {"البروج", 22}, {"الطارق", 17}, {"الأعلى", 19}, {"الغاشية", 26}, {"الفجر", 30}, {"البلد", 20}, {"الشمس", 15}, {"الليل", 21}, {"الضحى", 11}, {"الشرح", 8}, {"التين", 8}, {"العلق", 19}, {"القدر", 5}, {"البينة", 8}, {"الزلزلة", 8}, {"العاديات", 11}, {"القارعة", 11}, {"التكاثر", 8}, {"العصر", 3}, {"الهمزة", 9}, {"الفيل", 5}, {"قريش", 4}, {"الماعون", 7}, {"الكوثر", 3}, {"الكافرون", 6}, {"النصر", 3}, {"المسد", 5}, {"الإخلاص", 4}, {"الفلق", 5}, {"الناس", 6} };
        
        var prophets = new[] { "آدم", "نوح", "إبراهيم", "إسماعيل", "إسحاق", "يعقوب", "يوسف", "موسى", "هارون", "داود", "سليمان", "أيوب", "يونس", "إلياس", "اليسع", "ذو الكفل", "زكريا", "يحيى", "عيسى", "محمد", "شعيب", "صالح", "هود", "لوط", "إدريس" };
        
        var prophetStories = new Dictionary<string, string> { {"آدم", "أبو البشر"}, {"نوح", "شيخ المرسلين"}, {"إبراهيم", "خليل الله"}, {"إسماعيل", "الذبيح"}, {"إسحاق", "والد يعقوب"}, {"يعقوب", "إسرائيل"}, {"يوسف", "الصديق"}, {"موسى", "كليم الله"}, {"هارون", "أخو موسى"}, {"داود", "صاحب الزبور"}, {"سليمان", "من سخر الله له الريح"}, {"أيوب", "الصابر"}, {"يونس", "ذو النون"}, {"إلياس", "من بني إسرائيل"}, {"اليسع", "تابع إلياس"}, {"ذو الكفل", "الكفيل"}, {"زكريا", "كافل مريم"}, {"يحيى", "ابن زكريا"}, {"عيسى", "روح الله"}, {"محمد", "خاتم الأنبياء"}, {"شعيب", "خطيب الأنبياء"}, {"صالح", "صاحب الناقة"}, {"هود", "نبي عاد"}, {"لوط", "ابن أخ إبراهيم"}, {"إدريس", "أول من خط بالقلم"} };
        
        var companions = new[] { "أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب", "طلحة بن عبيد الله", "الزبير بن العوام", "عبد الرحمن بن عوف", "سعد بن أبي وقاص", "سعيد بن زيد", "أبو عبيدة بن الجراح", "بلال بن رباح", "عمار بن ياسر", "خالد بن الوليد", "أبو هريرة", "أنس بن مالك", "عبد الله بن مسعود", "عبد الله بن عمر", "عبد الله بن عباس", "معاذ بن جبل", "أبو ذر الغفاري", "سلمان الفارسي", "صهيب الرومي", "حمزة بن عبد المطلب", "جعفر بن أبي طالب", "أسامة بن زيد" };
        
        var companionTitles = new Dictionary<string, string> { {"أبو بكر الصديق", "الصديق"}, {"عمر بن الخطاب", "الفاروق"}, {"عثمان بن عفان", "ذو النورين"}, {"علي بن أبي طالب", "أبو الحسن"}, {"خالد بن الوليد", "سيف الله المسلول"}, {"حمزة بن عبد المطلب", "أسد الله"}, {"أبو عبيدة بن الجراح", "أمين الأمة"}, {"أبو هريرة", "راوية الإسلام"}, {"عبد الله بن عباس", "حبر الأمة"}, {"بلال بن رباح", "مؤذن الرسول"}, {"سعد بن معاذ", "اهتز لموته العرش"} };

        var asmaAlHusna = new[] { "الرحمن", "الرحيم", "الملك", "القدوس", "السلام", "المؤمن", "المهيمن", "العزيز", "الجبار", "المتكبر", "الخالق", "البارئ", "المصور", "الغفار", "القهار", "الوهاب", "الرزاق", "الفتاح", "العليم", "القابض", "الباسط", "الخافض", "الرافع", "المعز", "المذل", "السميع", "البصير", "الحكم", "العدل", "اللطيف", "الخبير", "الحليم", "العظيم", "الغفور", "الشكور", "العلي", "الكبير", "الحفيظ", "المقيت", "الحسيب", "الجليل", "الكريم", "الرقيب", "المجيب", "الواسع", "الحكيم", "الودود", "المجيد", "الباعث", "الشهيد", "الحق", "الوكيل", "القوي", "المتين", "الولي", "الحميد", "المحصي", "المبدئ", "المعيد", "المحيي", "المميت", "الحي", "القيوم", "الواجد", "الماجد", "الواحد", "الصمد", "القادر", "المقتدر", "المقدم", "المؤخر", "الأول", "الآخر", "الظاهر", "الباطن", "الوالي", "المتعالي", "البر", "التواب", "المنتقم", "العفو", "الرؤوف", "مالك الملك", "ذو الجلال والإكرام", "المقسط", "الجامع", "الغني", "المغني", "المانع", "الضار", "النافع", "النور", "الهادي", "البديع", "الباقي", "الوارث", "الرشيد", "الصبور" };
        
        var hijriMonths = new[] { "محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة" };
        
        var battles = new[] { "بدر", "أحد", "الخندق", "خيبر", "حنين", "تبوك", "مؤتة", "بني قريظة", "بني النضير", "بني قينقاع", "فتح مكة", "الحديبية" };
        
        var prayers = new[] { "الفجر", "الظهر", "العصر", "المغرب", "العشاء" };
        var prayerRakaat = new Dictionary<string, int> { {"الفجر", 2}, {"الظهر", 4}, {"العصر", 4}, {"المغرب", 3}, {"العشاء", 4} };

        var pillarsOfIslam = new[] { "الشهادتان", "الصلاة", "الزكاة", "الصيام", "الحج" };
        var pillarsOfFaith = new[] { "الإيمان بالله", "الإيمان بالملائكة", "الإيمان بالكتب", "الإيمان بالرسل", "الإيمان باليوم الآخر", "الإيمان بالقدر" };

        // Generate questions until we reach the target
        while (generated < count)
        {
            // 1. Surah order questions
            for (int i = 0; i < surahs.Length && generated < count; i++)
            {
                var surah = surahs[i];
                var others = surahs.Where(s => s != surah).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"ما هي السورة رقم {i + 1} في القرآن الكريم؟",
                    $"سورة {surah}", $"سورة {others[0]}", $"سورة {others[1]}", $"سورة {others[2]}");
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 2. Surah ayat count questions
            for (int i = 0; i < surahs.Length && generated < count; i++)
            {
                var surah = surahs[i];
                if (surahAyats.TryGetValue(surah, out int ayatCount))
                {
                    // Generate distinct wrong answers based on surah size
                    var wrongAnswers = new HashSet<int>();
                    while (wrongAnswers.Count < 3)
                    {
                        int wrong;
                        if (ayatCount <= 10)
                        {
                            // For short surahs, use small offsets and add some variety
                            wrong = ayatCount + _random.Next(1, 10) * (_random.Next(2) == 0 ? 1 : -1);
                            if (wrong <= 0) wrong = ayatCount + _random.Next(2, 8);
                        }
                        else if (ayatCount <= 50)
                        {
                            wrong = ayatCount + _random.Next(-15, 20);
                        }
                        else
                        {
                            wrong = ayatCount + _random.Next(-30, 40);
                        }
                        wrong = Math.Max(1, wrong);
                        if (wrong != ayatCount) wrongAnswers.Add(wrong);
                    }
                    var wrongs = wrongAnswers.ToArray();
                    
                    AddQuestion(context, categoryId, Difficulty.Hard, 25,
                        $"كم عدد آيات سورة {surah}؟",
                        $"{ayatCount} آية", $"{wrongs[0]} آية", $"{wrongs[1]} آية", $"{wrongs[2]} آية");
                    generated++;
                    
                    if (generated % batchSize == 0) await context.SaveChangesAsync();
                    if (generated >= count) break;
                }
            }

            // 3. Prophet questions
            for (int i = 0; i < prophets.Length && generated < count; i++)
            {
                var prophet = prophets[i];
                var others = prophets.Where(p => p != prophet).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                if (prophetStories.TryGetValue(prophet, out var title))
                {
                    AddQuestion(context, categoryId, Difficulty.Medium, 20,
                        $"من هو النبي الملقب بـ '{title}'؟",
                        $"{prophet} عليه السلام", $"{others[0]} عليه السلام", $"{others[1]} عليه السلام", $"{others[2]} عليه السلام");
                    generated++;
                    
                    if (generated % batchSize == 0) await context.SaveChangesAsync();
                    if (generated >= count) break;
                }
            }
            
            // 4. Companion title questions
            foreach (var (companion, title) in companionTitles)
            {
                if (generated >= count) break;
                var others = companions.Where(c => c != companion).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Hard, 25,
                    $"من هو الصحابي الملقب بـ '{title}'؟",
                    companion, others[0], others[1], others[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 5. Asma Al Husna questions
            for (int i = 0; i < asmaAlHusna.Length && generated < count; i++)
            {
                var name = asmaAlHusna[i];
                var others = asmaAlHusna.Where(n => n != name).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"ما معنى اسم الله '{name}'؟",
                    GetAsmaAlHusnaMeaning(name), GetAsmaAlHusnaMeaning(others[0]), GetAsmaAlHusnaMeaning(others[1]), GetAsmaAlHusnaMeaning(others[2]));
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 6. Prayer rakaat questions
            foreach (var prayer in prayers)
            {
                if (generated >= count) break;
                var rakaat = prayerRakaat[prayer];
                var wrongAnswers = new[] { 2, 3, 4, 5 }.Where(r => r != rakaat).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"كم عدد ركعات صلاة {prayer}؟",
                    $"{rakaat} ركعات", $"{wrongAnswers[0]} ركعات", $"{wrongAnswers[1]} ركعات", $"{wrongAnswers[2]} ركعات");
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 7. Hijri month questions  
            for (int i = 0; i < hijriMonths.Length && generated < count; i++)
            {
                var month = hijriMonths[i];
                var others = hijriMonths.Where(m => m != month).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"ما هو الشهر الهجري رقم {i + 1}؟",
                    month, others[0], others[1], others[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 8. Pillars of Islam questions
            for (int i = 0; i < pillarsOfIslam.Length && generated < count; i++)
            {
                var pillar = pillarsOfIslam[i];
                var others = pillarsOfIslam.Where(p => p != pillar).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"ما هو الركن رقم {i + 1} من أركان الإسلام؟",
                    pillar, others[0], others[1], others[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 9. Battle questions
            for (int i = 0; i < battles.Length && generated < count; i++)
            {
                var battle = battles[i];
                var others = battles.Where(b => b != battle).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"في أي سنة هجرية وقعت غزوة {battle}؟",
                    GetBattleYear(battle), GetBattleYear(others[0]), GetBattleYear(others[1]), GetBattleYear(others[2]));
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 10. Numeric Quran facts
            var quranFacts = new[]
            {
                ("كم عدد سور القرآن الكريم؟", "114 سورة", "100 سورة", "120 سورة", "99 سورة", Difficulty.Easy),
                ("كم عدد أجزاء القرآن الكريم؟", "30 جزءاً", "28 جزءاً", "25 جزءاً", "35 جزءاً", Difficulty.Easy),
                ("كم عدد أحزاب القرآن الكريم؟", "60 حزباً", "30 حزباً", "50 حزباً", "70 حزباً", Difficulty.Medium),
                ("كم عدد السجدات في القرآن الكريم؟", "15 سجدة", "10 سجدات", "20 سجدة", "12 سجدة", Difficulty.Hard),
                ("كم مرة ذكر اسم 'محمد' في القرآن؟", "4 مرات", "10 مرات", "7 مرات", "1 مرة", Difficulty.Hard),
                ("كم عدد كلمات سورة الفاتحة؟", "29 كلمة", "25 كلمة", "35 كلمة", "20 كلمة", Difficulty.Hard),
                ("كم عدد حروف سورة الفاتحة؟", "139 حرفاً", "100 حرف", "150 حرفاً", "120 حرفاً", Difficulty.Hard),
                ("كم مرة ذكرت كلمة 'الله' في القرآن؟", "2699 مرة", "1000 مرة", "5000 مرة", "3500 مرة", Difficulty.Hard),
                ("كم عدد السور المكية في القرآن؟", "86 سورة", "28 سورة", "60 سورة", "100 سورة", Difficulty.Medium),
                ("كم عدد السور المدنية في القرآن؟", "28 سورة", "86 سورة", "40 سورة", "50 سورة", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in quranFacts)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 11. Generate variations with numbers
            for (int variation = 0; variation < 100 && generated < count; variation++)
            {
                int surahNum = _random.Next(1, 115);
                int actualSurah = surahNum - 1;
                if (actualSurah >= 0 && actualSurah < surahs.Length)
                {
                    var wrongNums = new[] { surahNum + _random.Next(1, 10), surahNum - _random.Next(1, 5), surahNum + _random.Next(10, 20) };
                    AddQuestion(context, categoryId, Difficulty.Medium, 20,
                        $"سورة {surahs[actualSurah]} هي السورة رقم كم في القرآن؟",
                        $"رقم {surahNum}", $"رقم {wrongNums[0]}", $"رقم {Math.Max(1, wrongNums[1])}", $"رقم {Math.Min(114, wrongNums[2])}");
                    generated++;
                    if (generated % batchSize == 0) await context.SaveChangesAsync();
                }
            }

            // 12. First/Last questions
            var firstLastQuestions = new[]
            {
                ("ما هي أول سورة في القرآن الكريم؟", "سورة الفاتحة", "سورة البقرة", "سورة العلق", "سورة الناس", Difficulty.Easy),
                ("ما هي آخر سورة في القرآن الكريم؟", "سورة الناس", "سورة الفلق", "سورة الإخلاص", "سورة المسد", Difficulty.Easy),
                ("ما هي أول سورة نزلت على النبي؟", "سورة العلق", "سورة الفاتحة", "سورة المدثر", "سورة القلم", Difficulty.Medium),
                ("ما هي آخر سورة نزلت كاملة؟", "سورة النصر", "سورة الناس", "سورة التوبة", "سورة المائدة", Difficulty.Hard),
                ("من أول من أسلم من الرجال؟", "أبو بكر الصديق", "علي بن أبي طالب", "عمر بن الخطاب", "عثمان بن عفان", Difficulty.Medium),
                ("من أول من أسلم من النساء؟", "خديجة بنت خويلد", "فاطمة الزهراء", "عائشة بنت أبي بكر", "أسماء بنت أبي بكر", Difficulty.Medium),
                ("من أول من أسلم من الصبيان؟", "علي بن أبي طالب", "الزبير بن العوام", "سعد بن أبي وقاص", "طلحة بن عبيد الله", Difficulty.Medium),
                ("من أول شهيد في الإسلام؟", "سمية بنت خياط", "ياسر بن عامر", "حمزة بن عبد المطلب", "بلال بن رباح", Difficulty.Hard),
                ("من أول مؤذن في الإسلام؟", "بلال بن رباح", "عبد الله بن أم مكتوم", "سعد القرظ", "أبو محذورة", Difficulty.Medium),
                ("ما أول مسجد بني في الإسلام؟", "مسجد قباء", "المسجد الحرام", "المسجد النبوي", "المسجد الأقصى", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in firstLastQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 13. Pillars of Faith questions
            for (int i = 0; i < pillarsOfFaith.Length && generated < count; i++)
            {
                var pillar = pillarsOfFaith[i];
                var others = pillarsOfFaith.Where(p => p != pillar).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"ما هو ركن الإيمان رقم {i + 1}؟",
                    pillar, others[0], others[1], others[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 14. Prophet & Animal/Object stories
            var prophetRelated = new[]
            {
                ("من هو النبي الذي كلمه الله مباشرة؟", "موسى عليه السلام", "إبراهيم عليه السلام", "محمد صلى الله عليه وسلم", "عيسى عليه السلام", Difficulty.Medium),
                ("من هو النبي الذي ابتلعه الحوت؟", "يونس عليه السلام", "موسى عليه السلام", "نوح عليه السلام", "يوسف عليه السلام", Difficulty.Easy),
                ("من هو النبي الذي ألقي في النار؟", "إبراهيم عليه السلام", "موسى عليه السلام", "إسماعيل عليه السلام", "لوط عليه السلام", Difficulty.Easy),
                ("من هو النبي الذي سخر الله له الريح؟", "سليمان عليه السلام", "داود عليه السلام", "موسى عليه السلام", "عيسى عليه السلام", Difficulty.Medium),
                ("من هو النبي الذي أوتي الزبور؟", "داود عليه السلام", "سليمان عليه السلام", "موسى عليه السلام", "عيسى عليه السلام", Difficulty.Medium),
                ("من هو النبي صاحب الناقة؟", "صالح عليه السلام", "شعيب عليه السلام", "هود عليه السلام", "لوط عليه السلام", Difficulty.Medium),
                ("من هو النبي الذي بنى الكعبة مع ابنه؟", "إبراهيم عليه السلام", "إسماعيل عليه السلام", "آدم عليه السلام", "نوح عليه السلام", Difficulty.Easy),
                ("من هو أول نبي أرسل إلى الناس؟", "نوح عليه السلام", "آدم عليه السلام", "إبراهيم عليه السلام", "موسى عليه السلام", Difficulty.Medium),
                ("من هو النبي الذي رفعه الله إلى السماء؟", "عيسى عليه السلام", "إبراهيم عليه السلام", "موسى عليه السلام", "إدريس عليه السلام", Difficulty.Medium),
                ("من هو أبو الأنبياء؟", "إبراهيم عليه السلام", "آدم عليه السلام", "نوح عليه السلام", "إسماعيل عليه السلام", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in prophetRelated)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 15. Islamic history dates
            for (int year = 1; year <= 30 && generated < count; year++)
            {
                var events = GetIslamicEventForYear(year);
                if (!string.IsNullOrEmpty(events))
                {
                    var wrongYears = new[] { year + _random.Next(1, 5), year - _random.Next(1, 3), year + _random.Next(3, 8) };
                    AddQuestion(context, categoryId, Difficulty.Hard, 25,
                        $"في أي سنة هجرية حدث: {events}؟",
                        $"السنة {year} هـ", $"السنة {Math.Max(1, wrongYears[0])} هـ", $"السنة {Math.Max(1, wrongYears[1])} هـ", $"السنة {wrongYears[2]} هـ");
                    generated++;
                    if (generated % batchSize == 0) await context.SaveChangesAsync();
                }
            }

            // 16. REMOVED - Bad question format

            // 17. Quran special surahs
            var specialSurahs = new[]
            {
                ("ما هي السورة التي لا تبدأ بالبسملة؟", "سورة التوبة", "سورة الفاتحة", "سورة الإخلاص", "سورة البقرة", Difficulty.Medium),
                ("ما هي السورة التي تسمى قلب القرآن؟", "سورة يس", "سورة البقرة", "سورة الفاتحة", "سورة الإخلاص", Difficulty.Medium),
                ("ما هي السورة التي تسمى سنام القرآن؟", "سورة البقرة", "سورة آل عمران", "سورة يس", "سورة الملك", Difficulty.Hard),
                ("ما هي السورة التي تعدل ثلث القرآن؟", "سورة الإخلاص", "سورة الفاتحة", "سورة الكهف", "سورة يس", Difficulty.Medium),
                ("ما هي السورة التي تشفع لصاحبها؟", "سورة الملك", "سورة يس", "سورة البقرة", "سورة الكهف", Difficulty.Hard),
                ("ما هي السورة التي ذكرت فيها البسملة مرتين؟", "سورة النمل", "سورة الفاتحة", "سورة البقرة", "سورة آل عمران", Difficulty.Hard),
                ("ما هي أطول كلمة في القرآن الكريم؟", "فأسقيناكموه", "استغفار", "الرحمن", "أنلزمكموها", Difficulty.Hard),
                ("ما هي السورة الوحيدة التي سميت باسم امرأة؟", "سورة مريم", "سورة النساء", "سورة الممتحنة", "سورة الطلاق", Difficulty.Medium),
                ("ما هي السورة التي تسمى عروس القرآن؟", "سورة الرحمن", "سورة يس", "سورة البقرة", "سورة الملك", Difficulty.Hard),
                ("أي سورة تسمى المنجية؟", "سورة الملك", "سورة يس", "سورة الرحمن", "سورة الواقعة", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in specialSurahs)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 18. Surah Makki/Madani questions - LIMITED TO 5 TOTAL
            while (makkiMadaniGenerated < maxMakkiMadaniQuestions && generated < count)
            {
                var idx = _random.Next(0, surahs.Length);
                var surah = surahs[idx];
                var others = surahs.Where(s => s != surah).OrderBy(_ => _random.Next()).Take(3).ToArray();
                var diff = idx < 30 ? Difficulty.Easy : (idx < 80 ? Difficulty.Medium : Difficulty.Hard);
                
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff),
                    $"أي من هذه السور ليست من السور {(idx < 30 ? "المكية" : "المدنية")}؟",
                    $"سورة {surah}", $"سورة {others[0]}", $"سورة {others[1]}", $"سورة {others[2]}");
                generated++;
                makkiMadaniGenerated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 19. Quran stories and parables
            var quranStories = new[]
            {
                ("في أي سورة ذكرت قصة أصحاب الكهف؟", "سورة الكهف", "سورة يس", "سورة مريم", "سورة الأنبياء", Difficulty.Easy),
                ("في أي سورة ذكرت قصة يوسف عليه السلام كاملة؟", "سورة يوسف", "سورة مريم", "سورة الأنبياء", "سورة القصص", Difficulty.Easy),
                ("في أي سورة ذكرت قصة موسى وفرعون بالتفصيل؟", "سورة طه", "سورة البقرة", "سورة الأعراف", "سورة القصص", Difficulty.Medium),
                ("في أي سورة ذكر حوار إبليس مع الله؟", "سورة الحجر", "سورة البقرة", "سورة الأعراف", "سورة ص", Difficulty.Hard),
                ("أين ذكرت قصة مريم وعيسى عليهما السلام؟", "سورة مريم", "سورة آل عمران", "سورة النساء", "سورة الأنبياء", Difficulty.Easy),
                ("في أي سورة ذكرت قصة ذي القرنين؟", "سورة الكهف", "سورة الأنبياء", "سورة الصافات", "سورة الفرقان", Difficulty.Medium),
                ("في أي سورة ذكرت قصة أصحاب الفيل؟", "سورة الفيل", "سورة قريش", "سورة البروج", "سورة الطارق", Difficulty.Easy),
                ("في أي سورة ذكرت قصة لقمان الحكيم؟", "سورة لقمان", "سورة يس", "سورة الحجر", "سورة الكهف", Difficulty.Easy),
                ("في أي سورة ذكرت قصة قوم عاد وثمود؟", "سورة الحاقة", "سورة الفجر", "سورة الشمس", "سورة هود", Difficulty.Medium),
                ("في أي سورة ذكرت قصة أصحاب الأخدود؟", "سورة البروج", "سورة الفيل", "سورة الانفطار", "سورة المطففين", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in quranStories)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 20. Islamic jurisprudence (Fiqh) questions
            var fiqhQuestions = new[]
            {
                ("ما هو الوضوء؟", "غسل أعضاء مخصوصة", "الاستحمام الكامل", "التيمم بالتراب", "غسل اليدين فقط", Difficulty.Easy),
                ("كم عدد أركان الوضوء؟", "6 أركان", "4 أركان", "3 أركان", "5 أركان", Difficulty.Medium),
                ("ما أول فرض في الوضوء؟", "غسل الوجه", "المضمضة", "غسل اليدين", "النية", Difficulty.Medium),
                ("متى يجب الغسل؟", "بعد الجنابة", "قبل كل صلاة", "مرة في اليوم", "مرة في الأسبوع", Difficulty.Easy),
                ("ما هو التيمم؟", "البديل عن الوضوء بالتراب", "نوع من الوضوء", "غسل بالماء البارد", "مسح الجسم", Difficulty.Easy),
                ("كم ركعة في صلاة الوتر؟", "1 أو 3 ركعات", "2 ركعات", "4 ركعات", "5 ركعات", Difficulty.Medium),
                ("ما هي صلاة الاستخارة؟", "صلاة لطلب الخيرة من الله", "صلاة الجمعة", "صلاة العيد", "صلاة الجنازة", Difficulty.Easy),
                ("كم عدد ركعات صلاة التراويح؟", "8 أو 20 ركعة", "10 ركعات", "30 ركعة", "5 ركعات", Difficulty.Medium),
                ("ما هو نصاب زكاة الذهب؟", "85 غراماً", "100 غرام", "50 غراماً", "200 غرام", Difficulty.Hard),
                ("ما نسبة زكاة المال؟", "2.5%", "5%", "10%", "1%", Difficulty.Medium),
                ("من يستحق الزكاة من الأصناف الثمانية؟", "الفقراء والمساكين", "الأغنياء", "التجار", "الحكام", Difficulty.Easy),
                ("ما هي شروط وجوب الحج؟", "الإسلام والبلوغ والاستطاعة", "الغنى فقط", "العلم فقط", "الصحة فقط", Difficulty.Medium),
                ("ما هو الإحرام؟", "نية الدخول في النسك", "لبس ملابس خاصة", "الذهاب لمكة", "الطواف", Difficulty.Medium),
                ("ما هي أركان الحج؟", "الإحرام والوقوف بعرفة والطواف والسعي", "الطواف فقط", "السعي فقط", "الوقوف بعرفة فقط", Difficulty.Hard),
                ("ما هو السعي؟", "المشي بين الصفا والمروة", "الطواف حول الكعبة", "الوقوف بعرفة", "رمي الجمرات", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in fiqhQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 21. Angels in Islam
            var angelQuestions = new[]
            {
                ("من هو الملك الموكل بالوحي؟", "جبريل عليه السلام", "ميكائيل عليه السلام", "إسرافيل عليه السلام", "عزرائيل", Difficulty.Easy),
                ("من هو الملك الموكل بالأرزاق والأمطار؟", "ميكائيل عليه السلام", "جبريل عليه السلام", "إسرافيل عليه السلام", "مالك", Difficulty.Medium),
                ("من هو الملك الموكل بالنفخ في الصور؟", "إسرافيل عليه السلام", "جبريل عليه السلام", "ميكائيل عليه السلام", "رضوان", Difficulty.Medium),
                ("من هو خازن الجنة؟", "رضوان", "مالك", "جبريل عليه السلام", "ميكائيل عليه السلام", Difficulty.Medium),
                ("من هو خازن النار؟", "مالك", "رضوان", "جبريل عليه السلام", "إسرافيل عليه السلام", Difficulty.Medium),
                ("ما اسم الملكين الكاتبين للأعمال؟", "رقيب وعتيد", "منكر ونكير", "هاروت وماروت", "جبريل وميكائيل", Difficulty.Hard),
                ("ما اسم ملائكة سؤال القبر؟", "منكر ونكير", "رقيب وعتيد", "هاروت وماروت", "الكرام الكاتبون", Difficulty.Hard),
                ("كم عدد حملة العرش؟", "8 ملائكة", "4 ملائكة", "10 ملائكة", "12 ملكاً", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in angelQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 22. Islamic books
            var booksQuestions = new[]
            {
                ("ما هي الكتب السماوية الأربعة؟", "التوراة والإنجيل والزبور والقرآن", "القرآن فقط", "التوراة والإنجيل", "الزبور والقرآن", Difficulty.Easy),
                ("على من أنزلت التوراة؟", "موسى عليه السلام", "عيسى عليه السلام", "داود عليه السلام", "إبراهيم عليه السلام", Difficulty.Easy),
                ("على من أنزل الإنجيل؟", "عيسى عليه السلام", "موسى عليه السلام", "داود عليه السلام", "محمد صلى الله عليه وسلم", Difficulty.Easy),
                ("على من أنزل الزبور؟", "داود عليه السلام", "موسى عليه السلام", "عيسى عليه السلام", "سليمان عليه السلام", Difficulty.Easy),
                ("ما هي صحف إبراهيم؟", "صحف أنزلت على إبراهيم", "كتاب التوراة", "الإنجيل", "القرآن", Difficulty.Medium),
                ("ما هو أول كتاب في الحديث؟", "موطأ الإمام مالك", "صحيح البخاري", "صحيح مسلم", "سنن أبي داود", Difficulty.Hard),
                ("من جمع القرآن في مصحف واحد؟", "أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب", Difficulty.Medium),
                ("من نسخ المصاحف ووحد القراءة؟", "عثمان بن عفان", "أبو بكر الصديق", "عمر بن الخطاب", "علي بن أبي طالب", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in booksQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 23. Quran verses and Ayahs
            var ayahQuestions = new[]
            {
                ("أي سورة تبدأ بـ 'الحمد لله رب العالمين'؟", "سورة الفاتحة", "سورة البقرة", "سورة الأنعام", "سورة فاطر", Difficulty.Easy),
                ("أي سورة تنتهي بـ 'من الجنة والناس'؟", "سورة الناس", "سورة الفلق", "سورة الإخلاص", "سورة الكافرون", Difficulty.Easy),
                ("في أي سورة آية الكرسي؟", "سورة البقرة", "سورة آل عمران", "سورة النساء", "سورة المائدة", Difficulty.Easy),
                ("ما رقم آية الكرسي في سورة البقرة؟", "255", "250", "260", "245", Difficulty.Hard),
                ("في أي سورة آية الدين (أطول آية)؟", "سورة البقرة", "سورة النساء", "سورة المائدة", "سورة الأنفال", Difficulty.Medium),
                ("ما هي أقصر آية في القرآن؟", "طه و يس", "الرحمن", "مدهامتان", "الله", Difficulty.Hard),
                ("أي سورة تبدأ بـ 'تبارك'؟", "سورة الملك وسورة الفرقان", "سورة البقرة", "سورة يس", "سورة الرحمن", Difficulty.Medium),
                ("أي سورة تبدأ بـ 'قل هو الله أحد'؟", "سورة الإخلاص", "سورة الفلق", "سورة الناس", "سورة الكافرون", Difficulty.Easy),
                ("أي سورة تبدأ بـ 'قل أعوذ برب الفلق'؟", "سورة الفلق", "سورة الناس", "سورة الإخلاص", "سورة الكافرون", Difficulty.Easy),
                ("أي سورة تبدأ بـ 'قل أعوذ برب الناس'؟", "سورة الناس", "سورة الفلق", "سورة الإخلاص", "سورة الكافرون", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in ayahQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 24. Important Islamic places
            var placesQuestions = new[]
            {
                ("أين ولد النبي محمد صلى الله عليه وسلم؟", "مكة المكرمة", "المدينة المنورة", "الطائف", "القدس", Difficulty.Easy),
                ("أين توفي النبي صلى الله عليه وسلم؟", "المدينة المنورة", "مكة المكرمة", "الطائف", "القدس", Difficulty.Easy),
                ("أين يقع المسجد الحرام؟", "مكة المكرمة", "المدينة المنورة", "القدس", "الطائف", Difficulty.Easy),
                ("أين يقع المسجد النبوي؟", "المدينة المنورة", "مكة المكرمة", "القدس", "الطائف", Difficulty.Easy),
                ("أين يقع المسجد الأقصى؟", "القدس", "مكة المكرمة", "المدينة المنورة", "دمشق", Difficulty.Easy),
                ("ما هو الحرم الثالث؟", "المسجد الأقصى", "مسجد قباء", "الجامع الأموي", "الأزهر", Difficulty.Medium),
                ("أين غار حراء؟", "جبل النور بمكة", "جبل أحد بالمدينة", "جبل عرفات", "جبل ثور", Difficulty.Medium),
                ("أين غار ثور؟", "جنوب مكة", "شمال مكة", "المدينة", "الطائف", Difficulty.Medium),
                ("أين جبل عرفات؟", "خارج مكة", "داخل مكة", "المدينة", "الطائف", Difficulty.Easy),
                ("أين مزدلفة؟", "بين عرفات ومنى", "مكة", "المدينة", "الطائف", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in placesQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 25. Prophet Muhammad's life (Seerah)
            var seerahQuestions = new[]
            {
                ("في أي عام ولد النبي صلى الله عليه وسلم؟", "عام الفيل", "عام الهجرة", "عام الحزن", "عام الفتح", Difficulty.Easy),
                ("كم كان عمر النبي حين توفي؟", "63 عاماً", "60 عاماً", "65 عاماً", "70 عاماً", Difficulty.Medium),
                ("من أرضعت النبي صلى الله عليه وسلم؟", "حليمة السعدية", "آمنة بنت وهب", "فاطمة بنت أسد", "خديجة", Difficulty.Medium),
                ("من هو كافل النبي بعد وفاة جده؟", "أبو طالب", "حمزة", "العباس", "أبو لهب", Difficulty.Medium),
                ("كم كان عمر النبي عند زواجه من خديجة؟", "25 عاماً", "30 عاماً", "35 عاماً", "20 عاماً", Difficulty.Hard),
                ("كم عدد أبناء النبي من الذكور؟", "3 أبناء", "2 ابنان", "4 أبناء", "5 أبناء", Difficulty.Hard),
                ("كم عدد بنات النبي صلى الله عليه وسلم؟", "4 بنات", "3 بنات", "5 بنات", "2 بنتان", Difficulty.Medium),
                ("من هي آخر زوجات النبي وفاة؟", "أم سلمة", "عائشة", "حفصة", "ميمونة", Difficulty.Hard),
                ("كم استمرت الدعوة السرية في مكة؟", "3 سنوات", "5 سنوات", "7 سنوات", "سنة واحدة", Difficulty.Medium),
                ("في أي سنة كانت الهجرة إلى الحبشة الأولى؟", "السنة الخامسة", "السنة الثالثة", "السنة السابعة", "السنة العاشرة", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in seerahQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 26. Islamic ethics and morals
            var ethicsQuestions = new[]
            {
                ("ما هي الكبائر في الإسلام؟", "الشرك والقتل والزنا", "الكذب فقط", "الغيبة فقط", "التأخر عن الصلاة", Difficulty.Medium),
                ("ما هي أعظم الكبائر؟", "الشرك بالله", "القتل", "الزنا", "شرب الخمر", Difficulty.Easy),
                ("ما حكم عقوق الوالدين؟", "من الكبائر", "مكروه", "مباح", "مستحب", Difficulty.Easy),
                ("ما هي حقوق الجار في الإسلام؟", "الإحسان وعدم الأذى", "لا حقوق له", "السلام فقط", "الزيارة مرة سنوياً", Difficulty.Easy),
                ("ما حكم صلة الرحم؟", "واجبة", "مستحبة", "مكروهة", "محرمة", Difficulty.Easy),
                ("ما ثمرة الصدق؟", "الهداية والجنة", "كثرة المال", "الشهرة", "الرياسة", Difficulty.Easy),
                ("ما أثر الكذب؟", "الفجور والنار", "النجاح", "الغنى", "السعادة", Difficulty.Medium),
                ("ما هي التوبة النصوح؟", "الندم والإقلاع والعزم", "الاستغفار باللسان", "البكاء", "الحزن", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in ethicsQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 27. Famous Muslim scholars
            var scholarsQuestions = new[]
            {
                ("من مؤسس علم الجبر؟", "الخوارزمي", "ابن سينا", "ابن رشد", "الرازي", Difficulty.Medium),
                ("من صاحب كتاب 'القانون في الطب'؟", "ابن سينا", "الرازي", "ابن رشد", "البخاري", Difficulty.Medium),
                ("من جمع صحيح البخاري؟", "الإمام البخاري", "الإمام مسلم", "الإمام مالك", "الإمام أحمد", Difficulty.Easy),
                ("من مؤسس المذهب الحنفي؟", "أبو حنيفة النعمان", "الإمام مالك", "الشافعي", "أحمد بن حنبل", Difficulty.Medium),
                ("من مؤسس المذهب المالكي؟", "الإمام مالك", "أبو حنيفة", "الشافعي", "أحمد بن حنبل", Difficulty.Medium),
                ("من مؤسس المذهب الشافعي؟", "الإمام الشافعي", "الإمام مالك", "أبو حنيفة", "أحمد بن حنبل", Difficulty.Medium),
                ("من مؤسس المذهب الحنبلي؟", "أحمد بن حنبل", "الإمام الشافعي", "الإمام مالك", "أبو حنيفة", Difficulty.Medium),
                ("من صاحب كتاب 'إحياء علوم الدين'؟", "الإمام الغزالي", "ابن تيمية", "ابن القيم", "النووي", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in scholarsQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 28. Ramadan and fasting
            var ramadanQuestions = new[]
            {
                ("في أي شهر يجب الصيام؟", "شهر رمضان", "شهر شعبان", "شهر محرم", "شهر ذي الحجة", Difficulty.Easy),
                ("ما وقت الإمساك في رمضان؟", "عند أذان الفجر", "عند الشروق", "منتصف الليل", "بعد العشاء", Difficulty.Easy),
                ("ما وقت الإفطار؟", "عند أذان المغرب", "عند الغروب", "بعد صلاة العشاء", "قبل المغرب", Difficulty.Easy),
                ("ما هو السحور؟", "الأكل قبل الفجر", "الأكل بعد المغرب", "الأكل وقت الظهر", "الإفطار", Difficulty.Easy),
                ("ما هي ليلة القدر؟", "ليلة نزول القرآن", "ليلة الإسراء", "ليلة الهجرة", "ليلة العيد", Difficulty.Easy),
                ("في أي ليالي رمضان تُطلب ليلة القدر؟", "العشر الأواخر", "العشر الأولى", "العشر الوسطى", "أول ليلة", Difficulty.Medium),
                ("ليلة القدر خير من كم شهر؟", "ألف شهر", "مئة شهر", "عشرة أشهر", "خمسمئة شهر", Difficulty.Easy),
                ("ما هي زكاة الفطر؟", "صدقة تُخرج قبل العيد", "زكاة المال", "صدقة اختيارية", "زكاة الذهب", Difficulty.Easy),
                ("ما مقدار زكاة الفطر؟", "صاع من الطعام", "درهم واحد", "نصف صاع", "ثلاثة آصع", Difficulty.Medium),
                ("ما حكم من أفطر عمداً في رمضان؟", "الكفارة والقضاء", "لا شيء عليه", "القضاء فقط", "الكفارة فقط", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in ramadanQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 29. Day of Judgment and Hereafter
            var akhirahQuestions = new[]
            {
                ("ما أول ما يسأل عنه العبد يوم القيامة؟", "الصلاة", "الصيام", "الزكاة", "الحج", Difficulty.Medium),
                ("ما هو الصراط؟", "جسر على جهنم", "باب الجنة", "ميزان الأعمال", "كتاب الأعمال", Difficulty.Medium),
                ("ما هو الميزان؟", "توزن فيه الأعمال", "الصراط", "الحوض", "الشفاعة", Difficulty.Easy),
                ("ما هو الحوض؟", "حوض ماء للنبي", "الميزان", "الصراط", "الجنة", Difficulty.Medium),
                ("كم عدد أبواب الجنة؟", "8 أبواب", "7 أبواب", "10 أبواب", "4 أبواب", Difficulty.Medium),
                ("كم عدد أبواب جهنم؟", "7 أبواب", "8 أبواب", "10 أبواب", "4 أبواب", Difficulty.Medium),
                ("ما اسم أعلى درجة في الجنة؟", "الفردوس الأعلى", "جنة عدن", "جنة النعيم", "دار السلام", Difficulty.Medium),
                ("من أول من يدخل الجنة؟", "النبي محمد صلى الله عليه وسلم", "آدم عليه السلام", "إبراهيم عليه السلام", "موسى عليه السلام", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in akhirahQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 30. Surah comparison questions with ONLY relevant options
            for (int i = 0; i < 50 && generated < count; i++)
            {
                var surah1 = surahs[_random.Next(surahs.Length)];
                var surah2 = surahs[_random.Next(surahs.Length)];
                while (surah2 == surah1 || surahAyats.GetValueOrDefault(surah1, 0) == surahAyats.GetValueOrDefault(surah2, 0))
                    surah2 = surahs[_random.Next(surahs.Length)];
                
                var longer = surahAyats.GetValueOrDefault(surah1, 0) > surahAyats.GetValueOrDefault(surah2, 0) ? surah1 : surah2;
                var shorter = surahAyats.GetValueOrDefault(surah1, 0) > surahAyats.GetValueOrDefault(surah2, 0) ? surah2 : surah1;
                
                // Options are ONLY the two surahs being compared + "متساويتان" + "لا يمكن المقارنة"
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"أيهما أطول: سورة {surah1} أم سورة {surah2}؟",
                    $"سورة {longer}",
                    $"سورة {shorter}",
                    "متساويتان في الطول",
                    "لا يمكن المقارنة");
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task GenerateSportsQuestionsAsync(SabqDbContext context, Guid categoryId, int count)
    {
        int generated = 0;
        int batchSize = 500;

        var footballTeams = new[] { "ريال مدريد", "برشلونة", "مانشستر يونايتد", "ليفربول", "بايرن ميونخ", "يوفنتوس", "باريس سان جيرمان", "مانشستر سيتي", "تشيلسي", "أرسنال", "ميلان", "إنتر ميلان", "أتلتيكو مدريد", "بوروسيا دورتموند", "توتنهام", "أياكس", "بنفيكا", "بورتو", "سيلتيك", "رينجرز", "الأهلي المصري", "الزمالك", "الهلال السعودي", "النصر السعودي", "الاتحاد السعودي", "الأهلي السعودي", "العين الإماراتي", "الدحيل القطري", "السد القطري", "الترجي التونسي", "الرجاء المغربي", "الوداد المغربي", "الإسماعيلي", "بيراميدز", "شباب الأهلي", "الشارقة", "الجزيرة", "الوحدة الإماراتي" };
        
        var footballPlayers = new[] { "ليونيل ميسي", "كريستيانو رونالدو", "نيمار", "كيليان مبابي", "إرلينج هالاند", "محمد صلاح", "كريم بنزيما", "روبرت ليفاندوفسكي", "لوكا مودريتش", "كيفين دي بروين", "فيرجيل فان دايك", "تيبو كورتوا", "جود بيلينغهام", "فينيسيوس جونيور", "رودريغو", "بوكايو ساكا", "ماركوس راشفورد", "جمال موسيالا", "فيل فودين", "دييغو مارادونا", "بيليه", "يوهان كرويف", "فرانز بيكنباور", "زين الدين زيدان", "رونالدينيو", "تيري هنري", "ثيري هنري", "رونالدو البرازيلي", "روماريو", "ريفالدو", "كاكا", "أندريس إنييستا", "تشافي هيرنانديز", "سيرجيو راموس", "كارلوس بويول", "باولو مالديني", "فرانكو باريزي", "ياشين", "بوفون", "كاسياس", "نوير", "حسن الشحات", "رياض محرز", "سادي ماني", "كريم حافظ", "عمر مرموش" };
        
        var countries = new[] { "البرازيل", "الأرجنتين", "ألمانيا", "فرنسا", "إيطاليا", "إسبانيا", "إنجلترا", "هولندا", "البرتغال", "بلجيكا", "كرواتيا", "أوروغواي", "كولومبيا", "المكسيك", "الولايات المتحدة", "اليابان", "كوريا الجنوبية", "السعودية", "المغرب", "تونس", "مصر", "الجزائر", "نيجيريا", "الكاميرون", "السنغال", "غانا", "قطر", "الإمارات", "العراق", "الأردن", "سوريا", "فلسطين", "لبنان", "الكويت", "عمان", "البحرين", "اليمن", "ليبيا", "السودان", "موريتانيا" };

        var worldCupYears = new[] { 1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022 };
        
        var worldCupWinners = new Dictionary<int, string> { {1930, "أوروغواي"}, {1934, "إيطاليا"}, {1938, "إيطاليا"}, {1950, "أوروغواي"}, {1954, "ألمانيا"}, {1958, "البرازيل"}, {1962, "البرازيل"}, {1966, "إنجلترا"}, {1970, "البرازيل"}, {1974, "ألمانيا"}, {1978, "الأرجنتين"}, {1982, "إيطاليا"}, {1986, "الأرجنتين"}, {1990, "ألمانيا"}, {1994, "البرازيل"}, {1998, "فرنسا"}, {2002, "البرازيل"}, {2006, "إيطاليا"}, {2010, "إسبانيا"}, {2014, "ألمانيا"}, {2018, "فرنسا"}, {2022, "الأرجنتين"} };

        var worldCupHosts = new Dictionary<int, string> { {1930, "أوروغواي"}, {1934, "إيطاليا"}, {1938, "فرنسا"}, {1950, "البرازيل"}, {1954, "سويسرا"}, {1958, "السويد"}, {1962, "تشيلي"}, {1966, "إنجلترا"}, {1970, "المكسيك"}, {1974, "ألمانيا الغربية"}, {1978, "الأرجنتين"}, {1982, "إسبانيا"}, {1986, "المكسيك"}, {1990, "إيطاليا"}, {1994, "الولايات المتحدة"}, {1998, "فرنسا"}, {2002, "كوريا واليابان"}, {2006, "ألمانيا"}, {2010, "جنوب أفريقيا"}, {2014, "البرازيل"}, {2018, "روسيا"}, {2022, "قطر"} };

        var sports = new[] { "كرة القدم", "كرة السلة", "التنس", "السباحة", "ألعاب القوى", "الجمباز", "الملاكمة", "المصارعة", "رفع الأثقال", "الكرة الطائرة", "كرة اليد", "الهوكي", "الجولف", "البيسبول", "الرجبي", "الكريكيت", "البادمنتون", "تنس الطاولة", "الفروسية", "السهام", "التجديف", "الإبحار", "ركوب الدراجات", "التزلج", "كرة الماء" };
        
        var sportsPlayersCount = new Dictionary<string, int> { {"كرة القدم", 11}, {"كرة السلة", 5}, {"الكرة الطائرة", 6}, {"كرة اليد", 7}, {"الهوكي", 11}, {"الرجبي", 15}, {"البيسبول", 9}, {"الكريكيت", 11}, {"كرة الماء", 7} };

        var olympicCities = new[] { ("أثينا", 1896), ("باريس", 1900), ("لندن", 1908), ("ستوكهولم", 1912), ("أنتويرب", 1920), ("باريس", 1924), ("أمستردام", 1928), ("لوس أنجلوس", 1932), ("برلين", 1936), ("لندن", 1948), ("هلسنكي", 1952), ("ملبورن", 1956), ("روما", 1960), ("طوكيو", 1964), ("مكسيكو سيتي", 1968), ("ميونخ", 1972), ("مونتريال", 1976), ("موسكو", 1980), ("لوس أنجلوس", 1984), ("سيول", 1988), ("برشلونة", 1992), ("أتلانتا", 1996), ("سيدني", 2000), ("أثينا", 2004), ("بكين", 2008), ("لندن", 2012), ("ريو دي جانيرو", 2016), ("طوكيو", 2020) };

        var tennisTournaments = new[] { "ويمبلدون", "رولان غاروس", "أستراليا المفتوحة", "أمريكا المفتوحة" };
        var tennisPlayers = new[] { "روجر فيدرر", "رافائيل نادال", "نوفاك ديوكوفيتش", "أندي موراي", "سيرينا ويليامز", "ماريا شارابوفا", "نعومي أوساكا", "كارلوس الكاراز" };

        var leagues = new[] { ("الدوري الإنجليزي", "إنجلترا"), ("الدوري الإسباني", "إسبانيا"), ("الدوري الألماني", "ألمانيا"), ("الدوري الإيطالي", "إيطاليا"), ("الدوري الفرنسي", "فرنسا"), ("الدوري السعودي", "السعودية"), ("الدوري المصري", "مصر"), ("الدوري الإماراتي", "الإمارات"), ("الدوري القطري", "قطر") };

        // Generate questions until we reach the target
        while (generated < count)
        {
            // 1. World Cup winner questions
            foreach (var year in worldCupYears)
            {
                if (generated >= count) break;
                var winner = worldCupWinners[year];
                var others = countries.Where(c => c != winner).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"من فاز بكأس العالم عام {year}؟",
                    winner, others[0], others[1], others[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 2. World Cup host questions
            foreach (var year in worldCupYears)
            {
                if (generated >= count) break;
                var host = worldCupHosts[year];
                var others = countries.Where(c => c != host).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Hard, 25,
                    $"أين أقيمت بطولة كأس العالم {year}؟",
                    host, others[0], others[1], others[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 3. Team league questions
            for (int i = 0; i < footballTeams.Length && generated < count; i++)
            {
                var team = footballTeams[i];
                var league = GetTeamLeague(team);
                var otherLeagues = leagues.Select(l => l.Item1).Where(l => l != league).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"في أي دوري يلعب فريق {team}؟",
                    league, otherLeagues[0], otherLeagues[1], otherLeagues[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 4. Player nationality questions
            for (int i = 0; i < footballPlayers.Length && generated < count; i++)
            {
                var player = footballPlayers[i];
                var nationality = GetPlayerNationality(player);
                var otherNats = countries.Where(c => c != nationality).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"ما هي جنسية اللاعب {player}؟",
                    nationality, otherNats[0], otherNats[1], otherNats[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 5. Sport player count questions
            foreach (var (sport, playerCount) in sportsPlayersCount)
            {
                if (generated >= count) break;
                var wrongCounts = new[] { playerCount + 1, playerCount - 1, playerCount + 2 };
                
                AddQuestion(context, categoryId, Difficulty.Easy, 15,
                    $"كم عدد لاعبي فريق {sport} في الملعب؟",
                    $"{playerCount} لاعبين", $"{Math.Max(1, wrongCounts[0])} لاعبين", $"{Math.Max(1, wrongCounts[1])} لاعبين", $"{wrongCounts[2]} لاعبين");
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 6. Team color questions
            for (int i = 0; i < footballTeams.Length && generated < count; i++)
            {
                var team = footballTeams[i];
                var color = GetTeamColor(team);
                var colors = new[] { "أبيض", "أحمر", "أزرق", "أخضر", "أصفر", "أسود", "برتقالي", "بنفسجي" };
                var otherColors = colors.Where(c => c != color && !color.Contains(c)).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"ما هو اللون الأساسي لقميص فريق {team}؟",
                    color, otherColors[0], otherColors[1], otherColors[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
                if (generated >= count) break;
            }

            // 7. Tennis tournament questions
            var tennisFacts = new[]
            {
                ("أي بطولة جراند سلام تلعب على العشب؟", "ويمبلدون", "رولان غاروس", "أستراليا المفتوحة", "أمريكا المفتوحة", Difficulty.Easy),
                ("أي بطولة جراند سلام تلعب على الملاعب الترابية؟", "رولان غاروس", "ويمبلدون", "أستراليا المفتوحة", "أمريكا المفتوحة", Difficulty.Easy),
                ("من هو صاحب أكبر عدد من بطولات جراند سلام في التنس؟", "نوفاك ديوكوفيتش", "روجر فيدرر", "رافائيل نادال", "بيت سامبراس", Difficulty.Medium),
                ("من هو ملك الملاعب الترابية؟", "رافائيل نادال", "روجر فيدرر", "نوفاك ديوكوفيتش", "أندي موراي", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in tennisFacts)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 8. Olympic questions
            foreach (var (city, year) in olympicCities)
            {
                if (generated >= count) break;
                var otherCities = olympicCities.Select(o => o.Item1).Where(c => c != city).Distinct().OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Hard, 25,
                    $"أين أقيمت الألعاب الأولمبية الصيفية عام {year}؟",
                    city, otherCities[0], otherCities[1], otherCities[2]);
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 9. General sports facts
            var sportsFacts = new[]
            {
                ("كم عدد الحلقات الأولمبية؟", "5 حلقات", "4 حلقات", "6 حلقات", "3 حلقات", Difficulty.Easy),
                ("كم دقيقة مدة شوط كرة القدم؟", "45 دقيقة", "30 دقيقة", "60 دقيقة", "40 دقيقة", Difficulty.Easy),
                ("كم شوط في مباراة كرة القدم؟", "شوطان", "ثلاثة أشواط", "أربعة أشواط", "شوط واحد", Difficulty.Easy),
                ("ما لون البطاقة التي تعني الطرد؟", "أحمر", "أصفر", "أخضر", "أزرق", Difficulty.Easy),
                ("كم يبلغ عرض مرمى كرة القدم؟", "7.32 متر", "8 متر", "6 متر", "10 متر", Difficulty.Hard),
                ("كم يبلغ ارتفاع مرمى كرة القدم؟", "2.44 متر", "3 متر", "2 متر", "2.5 متر", Difficulty.Hard),
                ("كم نقطة للفوز في سيت التنس؟", "6 نقاط على الأقل", "4 نقاط", "5 نقاط", "10 نقاط", Difficulty.Medium),
                ("كم شوط في مباراة كرة السلة NBA؟", "4 أشواط", "2 شوطان", "3 أشواط", "5 أشواط", Difficulty.Medium),
                ("كم طول ملعب كرة القدم تقريباً؟", "100-110 متر", "50 متر", "150 متر", "200 متر", Difficulty.Easy),
                ("كم عرض ملعب كرة القدم تقريباً؟", "64-75 متر", "100 متر", "50 متر", "90 متر", Difficulty.Medium),
                ("كم طول سباق الماراثون؟", "42.195 كم", "21 كم", "50 كم", "30 كم", Difficulty.Medium),
                ("كم مسافة ضربة الجزاء من المرمى؟", "11 متر", "12 متر", "10 متر", "9 متر", Difficulty.Medium),
                ("كم عدد الإنذارات للطرد في كرة القدم؟", "إنذاران", "3 إنذارات", "إنذار واحد", "4 إنذارات", Difficulty.Easy),
                ("كم تبديل مسموح به في كرة القدم؟", "5 تبديلات", "3 تبديلات", "6 تبديلات", "4 تبديلات", Difficulty.Easy),
                ("ما هو وقت الشوط الإضافي في كرة القدم؟", "30 دقيقة", "20 دقيقة", "15 دقيقة", "45 دقيقة", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in sportsFacts)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 10. Champions League questions
            var clWinners = new[] { ("ريال مدريد", 15), ("ميلان", 7), ("ليفربول", 6), ("برشلونة", 5), ("بايرن ميونخ", 6), ("مانشستر يونايتد", 3), ("إنتر ميلان", 3), ("يوفنتوس", 2), ("تشيلسي", 2), ("مانشستر سيتي", 1) };
            
            foreach (var (team, wins) in clWinners)
            {
                if (generated >= count) break;
                var wrongWins = new[] { wins + 2, wins - 1, wins + 5 };
                
                AddQuestion(context, categoryId, Difficulty.Hard, 25,
                    $"كم مرة فاز {team} بدوري أبطال أوروبا؟",
                    $"{wins} مرات", $"{Math.Max(1, wrongWins[0])} مرات", $"{Math.Max(1, wrongWins[1])} مرات", $"{wrongWins[2]} مرات");
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 11. Ballon d'Or winners
            var ballonDorHistory = new[]
            {
                ("من فاز بالكرة الذهبية 2023؟", "ليونيل ميسي", "إرلينج هالاند", "كيليان مبابي", "كريستيانو رونالدو", Difficulty.Medium),
                ("من فاز بأكبر عدد من الكرات الذهبية؟", "ليونيل ميسي", "كريستيانو رونالدو", "ميشيل بلاتيني", "يوهان كرويف", Difficulty.Easy),
                ("كم كرة ذهبية فاز بها ميسي؟", "8 كرات", "7 كرات", "6 كرات", "5 كرات", Difficulty.Medium),
                ("كم كرة ذهبية فاز بها رونالدو؟", "5 كرات", "6 كرات", "4 كرات", "7 كرات", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in ballonDorHistory)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 12. Arab football achievements
            var arabFootball = new[]
            {
                ("من أول منتخب عربي يصل لربع نهائي كأس العالم؟", "المغرب", "السعودية", "مصر", "الجزائر", Difficulty.Medium),
                ("من فاز بكأس أمم أفريقيا 2022؟", "السنغال", "مصر", "الجزائر", "المغرب", Difficulty.Medium),
                ("من هداف الدوري المصري التاريخي؟", "حسن الشاذلي", "حسام حسن", "عماد متعب", "أحمد حسن", Difficulty.Hard),
                ("من أكثر نادي فوزاً بالدوري المصري؟", "الأهلي", "الزمالك", "الإسماعيلي", "المصري", Difficulty.Easy),
                ("من أكثر نادي فوزاً بدوري أبطال أفريقيا؟", "الأهلي المصري", "الزمالك", "الترجي", "الرجاء", Difficulty.Medium),
                ("من فاز بكأس العرب 2021؟", "الجزائر", "تونس", "مصر", "قطر", Difficulty.Medium),
                ("من استضاف كأس العالم 2022؟", "قطر", "الإمارات", "السعودية", "البحرين", Difficulty.Easy),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in arabFootball)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 13. World Cup stats
            var wcStats = new[]
            {
                ("من هداف كأس العالم التاريخي؟", "ميروسلاف كلوزه", "رونالدو البرازيلي", "جيرد مولر", "جوست فونتين", Difficulty.Medium),
                ("كم مرة فازت البرازيل بكأس العالم؟", "5 مرات", "4 مرات", "6 مرات", "3 مرات", Difficulty.Medium),
                ("كم مرة فازت ألمانيا بكأس العالم؟", "4 مرات", "3 مرات", "5 مرات", "2 مرتان", Difficulty.Medium),
                ("كم مرة فازت الأرجنتين بكأس العالم؟", "3 مرات", "2 مرتان", "4 مرات", "1 مرة", Difficulty.Medium),
                ("من أكبر هزيمة في تاريخ كأس العالم؟", "المجر 10-1 السلفادور", "ألمانيا 7-1 البرازيل", "يوغسلافيا 9-0 زائير", "المجر 9-0 كوريا", Difficulty.Hard),
                ("من سجل أسرع هدف في كأس العالم؟", "هاكان شوكور", "بيليه", "رونالدو", "مبابي", Difficulty.Hard),
                ("كم هدف سجل فونتين في كأس العالم 1958؟", "13 هدف", "10 أهداف", "8 أهداف", "15 هدف", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in wcStats)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 14. Individual sport records
            var records = new[]
            {
                ("من هو أسرع إنسان في العالم؟", "يوسين بولت", "تايسون غاي", "أساف باويل", "جوستين غاتلين", Difficulty.Easy),
                ("ما هو الرقم القياسي في سباق 100 متر؟", "9.58 ثانية", "9.69 ثانية", "9.72 ثانية", "9.50 ثانية", Difficulty.Hard),
                ("من صاحب رقم قياسي الوثب الطويل؟", "مايك باويل", "كارل لويس", "بوب بيمون", "دياميلوس جيمس", Difficulty.Hard),
                ("كم يبلغ الرقم القياسي في رمي الرمح للرجال تقريباً؟", "98.48 متر", "90 متر", "85 متر", "105 متر", Difficulty.Hard),
                ("من هو أعظم سباح في التاريخ؟", "مايكل فيلبس", "إيان ثورب", "مارك سبيتز", "ريان لوكتي", Difficulty.Easy),
                ("كم ميدالية أولمبية فاز بها مايكل فيلبس؟", "28 ميدالية", "23 ميدالية", "20 ميدالية", "30 ميدالية", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in records)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 15. Variable generation - matching teams to stadiums
            var stadiums = new[] { ("سانتياغو برنابيو", "ريال مدريد"), ("كامب نو", "برشلونة"), ("أولد ترافورد", "مانشستر يونايتد"), ("أنفيلد", "ليفربول"), ("أليانز أرينا", "بايرن ميونخ"), ("يوفنتوس ستاديوم", "يوفنتوس"), ("بارك دي برانس", "باريس سان جيرمان"), ("الاتحاد أرينا", "مانشستر سيتي"), ("سان سيرو", "ميلان"), ("ستامفورد بريدج", "تشيلسي"), ("الإمارات", "أرسنال") };
            
            foreach (var (stadium, team) in stadiums)
            {
                if (generated >= count) break;
                var otherTeams = footballTeams.Where(t => t != team).OrderBy(_ => _random.Next()).Take(3).ToArray();
                
                AddQuestion(context, categoryId, Difficulty.Medium, 20,
                    $"ما هو ملعب فريق {team}؟",
                    stadium, GetStadiumForTeam(otherTeams[0]), GetStadiumForTeam(otherTeams[1]), GetStadiumForTeam(otherTeams[2]));
                generated++;
                
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 16. Verified player career questions (factual)
            var playerCareerFacts = new[]
            {
                // Players who played for specific teams - VERIFIED FACTS
                ("في أي نادي بدأ ليونيل ميسي مسيرته الاحترافية؟", "برشلونة", "ريال مدريد", "نيويل أولد بويز", "أتلتيكو مدريد", Difficulty.Easy),
                ("في أي نادي بدأ كريستيانو رونالدو مسيرته الاحترافية؟", "سبورتينغ لشبونة", "مانشستر يونايتد", "ريال مدريد", "يوفنتوس", Difficulty.Medium),
                ("لأي نادي انتقل محمد صلاح من روما؟", "ليفربول", "تشيلسي", "مانشستر سيتي", "أرسنال", Difficulty.Easy),
                ("في أي نادي لعب زين الدين زيدان في إيطاليا؟", "يوفنتوس", "ميلان", "إنتر ميلان", "روما", Difficulty.Medium),
                ("أي نادي إنجليزي لعب له دييغو مارادونا؟", "لم يلعب في إنجلترا", "ليفربول", "مانشستر يونايتد", "توتنهام", Difficulty.Hard),
                ("لأي نادي انتقل نيمار من برشلونة؟", "باريس سان جيرمان", "ريال مدريد", "مانشستر سيتي", "بايرن ميونخ", Difficulty.Easy),
                ("في أي نادي إسباني لعب رونالدينيو؟", "برشلونة", "ريال مدريد", "أتلتيكو مدريد", "إشبيلية", Difficulty.Easy),
                ("لأي نادي انتقل كريستيانو رونالدو من ريال مدريد؟", "يوفنتوس", "مانشستر يونايتد", "باريس سان جيرمان", "بايرن ميونخ", Difficulty.Easy),
                ("في أي نادي لعب ثيري هنري في إنجلترا؟", "أرسنال", "تشيلسي", "ليفربول", "مانشستر يونايتد", Difficulty.Easy),
                ("لأي نادي انتقل بيكهام من مانشستر يونايتد؟", "ريال مدريد", "برشلونة", "ميلان", "باريس سان جيرمان", Difficulty.Medium),
                ("في أي نادي لعب روبرتو كارلوس معظم مسيرته؟", "ريال مدريد", "برشلونة", "ميلان", "إنتر ميلان", Difficulty.Medium),
                ("أين لعب فرانك لامبارد معظم مسيرته؟", "تشيلسي", "ليفربول", "مانشستر يونايتد", "أرسنال", Difficulty.Easy),
                ("في أي نادي لعب ستيفن جيرارد طوال مسيرته تقريباً؟", "ليفربول", "تشيلسي", "مانشستر يونايتد", "إيفرتون", Difficulty.Easy),
                ("لأي نادي انتقل غاريث بيل من توتنهام؟", "ريال مدريد", "برشلونة", "بايرن ميونخ", "مانشستر يونايتد", Difficulty.Easy),
                ("في أي نادي إيطالي لعب كاكا؟", "ميلان", "يوفنتوس", "إنتر ميلان", "روما", Difficulty.Medium),
                ("لأي منتخب لعب زين الدين زيدان؟", "فرنسا", "الجزائر", "إسبانيا", "إيطاليا", Difficulty.Easy),
                ("في أي نادي لعب باولو مالديني طوال مسيرته؟", "ميلان", "يوفنتوس", "إنتر ميلان", "روما", Difficulty.Medium),
                ("لأي نادي لعب فرانز بيكنباور في ألمانيا؟", "بايرن ميونخ", "بوروسيا دورتموند", "شالكه", "هامبورغ", Difficulty.Medium),
                ("في أي نادي برازيلي بدأ رونالدو البرازيلي؟", "كروزيرو", "فلامنغو", "ساو باولو", "سانتوس", Difficulty.Hard),
                ("لأي نادي انتقل لويس فيغو من برشلونة؟", "ريال مدريد", "مانشستر يونايتد", "يوفنتوس", "ميلان", Difficulty.Medium),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in playerCareerFacts)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 17. More factual sports trivia
            var moreFactualQuestions = new[]
            {
                ("من هو كابتن منتخب الأرجنتين الفائز بكأس العالم 2022؟", "ليونيل ميسي", "أنخيل دي ماريا", "رودريغو دي بول", "إميليانو مارتينيز", Difficulty.Easy),
                ("من سجل الهدف الفائز في نهائي كأس العالم 2010؟", "أندريس إنييستا", "ديفيد فيا", "تشافي", "فيرناندو توريس", Difficulty.Medium),
                ("من فاز بجائزة أفضل لاعب في كأس العالم 2022؟", "ليونيل ميسي", "كيليان مبابي", "أنطوان غريزمان", "لوكا مودريتش", Difficulty.Easy),
                ("من هداف كأس العالم 2022؟", "كيليان مبابي", "ليونيل ميسي", "أوليفييه جيرو", "جوليان ألفاريز", Difficulty.Medium),
                ("من حارس المنتخب الأرجنتيني في كأس العالم 2022؟", "إميليانو مارتينيز", "فرانكو أرماني", "جيرونيمو رولي", "خوان موسو", Difficulty.Medium),
                ("من هو أغلى لاعب في تاريخ كرة القدم؟", "نيمار", "كيليان مبابي", "فيليب كوتينيو", "جواو فيليكس", Difficulty.Medium),
                ("ما هي قيمة انتقال نيمار لباريس سان جيرمان؟", "222 مليون يورو", "180 مليون يورو", "250 مليون يورو", "200 مليون يورو", Difficulty.Hard),
                ("من فاز بالحذاء الذهبي في كأس العالم 2018؟", "هاري كين", "كيليان مبابي", "رونالدو", "لوكاكو", Difficulty.Medium),
                ("من سجل أسرع هاتريك في تاريخ الدوري الإنجليزي؟", "ساديو ماني", "روبي فاولر", "آلان شيرر", "سيرجيو أغويرو", Difficulty.Hard),
                ("كم عدد أهداف ميسي في كأس العالم 2022؟", "7 أهداف", "5 أهداف", "8 أهداف", "6 أهداف", Difficulty.Hard),
            };
            
            foreach (var (q, c, w1, w2, w3, diff) in moreFactualQuestions)
            {
                if (generated >= count) break;
                AddQuestion(context, categoryId, diff, GetTimeLimit(diff), q, c, w1, w2, w3);
                generated++;
                if (generated % batchSize == 0) await context.SaveChangesAsync();
            }

            // 18. Year-based achievements
            for (int year = 2000; year <= 2024 && generated < count; year++)
            {
                var achievement = GetSportsAchievementForYear(year);
                if (!string.IsNullOrEmpty(achievement))
                {
                    var wrongYears = new[] { year + 1, year - 1, year + 2 };
                    AddQuestion(context, categoryId, Difficulty.Hard, 25,
                        $"في أي عام: {achievement}؟",
                        $"{year}", $"{wrongYears[0]}", $"{wrongYears[1]}", $"{wrongYears[2]}");
                    generated++;
                    if (generated % batchSize == 0) await context.SaveChangesAsync();
                }
            }
        }

        await context.SaveChangesAsync();
    }

    // Helper methods
    private static string GetAsmaAlHusnaMeaning(string name) => name switch
    {
        "الرحمن" => "ذو الرحمة الواسعة",
        "الرحيم" => "ذو الرحمة بالمؤمنين",
        "الملك" => "صاحب الملك الحقيقي",
        "القدوس" => "المنزه عن كل نقص",
        "السلام" => "السالم من كل عيب",
        "المؤمن" => "المصدق لرسله",
        "المهيمن" => "الرقيب على كل شيء",
        "العزيز" => "الغالب الذي لا يغلب",
        "الجبار" => "الذي جبر خلقه على ما يشاء",
        "المتكبر" => "المتعالي عن صفات المخلوقين",
        "الخالق" => "الموجد للأشياء من العدم",
        "البارئ" => "المنشئ للخلق على غير مثال",
        "المصور" => "المعطي لكل شيء صورته",
        "الغفار" => "كثير المغفرة والستر",
        "القهار" => "الغالب لكل شيء",
        "الوهاب" => "كثير العطاء بلا عوض",
        "الرزاق" => "الموصل الأرزاق لخلقه",
        "الفتاح" => "فاتح أبواب الرحمة والرزق",
        "العليم" => "المحيط علمه بكل شيء",
        "القابض" => "الذي يضيق الرزق بحكمته",
        "الباسط" => "الذي يوسع الرزق لمن يشاء",
        "الخافض" => "المذل للجبارين والظالمين",
        "الرافع" => "الذي يرفع المؤمنين بنصره",
        "المعز" => "الذي يهب العزة لمن يشاء",
        "المذل" => "الذي يذل الكافرين والمنافقين",
        "السميع" => "الذي يسمع كل شيء",
        "البصير" => "المدرك لكل الأشياء",
        "الحكم" => "الفاصل بين الحق والباطل",
        "العدل" => "ذو العدل التام في الأحكام",
        "اللطيف" => "العالم بدقائق الأمور",
        "الخبير" => "العالم ببواطن الأمور",
        "الحليم" => "الذي لا يعجل بالعقوبة",
        "العظيم" => "ذو العظمة المطلقة",
        "الغفور" => "الذي يغفر الذنوب",
        "الشكور" => "المثيب على القليل بالكثير",
        "العلي" => "المتعالي عن صفات الخلق",
        "الكبير" => "ذو الكبرياء والعظمة",
        "الحفيظ" => "الحافظ لكل شيء",
        "المقيت" => "الذي يوصل القوت لخلقه",
        "الحسيب" => "الكافي لعباده",
        "الجليل" => "ذو الجلال والعظمة",
        "الكريم" => "كثير الخير والعطاء",
        "الرقيب" => "المطلع على كل شيء",
        "المجيب" => "الذي يجيب دعاء الداعين",
        "الواسع" => "الذي وسع رزقه كل شيء",
        "الحكيم" => "ذو الحكمة البالغة",
        "الودود" => "المحب لعباده الصالحين",
        "المجيد" => "ذو المجد والشرف والكرم",
        "الباعث" => "الذي يبعث الخلق يوم القيامة",
        "الشهيد" => "المطلع على كل شيء",
        "الحق" => "الموجود حقيقة لا شك فيه",
        "الوكيل" => "المتكفل بأمور عباده",
        "القوي" => "ذو القوة المطلقة",
        "المتين" => "شديد القوة الذي لا يضعف",
        "الولي" => "الناصر لعباده المؤمنين",
        "الحميد" => "المستحق للحمد والثناء",
        "المحصي" => "المحيط بكل شيء عدداً",
        "المبدئ" => "الذي بدأ الخلق ابتداءً",
        "المعيد" => "الذي يعيد الخلق بعد الموت",
        "المحيي" => "الذي يحيي الموتى",
        "المميت" => "الذي يميت الأحياء",
        "الحي" => "الدائم الحياة بلا فناء",
        "القيوم" => "القائم بذاته المقيم لغيره",
        "الواجد" => "الغني الذي لا يفتقر",
        "الماجد" => "ذو المجد والكرم الواسع",
        "الواحد" => "المتفرد بذاته وصفاته",
        "الصمد" => "الذي يقصده الخلق لحوائجهم",
        "القادر" => "ذو القدرة الكاملة",
        "المقتدر" => "التام القدرة على كل شيء",
        "المقدم" => "الذي يقدم ما يشاء",
        "المؤخر" => "الذي يؤخر ما يشاء",
        "الأول" => "الذي ليس قبله شيء",
        "الآخر" => "الذي ليس بعده شيء",
        "الظاهر" => "الذي ظهر فوق كل شيء",
        "الباطن" => "المحتجب عن الأبصار",
        "الوالي" => "المتولي لأمور خلقه",
        "المتعالي" => "المرتفع عن صفات الخلق",
        "البر" => "كثير البر والإحسان",
        "التواب" => "الذي يقبل التوبة كثيراً",
        "المنتقم" => "المعاقب للعصاة والظالمين",
        "العفو" => "الذي يمحو السيئات",
        "الرؤوف" => "الشديد الرحمة بعباده",
        "مالك الملك" => "المتصرف في الملك كيف يشاء",
        "ذو الجلال والإكرام" => "صاحب العظمة والجود",
        "المقسط" => "العادل في حكمه",
        "الجامع" => "الذي يجمع الخلائق يوم القيامة",
        "الغني" => "الذي لا يحتاج لأحد",
        "المغني" => "الذي يغني من يشاء",
        "المانع" => "الذي يمنع ما يشاء بحكمته",
        "الضار" => "المقدر للضر على من يشاء",
        "النافع" => "المقدر للنفع لمن يشاء",
        "النور" => "منور السماوات والأرض",
        "الهادي" => "الذي يهدي ويرشد عباده",
        "البديع" => "المبدع للخلق على غير مثال",
        "الباقي" => "الدائم الذي لا يزول",
        "الوارث" => "الذي يرث الأرض ومن عليها",
        "الرشيد" => "الذي يرشد الخلق لمصالحهم",
        "الصبور" => "الذي لا يعجل على العصاة",
        _ => "من صفات الله الحسنى"
    };

    private static string GetBattleYear(string battle) => battle switch
    {
        "بدر" => "السنة 2 هـ",
        "أحد" => "السنة 3 هـ",
        "الخندق" => "السنة 5 هـ",
        "خيبر" => "السنة 7 هـ",
        "حنين" => "السنة 8 هـ",
        "تبوك" => "السنة 9 هـ",
        "مؤتة" => "السنة 8 هـ",
        "بني قريظة" => "السنة 5 هـ",
        "بني النضير" => "السنة 4 هـ",
        "بني قينقاع" => "السنة 2 هـ",
        "فتح مكة" => "السنة 8 هـ",
        "الحديبية" => "السنة 6 هـ",
        _ => "السنة 5 هـ"
    };

    private static string GetIslamicEventForYear(int year) => year switch
    {
        1 => "الهجرة النبوية",
        2 => "غزوة بدر الكبرى",
        3 => "غزوة أحد",
        4 => "غزوة بني النضير",
        5 => "غزوة الخندق",
        6 => "صلح الحديبية",
        7 => "غزوة خيبر",
        8 => "فتح مكة",
        9 => "غزوة تبوك",
        10 => "حجة الوداع",
        11 => "وفاة النبي صلى الله عليه وسلم",
        13 => "فتح العراق والشام",
        14 => "معركة القادسية",
        15 => "فتح القدس",
        _ => ""
    };

    private static string GetTeamLeague(string team) => team switch
    {
        "ريال مدريد" or "برشلونة" or "أتلتيكو مدريد" => "الدوري الإسباني",
        "مانشستر يونايتد" or "ليفربول" or "مانشستر سيتي" or "تشيلسي" or "أرسنال" or "توتنهام" => "الدوري الإنجليزي",
        "بايرن ميونخ" or "بوروسيا دورتموند" => "الدوري الألماني",
        "يوفنتوس" or "ميلان" or "إنتر ميلان" => "الدوري الإيطالي",
        "باريس سان جيرمان" => "الدوري الفرنسي",
        "الأهلي المصري" or "الزمالك" or "الإسماعيلي" or "بيراميدز" => "الدوري المصري",
        "الهلال السعودي" or "النصر السعودي" or "الاتحاد السعودي" or "الأهلي السعودي" => "الدوري السعودي",
        "العين الإماراتي" or "الشارقة" or "الجزيرة" or "الوحدة الإماراتي" or "شباب الأهلي" => "الدوري الإماراتي",
        "الدحيل القطري" or "السد القطري" => "الدوري القطري",
        "الترجي التونسي" => "الدوري التونسي",
        "الرجاء المغربي" or "الوداد المغربي" => "الدوري المغربي",
        _ => "دوري أوروبي"
    };

    private static string GetPlayerNationality(string player) => player switch
    {
        "ليونيل ميسي" or "دييغو مارادونا" => "الأرجنتين",
        "كريستيانو رونالدو" => "البرتغال",
        "نيمار" or "بيليه" or "رونالدينيو" or "رونالدو البرازيلي" or "روماريو" or "ريفالدو" or "كاكا" => "البرازيل",
        "كيليان مبابي" or "زين الدين زيدان" or "تيري هنري" or "ثيري هنري" => "فرنسا",
        "محمد صلاح" or "حسن الشحات" => "مصر",
        "إرلينج هالاند" => "النرويج",
        "روبرت ليفاندوفسكي" => "بولندا",
        "لوكا مودريتش" => "كرواتيا",
        "كيفين دي بروين" => "بلجيكا",
        "يوهان كرويف" or "فيرجيل فان دايك" => "هولندا",
        "فرانز بيكنباور" or "جمال موسيالا" => "ألمانيا",
        "كريم بنزيما" => "فرنسا",
        "جود بيلينغهام" or "بوكايو ساكا" or "ماركوس راشفورد" or "فيل فودين" => "إنجلترا",
        "فينيسيوس جونيور" or "رودريغو" => "البرازيل",
        "أندريس إنييستا" or "تشافي هيرنانديز" or "سيرجيو راموس" or "كارلوس بويول" => "إسبانيا",
        "باولو مالديني" or "فرانكو باريزي" or "بوفون" => "إيطاليا",
        "ياشين" => "الاتحاد السوفيتي",
        "كاسياس" => "إسبانيا",
        "نوير" => "ألمانيا",
        "رياض محرز" => "الجزائر",
        "سادي ماني" => "السنغال",
        "عمر مرموش" => "مصر",
        _ => "أوروبا"
    };

    private static string GetTeamColor(string team) => team switch
    {
        "ريال مدريد" => "أبيض",
        "برشلونة" => "أزرق وأحمر",
        "مانشستر يونايتد" or "ليفربول" or "ميلان" or "بايرن ميونخ" or "الأهلي المصري" => "أحمر",
        "مانشستر سيتي" => "أزرق سماوي",
        "تشيلسي" or "إنتر ميلان" or "الهلال السعودي" => "أزرق",
        "أرسنال" => "أحمر",
        "يوفنتوس" => "أبيض وأسود",
        "باريس سان جيرمان" => "أزرق داكن",
        "الزمالك" => "أبيض",
        "النصر السعودي" => "أصفر",
        "بوروسيا دورتموند" => "أصفر",
        "توتنهام" => "أبيض",
        _ => "متعدد الألوان"
    };

    private static string GetStadiumForTeam(string team) => team switch
    {
        "ريال مدريد" => "سانتياغو برنابيو",
        "برشلونة" => "كامب نو",
        "مانشستر يونايتد" => "أولد ترافورد",
        "ليفربول" => "أنفيلد",
        "بايرن ميونخ" => "أليانز أرينا",
        "يوفنتوس" => "يوفنتوس ستاديوم",
        "باريس سان جيرمان" => "بارك دي برانس",
        "مانشستر سيتي" => "الاتحاد أرينا",
        "ميلان" or "إنتر ميلان" => "سان سيرو",
        "تشيلسي" => "ستامفورد بريدج",
        "أرسنال" => "الإمارات",
        "الأهلي المصري" => "استاد السلام",
        "الزمالك" => "استاد القاهرة",
        _ => "ملعب النادي"
    };

    private static string GetSportsAchievementForYear(int year) => year switch
    {
        2002 => "فازت البرازيل بكأس العالم للمرة الخامسة",
        2004 => "فازت اليونان ببطولة أمم أوروبا",
        2006 => "فازت إيطاليا بكأس العالم",
        2008 => "حطم يوسين بولت الرقم القياسي في 100 متر",
        2010 => "فازت إسبانيا بكأس العالم",
        2014 => "خسرت البرازيل 7-1 أمام ألمانيا",
        2016 => "فاز البرتغال ببطولة أمم أوروبا",
        2018 => "فازت فرنسا بكأس العالم",
        2022 => "فازت الأرجنتين بكأس العالم في قطر",
        _ => ""
    };

    private static int GetTimeLimit(Difficulty diff) => diff switch
    {
        Difficulty.Easy => 15,
        Difficulty.Medium => 20,
        Difficulty.Hard => 25,
        _ => 15
    };

    private static void AddQuestion(SabqDbContext context, Guid categoryId, Difficulty difficulty, int timeLimit, string questionText, string correct, string wrong1, string wrong2, string wrong3)
    {
        var q = new Question
        {
            Id = Guid.NewGuid(),
            CategoryId = categoryId,
            Difficulty = difficulty,
            TextAr = questionText,
            Slug = Guid.NewGuid().ToString(),
            TimeLimitSec = timeLimit,
            IsActive = true
        };
        context.Questions.Add(q);

        var options = new[]
        {
            new Option { Id = Guid.NewGuid(), QuestionId = q.Id, TextAr = correct, IsCorrect = true },
            new Option { Id = Guid.NewGuid(), QuestionId = q.Id, TextAr = wrong1, IsCorrect = false },
            new Option { Id = Guid.NewGuid(), QuestionId = q.Id, TextAr = wrong2, IsCorrect = false },
            new Option { Id = Guid.NewGuid(), QuestionId = q.Id, TextAr = wrong3, IsCorrect = false }
        };
        context.Options.AddRange(options);
    }
}
