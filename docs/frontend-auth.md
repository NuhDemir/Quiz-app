# Frontend Auth (Clerk + Backend JWT Köprüsü)

Bu doküman, frontend tarafına Clerk sosyal/login entegrasyonunun nasıl eklendiğini ve backend JWT ile nasıl köprü kurulduğunu adım adım açıklar.

## 1. Amaç

Clerk kullanıcı oturumunu (Google/Facebook vb. sosyal sağlayıcılar) doğrular; ardından alınan Clerk JWT backend'e gönderilerek (`auth-social-clerk`) dahili JWT üretilir ve Redux durumuna kaydedilir.

## 2. Ortam Değişkenleri (Frontend)

`frontend/.env` içerisine:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_API_BASE=/.netlify/functions/
```

Publishable key yoksa uygulama klasik form login ile devam eder.

## 3. Yapılan Değişiklikler

- `src/main.jsx`: `ClerkProvider` ile uygulama sarmalandı.
- `src/components/ClerkAuthBridge.jsx`: Clerk oturumu aktif olduğunda token exchange yapar.
- `src/store/authSlice.js`: `setBackendSession` action eklendi (Clerk köprüsü backend JWT'yi kaydedebilir).
- `src/pages/Login.jsx`: Form tabanlı giriş + (varsa) Clerk `<SignIn/>` UI seçimi.

## 4. Akış (Sequence)

1. Kullanıcı Clerk SignIn bileşeniyle oturum açar.
2. Clerk frontend SDK `session` yaratır; `getToken()` ile bir JWT elde edilir.
3. `ClerkAuthBridge` bu token'ı backend endpointine (`auth-social-clerk`) POST eder.
4. Backend Clerk token'ı doğrular (mock veya JWKS) → dahili kullanıcı oluşturur/bağlar → internal JWT döner.
5. Bridge bu internal JWT + user bilgisini `localStorage` ve Redux'a yazar.
6. Diğer korumalı istekler artık internal JWT ile çalışır.

## 5. Örnek Exchange Kodu (Özet)

```js
const clerkToken = await getToken();
const data = await apiRequest("auth-social-clerk", {
  method: "POST",
  data: { clerkToken },
});
// data.token = internal JWT
```

## 6. Geri Dönüş / Hata Durumları

- Clerk token alınamazsa Bridge hata loglar fakat kullanıcı Clerk oturumunda kalır.
- Backend 401 dönerse (ör. geçersiz JWKS) yeniden giriş veya sayfa yenileme önerilir.
- Issuer uyumsuzluğu için `.env` içindeki `CLERK_ISSUER` düzeltilecek.

## 7. Genişletme Önerileri

- Oturum yenileme: Token süresi yakınsa otomatik refresh (Clerk token + backend refresh endpoint).
- `aud` claim doğrulaması (backend).
- Multi-tab senkronizasyonu: `storage` event listener ile logout yansıtma.
- UI: SignOut button entegrasyonu (Clerk'in `SignOutButton` komponenti).

## 8. Test Stratejisi

- Mock mod: `VITE_CLERK_PUBLISHABLE_KEY` ayarlandı ama gerçek Clerk yok → `auth-social-clerk` mock token kabul eder (`mock::...`).
- Real mod: Backend JWKS testi (Node) zaten `socialAuthReal.test.js` ile kapsandı; frontend e2e (Playwright/Cypress) önerilir.

## 9. Sık Karşılaşılan Sorunlar

| Sorun                                 | Neden                      | Çözüm                                        |
| ------------------------------------- | -------------------------- | -------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` tanımsız | .env yüklenmedi            | Dosya adını .env.local yap ve yeniden başlat |
| 401 Invalid social token              | Mock format yanlış         | `mock::<id>::<email>::<username>` kullan     |
| 500 Failed to import JWKS key         | Node sürümü eski           | 16+ LTS veya 18+ kullan                      |
| Internal user null                    | Backend exchange başarısız | Network veya JWKS logunu kontrol et          |

## 10. Logout Senaryosu

- Kullanıcı uygulama içi logout: Redux `logout` + `Clerk` signOut birlikte tetiklenmeli (ileride eklenebilir).

---

Bu entegrasyon minimal viable düzeydedir. Sonraki adım: UI üzerinde Clerk profil / user button eklemek.
