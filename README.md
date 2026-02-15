# سابق (Sabiq) - Real-Time Arabic Quiz Platform

**جاوب الأول… واكسب** (Be First... and Win)

A production-ready, real-time multiplayer Arabic quiz platform built with .NET 9, MAUI, and Angular.

## 📱 Platforms

- **Mobile:** .NET MAUI (Android + Windows)
- **Web:** Angular 19 SPA with SSR support
- **Backend:** ASP.NET Core 9 Web API + SignalR

## 🎯 Core Features

- **Real-Time Multiplayer:** SignalR-powered live game rooms
- **Arabic-First:** Fully RTL with Arabic questions and UI
- **Server Authoritative:** Secure, server-side scoring with "first correct answer" detection
- **Guest Authentication:** Simple JWT-based login
- **Room System:** Create/join rooms with custom settings
- **Live Leaderboard:** Real-time score updates
- **Religious Category:** 30 Islamic questions (Easy/Medium/Hard)
- **Persistent History:** SQL Server for questions and game results
- **Flexible State:** In-Memory or Redis for room state

### 🌐 SEO & AdSense Ready
- **Legal Pages:** Privacy Policy, Terms & Conditions, About Us
- **Contact Form:** Backend-stored messages with validation
- **Questions Library:** SEO-optimized browseable questions with pagination
- **Dynamic Meta Tags:** OpenGraph, Twitter Cards for social sharing
- **JSON-LD Structured Data:** Rich snippets for search engines
- **Sitemap.xml:** Auto-generated sitemap for crawlers
- **robots.txt:** Search engine crawling directives
- **SSR Support:** Angular Server-Side Rendering ready

### 🎨 Modern UI
- **Polished Header:** Gradient design with animated logo, responsive mobile menu
- **Rich Footer:** Social media links, quick navigation, legal links
- **Social Media:** Twitter/X, Facebook, Instagram, YouTube icons
- **Game Mode:** Clean fullscreen experience (header/footer hidden during gameplay)

---

## 📋 Prerequisites

