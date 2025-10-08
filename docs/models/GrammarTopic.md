# GrammarTopic modeli

**Kısa özet:** Gramer derslerini raflara koyduğumuz yapı. Her kayıt bir konu ve içinde bölümler barındırıyor.

## Ana alanlar

- `slug`: URL'de kullandığımız benzersiz kısa ad.
- `title`: Konunun başlığı.
- `description`: Konuyu tanıtan kısa metin.
- `level`: Hangi seviye için (A1-C2 ya da `mixed`).
- `tags`: Filtreleme için etiket listesi.
- `sections`: Konuyu parçalara ayıran alt liste.
  - Her bölümde `key`, `title`, `order`, `content`, `examples` alanları var.
- `active`: Konu yayında mı?
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Ne işe yarıyor?

- Öğrencinin gramer sayfasında konu içeriğini göstermek.
- Kullanıcı ilerlemesi `User` modelindeki `grammarProgress` ile eşleşir.
