# LeaderboardSnapshot modeli

**Kısa özet:** Haftalık/aylık liderlik tablolarını dondurup saklar. Böylece "Eylül ayında kim birinciydi?" sorusuna cevap verebiliriz.

## İçerdiği bilgiler

- `period`: Hangi zaman dilimini tuttuğumuz (ör. `2025-09`).
- `type`: `monthly`, `weekly` veya `alltime`.
- `generatedAt`: Liste ne zaman oluşturuldu.
- `entries`: O dönemki sıralama listesi.
  - Her satırda `user`, `username`, `points`, `rank` var.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Kullanım notları

- `type + period` benzersiz tutulur, böylece aynı ay iki kez yazmayız.
- UI geçmiş liderlik ekranını buradan okur.
