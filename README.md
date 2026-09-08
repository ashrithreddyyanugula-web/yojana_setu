# SchemeSetu (Yojana Setu) - AI Gov-FinTech Platform

Imported from Google Stitch project **"SIH YS"** (`projects/5219321416303187681`).

SchemeSetu is an AI-powered multilingual platform connecting marginalized micro-entrepreneurs, street vendors, rural women leaders, and artisans with sovereign government schemes, subsidized loans, and direct benefits (such as PMEGP, PM SVANidhi, PM Vishwakarma, and Mudra).

---

## 📁 Repository Structure

```
SIH yojana setu/
├── index.html                   # Primary entry point (SchemeSetu with Live Ticker & AI Assist FAB)
├── DESIGN.md                    # Complete Design System tokens & guidelines
├── stitch_project.json          # Stitch project definition & theme parameters
├── screens.json                 # Screen instances & metadata
├── README.md                    # Project documentation
│
├── screens/                     # Imported screen variants
│   ├── scheme-setu-ai-fab.html  # Flagship version with Persistent Scheme AI Assist FAB
│   ├── scheme-setu-ticker.html # Version with Live Scheme Ticker
│   ├── scheme-setu-base.html    # Full-length base responsive layout
│   └── scheme-setu-compact.html # Compact desktop layout (1280x1024)
│
├── assets/                      # Vector & image assets
│   ├── logo.svg                 # Official SchemeSetu vector badge
│   ├── logo_screenshot.png      # Logo preview image
│   ├── yojana_setu_header_logo.png # High-res portal header branding
│   ├── user_avatar.png          # Verified profile avatar (Sunita Devi)
│   ├── success_story_entrepreneur.png # Beneficiary spotlight photo
│   ├── entrepreneur_headshot.png # Entrepreneur woman headshot
│   └── reference_inspiration.png # UI reference design
│
└── screenshots/                 # High-resolution screen captures
    ├── scheme-setu-ai-fab.png
    ├── scheme-setu-ticker.png
    └── scheme-setu-base.png
```

---

## 🎨 Design System & Highlights

- **Theme Name**: `SchemeSetu Sovereign FinTech`
- **Color Mode**: Light mode with high-contrast sovereign palette (WCAG AAA compliant)
  - **Primary**: Sovereign Indigo (`#3525CD` / `#4F46E5`)
  - **Secondary**: Affirmative Emerald (`#006C49` / `#10B981`)
  - **Tertiary**: Sovereign Saffron (`#F59E0B` / `#684000`)
  - **Surface & Canvas**: `#F9F9FF` / `#FFFFFF`
- **Typography**:
  - Headings & Metrics: **Plus Jakarta Sans** (weights 600, 700, 800)
  - Body, Metadata & Multilingual Text: **Inter** (supports Indic script heights)
- **Key Modules**:
  1. **Top Sovereign Ambient Ribbon**: Live scheme ticker, accessibility font sizing, contrast toggle.
  2. **Navigation Column**: Direct access to Home, Schemes & Eligibility, AI Saathi Copilot, GIS Locator, Document Intelligence, Application Journey, and Success Stories.
  3. **Hero Hub**: Primary search bar, voice query trigger ("Bolkar Poochhein" in 22 languages), instant metric strip.
  4. **Core Bento Grid Dashboard**: Filterable scheme discovery, verified eligibility badges, subsidy meters, and instant application pathways.
  5. **Persistent Scheme AI Assist FAB**: Floating multilingual copilot accessible from any scroll position.

---

## 🚀 Running Locally

Open `index.html` in any browser or launch a local web server:

```bash
# Python
python3 -m http.server 3000

# Node.js
npx serve .
```

Then visit `http://localhost:3000` to view the platform.
