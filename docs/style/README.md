# Style Documentation

> Quiz-app Frontend CSS Architecture Dokümantasyonu

---

## 📚 Dokümantasyon İçeriği

### 1. [CSS Refactoring Roadmap](./css-refactoring-roadmap.md)

**Kapsamlı refactoring planı ve ilerleme takibi**

- ✅ Tamamlanan yapının durumu
- 🎯 8 aşamalı detaylı roadmap
- 📊 İlerleme takibi ve metrikler
- 🚀 Sprint planlaması
- ⚠️ Risk analizi
- 🔧 Teknik detaylar

**Kim için:** Project manager, lead developer, tüm takım

**Ne zaman kullanılır:** Proje planlaması, sprint review, progress tracking

---

### 2. [Quick Reference](./quick-reference.md)

**Günlük geliştirme için hızlı referans**

- 🎨 CSS Variables listesi
- 🧩 Component pattern'leri
- 📱 Responsive patterns
- 🎭 BEM naming örnekleri
- 🌙 Dark mode kullanımı
- ⚡ Utility classes
- 💡 Best practices

**Kim için:** Frontend developer'lar

**Ne zaman kullanılır:** Daily development, kod yazarken

---

## 🗂️ Klasör Yapısı

```
docs/style/
├── README.md                        # Bu dosya
├── css-refactoring-roadmap.md       # Detaylı refactoring planı
└── quick-reference.md               # Hızlı referans kılavuzu
```

### Planlanan Dokümantasyon

```
docs/style/
├── STYLE_GUIDE.md                   # Stil rehberi
├── COMPONENTS.md                    # Component library
├── CSS_VARIABLES.md                 # Variables reference
├── MIGRATION_GUIDE.md               # Migration rehberi
└── RESPONSIVE_PATTERNS.md           # Responsive pattern'ler
```

---

## 🚀 Hızlı Başlangıç

### Yeni Bir Stil Modülü Oluşturmak

1. **Doğru klasörü belirle:**

   ```
   base/       → Reset, theme, typography, animations
   layout/     → Grid, containers, structure
   components/ → Reusable UI components
   pages/      → Page-specific styles
   utilities/  → Helper classes, animations
   ```

2. **BEM naming kullan:**

   ```css
   .component {
   }
   .component__element {
   }
   .component--modifier {
   }
   ```

3. **CSS Variables kullan:**

   ```css
   padding: var(--spacing-4);
   border-radius: var(--radius-md);
   transition: var(--transition-base);
   ```

4. **Mobile-first responsive:**

   ```css
   .component {
     /* mobile styles */
   }

   @media (min-width: 768px) {
     .component {
       /* tablet styles */
     }
   }
   ```

---

## 📋 Checklist: Yeni Stil Dosyası

- [ ] Dosyayı doğru klasöre yerleştir
- [ ] BEM naming convention uygula
- [ ] CSS Variables kullan (hard-coded değerler yok)
- [ ] Mobile-first responsive yaz
- [ ] Dark mode stillerini ekle
- [ ] `global.css` veya `index.css`'te import et
- [ ] Browser'da test et (Chrome, Firefox, Safari)
- [ ] Stylelint çalıştır: `npm run lint:css`

---

## 🎯 Mevcut Durum

### ✅ Tamamlanan (Sprint 1)

```
frontend/src/style/
├── base/
│   ├── reset.css         ✅
│   ├── theme.css         ✅
│   └── typography.css    ✅
├── layout/
│   └── structure.css     ✅
├── components/
│   ├── buttons.css       ✅
│   ├── chips.css         ✅
│   ├── cards.css         ✅
│   ├── drawers.css       ✅
│   ├── forms.css         ✅
│   └── tabs.css          ✅
└── pages/
    └── stats.css         ✅
```

### 🔄 Devam Ediyor

- Vocabulary.css (Word Hunt, FlashCards, Review)
- Quiz.css
- Admin.css

### ⏳ Planlanan

- Grammar.css
- Auth.css
- Profile.css
- Leaderboard.css
- Settings.css
- Home.css
- Categories.css

---

## 🛠️ Geliştirme Komutları

```bash
# CSS lint
npm run lint:css

# CSS lint + auto-fix
npm run lint:css:fix

# Build
npm run build

# Dev server
npm run dev
```

---

## 📊 Metrikler

### Hedef Metrikler

- **Bundle Size:** < 100KB (before gzip)
- **Lighthouse Performance:** 90+
- **Lighthouse Accessibility:** 95+
- **CSS Specificity:** Max 0,4,0
- **Max Nesting Depth:** 3

### Mevcut Durum

- **global.css:** ~5700 satır ⚠️
- **Modüler dosyalar:** ~2000 satır ✅
- **Refactor ilerleme:** ~15% 🔄

---

## 🤝 Katkıda Bulunma

### Stil Güncellemeleri

1. **Branch oluştur:**

   ```bash
   git checkout -b style/component-name
   ```

2. **Değişiklikleri yap:**

   - BEM naming kullan
   - CSS Variables tercih et
   - Mobile-first yaz
   - Dark mode ekle

3. **Test et:**

   ```bash
   npm run lint:css
   npm run dev
   ```

4. **Commit:**

   ```bash
   git add .
   git commit -m "style: update component-name styles"
   ```

5. **Pull request oluştur**

---

## 📖 Kaynaklar

### Harici

- [BEM Methodology](http://getbem.com/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS @layer (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)
- [Modern CSS Solutions](https://moderncss.dev/)

### Proje İçi

- [CSS Refactoring Roadmap](./css-refactoring-roadmap.md) - Detaylı plan
- [Quick Reference](./quick-reference.md) - Hızlı referans
- [Frontend Auth](../frontend-auth.md) - Auth implementasyonu
- [Design System](../design.md) - Genel design dokümantasyonu

---

## ❓ SSS (Sık Sorulan Sorular)

### Q: Yeni bir component için stil nereye yazılmalı?

**A:** Component reusable ise `components/` klasörüne, sayfa-spesifik ise `pages/` klasörüne.

### Q: Inline style mı, CSS dosyası mı kullanmalıyım?

**A:** Her zaman CSS dosyası kullanın. Inline style sadece dinamik değerler için (JS'ten gelen).

### Q: Dark mode nasıl eklenir?

**A:** `.dark` selector kullanın veya CSS variables ile tema yönetin.

### Q: Responsive breakpoint'ler nerede tanımlı?

**A:** `base/theme.css` içinde CSS variables olarak. Mobile-first yaklaşım kullanın.

### Q: BEM naming zorunlu mu?

**A:** Evet, tutarlılık için tüm projede BEM kullanılıyor.

---

## 🔄 Versiyon Geçmişi

### v1.0.0 (9 Ekim 2025)

- ✨ İlk dokümantasyon oluşturuldu
- 📝 CSS Refactoring Roadmap
- 📝 Quick Reference Guide
- 📁 Klasör yapısı belirlendi

---

## 📬 İletişim

Sorular veya öneriler için:

- GitHub Issues açın
- Team lead'e ulaşın
- Code review'da tartışın

---

**Son Güncelleme:** 9 Ekim 2025  
**Durum:** 🔄 Aktif Geliştirme  
**Versiyon:** 1.0.0
