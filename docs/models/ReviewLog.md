# ReviewLog modeli

**Kısa özet:** Kelime veya gramer tekrarlarında yapılan her hamleyi yazar. "Şu kelimeyi bugün kaçıncı defa gözden geçirdik?" sorusu buradan çıkar.

## İçindekiler

- `user`: Kim tekrar yaptı.
- `type`: Kelime mi, gramer mi?
- `refId`: Hangi kelime ya da konu üzerinde çalışıldı.
- `action`: Yapılan işin türü (`review`, `promote`, `demote`, `master`).
- `beforeStatus` / `afterStatus`: Hamle öncesi ve sonrası durum etiketi.
- `intervalDays`: Bir sonraki tekrar aralığı kaç gün.
- `easeFactor`: SM-2 benzeri algoritma için kolaylık katsayısı.
- `correct`: Cevap doğru muydu?
- `timeSpentSec`: Bu hamleye harcanan süre.
- `reviewedAt`: Hamle zamanı.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Nerede kullanılır?

- Öğrenme geçmişi grafikleri.
- Spaced repetition motorunda ilerlemeyi izlemek.
