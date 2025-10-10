# CSS Quick Reference

> Quiz-app Frontend için hızlı referans kılavuzu

---

## 📁 Klasör Yapısı

```
frontend/src/style/
├── base/              # Temel katman
│   ├── reset.css
│   ├── theme.css
│   ├── typography.css
│   └── animations.css (planlanan)
│
├── layout/            # Layout katmanı
│   └── structure.css
│
├── components/        # Bileşen katmanı
│   ├── buttons.css
│   ├── chips.css
│   ├── cards.css
│   ├── drawers.css
│   ├── forms.css
│   └── tabs.css
│
├── pages/            # Sayfa katmanı
│   ├── stats.css
│   └── vocabulary.css (planlanan)
│
└── utilities/        # Utility katmanı (planlanan)
```

---

## 🎨 CSS Variables Referansı

### Renkler

```css
/* Primary Colors */
--color-primary: #0077ff;
--color-primary-dark: #0056b3;
--color-primary-light: #4d9fff;

/* Status Colors */
--color-success: #34c759;
--color-warning: #ff9500;
--color-danger: #ff375f;
--color-info: #5ac8fa;

/* Text Colors */
--color-text-primary: #1f2937;
--color-text-secondary: #6b7280;
--color-text-tertiary: #9ca3af;

/* Surface Colors */
--color-surface: #ffffff;
--color-surface-muted: #f9fafb;
--color-border: #e5e7eb;
```

### Spacing

```css
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-12: 3rem; /* 48px */
```

### Border Radius (Planlanan)

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Shadows (Planlanan)

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

### Transitions (Planlanan)

```css
--transition-fast: 150ms ease;
--transition-base: 250ms ease;
--transition-slow: 350ms ease;
```

---

## 🧩 Component Patterns

### Buttons

```jsx
// Primary Button
<button className="btn btn--primary">
  Primary Action
</button>

// Secondary Button
<button className="btn btn--secondary">
  Secondary Action
</button>

// Ghost Button
<button className="btn btn--ghost">
  Ghost Action
</button>

// Sizes
<button className="btn btn--primary btn--sm">Small</button>
<button className="btn btn--primary btn--md">Medium</button>
<button className="btn btn--primary btn--lg">Large</button>

// States
<button className="btn btn--primary" disabled>Disabled</button>
<button className="btn btn--primary btn--loading">Loading</button>
```

### Cards

```jsx
// Basic Card
<div className="card">
  <div className="card__header">
    <h3>Card Title</h3>
  </div>
  <div className="card__body">
    Content goes here
  </div>
  <div className="card__footer">
    <button className="btn btn--primary">Action</button>
  </div>
</div>

// Surface Card
<div className="surface-card">
  Content
</div>

// Elevated Card
<div className="surface-card surface-card--elevated">
  Elevated content
</div>
```

### Chips

```jsx
// Basic Chip
<span className="chip">Label</span>

// Variants
<span className="chip chip--primary">Primary</span>
<span className="chip chip--success">Success</span>
<span className="chip chip--warning">Warning</span>
<span className="chip chip--danger">Danger</span>

// With Icon
<span className="chip chip--primary">
  <Icon />
  <span>Label</span>
</span>
```

### Forms

```jsx
// Input Group
<div className="form-group">
  <label className="form-label">Email</label>
  <input
    type="email"
    className="form-input"
    placeholder="your@email.com"
  />
  <span className="form-help">Help text here</span>
</div>

// Select
<select className="form-select">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Textarea
<textarea
  className="form-textarea"
  rows="4"
  placeholder="Enter text..."
></textarea>

// Error State
<input className="form-input form-input--error" />
<span className="form-error">Error message</span>
```

---

## 📱 Responsive Patterns

### Breakpoints

```css
/* Mobile First Approach */

/* Small (640px+) */
@media (min-width: 640px) {
  /* Tablet styles */
}

/* Medium (768px+) */
@media (min-width: 768px) {
  /* Tablet landscape */
}

/* Large (1024px+) */
@media (min-width: 1024px) {
  /* Desktop */
}

/* Extra Large (1280px+) */
@media (min-width: 1280px) {
  /* Large desktop */
}
```

### Fluid Typography

```css
/* Clamp kullanımı */
font-size: clamp(1rem, 2vw, 1.5rem);
/* min: 1rem, preferred: 2vw, max: 1.5rem */
```

### Grid Patterns

```css
/* Auto-fit Grid */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
}

/* Responsive Stack */
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

@media (min-width: 768px) {
  .stack--md {
    flex-direction: row;
  }
}
```

---

## 🎭 BEM Naming Convention

### Yapı

```
.block { }              /* Bileşen */
.block__element { }     /* Alt eleman */
.block--modifier { }    /* Varyant */
.block__element--modifier { }  /* Alt eleman varyantı */
```

### Örnekler

#### Card Component

