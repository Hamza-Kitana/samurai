using Microsoft.EntityFrameworkCore;
using SamuraiRealm.Api.Entities;

namespace SamuraiRealm.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        var categories = new[]
        {
            new Category { Id = "c-maps", Slug = "maps", NameAr = "مابات", NameEn = "Maps" },
            new Category { Id = "c-scripts", Slug = "scripts", NameAr = "سكربتات", NameEn = "Scripts" },
            new Category { Id = "c-clothing", Slug = "clothing", NameAr = "ملابس", NameEn = "Clothing" },
            new Category { Id = "c-vehicles", Slug = "vehicles", NameAr = "سيارات", NameEn = "Vehicles" },
        };
        db.Categories.AddRange(categories);

        var mapInstallAr = new[]
        {
            "حمّل ملف الماب بعد الشراء من حسابك",
            "ضع المجلد داخل resources في سيرفرك",
            "أضف ensure اسم-المورد في server.cfg",
            "أعد تشغيل السيرفر وتأكد أن الماب يظهر بدون أخطاء",
        };
        var mapInstallEn = new[]
        {
            "Download the map file from your account after purchase",
            "Place the folder inside your server resources",
            "Add ensure resource-name to server.cfg",
            "Restart the server and confirm the map loads cleanly",
        };
        var scriptInstallAr = new[]
        {
            "حمّل السكربت من صفحة التحميلات في حسابك",
            "ضع المجلد داخل resources",
            "عدّل ملف config.lua حسب فريموورك سيرفرك (ESX / QBCore)",
            "أضف ensure اسم-السكربت في server.cfg ثم أعد التشغيل",
        };
        var scriptInstallEn = new[]
        {
            "Download the script from your account downloads",
            "Place the folder inside resources",
            "Edit config.lua for your framework (ESX / QBCore)",
            "Add ensure script-name to server.cfg and restart",
        };

        var products = new List<Product>
        {
            SeedProduct("p1", "yakuza-casino", "كازينو الياكوزا", "Yakuza Casino", "maps", 49, "/images/p-casino.png", true,
                ["تصميم داخلي كامل", "إضاءة RTX واقعية", "محسّن للأداء (FPS)", "تركيب سهل بدقيقتين"],
                ["Full custom interior", "Realistic lighting", "FPS optimized", "2-minute install"],
                mapInstallAr, mapInstallEn, "2026-01-01"),
            SeedProduct("p2", "samurai-dojo", "دوجو الساموراي", "Samurai Dojo", "maps", 39, "/images/p-dojo.png", true,
                ["أشجار ساكورا متحركة", "مؤثرات صوتية محيطة", "مناسب لعصابات الرول بلاي"],
                ["Animated sakura", "Ambient sounds", "Great for gang RP"],
                mapInstallAr, mapInstallEn, "2026-01-02"),
            SeedProduct("p3", "neon-drift-garage", "كراج نيون درفت", "Neon Drift Garage", "maps", 34, "/images/p-garage.png", false,
                ["رافعات متحركة", "نيون قابل للتخصيص", "يدعم أنظمة التعديل الشهيرة"],
                ["Animated lifts", "Custom neon", "Works with popular tuner scripts"],
                mapInstallAr, mapInstallEn, "2026-01-03"),
            SeedProduct("p4", "advanced-heist", "سكربت السرقات المتقدم", "Advanced Heist Script", "scripts", 59, "/images/p-heist.png", true,
                ["يدعم ESX و QBCore", "مهام متعددة المراحل", "إعدادات كاملة في config", "تحديثات مجانية"],
                ["ESX & QBCore", "Multi-stage missions", "Full config", "Free updates"],
                scriptInstallAr, scriptInstallEn, "2026-01-04"),
            SeedProduct("p5", "hud-samurai", "واجهة HUD ساموراي", "Samurai HUD", "scripts", 19, "/images/p-hud.png", false,
                ["استهلاك موارد منخفض", "قابل للتخصيص بالكامل", "أنيميشن ناعم"],
                ["Low resource usage", "Fully customizable", "Smooth animations"],
                scriptInstallAr, scriptInstallEn, "2026-01-05"),
            SeedProduct("p6", "anticheat-shield", "درع مكافحة الغش", "AntiCheat Shield", "scripts", 45, "/images/p-anticheat.png", false,
                ["كشف فوري", "سجلات ديسكورد", "تحديث مستمر"],
                ["Instant detection", "Discord logs", "Constant updates"],
                scriptInstallAr, scriptInstallEn, "2026-01-06"),
            SeedProduct("p7", "samurai-outfit-pack", "باقة ملابس ساموراي", "Samurai Outfit Pack", "clothing", 29, "/images/p-outfit.png", true,
                ["60 قطعة", "للرجال والنساء", "جودة 4K"],
                ["60 pieces", "Male & female", "4K quality"],
                mapInstallAr, mapInstallEn, "2026-01-07"),
            SeedProduct("p8", "street-wear-pack", "باقة ستريت وير", "Street Wear Pack", "clothing", 24, "/images/p-street.png", false,
                ["هوديز وجاكيتات", "أحذية حصرية", "تركيب سهل"],
                ["Hoodies & jackets", "Exclusive sneakers", "Easy install"],
                mapInstallAr, mapInstallEn, "2026-01-08"),
            SeedProduct("p9", "jdm-car-pack", "باقة سيارات JDM", "JDM Car Pack", "vehicles", 54, "/images/p-jdm.png", true,
                ["10 سيارات", "أصوات محركات حقيقية", "دعم كامل للتعديل"],
                ["10 cars", "Real engine sounds", "Full tuning support"],
                mapInstallAr, mapInstallEn, "2026-01-09"),
            SeedProduct("p10", "police-fleet", "أسطول الشرطة", "Police Fleet", "vehicles", 44, "/images/p-police.png", false,
                ["إضاءة ELS", "ستيكرات قابلة للت customization", "تفاصيل داخلية"],
                ["ELS lighting", "Custom liveries", "Full interiors"],
                mapInstallAr, mapInstallEn, "2026-01-10"),
            SeedProduct("p11", "discord-bot-link", "ربط ديسكورد", "Discord Link System", "scripts", 22, "/images/p-discord.png", false,
                ["أدوار تلقائية", "صلاحيات حسب الرتبة", "إعداد سريع"],
                ["Auto roles", "Rank permissions", "Quick setup"],
                scriptInstallAr, scriptInstallEn, "2026-01-11"),
            SeedProduct("p12", "night-market", "ماب السوق الليلي", "Night Market", "maps", 37, "/images/p-market.png", false,
                ["أكشاك مضيئة", "حشود متحركة", "أجواء مطر"],
                ["Glowing stalls", "Animated crowds", "Rain ambience"],
                mapInstallAr, mapInstallEn, "2026-01-12"),
        };

        db.Products.AddRange(products);

        foreach (var p in products)
        {
            db.ProductFiles.Add(new ProductFile
            {
                Id = $"f-{p.Id}",
                ProductId = p.Id,
                FileName = $"{p.Slug}.zip",
                FileUrl = $"#download-{p.Slug}",
            });
        }

        db.Users.Add(new User
        {
            Id = "admin-1",
            Email = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("222"),
            DisplayName = "Admin",
            Role = "admin",
            Provider = "local",
        });

        await db.SaveChangesAsync();
    }

    private static Product SeedProduct(
        string id,
        string slug,
        string titleAr,
        string titleEn,
        string category,
        decimal price,
        string imageUrl,
        bool featured,
        string[] featuresAr,
        string[] featuresEn,
        string[] installAr,
        string[] installEn,
        string createdAt)
    {
        var images = imageUrl.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
            ? new List<string> { imageUrl, imageUrl.Replace(".png", ".jpg", StringComparison.OrdinalIgnoreCase) }
            : new List<string> { imageUrl };

        return new Product
        {
            Id = id,
            Slug = slug,
            TitleAr = titleAr,
            TitleEn = titleEn,
            ShortAr = titleAr,
            ShortEn = titleEn,
            DescriptionAr = titleAr,
            DescriptionEn = titleEn,
            CategorySlug = category,
            Price = price,
            ImageUrl = imageUrl,
            ImagesJson = JsonHelper.ToJson(images),
            FeaturesArJson = JsonHelper.ToJson(featuresAr),
            FeaturesEnJson = JsonHelper.ToJson(featuresEn),
            InstallArJson = JsonHelper.ToJson(installAr),
            InstallEnJson = JsonHelper.ToJson(installEn),
            IsFeatured = featured,
            IsActive = true,
            CreatedAt = DateTime.Parse(createdAt).ToUniversalTime(),
        };
    }
}
