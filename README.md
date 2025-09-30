# English Quiz Master

Bu proje React.js kullanarak geliştirilmiş, JSON dosyalarından veri çeken kapsamlı bir İngilizce quiz uygulamasıdır.

## 🚀 Özellikler

- **5 Quiz Kategorisi:** Grammar, Vocabulary, Reading, Sentence Structure, Idioms
- **6 Seviye:** A1, A2, B1, B2, C1, C2
- **Çoklu Soru Türleri:** Çoktan seçmeli, boşluk doldurma, doğru/yanlış, eşleştirme
- **Local Storage ile Veri Persistence**
- **Kullanıcı Profili ve İstatistikler**
- **Rozet ve Başarım Sistemi**
- **Responsive Design**
- **PWA Desteği**

## 📁 Proje Yapısı

```
Quiz-app/
├── frontend/          # React.js uygulaması
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── data/      # JSON veri dosyaları
│   │   └── styles/
│   └── package.json
├── docs/              # Proje belgeleri
│   ├── requirements.md
│   ├── design.md
│   └── task.md
└── README.md
```

## 🛠️ Teknolojiler

### Frontend-Only Yaklaşım

- React 18+
- Material-UI / Ant Design
- Redux Toolkit (Local State Management)
- React Router v6
- Local Storage API
- Chart.js
- JSON Veri Dosyaları

## 🚀 Kurulum ve Çalıştırma

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend (Netlify Functions)

Proje kök dizininde testleri ve serverless fonksiyonları çalıştırmak için:

```bash
npm install
npm test
```

Netlify lokal geliştirme (isteğe bağlı):

```bash
npm install -g netlify-cli
netlify dev
```

## 🔐 Ortam Değişkenleri

Kök dizindeki `.env.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun.

| Değişken               | Açıklama                                    |
| ---------------------- | ------------------------------------------- |
| `MONGODB_URI`          | MongoDB bağlantı URI                        |
| `JWT_SECRET`           | JWT imzalama gizli anahtarı                 |
| `JWT_EXPIRES_IN`       | (Opsiyonel) Token süresi (örn: `7d`, `30d`) |
| `BCRYPT_SALT_ROUNDS`   | (Opsiyonel) Hash güçlü ayarı                |
| `RATE_LIMIT_WINDOW_MS` | (Planlanan) Rate limit pencere süresi       |
| `RATE_LIMIT_MAX`       | (Planlanan) Rate limit isteği üst sınırı    |

## 📊 Veri Yönetimi

Uygulama aşağıdaki JSON dosyalarından veri çeker:

- `questions.json` - Quiz soruları
- `categories.json` - Quiz kategorileri
- `levels.json` - Seviye bilgileri
- `badges.json` - Rozet sistemi

Kullanıcı verileri Local Storage'da saklanır.

## 📱 Demo

Frontend: [Netlify'da Canlı Demo](https://english-quiz-master.netlify.app)

## 🚀 Netlify Deployment

Bu proje Netlify'da kolayca deploy edilebilir:

1. GitHub repository'yi Netlify'a bağlayın
2. Build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/build`

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
