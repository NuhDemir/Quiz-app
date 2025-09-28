# İngilizce Quiz Uygulaması - Gereksinimler Belgesi

## Proje Genel Bakış

**Proje Adı:** English Quiz Master  
**Teknoloji Stack:** MERN (MongoDB, Express.js, React, Node.js)  
**Amaç:** İngilizce seviyesini test etmek ve geliştirmek için kapsamlı bir quiz uygulaması

## 1. Fonksiyonel Gereksinimler

### 1.1 Kullanıcı Yönetimi
- **Kullanıcı Kaydı:**
  - Email ve şifre ile kayıt olma
  - Google/Facebook ile sosyal giriş
  - Email doğrulama sistemi
  - Profil bilgileri (ad, soyad, yaş, mevcut İngilizce seviyesi)

- **Giriş/Çıkış:**
  - Güvenli giriş sistemi (JWT token)
  - "Beni hatırla" özelliği
  - Şifre sıfırlama (email ile)
  - Otomatik oturum kapatma

- **Profil Yönetimi:**
  - Profil bilgilerini güncelleme
  - Şifre değiştirme
  - Hesap silme
  - Avatar yükleme

### 1.2 Quiz Sistemi
- **Quiz Kategorileri:**
  - Gramer (Grammar)
  - Kelime Bilgisi (Vocabulary)
  - Okuma Anlama (Reading Comprehension)
  - Cümle Yapısı (Sentence Structure)
  - İdiyomlar (Idioms)

- **Seviye Kategorileri:**
  - Başlangıç (Beginner - A1)
  - Temel (Elementary - A2)
  - Orta-Alt (Pre-Intermediate - B1)
  - Orta (Intermediate - B2)
  - İleri (Upper-Intermediate - C1)
  - İleri+ (Advanced - C2)

- **Quiz Türleri:**
  - Çoktan seçmeli sorular
  - Boşluk doldurma
  - Doğru/Yanlış soruları
  - Eşleştirme soruları
  - Görsel destekli sorular

### 1.3 Soru ve Cevap Yönetimi
- **Soru Özellikleri:**
  - Her sorunun kategori, seviye, zorluk derecesi
  - Açıklama ve detaylı çözüm
  - Görsel/resim desteği
  - Soru etiketleri (tags)

- **Cevap Sistemi:**
  - Anında geri bildirim
  - Doğru cevap açıklaması
  - Puan hesaplama sistemi
  - Zaman sınırı (opsiyonel)

### 1.4 İlerleme Takibi
- **Kullanıcı İstatistikleri:**
  - Toplam çözülen soru sayısı
  - Doğruluk oranı (kategori bazında)
  - Seviye ilerlemesi
  - Haftalık/aylık performans grafikleri
  - En çok zorlandığı konular

- **Rozet ve Başarım Sistemi:**
  - Çeşitli rozetler kazanma
  - Başarım seviyeleri
  - Liderlik tablosu
  - Arkadaşlar ile karşılaştırma

### 1.5 Öğrenme Araçları
- **Kişisel Kelime Defteri:**
  - Yanlış yapılan kelimeler
  - Favoriler listesi
  - Kelime anlamları ve örnekler
  - Telaffuz rehberi

- **Çalışma Planı:**
  - Günlük/haftalık hedefler
  - Özelleştirilmiş quiz önerileri
  - Hatırlatma bildirimleri

### 1.6 Sosyal Özellikler
- **Rekabet:**
  - Arkadaşlar ile meydan okuma
  - Günlük/haftalık liderlik tabloları
  - Turnuva sistemi

- **Paylaşım:**
  - Sosyal medyada başarı paylaşımı
  - Rozet paylaşımı

## 2. Teknik Gereksinimler

### 2.1 Frontend (React)
- **Framework:** React 18+ (Hooks ve Context API)
- **UI Kütüphanesi:** Material-UI veya Ant Design
- **State Management:** Redux Toolkit + RTK Query
- **Routing:** React Router v6
- **Form Yönetimi:** Formik + Yup
- **Grafik:** Chart.js veya Recharts
- **Animasyonlar:** Framer Motion
- **PWA Desteği:** Service Workers

### 2.2 Backend (Node.js + Express.js)
- **Framework:** Express.js
- **Kimlik Doğrulama:** JWT + bcrypt
- **API Dokümanı:** Swagger/OpenAPI
- **Dosya Yükleme:** Multer
- **Email Servisi:** Nodemailer
- **Validation:** Joi
- **Rate Limiting:** express-rate-limit
- **CORS:** cors middleware
- **Güvenlik:** helmet, express-validator

### 2.3 Veritabanı (MongoDB)
- **ODM:** Mongoose
- **Indexing:** Performans için gerekli indexler
- **Backup:** Düzenli veritabanı yedekleri
- **Cloud:** MongoDB Atlas (production)

### 2.4 Dosya Depolama
- **Görseller:** CDN desteği
- **Avatar:** Kullanıcı profil fotoğrafları

### 2.5 Deployment & DevOps
- **Frontend:** Vercel veya Netlify
- **Backend:** Heroku, AWS EC2 veya DigitalOcean
- **CI/CD:** GitHub Actions
- **Monitoring:** Winston (logging)
- **Environment:** dotenv

## 3. Performans Gereksinimleri

### 3.1 Hız
- Sayfa yükleme süresi: < 3 saniye
- API yanıt süresi: < 500ms
- Quiz başlatma süresi: < 2 saniye

### 3.2 Ölçeklenebilirlik
- Eş zamanlı 1000+ kullanıcı desteği
- 100,000+ soru kapasitesi
- Otomatik yük dengeleme

### 3.3 Güvenlik
- HTTPS/SSL sertifikası
- Şifre hashleme (bcrypt)
- SQL Injection koruması
- XSS koruması
- CSRF koruması

## 4. Kullanıcı Arayüzü Gereksinimleri

### 4.1 Responsive Design
- Mobil-ilk yaklaşım
- Tablet ve desktop uyumluluğu
- Touch-friendly interface

### 4.2 Erişilebilirlik
- WCAG 2.1 AA standardı
- Klavye navigasyonu
- Screen reader desteği
- Yüksek kontrast modu

### 4.3 Çoklu Dil Desteği
- Türkçe arayüz
- İngilizce arayüz
- i18n implementasyonu

## 5. Veri Gereksinimleri

### 5.1 Soru Bankası
- Minimum 10,000 soru
- Her kategoride en az 1,000 soru
- Her seviyede dengeli dağılım

### 5.2 İçerik Kalitesi
- Native speaker onayı
- Akademik kaynaklardan referans
- Güncel İngilizce kullanımı

## 6. Test Gereksinimleri

### 6.1 Otomatik Testler
- Unit testler (Jest)
- Integration testler
- E2E testler (Cypress)
- API testleri (Supertest)

### 6.2 Manuel Testler
- Kullanıcı kabul testleri
- Erişilebilirlik testleri
- Performans testleri

## 7. Bakım ve Güncelleme

### 7.1 İçerik Yönetimi
- Admin paneli
- Toplu soru ekleme/düzenleme
- İstatistik raporları

### 7.2 Sistem Bakımı
- Düzenli güvenlik güncellemeleri
- Performans optimizasyonu
- Veri yedekleme
- Log analizi

## 8. Yasal ve Uyum

### 8.1 Veri Koruma
- GDPR uyumluluğu
- Kullanıcı verisi şifreleme
- Veri saklama politikaları

### 8.2 Telif Hakları
- Özgün içerik oluşturma
- Görsel telif kontrolü