# Development Notes for Sabq

## Common Development Tasks

### Database Migrations

**Add new migration:**
```powershell
cd src\Sabq.Api
dotnet ef migrations add MigrationName --project ..\Sabq.Infrastructure
```

**Update database:**
```powershell
dotnet ef database update --project ..\Sabq.Infrastructure
```

**Rollback migration:**
```powershell
dotnet ef database update PreviousMigrationName --project ..\Sabq.Infrastructure
```

**Remove last migration:**
```powershell
dotnet ef migrations remove --project ..\Sabq.Infrastructure
```

### Running Multiple Projects

**Terminal 1 - API:**
```powershell
cd src\Sabq.Api
dotnet watch run
```

**Terminal 2 - Web:**
```powershell
cd src\Sabq.Web
npm start
```

**Terminal 3 - Mobile (optional):**
```powershell
cd src\Sabq.Mobile
dotnet build -t:Run -f net9.0-android
```

### Testing SignalR Locally

Use browser console:
```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5000/hubs/sabq", {
        accessTokenFactory: () => "YOUR_JWT_TOKEN"
    })
    .build();

await connection.start();
await connection.invoke("JoinRoom", "ABC123");
```

## Architecture Decisions

### Why SignalR?
- Real-time bidirectional communication
- Automatic reconnection
- Multiple transport fallbacks (WebSockets, Server-Sent Events, Long Polling)
- Built-in support for groups (rooms)

### Why In-Memory + Redis Option?
- **Development:** In-Memory is fast and requires no setup
- **Production:** Redis provides distributed state for multiple API instances
- **Interface-based:** Easy to swap implementations

### Why JWT for Guest Auth?
- Stateless authentication
- Works seamlessly with SignalR
- No session management needed
- Easy to implement and secure

### Why MAUI Instead of Xamarin?
- Modern, actively maintained
- Better performance
- Simplified project structure
- .NET 9 support

### Why Angular Standalone Components?
- Modern Angular architecture
- Reduced boilerplate
- Better tree-shaking
- Simpler dependency injection

## Performance Considerations

### Server-Side
- **SemaphoreSlim** prevents race conditions on answer submission
- **Database indexes** on frequently queried columns
- **AsNoTracking()** for read-only queries (can be added for optimization)
- **SignalR Groups** for efficient room-based broadcasting

### Client-Side
- **RxJS BehaviorSubject** for lightweight state management
- **OnPush change detection** can be added to Angular components
- **MVVM pattern** in MAUI for separation of concerns
- **async/await** throughout for non-blocking operations

## Security Notes

### Current Implementation
- ✅ JWT authentication
- ✅ HTTPS in production (configure in hosting)
- ✅ Server authoritative scoring
- ✅ Input validation on API endpoints
- ✅ CORS configured for known origins

### Production Hardening
- [ ] Rate limiting on API endpoints
- [ ] Additional request validation
- [ ] Secrets management (Azure Key Vault, AWS Secrets Manager)
- [ ] SQL injection protection (already using EF Core parameterized queries)
- [ ] XSS protection (already using framework defaults)

## Future Enhancements

### Feature Ideas
- [ ] Friend system / player profiles
- [ ] Private rooms with passwords
- [ ] Custom question packs
- [ ] Achievements and badges
- [ ] In-game chat
- [ ] Replay/spectator mode
- [ ] Multiple language support
- [ ] Team-based games
- [ ] Tournament brackets
- [ ] Power-ups and special abilities

### Technical Improvements
- [ ] Azure SignalR Service for scale
- [ ] Cosmos DB for global distribution
- [ ] Azure App Insights for monitoring
- [ ] Unit and integration tests
- [ ] CI/CD pipeline (GitHub Actions, Azure DevOps)
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] GraphQL API layer

## Debugging Tips

### API Not Starting
1. Check port 5000 is not in use: `netstat -ano | findstr :5000`
2. Kill process if needed: `taskkill /PID <PID> /F`
3. Check SQL Server is running

### MAUI Build Issues
1. Clean solution: `dotnet clean`
2. Restore packages: `dotnet restore`
3. Rebuild: `dotnet build`
4. Check SDK version: `dotnet --list-sdks`

### SignalR Connection Issues
1. Check browser console for errors
2. Verify JWT token is valid (decode at jwt.io)
3. Check CORS settings match client origin
4. Enable detailed SignalR logging in browser:
   ```javascript
   .configureLogging(signalR.LogLevel.Debug)
   ```

### Database Issues
1. Verify connection string
2. Check SQL Server is running
3. Recreate database: 
   ```powershell
   dotnet ef database drop
   dotnet ef database update
   ```

## Code Organization Best Practices

### Adding a New Feature
1. **Domain:** Add entities/enums if needed
2. **Shared:** Add DTOs for API contracts
3. **Infrastructure:** Add repository/data access if needed
4. **Application:** Add service with business logic
5. **API:** Add controller endpoint and/or SignalR hub method
6. **Clients:** Add API calls and UI

### Naming Conventions
- **Entities:** Singular (e.g., `Question`, not `Questions`)
- **DTOs:** Suffix with `Dto`, `Request`, `Response`, or `Event`
- **Services:** Suffix with `Service`
- **ViewModels:** Suffix with `ViewModel`
- **Components:** Descriptive names (e.g., `LoginComponent`)

## Useful Commands

### .NET
```powershell
# List all projects
dotnet sln list

# Add project to solution
dotnet sln add src\ProjectName\ProjectName.csproj

# List outdated packages
dotnet list package --outdated

# Update packages
dotnet add package PackageName
```

### Angular
```powershell
# Generate component
ng generate component components/component-name --standalone

# Generate service
ng generate service services/service-name

# Build for production
npm run build

# Analyze bundle size
npm install -g webpack-bundle-analyzer
ng build --stats-json
webpack-bundle-analyzer dist/sabq-web/stats.json
```

### Git
```powershell
# Initial commit
git init
git add .
git commit -m "Initial commit: Complete Sabq platform"

# Create branch
git checkout -b feature/feature-name

# Push to remote
git remote add origin https://github.com/username/sabq.git
git push -u origin main
```

---

**Last Updated:** February 2026