### Required
- **.NET 9 SDK:** [Download](https://dotnet.microsoft.com/download/dotnet/9.0)
- **SQL Server:** LocalDB (included with Visual Studio) or SQL Server Express
- **Node.js 18+:** [Download](https://nodejs.org/) (for Angular web client)
- **Visual Studio 2022** or **VS Code**

### Optional
- **Redis:** For distributed room state (optional, falls back to in-memory)
- **Android SDK:** For MAUI Android development
- **Windows 10/11 SDK:** For MAUI Windows development

---

## 🚀 Quick Start Guide

### 1️⃣ Clone and Restore

```powershell
cd d:\sabba
dotnet restore Sabq.sln
```

### 2️⃣ Setup Database

#### Option A: Using Package Manager Console in Visual Studio
```powershell
# Navigate to API project
cd src\Sabq.Api

# Create migration
dotnet ef migrations add InitialCreate --project ..\Sabq.Infrastructure\Sabq.Infrastructure.csproj --startup-project .\Sabq.Api.csproj

# Update database
dotnet ef database update --project ..\Sabq.Infrastructure\Sabq.Infrastructure.csproj --startup-project .\Sabq.Api.csproj
```

#### Option B: Using .NET CLI
```powershell
# Install EF Core tools globally if not already installed
dotnet tool install --global dotnet-ef

# From the solution root
cd src\Sabq.Api
dotnet ef migrations add InitialCreate --project ..\Sabq.Infrastructure
dotnet ef database update --project ..\Sabq.Infrastructure
```

**Database Connection String** (default in appsettings.json):
```json
"Server=(localdb)\\mssqllocaldb;Database=SabqDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
```

### 3️⃣ Run the API

```powershell
cd src\Sabq.Api
dotnet run
```

API will be available at:
- **HTTP:** http://localhost:5213
- **Swagger UI:** http://localhost:5213/swagger
- **SignalR Hub:** http://localhost:5213/hubs/sabq

The database will be automatically seeded with:
- 1 Category: "ديني - إسلامي"
- 30 Questions (10 Easy, 10 Medium, 10 Hard)
- 4 Options per question

### 4️⃣ Run MAUI Mobile App

#### Android
```powershell
cd src\Sabq.Mobile
dotnet build -t:Run -f net9.0-android
```

Or in Visual Studio:
1. Set `Sabq.Mobile` as startup project
2. Select Android Emulator or device
3. Press F5

**Note:** Android emulator uses `http://10.0.2.2:5213` to access localhost

#### Windows
```powershell
cd src\Sabq.Mobile
dotnet build -t:Run -f net9.0-windows10.0.19041.0
```

Or in Visual Studio:
1. Set `Sabq.Mobile` as startup project
2. Select "Windows Machine"
3. Press F5

### 5️⃣ Run Angular Web Client

```powershell
cd src\Sabq.Web

# Install dependencies (first time only)
npm install

# Start dev server
npm start
```

Web app will be available at: http://localhost:4200

#### SSR Build (Production)
```powershell
npm run build
# Output in dist/sabq-web/browser (client) and dist/sabq-web/server (SSR)
```

---

## 🏗️ Solution Structure

```
Sabq/
├── src/
│   ├── Sabq.Domain/              # Entities, Enums
│   ├── Sabq.Shared/              # DTOs, SignalR events
│   ├── Sabq.Infrastructure/      # EF Core, DbContext, RoomStore
│   ├── Sabq.Application/         # Services, Business Logic
│   ├── Sabq.Api/                 # Web API, SignalR Hub, Controllers
│   ├── Sabq.Mobile/              # MAUI (Android + Windows)
│   ├── Sabq.Web/                 # Angular 19 SPA with SSR
│   └── Sabq.Tests/               # Unit Tests (xUnit)
├── assets/                       # Branding assets
├── scripts/                      # SQL scripts
├── Sabq.sln
├── README.md
└── BRANDING.md
```

---

## 🎮 How to Play

### For Host (Room Creator)
1. **Login** as guest with display name
2. **Create Room** with settings:
   - Category (e.g., "ديني - إسلامي")
   - Difficulty levels (Easy/Medium/Hard)
   - Number of questions (5-50)
3. **Share room code** with other players
4. **Start game** when ready

### For Players
1. **Login** as guest with display name
2. **Join room** using 6-character code
3. **Wait in lobby** for host to start
4. **Answer questions** as fast as possible
5. **First correct answer** gets +1 point
6. **Wrong answers** get -1 point

### Game Flow
1. **Lobby:** Players join and wait
2. **Game Start:** Questions begin automatically
3. **Each Question:** 
   - Timer counts down
   - Submit answer (one attempt only)
   - First correct answer ends question immediately
   - Leaderboard updates live
4. **Results:** Final leaderboard shown

---

## ⚙️ Configuration

### API Settings (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SabqDb;...",
    "Redis": ""  // Optional: "localhost:6379"
  },
  "Jwt": {
    "Secret": "YOUR_SECRET_KEY_HERE",
    "Issuer": "SabqApi",
    "Audience": "SabqClients"
  }
}
```

### CORS Configuration
Default CORS allows:
- http://localhost:4200
- http://localhost:4201
- http://localhost:4202

To add more origins, edit `Program.cs`:
```csharp
policy.WithOrigins(
    "http://localhost:4200",
    "https://your-production-domain.com"
)
```

### Redis Setup (Optional)
If you want distributed room state:

1. Install Redis:
   - Windows: Use [Memurai](https://www.memurai.com/) or Docker
   - Linux/Mac: `brew install redis` or `apt-get install redis`

2. Update appsettings.json:
   ```json
   "ConnectionStrings": {
     "Redis": "localhost:6379"
   }
   ```

3. Restart API - Redis will be used automatically

---

## 🔐 Authentication

### JWT Flow
1. Client calls `POST /api/auth/guest` with display name
2. Server creates Player entity and returns JWT token
3. Client stores token and includes in:
   - HTTP requests: `Authorization: Bearer {token}`
   - SignalR connection: `accessTokenFactory` option

### Token Expiration
- Default: 7 days
- Refresh: Re-login required (guest flow is quick)

---

## 🧪 Testing the System

### Unit Tests
```powershell
cd src\Sabq.Tests
dotnet test
```

Tests cover:
- Archive service
- Game history service  
- Contact service validation
- DTO validation

### Manual Test Scenario
1. **Start API:** `dotnet run` in Sabq.Api (runs on port 5213)
2. **Start Web Client:** `npm start` in Sabq.Web (runs on port 4200)
3. **Open browser tab 1:** Login as "Player1", create room
4. **Open browser tab 2:** Login as "Player2", join with room code
5. **Player1:** Start game
6. **Both players:** Answer questions
7. **Verify:** First correct answer gets point, wrong answer loses point
8. **Check:** Live leaderboard updates
9. **Finish:** View results screen

### Test with Mobile
1. Run Android emulator
2. Run MAUI app
3. Login and join room created from web
4. Play together across platforms

---

## 📊 Database Schema

### Main Tables
- **Categories:** Question categories
- **Questions:** Question text, difficulty, time limit
- **Options:** Answer options (one marked as correct)
- **Players:** Guest player accounts
- **GameRooms:** Room metadata and settings
- **GameRoomPlayers:** Player scores in rooms
- **GameRoomQuestions:** Questions assigned to rooms
- **GameAnswers:** Answer history with timestamps

### Indexes
- `GameRooms.Code` (UNIQUE)
- `Questions.CategoryId, IsActive`
- `GameAnswers.RoomId, QuestionId, PlayerId`

---

## 🎨 Branding & Design

See [BRANDING.md](./BRANDING.md) for:
- Logo SVG files
- Color palette
- Typography (Cairo font)
- App icon generation
- UI guidelines

### Quick Reference
- **Primary Color:** #1E3A8A (Dark Blue)
- **Secondary Color:** #F59E0B (Gold)
- **Success:** #10B981 (Green)
- **Error:** #EF4444 (Red)
- **Fonts:** Cairo (sans-serif), Aref Ruqaa (Arabic calligraphy)

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/guest` - Guest login with display name

