using Microsoft.EntityFrameworkCore;
using Sabq.Domain.Entities;
using Sabq.Domain.Enums;

namespace Sabq.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(SabqDbContext context)
    {
        // Check if already seeded
        if (await context.Categories.AnyAsync())
            return;

        // Create Category
        var islamicCategory = new Category
        {
            Id = Guid.NewGuid(),
            NameAr = "ديني - إسلامي",
            IsActive = true
        };
        context.Categories.Add(islamicCategory);

        // Easy Questions (10)
        var easyQuestions = new[]
        {
            ("ما هو عدد الصلوات المفروضة في اليوم؟", "خمس صلوات", "ثلاث صلوات", "سبع صلوات", "أربع صلوات"),
            ("في أي شهر يصوم المسلمون؟", "رمضان", "شعبان", "رجب", "ذو الحجة"),
            ("ما هو الركن الأول من أركان الإسلام؟", "الشهادتان", "الصلاة", "الزكاة", "الحج"),
            ("كم عدد أركان الإسلام؟", "خمسة", "ستة", "أربعة", "سبعة"),
            ("ما هي القبلة التي يتوجه إليها المسلمون في الصلاة؟", "الكعبة المشرفة", "المسجد النبوي", "المسجد الأقصى", "جبل عرفات"),
            ("من هو خاتم الأنبياء والمرسلين؟", "محمد صلى الله عليه وسلم", "عيسى عليه السلام", "موسى عليه السلام", "إبراهيم عليه السلام"),
            ("كم عدد سور القرآن الكريم؟", "114 سورة", "100 سورة", "120 سورة", "99 سورة"),
            ("ما هي أطول سورة في القرآن الكريم؟", "سورة البقرة", "سورة آل عمران", "سورة النساء", "سورة الأعراف"),
            ("في أي مدينة ولد النبي محمد صلى الله عليه وسلم؟", "مكة المكرمة", "المدينة المنورة", "الطائف", "القدس"),
            ("ما هو الشهر الذي يحج فيه المسلمون؟", "ذو الحجة", "رمضان", "محرم", "شوال")
        };

        foreach (var (question, correct, wrong1, wrong2, wrong3) in easyQuestions)
        {
            var q = new Question
            {
                Id = Guid.NewGuid(),
                CategoryId = islamicCategory.Id,
                Difficulty = Difficulty.Easy,
                TextAr = question,
                TimeLimitSec = 15,
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

        // Medium Questions (10)
        var mediumQuestions = new[]
        {
            ("كم عدد أركان الإيمان؟", "ستة", "خمسة", "سبعة", "أربعة"),
            ("ما هي السورة التي تعدل ثلث القرآن؟", "سورة الإخلاص", "سورة الفاتحة", "سورة الكوثر", "سورة الناس"),
            ("من هو أول من آمن من الرجال؟", "أبو بكر الصديق", "عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب"),
            ("كم عدد أولي العزم من الرسل؟", "خمسة", "ستة", "أربعة", "سبعة"),
            ("ما هو الشهر الذي حدثت فيه غزوة بدر؟", "رمضان", "شوال", "ذو القعدة", "محرم"),
            ("كم عدد المشاهد التي شهدها النبي محمد صلى الله عليه وسلم من الغزوات والسرايا؟", "27 غزوة", "25 غزوة", "30 غزوة", "20 غزوة"),
            ("من هو أول مؤذن في الإسلام؟", "بلال بن رباح", "عمر بن الخطاب", "سعد بن أبي وقاص", "خالد بن الوليد"),
            ("كم عدد الأنبياء الذين ذكروا في القرآن الكريم؟", "25 نبياً", "20 نبياً", "30 نبياً", "15 نبياً"),
            ("ما هي السورة التي بدأت باسم ثمرتين؟", "سورة التين", "سورة النخل", "سورة الزيتون", "سورة العنب"),
            ("في أي عام هاجر النبي صلى الله عليه وسلم من مكة إلى المدينة؟", "السنة الأولى للهجرة", "السنة الثانية للهجرة", "السنة الثالثة للهجرة", "قبل الهجرة بسنة")
        };

        foreach (var (question, correct, wrong1, wrong2, wrong3) in mediumQuestions)
        {
            var q = new Question
            {
                Id = Guid.NewGuid(),
                CategoryId = islamicCategory.Id,
                Difficulty = Difficulty.Medium,
                TextAr = question,
                TimeLimitSec = 20,
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

        // Hard Questions (10)
        var hardQuestions = new[]
        {
            ("ما هي السورة التي لا تبدأ بالبسملة؟", "سورة التوبة", "سورة الفاتحة", "سورة الإخلاص", "سورة الناس"),
            ("من هو الصحابي الذي اهتز لموته عرش الرحمن؟", "سعد بن معاذ", "عمر بن الخطاب", "حمزة بن عبد المطلب", "أبو بكر الصديق"),
            ("كم عدد السور المكية في القرآن الكريم؟", "86 سورة", "28 سورة", "50 سورة", "64 سورة"),
            ("من هو الصحابي الملقب بحبر الأمة؟", "عبد الله بن عباس", "عبد الله بن مسعود", "عبد الله بن عمر", "أبو هريرة"),
            ("ما هي أقصر سورة في القرآن الكريم؟", "سورة الكوثر", "سورة الإخلاص", "سورة الفلق", "سورة النصر"),
            ("من هو النبي الذي سمي بذي النون؟", "يونس عليه السلام", "يوسف عليه السلام", "موسى عليه السلام", "نوح عليه السلام"),
            ("كم عدد آيات سورة البقرة؟", "286 آية", "200 آية", "250 آية", "300 آية"),
            ("في أي سنة هجرية كانت غزوة الخندق؟", "السنة الخامسة", "السنة الثالثة", "السنة السابعة", "السنة التاسعة"),
            ("من هو الصحابي الذي لقب بأسد الله؟", "حمزة بن عبد المطلب", "علي بن أبي طالب", "خالد بن الوليد", "عمر بن الخطاب"),
            ("ما هي السورة التي تسمى قلب القرآن؟", "سورة يس", "سورة الفاتحة", "سورة البقرة", "سورة الإخلاص")
        };

        foreach (var (question, correct, wrong1, wrong2, wrong3) in hardQuestions)
        {
            var q = new Question
            {
                Id = Guid.NewGuid(),
                CategoryId = islamicCategory.Id,
                Difficulty = Difficulty.Hard,
                TextAr = question,
                TimeLimitSec = 25,
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

        await context.SaveChangesAsync();
    }
}
