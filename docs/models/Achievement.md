# Achievement modeli

**Kısa özet:** Bu belge, kullanıcılara verilen başarı rozetlerini tutar. Her kayıt, "şu işi yaptığında şu ödülü al" mantığını anlatır.

## Tarlada ne var ne yok?

- `code`: Her başarının eşsiz rumuzu. Aynı kod iki kez yazılamaz.
- `title`: Kullanıcıya gösterilecek isim.
- `description`: Başarının küçük açıklaması (boş kalabilir).
- `tier`: Bronzdan elmasa kadar beş kademeden biri. Varsayılan `bronze`.
- `criteria`: Şartların saklandığı serbest alan. Örn. "10 quiz çöz" gibi.
- `pointsReward`: Bu başarıdan gelen puan.
- `charmsReward`: Verilecek tılsım sayısı.
- `repeatable`: Aynı başarı tekrar tekrar alınabilir mi?
- `maxRepeats`: Tekrar edebilen başarılar için üst sınır.
- `createdAt` / `updatedAt`: Mongoose'un otomatik eklediği zaman damgaları.

## Nerede işe yarar?

- Kullanıcının profilinde topladığı başarıları göstermek.
- Achievements engine, kriterleri okuyup ödül verip vermeyeceğine karar verir.
