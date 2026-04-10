
# Design System – KI Recruiting Automation Platform

## Designsprache
Editorial, modern, minimal. Inspiriert von Studio-Ästhetik.
Typografie-geführt mit klarer Hierarchie. Warme Neutraltöne mit Terrakotta-Akzent.

---

## Farben (Tailwind Config)

```js
colors: {
  // Primär – Terrakotta/Burnt Orange
  "primary":                    "#9a442d",
  "primary-dim":                "#8b3923",
  "primary-container":          "#ffdbd2",
  "primary-fixed":              "#ffdbd2",
  "primary-fixed-dim":          "#ffc8ba",
  "on-primary":                 "#fff6f4",
  "on-primary-container":       "#8a3822",
  "on-primary-fixed":           "#722612",
  "on-primary-fixed-variant":   "#97412b",
  "inverse-primary":            "#f68b6f",

  // Sekundär – Warm Gray
  "secondary":                  "#5e5f5f",
  "secondary-dim":              "#525353",
  "secondary-container":        "#e3e2e2",
  "secondary-fixed":            "#e3e2e2",
  "secondary-fixed-dim":        "#d5d4d4",
  "on-secondary":               "#faf8f8",
  "on-secondary-container":     "#515252",
  "on-secondary-fixed":         "#3f3f40",
  "on-secondary-fixed-variant": "#5b5b5c",

  // Tertiär – Dusty Rose
  "tertiary":                   "#7b555c",
  "tertiary-dim":               "#6e4951",
  "tertiary-container":         "#fdcad3",
  "tertiary-fixed":             "#fdcad3",
  "tertiary-fixed-dim":         "#eebdc6",
  "on-tertiary":                "#fff7f7",
  "on-tertiary-container":      "#654148",
  "on-tertiary-fixed":          "#4f2f36",
  "on-tertiary-fixed-variant":  "#6f4a52",

  // Error
  "error":                      "#9f403d",
  "error-dim":                  "#4e0309",
  "error-container":            "#fe8983",
  "on-error":                   "#fff7f6",
  "on-error-container":         "#752121",

  // Surface (Hintergrund-Hierarchie)
  "background":                 "#f9f9f8",
  "surface":                    "#f9f9f8",
  "surface-bright":             "#f9f9f8",
  "surface-dim":                "#d4dcda",
  "surface-tint":               "#9a442d",
  "surface-variant":            "#dde4e3",
  "surface-container-lowest":   "#ffffff",
  "surface-container-low":      "#f2f4f3",
  "surface-container":          "#ebeeed",
  "surface-container-high":     "#e4e9e8",
  "surface-container-highest":  "#dde4e3",

  // On-Surface
  "on-surface":                 "#2d3433",
  "on-surface-variant":         "#5a6060",
  "on-background":              "#2d3433",

  // Outline
  "outline":                    "#757c7b",
  "outline-variant":            "#adb3b2",

  // Inverse
  "inverse-surface":            "#0c0f0e",
  "inverse-on-surface":         "#9c9d9c",
}
```

---

## Typografie

```js
fontFamily: {
  "headline": ["Newsreader", "serif"],   // Große Überschriften, kursiv, editorial
  "body":     ["Manrope", "sans-serif"], // Fließtext, UI-Text
  "label":    ["Manrope", "sans-serif"], // Chips, Tags, Buttons – uppercase + tracking
}
```

### Verwendung
| Element           | Klasse                                              |
|-------------------|-----------------------------------------------------|
| Hero Headline     | `font-headline text-5xl md:text-7xl italic leading-none` |
| Card Titel (groß) | `font-headline text-4xl`                            |
| Card Titel (mittel)| `font-headline text-2xl`                           |
| Body Text         | `font-body text-base text-on-surface-variant`       |
| Labels / Chips    | `font-label text-xs font-bold uppercase tracking-widest` |
| Button Text       | `font-label text-xs font-bold uppercase tracking-widest` |

---

## Border Radius

```js
borderRadius: {
  DEFAULT: "0.25rem",  // 4px  – kleine Elemente
  lg:      "1rem",     // 16px – Cards
  xl:      "1.5rem",   // 24px – große Cards, Modals
  full:    "9999px",   // Chips, Avatare, FAB
}
```

---

## Schatten (Cards)

```css
shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]
```
Sanfter, tiefer Schatten – nicht zu stark, wirkt schwebend.

---

## Hintergrund-Dekoration

```css
/* Grid Pattern – subtil, fixed position */
.grid-pattern {
  background-image:
    linear-gradient(to right, #adb3b2 1px, transparent 1px),
    linear-gradient(to bottom, #adb3b2 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.08;
}
```
```html
<div class="fixed inset-0 grid-pattern pointer-events-none z-0"></div>
```

---

## Komponenten

### TopAppBar
```html
<header class="w-full sticky top-0 z-40 bg-surface">
  <div class="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
    <!-- Logo: Newsreader, italic, semibold -->
    <h1 class="font-headline text-2xl italic font-semibold">AppName</h1>
    <!-- Nav links: label uppercase tracking-widest -->
    <!-- Active: text-primary, Inaktiv: text-on-surface/60 -->
    <!-- Avatar: w-10 h-10 rounded-full -->
  </div>
</header>
```

