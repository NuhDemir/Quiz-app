# Implementation Plan (Quiz App)

Bu plan; proje ilerlemesini standartlaştırılmış, numaralı ve takip edilebilir bir formatta sunar. Her görev ilgili ise gereksinim belgesindeki (requirements.md) bölümlerle ilişkilendirilmiştir.

Durum Etiketleri:

- [x] Tamamlandı | [ ] Henüz Yapılmadı | [~] Kısmi / Devam Ediyor

---

## 1. Altyapı ve Temel Kurulum

### 1.1 Proje Ortamı ve Çekirdek Yapı

- [x] Node.js + Netlify Functions kurulum ve çalışma (local dev proxy) (Ref: 2.2 kısmi)
- [x] Environment değişkenleri yapılandırma (`MONGODB_URI`, `JWT_SECRET`) (Ref: 2.2)
- [x] Frontend Vite + React + Redux Toolkit başlangıç yapısı (Ref: 2.1)

### 1.2 Veritabanı & Bağlantı Yönetimi

- [x] MongoDB bağlantı helper (retry / timeout iyileştirmeleri) (Ref: 2.2, 3.3)
- [x] Model kayıt sırası / MissingSchemaError önleme düzenlemeleri

---

## 2. Veri Modelleri (Gamification & Öğrenme)

- [x] User (quizStats alanı ile) (Ref: 1.1, 1.4)
- [x] Quiz & Question (Ref: 1.2, 1.3)
- [x] QuizAttempt (denormalize metriklere temel) (Ref: 1.4)
- [x] ReviewLog (SRS temel) (Ref: 1.5 kısmi)
- [x] DailyUserStat (ileride grafikler için) (Ref: 1.4)
- [x] Badge & Achievement (Ref: 1.4 Rozet ve Başarım Sistemi)
- [x] WordEntry (kişisel kelime defteri başlangıcı) (Ref: 1.5)
- [x] GrammarTopic (kategori/konu ilerlemesi) (Ref: 1.2, 1.4)
- [x] LeaderboardSnapshot (haftalık/sezonluk analiz altyapısı)

---

## 3. Migration ve Dönüşüm

- [x] Eski Progress modelinden yeni yapıya migrasyon scripti (`scripts/migrate_progress.js`)
- [x] Progress doküman bağımlılıklarının kaldırılması
- [ ] Eski verinin badge/achievement kodlarıyla tutarlı eşleştirilmesi için otomatik eşleme aracı (gerektiğinde)

---

## 5. Quiz Akışı ve İstatistikler

- [x] Quiz oluşturma (temel) (Ref: 1.2)
- [x] Quiz detay listeleme (Ref: 1.2)
- [x] Quiz submit (persist + istatistik güncelleme) (Ref: 1.2, 1.4)
- [x] Toplam doğru / yanlış / doğruluk oranı hesaplama (Ref: 1.4)
- [x] Tek endpoint üzerinden progress hesaplama (`progress`) (Ref: 1.4)
- [ ] Kategori bazlı performans / seviye ilerlemesi (Ref: 1.4, 1.2)
- [ ] Zaman sınırı / süre ölçümü (Ref: 1.2 opsiyonel)
- [ ] Farklı soru tipleri (boşluk doldurma, eşleştirme, görsel) (Ref: 1.2, 1.3)

---

## 6. Gamification & Achievement Sistemi

- [x] Achievement Engine (merkezi kriter değerlendirme)
- [x] `achievements-evaluate` fonksiyonu refactor
- [x] `quiz-submit` içine otomatik tetikleme (FIRST_QUIZ)
- [ ] Ek kriterler: 10 quiz, %80 doğruluk, 5 gün streak (Ref: 1.4)
- [ ] Dinamik kriterlerin DB üstünden yönetimi (admin UI) (Ref: 7.1)
- [ ] Kullanıcıya rozet kazandı bildirimi (frontend toast/modal) (Ref: 1.4)

---

## 7. Öğrenme Araçları & SRS

- [x] SRS review temel fonksiyonu (`srs-review`) (Ref: 1.5)
- [x] Kelime ekleme (`word-add`) (Ref: 1.5)
- [ ] Tekrar aralıklarının (interval) optimize edilmesi (Leitner/SM2 varyasyonu) (Ref: 1.5)
- [ ] Kişisel kelime defteri UI (Ref: 1.5)
- [ ] Önerilen quizler / adaptif çalışma planı (Ref: 1.5)

---

## 8. Leaderboard & Sosyal Özellikler

