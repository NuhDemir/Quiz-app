# CSS Refactoring Roadmap

> **Proje:** Quiz-app Frontend Style Architecture  
> **Başlangıç:** 8 Ekim 2025  
> **Amaç:** Modüler, maintainable ve scalable CSS mimarisi oluşturmak

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Mevcut Durum](#mevcut-durum)
3. [Hedef Mimari](#hedef-mimari)
4. [Aşamalar](#aşamalar)
5. [İlerleme Takibi](#ilerleme-takibi)

---

## Genel Bakış

### Problem

- `global.css` dosyası 5700+ satır
- Monolitik CSS yapısı
- Tekrarlanan stil kuralları
- Responsive düzenlemeler standardize değil
- Kullanılmayan stil bloklarının varlığı
- Dark mode duplicate'leri

### Çözüm

- Modüler CSS mimarisi (Base → Layout → Components → Pages → Utilities)
- CSS Variables ile tema yönetimi
- BEM naming convention
- Mobile-first responsive yaklaşım
- CSS @layer ile cascade yönetimi
- Performans optimizasyonu

---

## Mevcut Durum

### ✅ Tamamlanan Yapı

```
frontend/src/style/
├── base/
│   ├── reset.css         ✅ [CSS reset kuralları]
│   ├── theme.css         ✅ [CSS variables - colors, spacing]
│   └── typography.css    ✅ [Font tanımları, text styles]
├── layout/
│   └── structure.css     ✅ [Layout wrapper, container, grid]
├── components/
│   ├── buttons.css       ✅ [Buton varyantları]
│   ├── chips.css         ✅ [Chip/badge bileşenleri]
│   ├── cards.css         ✅ [Card yapıları]
│   ├── drawers.css       ✅ [Drawer/sidebar]
│   ├── forms.css         ✅ [Form elemanları]
│   └── tabs.css          ✅ [Tab navigasyon]
├── pages/
│   └── stats.css         ✅ [İstatistik sayfası]
└── global.css            🔄 [5700+ satır - refactor gerekli]
```

### ⚠️ Sorunlar

1. **Vocabulary bölümü** (~1500 satır) hala global.css'te
2. **Quiz bölümü** (~800 satır) hala global.css'te
3. **Admin bölümü** (~1200 satır) hala global.css'te
4. **Auth, Profile, Leaderboard** stilleri dağınık
5. **Animasyonlar** inline tanımlı
6. **CSS Variables** eksik (border-radius, shadows, transitions)
7. **Responsive breakpoints** hard-coded
8. **@layer** yapısı kurulmamış

---

## Hedef Mimari

### 🎯 Final Structure

```
frontend/src/style/
├── base/                    [Foundation Layer]
│   ├── reset.css
│   ├── theme.css            [Genişletilecek]
│   ├── typography.css
│   └── animations.css       [YENİ]
│
├── layout/                  [Layout Layer]
│   ├── structure.css
│   ├── grid.css             [YENİ - Gelişmiş grid systems]
│   └── containers.css       [YENİ - Container queries]
│
├── components/              [Component Layer]
│   ├── buttons.css
│   ├── chips.css
│   ├── cards.css
│   ├── drawers.css
│   ├── forms.css
│   ├── tabs.css
│   ├── modals.css           [YENİ]
│   ├── panels.css           [YENİ]
│   ├── badges.css           [YENİ]
│   └── tooltips.css         [YENİ]
│
├── pages/                   [Page Layer]
│   ├── vocabulary.css       [YENİ - 1500+ satır]
│   ├── quiz.css             [YENİ - 800+ satır]
│   ├── grammar.css          [YENİ]
│   ├── admin.css            [YENİ - 1200+ satır]
│   ├── auth.css             [YENİ]
│   ├── profile.css          [YENİ]
│   ├── leaderboard.css      [YENİ]
│   ├── settings.css         [YENİ]
│   ├── home.css             [YENİ]
│   ├── categories.css       [YENİ]
│   └── stats.css            ✅
│
├── utilities/               [Utility Layer]
│   ├── animations.css       [YENİ - @keyframes]
│   ├── transitions.css      [YENİ]
│   └── helpers.css          [YENİ - Utility classes]
│
└── index.css                [Import orchestrator with @layer]
```

---

## Aşamalar

## 🎯 AŞAMA 1: Pages Modüllerinin Oluşturulması

### 1.1 Vocabulary Sayfası Stilleri

**Durum:** 🔄 Devam Ediyor  
**Dosya:** `pages/vocabulary.css`  
**Tahmini Süre:** 3-4 saat

#### Taşınacak Bölümler:

```css
/* global.css satır ~14-1500 arası */

1. Vocabulary Layout & Hero (satır 17-140)
   - .vocabulary-page
   - .vocabulary-header
   - .vocabulary-header__content
   - .vocabulary-header__intro
   - .vocabulary-hero-stats
   - .vocabulary-hero-stats__grid
   - .vocabulary-hero-stat

2. Vocabulary Content & Sections (satır 140-280)
   - .vocabulary-content
   - .vocabulary-content__grid
   - .vocabulary-content__main
   - .vocabulary-content__sidebar
   - .vocabulary-section
   - .vocabulary-panel

3. Vocabulary HUD & Stats (satır 280-450)
   - .vocabulary-hud
   - .vocabulary-hud__header
   - .vocabulary-hud__pills
   - .vocabulary-hud__stats
   - .vocabulary-hud__card
   - .vocabulary-hud__icon (variants)
   - .vocabulary-hud__progress-grid

4. Vocabulary Replay System (satır 450-600)
   - .vocabulary-replay
   - .vocabulary-replay__header
   - .vocabulary-replay__history
   - .vocabulary-replay__history-item
   - .vocabulary-replay__card
   - .vocabulary-replay__controls

5. Vocabulary Panel Components (satır 600-850)
   - .vocabulary-panel__section
   - .vocabulary-panel__stats
   - .vocabulary-panel__filters
   - .vocabulary-filter-chip
   - .vocabulary-panel__placeholder

6. Vocabulary Grid & Cards (satır 850-950)
   - .vocabulary-grid
   - .vocabulary-card
   - .vocabulary-card__header
   - .vocabulary-card__footer

7. Word Hunt Game (satır 950-1200)
   - .vocabulary-word-hunt
   - .vocabulary-word-hunt__hud
   - .vocabulary-word-hunt__toolbar
   - .vocabulary-word-hunt__board
   - .vocabulary-word-hunt__row
   - .vocabulary-word-hunt__cell (states)
   - .vocabulary-word-hunt__words
   - .vocabulary-word-hunt__word-list
   - .vocabulary-word-hunt__progress

8. Speed Challenge Game (satır 1200-1350)
   - .vocabulary-speed-challenge
   - .vocabulary-speed-challenge__hud
   - .vocabulary-speed-challenge__stats
   - .vocabulary-speed-challenge__card
   - .vocabulary-speed-challenge__options

9. Review System (satır 1350-1500)
   - .vocabulary-review
   - .vocabulary-review__hud
   - .vocabulary-review__chip
   - .vocabulary-review__progress
   - .vocabulary-review__ratings
   - .review-rating-button (variants)

10. FlashCards (satır 1500-1650)
    - .vocabulary-flashcard
    - .vocabulary-flashcard__body
    - .vocabulary-flashcard__front
    - .vocabulary-flashcard__back
    - .vocabulary-flashcard__examples

11. Category Management (satır 1650-1900)
    - .vocabulary-category-list
    - .vocabulary-categories-panel
    - .vocabulary-category-inline
    - .vocabulary-category-sheet
    - .vocabulary-admin

12. Responsive Adjustments (satır 1900-2000)
    - Mobile breakpoints (@media max-width: 640px)
    - Tablet breakpoints (@media max-width: 960px)
```

#### Yapılacaklar:

- [ ] `pages/vocabulary.css` dosyası oluştur
- [ ] Yukarıdaki tüm bölümleri taşı
- [ ] Dark mode stillerini birleştir
- [ ] Responsive breakpoints'leri CSS variables'a çevir
- [ ] BEM naming convention uygula
- [ ] Word Hunt board için mobile optimizasyon
- [ ] `global.css`'te import ekle
- [ ] Browser test (Chrome, Firefox, Safari)

---

### 1.2 Quiz Sayfası Stilleri

**Durum:** ⏳ Bekliyor  
**Dosya:** `pages/quiz.css`  
**Tahmini Süre:** 2-3 saat

#### Taşınacak Bölümler:

```css
/* global.css satır ~3100-3900 arası */

1. Quiz Container & Layout (satır 3100-3200)
   - .quiz-page
   - .quiz-page--centered
   - .quiz-spinner
   - .quiz-header

2. Quiz Question Components (satır 3200-3400)
   - .quiz-question
   - .quiz-question__header
   - .quiz-question__title
   - .quiz-question__media
   - .quiz-flag

3. Quiz Options & Interactions (satır 3400-3600)
   - .quiz-options
   - .quiz-option (states: selected, correct, incorrect)
   - .quiz-option__label
   - .quiz-option__status
   - .quiz-question__explanation

4. Quiz Progress & Footer (satır 3600-3750)
   - .quiz-footer
   - .quiz-footer__progress
   - .quiz-footer__progress-bar
   - .quiz-footer__actions
   - .quiz-footer__meta

5. Quiz Results Screen (satır 3750-3900)
   - .quiz-results
   - .quiz-results__icon
   - .quiz-results__stats
   - .quiz-results__stat (variants)
   - .quiz-results__actions
   - .quiz-results__details

6. Quiz Error & Empty States
   - .quiz-error
   - .quiz-empty
   - .quiz-page__overlay
```

#### Yapılacaklar:

- [ ] `pages/quiz.css` dosyası oluştur
- [ ] Bölümleri global.css'ten taşı
- [ ] Option button states'i refactor et
- [ ] Progress bar animasyonunu optimize et
- [ ] Mobile layout düzenle (question + options stack)
- [ ] Touch-friendly button sizes (min 44px)
- [ ] `global.css`'te import ekle
- [ ] Quiz flow test (start → questions → results)

---

### 1.3 Admin Panel Stilleri

**Durum:** ⏳ Bekliyor  
**Dosya:** `pages/admin.css`  
**Tahmini Süre:** 3-4 saat

#### Taşınacak Bölümler:

```css
/* global.css satır ~3900-5100 arası */

1. Admin Shell & Layout (satır 3900-4000)
   - .admin-shell
   - .admin-sidebar
   - .admin-sidebar__header
   - .admin-logo
   - .admin-nav

2. Admin Main Content (satır 4000-4100)
   - .admin-main
   - .admin-header
   - .admin-header__actions
   - .admin-user-chip
   - .admin-content

3. Admin Cards & Sections (satır 4100-4200)
   - .admin-card
   - .admin-card__header
   - .admin-card__actions
   - .admin-toolbar
   - .admin-alert (variants)

4. Admin Tables (satır 4200-4400)
   - .admin-table-wrapper
   - .admin-table
   - .admin-table__title
   - .admin-table__actions
   - .admin-table__empty
   - .admin-status (variants)
   - .admin-pagination

5. Admin Forms (satır 4400-4700)
   - .admin-form
   - .admin-field
   - .admin-field-grid
   - .admin-toggle
   - .admin-form__error
   - .admin-question-list
   - .admin-options

6. Quiz Import System (satır 4700-5000)
   - .quiz-import
   - .quiz-import__actions
   - .quiz-import__upload
   - .quiz-import__textarea
   - .quiz-import__summary
   - .quiz-import__questions
   - .quiz-import__options

7. Admin Utilities (satır 5000-5100)
   - .admin-button--danger
   - .admin-quiz-manager
   - .admin-login
   - .metric-card
```

#### Yapılacaklar:

- [ ] `pages/admin.css` dosyası oluştur
- [ ] Admin layout responsive yap
- [ ] Table → Card view transformation (mobile)
- [ ] Filter panel collapsible yap
- [ ] CSV import UI optimize et
- [ ] Touch-friendly controls
- [ ] `global.css`'te import ekle
- [ ] Admin flow test (table, filters, import)

---

### 1.4 Auth Sayfası Stilleri

**Durum:** ⏳ Bekliyor  
**Dosya:** `pages/auth.css`  
**Tahmini Süre:** 1-2 saat

#### Taşınacak Bölümler:

```css
/* global.css satır ~5100-5400 arası */

1. Auth Page Layout (satır 5100-5200)
   - .auth-page
   - .auth-page--accent
   - .auth-hero

2. Auth Card Components (satır 5200-5300)
   - .auth-card
   - .auth-card__header
   - .auth-card__footer
   - .auth-badge

3. Auth Forms (satır 5300-5400)
   - .auth-form
   - .auth-field
   - .auth-field__label
   - .auth-submit
   - .auth-alert (variants)
   - .auth-inline-link
```

#### Yapılacaklar:

- [ ] `pages/auth.css` dosyası oluştur
- [ ] Login/Register form stilleri taşı
- [ ] Social button styles
- [ ] Password toggle visibility
- [ ] Mobile layout düzenle
- [ ] `global.css`'te import ekle
- [ ] Auth flow test (login, register, reset)

---

### 1.5 Diğer Sayfa Stilleri

**Durum:** ⏳ Bekliyor  
**Tahmini Süre:** 4-5 saat

#### 1.5.1 Settings Page (`pages/settings.css`)

```css
/* global.css satır ~5100-5250 arası */
- .settings-page
- .settings-header
- .settings-grid
- .settings-card
- .switch (toggle component)
- .settings-meta-inline
```

#### 1.5.2 Profile Page (`pages/profile.css`)

```css
/* global.css satır ~5650-5950 arası */
- .profile-page
- .profile-hero
- .profile-metric-grid
- .profile-section
- .profile-badge-grid
- .profile-activity
```

#### 1.5.3 Leaderboard Page (`pages/leaderboard.css`)

```css
/* global.css satır ~5950-6150 arası */
- .leaderboard-page
- .leaderboard-podium
- .leaderboard-podium__card (gold, silver, bronze)
- .leaderboard-table-wrapper
- .leaderboard-table
```

#### 1.5.4 Home Page (`pages/home.css`)

```css
/* global.css satır ~5450-5550 arası */
- .home-page
- .home-header
- .stats-grid
- .stats-card
- .home-actions
```

#### 1.5.5 Categories Page (`pages/categories.css`)

```css
/* global.css satır ~5550-5850 arası */
- .categories-page
- .categories-header
- .category-grid
- .category-card
- .level-grid
- .category-summary-grid
- .vocabulary-stat-card
```

#### Yapılacaklar:

- [ ] Her sayfa için ayrı CSS dosyası oluştur
- [ ] Ortak pattern'leri tespit et
- [ ] Utility class'lara taşınabilecekleri ayır
- [ ] Responsive düzenlemeleri uygula
- [ ] `global.css`'te import'ları ekle
- [ ] Her sayfa için smoke test

---

## 🎯 AŞAMA 2: Component Modüllerinin Genişletilmesi

### 2.1 Yeni Component Dosyaları

#### `components/modals.css`

```css
.modal-overlay {
}
.modal-content {
}
.modal-header {
}
.modal-body {
}
.modal-footer {
}
.modal--sm {
}
.modal--md {
}
.modal--lg {
}
```

#### `components/panels.css`

```css
.panel {
}
.panel-header {
}
.panel-content {
}
.panel-footer {
}
.glass-panel {
}
.surface-panel {
}
```

#### `components/badges.css`

```css
.badge {
}
.badge--sm {
}
.badge--md {
}
.badge--lg {
}
.badge--success {
}
.badge--warning {
}
.badge--error {
}
.difficulty-badge {
}
```

#### `components/tooltips.css`

```css
.tooltip {
}
.tooltip-trigger {
}
.tooltip-content {
}
.tooltip--top {
}
.tooltip--bottom {
}
.tooltip--left {
}
.tooltip--right {
}
```

#### Yapılacaklar:

- [ ] Her component dosyasını oluştur
- [ ] Global.css'ten ilgili stilleri taşı
- [ ] BEM naming uygula
- [ ] Variants tanımla
- [ ] Dark mode stilleri ekle
- [ ] `global.css`'te import ekle

---

## 🎯 AŞAMA 3: Base Layer Genişletmesi

### 3.1 Animations Dosyası

**Dosya:** `base/animations.css`

#### Taşınacak @keyframes:

```css
/* global.css'ten tüm @keyframes tanımları */

@keyframes spin {
}
@keyframes fadeIn {
}
@keyframes slideInUp {
}
@keyframes slideInDown {
}
@keyframes pulse {
}
@keyframes shake {
}
@keyframes bounce {
}
@keyframes glow {
}
@keyframes shimmer {
}
@keyframes vocabulary-sheet-in {
}
@keyframes skeleton-shimmer {
}
```

#### Yapılacaklar:

- [ ] `base/animations.css` oluştur
- [ ] Tüm @keyframes'leri taşı
- [ ] Kullanılmayanları tespit et ve sil
- [ ] Animation helper classes ekle:
  ```css
  .animate-fade-in {
    animation: fadeIn 0.3s ease;
  }
  .animate-slide-up {
    animation: slideInUp 0.4s ease;
  }
  ```
- [ ] `global.css`'te import ekle

---

### 3.2 Theme Variables Genişletmesi

**Dosya:** `base/theme.css`

#### Eklenecek CSS Variables:

```css
:root {
  /* Border Radius Tokens */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadow Tokens */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

  /* Transition Tokens */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slowest: 500ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-Index Scale */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-notification: 1080;

  /* Breakpoints (for JS access) */
  --bp-xs: 375px;
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --bp-2xl: 1536px;

  /* Spacing Scale (if missing) */
  --spacing-px: 1px;
  --spacing-0: 0;
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-5: 1.25rem; /* 20px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-10: 2.5rem; /* 40px */
  --spacing-12: 3rem; /* 48px */
  --spacing-16: 4rem; /* 64px */
  --spacing-20: 5rem; /* 80px */
  --spacing-24: 6rem; /* 96px */
}

/* Dark Mode Overrides */
.dark {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.7);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.8);
}
```

#### Yapılacaklar:

- [ ] `theme.css`'e yeni variables ekle
- [ ] Global.css'teki hard-coded değerleri bul:

  ```bash
  # Border-radius
  grep -r "border-radius: [0-9]" frontend/src/style/global.css

  # Box-shadow
  grep -r "box-shadow: " frontend/src/style/global.css

  # Transition
  grep -r "transition: " frontend/src/style/global.css
  ```

- [ ] Hard-coded değerleri `var(--*)` ile değiştir
- [ ] Test: Theme değişikliklerinin tüm componentlere yansımasını kontrol et

---

### 3.3 Typography Scale Genişletmesi

**Dosya:** `base/typography.css`

#### Fluid Typography Ekle:

```css
:root {
  /* Fluid Typography */
  --text-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.4vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.3rem + 0.8vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.6rem + 1vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.9rem + 1.4vw, 3rem);

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}
```

#### Yapılacaklar:

- [ ] Fluid typography ekle
- [ ] Heading utility classes oluştur
- [ ] Text utility classes oluştur
- [ ] Responsive font-size'ları test et

---

## 🎯 AŞAMA 4: Utilities Layer

### 4.1 Responsive Utilities

**Dosya:** `utilities/responsive.css`

```css
/* Container Queries */
@container (min-width: 400px) {
  .container-md\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Breakpoint Utilities */
@media (min-width: 640px) {
  .sm\:block {
    display: block;
  }
  .sm\:flex {
    display: flex;
  }
  .sm\:grid {
    display: grid;
  }
  .sm\:hidden {
    display: none;
  }
}

@media (min-width: 768px) {
  .md\:block {
    display: block;
  }
  .md\:flex {
    display: flex;
  }
  .md\:grid {
    display: grid;
  }
  .md\:hidden {
    display: none;
  }
}

@media (min-width: 1024px) {
  .lg\:block {
    display: block;
  }
  .lg\:flex {
    display: flex;
  }
  .lg\:grid {
    display: grid;
  }
  .lg\:hidden {
    display: none;
  }
}
```

### 4.2 Helper Utilities

**Dosya:** `utilities/helpers.css`

```css
/* Glass Effect */
.glass-effect {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

/* Text Utilities */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Elevation */
.elevation-0 {
  box-shadow: none;
}
.elevation-1 {
  box-shadow: var(--shadow-sm);
}
.elevation-2 {
  box-shadow: var(--shadow-md);
}
.elevation-3 {
  box-shadow: var(--shadow-lg);
}
.elevation-4 {
  box-shadow: var(--shadow-xl);
}

/* Blur */
.blur-sm {
  backdrop-filter: blur(4px);
}
.blur-md {
  backdrop-filter: blur(8px);
}
.blur-lg {
  backdrop-filter: blur(16px);
}
```

---

## 🎯 AŞAMA 5: CSS @layer Yapısı

### 5.1 Index.css Refactor

**Dosya:** `frontend/src/style/index.css`

```css
/* Define layer order */
@layer reset, theme, layout, components, pages, utilities;

/* Base Layer */
@import "./base/reset.css" layer(reset);
@import "./base/theme.css" layer(theme);
@import "./base/typography.css" layer(theme);
@import "./base/animations.css" layer(theme);

/* Layout Layer */
@import "./layout/structure.css" layer(layout);
@import "./layout/grid.css" layer(layout);

/* Component Layer */
@import "./components/buttons.css" layer(components);
@import "./components/chips.css" layer(components);
@import "./components/cards.css" layer(components);
@import "./components/drawers.css" layer(components);
@import "./components/forms.css" layer(components);
@import "./components/tabs.css" layer(components);
@import "./components/modals.css" layer(components);
@import "./components/panels.css" layer(components);
@import "./components/badges.css" layer(components);
@import "./components/tooltips.css" layer(components);

/* Page Layer */
@import "./pages/vocabulary.css" layer(pages);
@import "./pages/quiz.css" layer(pages);
@import "./pages/grammar.css" layer(pages);
@import "./pages/admin.css" layer(pages);
@import "./pages/auth.css" layer(pages);
@import "./pages/profile.css" layer(pages);
@import "./pages/leaderboard.css" layer(pages);
@import "./pages/settings.css" layer(pages);
@import "./pages/home.css" layer(pages);
@import "./pages/categories.css" layer(pages);
@import "./pages/stats.css" layer(pages);

/* Utility Layer */
@import "./utilities/responsive.css" layer(utilities);
@import "./utilities/helpers.css" layer(utilities);
```

### 5.2 Global.css Temizleme

#### Yapılacaklar:

- [ ] Tüm stil bloklarını ilgili modüllere taşı
- [ ] `global.css`'i sadece import orchestrator olarak kullan
- [ ] Font import'u `global.css`'te kalabilir
- [ ] Genel HTML reset kuralları `base/reset.css`'te olmalı

**Final global.css:**

```css
/* Google Fonts */
@import url("https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;900&display=swap");

/* Main stylesheet - imports handled by index.css */
/* This file is now a legacy entry point */
/* Use index.css for module-based imports */
```

---

## 🎯 AŞAMA 6: Component Refactoring (JS/JSX)

### 6.1 Class Name Utility Setup

```bash
npm install clsx
```

**Dosya:** `frontend/src/utils/cn.js`

```javascript
import clsx from "clsx";

export const cn = (...inputs) => {
  return clsx(inputs);
};
```

### 6.2 Component-Specific Refactors

#### VocabularyLayout.jsx

```jsx
import { cn } from '@/utils/cn';

// Before
<div className="vocabulary-hero">

// After
<div className={cn('vocab-hero', isActive && 'vocab-hero--active')}>
```

#### WordHunt.jsx

```jsx
const getCellClasses = (cell) => cn(
  'wh-cell',
  cell.isSelected && 'wh-cell--selected',
  cell.isPartOfWord && 'wh-cell--correct',
  cell.isInvalid && 'wh-cell--invalid'
);

<button className={getCellClasses(cell)}>
```

#### QuizGame.jsx

```jsx
const getOptionClasses = (option) =>
  cn(
    "quiz-option",
    option.id === selectedId && "quiz-option--selected",
    option.id === correctId && "quiz-option--correct",
    showFeedback && option.id !== correctId && "quiz-option--incorrect"
  );
```

### 6.3 Theme Context Integration

**Dosya:** `frontend/src/contexts/ThemeContext.jsx`

```javascript
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
```

---

## 🎯 AŞAMA 7: Cleanup & Optimization

### 7.1 Unused Styles Detection

#### Script Çalıştır:

```bash
# Tüm CSS class'larını listele
grep -roh "class=\"[^\"]*\"" frontend/src/components/ | \
  sed 's/class="//g' | sed 's/"//g' | \
  tr ' ' '\n' | sort | uniq > used-classes.txt

# CSS'teki class tanımlarını listele
grep -roh "^\.[a-zA-Z0-9_-]*" frontend/src/style/ | \
  sed 's/^\.//g' | sort | uniq > defined-classes.txt

# Unused'ları bul
comm -13 used-classes.txt defined-classes.txt > unused-classes.txt
```

#### Manuel Kontrol:

- [ ] `.glass-effect` kullanımı var mı?
- [ ] `.list-stagger` kullanımı var mı?
- [ ] `.surface-card--elevated` gereksiz mi?
- [ ] `.chip--ghost` dark mode'da duplicate var mı?

### 7.2 Dark Mode Consolidation

#### Before:

```css
.chip {
  /* light styles */
}
.dark .chip {
  /* dark styles */
}
.chip--primary {
  /* light styles */
}
.dark .chip--primary {
  /* dark styles */
}
```

#### After:

```css
.chip {
  background: var(--chip-bg);
  color: var(--chip-color);
}

:root {
  --chip-bg: rgba(0, 0, 0, 0.1);
  --chip-color: #000;
}

.dark {
  --chip-bg: rgba(255, 255, 255, 0.1);
  --chip-color: #fff;
}
```

### 7.3 Performance Optimization

#### Bundle Size Check:

```bash
npm run build
ls -lh dist/assets/*.css
```

**Target:** < 100KB (before gzip)

#### CSS Purging (Production):

```bash
npm install -D @fullhuman/postcss-purgecss
```

**postcss.config.js:**

```javascript
module.exports = {
  plugins: [
    require("tailwindcss"),
    require("autoprefixer"),
    process.env.NODE_ENV === "production" &&
      require("@fullhuman/postcss-purgecss")({
        content: ["./src/**/*.jsx", "./src/**/*.js"],
        safelist: [/^wh-cell/, /^quiz-option/, /^vocab-/],
      }),
  ].filter(Boolean),
};
```

---

## 🎯 AŞAMA 8: Testing & Validation

### 8.1 Automated Tests

#### Stylelint Setup:

```bash
npm install --save-dev stylelint stylelint-config-standard
```

**.stylelintrc.json:**

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      {
        "message": "Class names must follow BEM convention"
      }
    ],
    "max-nesting-depth": 3,
    "selector-max-specificity": "0,4,0"
  }
}
```

**package.json:**

```json
{
  "scripts": {
    "lint:css": "stylelint 'src/style/**/*.css'",
    "lint:css:fix": "stylelint 'src/style/**/*.css' --fix",
    "test:css": "npm run lint:css"
  }
}
```

### 8.2 Browser Testing Matrix

| Page       | Chrome | Firefox | Safari | Edge | Chrome Android | Safari iOS |
| ---------- | ------ | ------- | ------ | ---- | -------------- | ---------- |
| Vocabulary | ⏳     | ⏳      | ⏳     | ⏳   | ⏳             | ⏳         |
| Word Hunt  | ⏳     | ⏳      | ⏳     | ⏳   | ⏳             | ⏳         |
| Quiz       | ⏳     | ⏳      | ⏳     | ⏳   | ⏳             | ⏳         |
| Admin      | ⏳     | ⏳      | ⏳     | ⏳   | ⏳             | ⏳         |
| Stats      | ⏳     | ⏳      | ⏳     | ⏳   | ⏳             | ⏳         |
| Auth       | ⏳     | ⏳      | ⏳     | ⏳   | ⏳             | ⏳         |

### 8.3 Critical User Flow Tests

#### 1. Registration → Vocabulary → Word Hunt

- [ ] Register form görünüyor
- [ ] Submit çalışıyor
- [ ] Redirect to vocabulary
- [ ] Category tabs çalışıyor
- [ ] Word Hunt board render oluyor
- [ ] Cell selection çalışıyor
- [ ] Word discovery animation çalışıyor
- [ ] Results screen görünüyor

#### 2. Quiz Flow

- [ ] Quiz list görünüyor
- [ ] Quiz start çalışıyor
- [ ] Questions load oluyor
- [ ] Option selection çalışıyor
- [ ] Feedback görünüyor
- [ ] Progress bar güncelleniyor
- [ ] Results screen doğru

#### 3. Admin Import

- [ ] File upload çalışıyor
- [ ] Preview görünüyor
- [ ] Import başlıyor
- [ ] Progress bar çalışıyor
- [ ] Success message görünüyor

### 8.4 Lighthouse Audits

**Target Scores:**

- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 85+

**Çalıştır:**

```bash
npm run build
npm run preview
# Chrome DevTools → Lighthouse → Run
```

---

## 🎯 AŞAMA 9: Documentation

### 9.1 Style Guide

**Dosya:** `docs/style/STYLE_GUIDE.md`

### 9.2 Component Library

**Dosya:** `docs/style/COMPONENTS.md`

### 9.3 CSS Variables Reference

**Dosya:** `docs/style/CSS_VARIABLES.md`

### 9.4 Migration Guide

**Dosya:** `docs/style/MIGRATION_GUIDE.md`

### 9.5 Responsive Patterns

**Dosya:** `docs/style/RESPONSIVE_PATTERNS.md`

---

## 📊 İlerleme Takibi

### Sprint 1 (Hafta 1)

- [x] Base klasörü kurulumu ✅
- [x] Components klasörü kurulumu ✅
- [x] Layout klasörü kurulumu ✅
- [x] Stats.css migrasyonu ✅
- [ ] Vocabulary.css migrasyonu 🔄
- [ ] Quiz.css migrasyonu
- [ ] Responsive düzenlemeler

### Sprint 2 (Hafta 2)

- [ ] Admin.css migrasyonu
- [ ] Auth.css migrasyonu
- [ ] Grammar.css migrasyonu
- [ ] CSS Variables optimization
- [ ] @layer yapısı

### Sprint 3 (Hafta 3)

- [ ] Diğer sayfa stilleri
- [ ] Component genişletmesi
- [ ] Utilities layer
- [ ] Dark mode consolidation

### Sprint 4 (Hafta 4)

- [ ] JS/JSX refactoring
- [ ] Cleanup & optimization
- [ ] Testing
- [ ] Documentation

---

## 🚀 Hızlı Başlangıç

```bash
# 1. Yeni branch oluştur
git checkout -b refactor/css-architecture

# 2. İlk modülü oluştur
touch frontend/src/style/pages/vocabulary.css

# 3. Stylelint kur
npm install --save-dev stylelint stylelint-config-standard

# 4. İlk lint çalıştır
npm run lint:css

# 5. İlk commit
git add .
git commit -m "feat(styles): initialize vocabulary.css module"
```

---

## 📝 Notlar

### Öncelikler

1. **YÜK SEK:** Vocabulary (Word Hunt kritik kullanıcı akışı)
2. **YÜKSEK:** Quiz (Core functionality)
3. **ORTA:** Admin (Power user feature)
4. **ORTA:** Auth (One-time usage)
5. **DÜŞÜK:** Settings, Profile (Nice to have)

### Riskler

- Word Hunt board responsive düzeni kompleks
- Admin table → card transformation zaman alabilir
- Dark mode consolidation breaking changes yapabilir

### Dependencies

- `clsx` - Class name utility
- `stylelint` - CSS linting
- `postcss-purgecss` - Unused CSS removal (production)

---

**Son Güncelleme:** 9 Ekim 2025  
**Durum:** 🔄 Devam Ediyor (Vocabulary modülü)  
**İlerleme:** 12/12 aşama - ~15% tamamlandı