### Game
- `GET /api/rooms` - List available rooms
- `POST /api/rooms` - Create new room
- `GET /api/game-history` - Get player's game history

### SEO & Content
- `GET /api/questions/seo` - Paginated questions for SEO pages
- `GET /api/questions/seo/{categorySlug}` - Questions by category
- `GET /api/questions/seo/{categorySlug}/{questionSlug}` - Single question detail
- `GET /api/seo/sitemap.xml` - Auto-generated sitemap
- `GET /api/seo/robots.txt` - Robots directives

### Contact
- `POST /api/contact` - Submit contact form message

---

## 🐛 Troubleshooting

### "Database cannot be created" error
**Solution:** Update connection string in appsettings.json to point to your SQL Server instance.

### "Unable to connect to localhost:5213" from Android emulator
**Solution:** Emulator uses `10.0.2.2` instead of `localhost`. Already configured in ApiService.

### SignalR connection fails
**Solution:** 
1. Check CORS settings in Program.cs
2. Verify JWT token is being sent
3. Check browser console for errors

### MAUI build fails
**Solution:**
1. Ensure .NET 9 SDK is installed
2. For Android: Install Android SDK via Visual Studio Installer
3. For Windows: Install Windows SDK 10.0.19041.0+

### Angular errors on npm start
**Solution:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check Node.js version (must be 18+)

### Questions not appearing
**Solution:** Check that database seeding completed successfully. Look for "Categories" table with data.

---