```css
.card {
}
.card__header {
}
.card__body {
}
.card__footer {
}
.card--elevated {
}
.card--bordered {
}
```

#### Button Component

```css
.btn {
}
.btn--primary {
}
.btn--secondary {
}
.btn--sm {
}
.btn--md {
}
.btn--lg {
}
.btn--loading {
}
```

#### Vocabulary Component

```css
.vocab-hero {
}
.vocab-hero__title {
}
.vocab-hero__stats {
}
.vocab-hero--featured {
}
```

---

## 🌙 Dark Mode

### Kullanım

```css
/* Light mode (default) */
.component {
  background: var(--color-surface);
  color: var(--color-text-primary);
}

/* Dark mode */
.dark .component {
  background: rgba(15, 23, 42, 0.8);
  color: rgba(229, 231, 235, 0.92);
}
```

### CSS Variables ile

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

.dark {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}

.component {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

---

## ⚡ Utility Classes (Planlanan)

### Display

```css
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
```

### Flexbox

```css
.flex-row {
  flex-direction: row;
}
.flex-col {
  flex-direction: column;
}
.items-start {
  align-items: flex-start;
}
.items-center {
  align-items: center;
}
.items-end {
  align-items: flex-end;
}
.justify-start {
  justify-content: flex-start;
}
.justify-center {
  justify-content: center;
}
.justify-end {
  justify-content: flex-end;
}
.justify-between {
  justify-content: space-between;
}
```

### Spacing

```css
/* Margin */
.m-0 {
  margin: 0;
}
.m-1 {
  margin: var(--spacing-1);
}
.m-2 {
  margin: var(--spacing-2);
}
.mt-4 {
  margin-top: var(--spacing-4);
}
.mb-6 {
  margin-bottom: var(--spacing-6);
}

/* Padding */
.p-0 {
  padding: 0;
}
.p-1 {
  padding: var(--spacing-1);
}
.p-2 {
  padding: var(--spacing-2);
}
.px-4 {
  padding-left: var(--spacing-4);
  padding-right: var(--spacing-4);
}
.py-6 {
  padding-top: var(--spacing-6);
  padding-bottom: var(--spacing-6);
}
```

### Text

```css
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-right {
  text-align: right;
}
.font-bold {
  font-weight: 700;
}
.font-semibold {
  font-weight: 600;
}
.font-medium {
  font-weight: 500;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## 🎬 Animations

### Keyframes (Mevcut)

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Kullanım

```css
.loading-spinner {
  animation: spin 1s linear infinite;
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

.slide-up {
  animation: slideInUp 0.4s ease;
}
```

---

## 💡 Best Practices

### 1. Mobile-First

```css
/* ✅ İyi */
.component {
  width: 100%;
}

@media (min-width: 768px) {
  .component {
    width: 50%;
  }
}

/* ❌ Kötü */
.component {
  width: 50%;
}

@media (max-width: 767px) {
  .component {
    width: 100%;
  }
}
```

### 2. CSS Variables Kullan

```css
/* ✅ İyi */
.btn {
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-md);
}

/* ❌ Kötü */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
}
```

### 3. Specificity Düşük Tut

```css
/* ✅ İyi */
.btn--primary {
}

/* ❌ Kötü */
.header .nav .btn.btn-primary {
}
```

### 4. Semantic Class Names

```css
/* ✅ İyi */
.card--featured {
}
.btn--loading {
}

/* ❌ Kötü */
.blue-box {
}
.big-text {
}
```

### 5. Consistent Naming

```css
/* ✅ İyi */
.vocab-card {
}
.vocab-card__title {
}
.vocab-card--active {
}

/* ❌ Kötü */
.vocabularyCard {
}
.vocabTitle {
}
.activeVocabCard {
}
```

---

## 🔧 Development Tools

### NPM Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint:css": "stylelint 'src/style/**/*.css'",
    "lint:css:fix": "stylelint 'src/style/**/*.css' --fix"
  }
}
```

### VS Code Extensions

- **Stylelint** - CSS linting
- **CSS Peek** - Go to definition
- **IntelliSense for CSS class names** - Autocomplete
- **Color Highlight** - Color preview

### Browser DevTools

```javascript
// CSS variable değerini oku
getComputedStyle(document.documentElement).getPropertyValue("--color-primary");

// CSS variable değerini değiştir
document.documentElement.style.setProperty("--color-primary", "#ff0000");
```

---

## 📚 Kaynaklar

### Harici Dokümantasyon

- [BEM Methodology](http://getbem.com/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS @layer (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)

### Proje Dokümantasyonu

- [CSS Refactoring Roadmap](./css-refactoring-roadmap.md)
- [Style Guide](./STYLE_GUIDE.md) (planlanan)
- [Component Library](./COMPONENTS.md) (planlanan)

---

**Son Güncelleme:** 9 Ekim 2025  
**Versiyon:** 1.0.0
