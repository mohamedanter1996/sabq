# Sabiq (سابق) - Branding Guidelines

## App Name
**Arabic:** سابق  
**Tagline:** جاوب الأول… واكسب  
**English Translation:** "Be First... and Win"

## Logo Concept
The Sabiq logo combines:
- **Arabic Text:** Bold "سابق" text representing the app name
- **Lightning/Speed Icon:** Symbolizes speed, quick thinking, and being first
- **Colors:** Dark Blue (#1E3A8A) and Gold (#F59E0B) for premium feel

## Color Palette

### Primary Colors
- **Dark Blue:** `#1E3A8A` - Trust, intelligence, knowledge
- **Gold/Amber:** `#F59E0B` - Success, achievement, winning

### Secondary Colors
- **Emerald Green:** `#10B981` - Correct answers, success
- **Red:** `#EF4444` - Incorrect answers, warnings

### Neutral Colors
- **Background:** `#F9FAFB` - Light gray
- **Surface:** `#FFFFFF` - White
- **Text Primary:** `#1F2937` - Dark gray
- **Text Secondary:** `#6B7280` - Medium gray

## Typography

### Logo Font (Ruq'ah Calligraphy)
**Aref Ruqaa** (Google Fonts)
- Traditional Arabic Ruq'ah calligraphy style
- Used for logo text "سابق"
- Bold weight for maximum impact
- Authentic handwritten calligraphic feel

### Usage
```css
font-family: 'Aref Ruqaa', serif;
```

### Body Font
**Cairo** (Google Fonts)
- Regular weight for body text
- Bold weight for headings and emphasis
- Excellent Arabic support with proper letter joining
- Modern, clean, and highly readable

**Alternative:** Tajawal

### Usage
```css
font-family: 'Cairo', sans-serif;
```

## App Icon Guidelines

### Android Adaptive Icon
1. **Foreground Layer:** Lightning icon in Gold (#F59E0B)
2. **Background Layer:** Dark Blue (#1E3A8A) solid color
3. **Size:** 432x432px with 108px safe zone

### iOS App Icon
1. **Size:** 1024x1024px
2. **Design:** Lightning icon centered on blue background with "سابق" text below
3. **Corner Radius:** iOS applies automatically

### Generation Steps
1. Create 1024x1024px PNG version of sabq-logo.svg
2. Use online tool like [AppIcon.co](https://appicon.co) to generate all sizes
3. For MAUI, place icons in `Resources/AppIcon/`

## Splash Screen

### Design
- **Background:** Dark Blue (#1E3A8A)
- **Logo:** Lightning icon + "سابق" text in white
- **Tagline:** "جاوب الأول… واكسب" in Gold (#F59E0B)
- **Loading Indicator:** White spinner below tagline

### Implementation
- MAUI: Use `Resources/Splash/splash.svg`
- Angular Web: CSS-based splash in index.html with animation

## UI Component Colors

### Buttons
- **Primary Action:** Dark Blue (#1E3A8A)
- **Secondary Action:** Gold (#F59E0B)
- **Success/Positive:** Green (#10B981)
- **Destructive:** Red (#EF4444)

### Game Elements
- **Correct Answer Feedback:** Green (#10B981) background
- **Wrong Answer Feedback:** Red (#EF4444) background
- **Selected Option:** Gray (#9CA3AF) background
- **Timer:** Gold (#F59E0B) for urgency

## Brand Voice
- **Exciting:** Emphasize competition and winning
- **Inclusive:** Welcoming to all knowledge levels
- **Arabic-First:** All content in Arabic, RTL layout
- **Energetic:** Fast-paced, engaging, reward-focused

## Usage Examples

### Good ✅
- Large, bold Arabic text
- Lightning/speed iconography
- Blue and gold color scheme
- RTL layouts
- Clear hierarchy

### Avoid ❌
- English-first design
- Slow/static imagery
- Muddy or washed-out colors
- LTR layouts for Arabic content
- Complex icons that don't scale

## File Locations
- **Logo SVG:** `/assets/sabq-logo.svg`
- **Favicon:** `/assets/favicon.svg`
- **App Icons:** Generated from logo, placed in respective platform folders
- **Fonts:** Google Fonts CDN or downloaded to project

---

**Created:** February 2026  
**Version:** 1.0