## 🚢 Production Deployment

### API Deployment
1. **Update appsettings.Production.json:**
   - Production database connection string
   - Redis connection (recommended for multi-instance)
   - Strong JWT secret (256+ bits)
   - Update CORS origins

2. **Publish:**
   ```powershell
   dotnet publish src/Sabq.Api -c Release -o ./publish
   ```

3. **Deploy to:**
   - Azure App Service
   - AWS Elastic Beanstalk
   - Docker container
   - IIS

### Web Client Deployment
```powershell
cd src/Sabq.Web
npm run build
```

Deploy `dist/sabq-web` to:
- Azure Static Web Apps
- Netlify
- Vercel
- Any static hosting

**Update API URL** in `api.service.ts` and `realtime.service.ts` to production endpoint.

### Mobile App Deployment

#### Android
1. **Generate keystore:**
   ```powershell
   keytool -genkeypair -v -keystore sabq.keystore -alias sabq -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Build release:**
   ```powershell
   dotnet publish -f net9.0-android -c Release
   ```

3. **Sign and upload to Google Play**

#### Windows
1. **Build MSIX package:**
   ```powershell
   dotnet publish -f net9.0-windows10.0.19041.0 -c Release
   ```

2. **Submit to Microsoft Store**

---

## 📝 Adding More Questions

### Via Database (SQL Server Management Studio)
```sql
-- Add a new category
INSERT INTO Categories (Id, NameAr, IsActive)
VALUES (NEWID(), 'تاريخ', 1);

-- Add a question
DECLARE @CategoryId UNIQUEIDENTIFIER = (SELECT Id FROM Categories WHERE NameAr = 'تاريخ');
DECLARE @QuestionId UNIQUEIDENTIFIER = NEWID();

INSERT INTO Questions (Id, CategoryId, Difficulty, TextAr, TimeLimitSec, IsActive)
VALUES (@QuestionId, @CategoryId, 2, 'من هو أول خليفة عباسي؟', 20, 1);

-- Add options
INSERT INTO Options (Id, QuestionId, TextAr, IsCorrect)
VALUES 
  (NEWID(), @QuestionId, 'أبو العباس السفاح', 1),
  (NEWID(), @QuestionId, 'أبو جعفر المنصور', 0),
  (NEWID(), @QuestionId, 'هارون الرشيد', 0),
  (NEWID(), @QuestionId, 'المأمون', 0);
```

### Via Code (Update DbSeeder.cs)
Add more question tuples in `DbSeeder.cs` and re-run migrations.

---

## 🤝 Contributing

### Code Style
- Use C# conventions for .NET code
- Use Angular style guide for TypeScript
- RTL-first for all UI
- Arabic strings for user-facing text

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update README if needed
5. Submit PR with description

---

## 📄 License

This project is provided as-is for educational and commercial use.

---

## 🙋 Support

For issues or questions:
1. Check troubleshooting section above
2. Review [BRANDING.md](./BRANDING.md) for design questions
3. Open an issue on GitHub

---

## 🎉 Acknowledgments

- **SignalR** for real-time functionality
- **MAUI** for cross-platform mobile
- **Angular** for modern web UI
- **Cairo Font** for beautiful Arabic typography

---

**Built with ❤️ for the Arabic-speaking community**

**Current Version:** 1.1.0  
**Last Updated:** February 2026

---

## 🗺️ Web Routes

### Main Application
- `/login` - Guest login page
- `/home` - Home/dashboard after login
- `/lobby/:code` - Game lobby (waiting room)
- `/game/:code` - Active game (header/footer hidden)
- `/results/:code` - Game results

### SEO & Legal Pages
- `/questions` - Questions library (paginated)
- `/questions/:category` - Questions by category
- `/questions/:category/:slug` - Single question detail
- `/privacy-policy` - Privacy policy page
- `/terms-and-conditions` - Terms of service
- `/about` - About us page
- `/contact` - Contact form
