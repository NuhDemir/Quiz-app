# Ortam Değişkenleri (Environment Variables)

Aşağıda backend (Netlify Functions) tarafından kullanılan veya planlanan tüm ortam değişkenleri listelenmiştir.

| Değişken               | Zorunlu   | Örnek                        | Açıklama                                                      |
| ---------------------- | --------- | ---------------------------- | ------------------------------------------------------------- |
| `MONGODB_URI`          | Evet      | mongodb+srv://...            | MongoDB bağlantı URI. SRV veya standart form olabilir.        |
| `JWT_SECRET`           | Evet      | super-secret                 | JWT imzalama anahtarı. Production'da uzun ve rastgele olmalı. |
| `JWT_EXPIRES_IN`       | Hayır     | 7d                           | Varsayılan 7d. Değiştirerek session süresini uzatabilirsiniz. |
| `BCRYPT_SALT_ROUNDS`   | Hayır     | 10                           | Parola hash maliyeti. Yüksek değer CPU maliyetini artırır.    |
| `RATE_LIMIT_WINDOW_MS` | Planlanan | 60000                        | Rate limiting pencere süresi (ms).                            |
| `RATE_LIMIT_MAX`       | Planlanan | 100                          | Belirtilen pencere içinde izin verilen maksimum istek sayısı. |
| `APP_URL`              | Hayır     | https://quiz-app.netlify.app | Frontend ana URL.                                             |

## Güvenlik Tavsiyeleri

- Production ortamında `.env` dosyasını repo'ya eklemeyin (git ignore altında tutun).
- `JWT_SECRET` en az 32+ random byte olmalı (örn. `openssl rand -hex 32`).
- Rate limiting eklediğinizde login, reset ve social auth endpointlerine uygulayın.
- Not: Email doğrulama ve parola sıfırlama özelliği kaldırıldığı için email servis değişkenleri gerekmiyor.

## Örnek `.env` Başlangıç

```
MONGODB_URI=mongodb+srv://user:pass@cluster/db
JWT_SECRET=change_me_dev_secret
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
APP_URL=http://localhost:8888
```