### Editorial Header (Seitenheader)
```html
<div class="mb-16 max-w-3xl">
  <h2 class="font-headline text-5xl md:text-7xl italic leading-none mb-6">
    Headline <br/>Text
  </h2>
  <p class="font-body text-lg text-on-surface-variant leading-relaxed">
    Beschreibung
  </p>
</div>
```

### Filter Chips
```html
<!-- Aktiv -->
<span class="px-6 py-2 rounded-full bg-primary-container text-on-primary-container font-label text-xs font-bold uppercase tracking-widest">
  Aktiv
</span>
<!-- Inaktiv -->
<span class="px-6 py-2 rounded-full bg-surface-container-highest text-on-surface-variant font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors cursor-pointer">
  Inaktiv
</span>
```

### Status Badge
```html
<!-- In Progress -->
<span class="text-xs font-label font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary-container/30">
  In Progress
</span>
<!-- Review / On Hold -->
<span class="text-[10px] font-label font-bold uppercase tracking-widest text-secondary">
  Review
</span>
```

### Bento Grid Layout
```html
<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
  <!-- Große Karte: 8 Spalten -->
  <div class="md:col-span-8 ..."></div>
  <!-- Kleine Karte: 4 Spalten -->
  <div class="md:col-span-4 ..."></div>
  <!-- Mittlere Karte: 4 Spalten -->
  <div class="md:col-span-4 ..."></div>
  <!-- Breite Karte: 8 Spalten -->
  <div class="md:col-span-8 ..."></div>
</div>
```

### Card (Standard)
```html
<div class="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between min-h-[400px] shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] group hover:bg-surface-bright transition-all">
  <!-- Header: Status Badge + Menu Icon -->
  <!-- Content: font-headline für Titel -->
  <!-- Footer: Avatare + Meta-Info -->
</div>
```

### Progress Bar
```html
<div class="w-full bg-outline-variant/20 h-1 rounded-full">
  <div class="bg-primary h-full rounded-full" style="width: 75%"></div>
</div>
<div class="flex justify-between text-[10px] font-label font-bold uppercase tracking-widest text-outline mt-2">
  <span>75% Complete</span>
  <span>12 Tasks</span>
</div>
```

### Avatar Stack
```html
<div class="flex -space-x-3">
  <div class="w-10 h-10 rounded-full border-2 border-surface-container-lowest overflow-hidden">
    <img src="..." />
  </div>
  <!-- Overflow Indicator -->
  <div class="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-secondary-container flex items-center justify-center text-[10px] font-bold">
    +4
  </div>
</div>
```

### Button (Primary)
```html
<button class="bg-primary text-on-primary px-6 py-2 rounded-xl text-xs font-label font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
  Button Text
</button>
```

### FAB (Floating Action Button)
```html
<button class="fixed bottom-24 right-8 md:bottom-12 md:right-12 bg-primary text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40 group">
  <span class="material-symbols-outlined text-3xl">add</span>
  <!-- Tooltip -->
  <span class="absolute right-full mr-4 bg-on-surface text-surface px-4 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
    Tooltip Text
  </span>
</button>
```

### Bottom Navigation (Mobile)
```html
<nav class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0_-12px_32px_-4px_rgba(45,52,51,0.06)] z-50 rounded-t-3xl">
  <!-- Aktiver Tab -->
  <a class="flex flex-col items-center bg-primary-container text-primary rounded-full px-5 py-2">
    <span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">icon</span>
    <span class="font-label text-[10px] font-bold uppercase tracking-widest">Label</span>
  </a>
  <!-- Inaktiver Tab -->
  <a class="flex flex-col items-center text-on-surface/60 py-2">
    <span class="material-symbols-outlined mb-1">icon</span>
    <span class="font-label text-[10px] font-bold uppercase tracking-widest">Label</span>
  </a>
</nav>
```

---

## Icons

[Material Symbols Outlined](https://fonts.google.com/icons)

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
/* Filled Variante: */
style="font-variation-settings: 'FILL' 1;"
```

---

## Interaktionen

| Zustand        | Effekt                                      |
|----------------|---------------------------------------------|
| Card hover     | `hover:bg-surface-bright` oder `hover:bg-surface-container-lowest` |
| Card hover (editorial) | `group-hover:italic` auf dem Titel  |
| Button hover   | `hover:bg-primary-dim`                      |
| FAB press      | `active:scale-90`                           |
| Nav link hover | `hover:text-primary transition-all`         |
| Chip hover     | `hover:bg-surface-container-high`           |
| Alle           | `transition-all` oder `transition-colors`   |

---

## Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet"/>
```

---

## Tailwind Config (komplett)

```js
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: { /* siehe oben */ },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Newsreader", "serif"],
        body:     ["Manrope", "sans-serif"],
        label:    ["Manrope", "sans-serif"],
      },
    },
  },
}
```

---

## Anwendung im KI Recruiting Tool

| Screen            | Komponente                              |
|-------------------|-----------------------------------------|
| Dashboard         | Bento Grid mit KPI-Karten               |
| Firmen-Liste      | Standard Cards (8+4 Col)                |
| Bewerber-Pipeline | Kanban mit Status Badges                |
| Funnel-Editor     | Wide Card (8 Col) mit Preview           |
| Login             | Zentriert, Editorial Header             |
| Navigation        | TopAppBar + Bottom Nav (Mobile)         |
| Aktionen          | FAB für "Neuen Bewerber", "Neuen Job"   |
