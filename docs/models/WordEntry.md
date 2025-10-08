# WordEntry modeli

**Kısa özet:** Sözlüğe eklenen her kelimenin temel kaydı. Kelimenin kendisi, çevirisi, zorluk derecesi ve tekrar bilgileri burada.

## Neler saklanır?

- `owner`: Kelimeyi ekleyen kullanıcı (isteğe bağlı).
- `term`: Kelimenin yazılışı.
- `normalizedTerm`: Küçük harfe çevrilmiş, aramada kullanılan versiyon.
- `translation`: Türkçe (veya hedef dilde) çeviri.
- `definition`: Açıklama metni.
- `language`: Kelimenin dili (varsayılan `en`).
- `examples`: Örnek cümleler.
- `notes`: Ek notlar.
- `level`: CEFR seviyeleri (bilinmiyorsa `unknown`).
- `category` / `subcategories`: Ana ve alt kategori referansları.
- `tags`: Etiket listesi.
- `difficulty`: `easy`, `medium`, `hard`.
- `status`: İçerik durumu (`draft`, `published`, `archived`).
- `decks`: Öğrenme ve tekrar desteleri için ayarlar.
- `spacedRepetition`: Varsayılan SM-2 parametreleri.
- `reviewState`: Genel öğrenme durumu (`new`, `learning`, `review`, `mastered`).
- `lastReviewedAt`, `nextReviewAt`: Son ve sonraki tekrar zamanı.
- `stats`: Toplam tekrar, başarı ve hata sayıları.
- `author`, `lastEditor`: İçeriği düzenleyenler.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Neden önemli?

- Kelime oyunlarının ve listelerinin ana veri kaynağıdır.
- Kaydetmeden önce `term` alanından otomatik `normalizedTerm` üretir; böylece aramalar düzgün çalışır.