- [x] Leaderboard endpoint (Ref: 1.4)
- [x] Snapshot alma fonksiyonu (`leaderboard-snapshot`)
- [ ] Günlük/haftalık otomatik schedule (Netlify Scheduled Functions) (Ref: 1.6 Rekabet)
- [ ] Arkadaş karşılaştırması / challenge sistemi (Ref: 1.6)
- [ ] Turnuva / sezon mantığı (Ref: 1.6)

---

## 9. UI / Frontend Genişletmeleri

- [x] Progress bileşeni token uyumu
- [ ] Badge kazanımı anlık bildirim
- [ ] Profilde rozet/başarım detay modali
- [ ] Çoklu dil desteği (i18n) (Ref: 4.3)
- [ ] Erişilebilirlik (WCAG 2.1 AA) iyileştirmeleri (Ref: 4.2)
- [ ] PWA / offline mod temel

---

## 10. Performans & Ölçeklenebilirlik

- [x] Bağlantı yönetimi stabilizasyonu (Ref: 3.1/3.2 kısmen)
- [ ] Ağır aggregation'lar için projection / index stratejisi dokümantasyonu (Ref: 2.3, 3.2)
- [ ] Soru koleksiyonlarında index planı (kategori, seviye, zorluk) (Ref: 2.3)
- [ ] Load test (kullanıcı ölçek hedefleri tanımlanacak) (Ref: 3.1, 3.2)

---

## 11. Güvenlik & Dayanıklılık

- [x] JWT tabanlı auth (Ref: 2.2, 3.3 Güvenlik kısmi)
- [ ] Rate limiting (Ref: 3.3)
- [ ] Brute force / login throttling (Ref: 3.3)
- [ ] Input validation (Joi / Zod) (Ref: 2.2)
- [ ] Audit log / davranış analizi (Ref: 7.2)
- [ ] Veri yedekleme stratejisi dokümantasyonu (Ref: 7.2)

---

## 12. Gözlemlenebilirlik (Observability) & Loglama

- [ ] Merkezi log sistemi (örn. Winston + Netlify plugin) (Ref: 7.2)
- [ ] Hata izleme (Sentry) entegrasyonu
- [ ] Performans metrikleri toplayıcı (Ref: 3.1)

---

## 13. Test Altyapısı ve Kapsam

- [x] Jest + mongodb-memory-server kurulum
- [x] Auth akışı testleri
- [x] Quiz submit + progress testleri
- [x] Otomatik badge testi (FIRST_QUIZ)
- [ ] Ek achievement senaryoları testleri
- [ ] Leaderboard & snapshot testleri
- [ ] SRS review testleri
- [ ] WordEntry ekleme & retrieval testleri
- [ ] Yük / performans test planı (ayrı araç - k6/JMeter) taslağı

---

## 14. Dokümantasyon

- [x] Gereksinimler belgesi (`requirements.md`)
- [x] Bu implementation plan (`task.md`)
- [ ] API endpoint referansı (otomatik veya manuel)
- [ ] Model şema sözlüğü
- [ ] Achievement kriter tanımlama kılavuzu

---

## 15. Kısa Vadeli Öncelik Önerilen Sıra

1. Ek achievement kriterleri + testler (10 quiz, %80 accuracy, streak)
2. Badge kazanımı frontend bildirimi
3. Leaderboard snapshot scheduling
4. Dinamik achievement şeması (DB üzerinden)
5. Rate limiting + temel güvenlik sertleştirmeleri

---

## 16. Riskler & İzleme

- Achievement kriterleri hard-coded: Değişim deploy gerektiriyor.
- `quiz-submit` synchronous birden fazla DB çağrısı: batching / minimal projection öneriliyor.
- Leaderboard snapshot işleyişi manuel tetiklenirse veri eskiyebilir.
- Artan populate maliyetleri için lightweight DTO katmanı gerekebilir.

Risk Azaltma Önerileri:

1. Kriterleri JSON tanımlarıyla (koleksiyon: AchievementDefinitions) yönet.
2. Projection + lean kullanımı ile sorgu yükünü azalt.
3. Scheduled function ile otomasyon.
4. Test genişletme ile regresyon riskini erken yakalama.

---

## 17. Katkı Rehberi (Kısa)

Yeni fonksiyon eklerken:

1. İlgili modelleri require et (schema register).
2. Auth gerektiğinde token doğrula; yoksa read-only senaryo belirt.
3. İş kuralını küçük saf fonksiyonlara böl.
4. Tekrarlayan kriter / ödül mantığını engine üzerinden yürüt.
5. Test: memory server pattern + izolasyon.

---

Güncelleme Zamanı: (yyyy-mm-dd) 2025-09-30

Bu plan düzenli olarak revize edilmelidir. Tamamlanan her başlık işaretlenip yeni alt görevler eklenebilir.
