# VocabularyProgress modeli

**Kısa özet:** Her kullanıcı + kelime ikilisi için öğrenme durumunu saklar. Hangi kelimeyi ne zaman tekrar edeceğimizi buradan biliriz.

## Önemli alanlar

- `user`: Sahibi olan kullanıcı.
- `word`: Takip edilen kelime (`WordEntry`).
- `category`: İsteğe bağlı kategori referansı.
- `deck`: Kelimenin hangi desteğe ait olduğu (`learn`, `review`, `custom`).
- `status`: Öğrenme durumu (`new`, `learning`, `review`, `mastered`).
- `easeFactor`: Spaced repetition için kolaylık katsayısı (varsayılan 2.5).
- `interval`: Bir sonraki tekrar aralığı (gün olarak).
- `repetition`: Kaçıncı tekrar olduğunun sayacı.
- `lastReviewedAt` / `nextReviewAt`: Son ve planlanan tekrar zamanı.
- `dueOverrideAt`: Manuel erteleme için tarih.
- `reviewHistory`: Geçmiş tekrarların listesi (ne zaman, sonuc neydi, notlar?).
- `notes`: Kullanıcı notu.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Ne işlev görür?

- Spaced repetition motoru bu tablodan hangi kelimenin sırada olduğunu bulur.
- Kullanıcının kelime kartındaki geçmişini ve notlarını gösterir.
