# Quiz modeli

**Kısa özet:** Kullanıcıların çözdüğü sınav paketleri. Başlık, açıklama ve içindeki sorular burada saklanır.

## Neler içeriyor?

- `title`: Quiz adı.
- `slug`: URL dostu benzersiz anahtar.
- `description`: Kısa özet.
- `category`: Quiz türü (kelime, gramer vb.).
- `level`: Hedef dil seviyesi (A1-C2 veya `mixed`).
- `difficulty`: Zorluk derecesi (`easy`, `medium`, `hard`).
- `tags`: Filtrelerde kullanılacak etiket listesi.
- `timeLimitSec`: Quiz süresi (varsa).
- `questionCount`: Soru adedi. `questions` alanı değişince otomatik güncellenir.
- `isPublished`: Quiz kullanıcıya açılmış mı?
- `questions`: `Question` referanslarından oluşan dizi.
- `meta`: Kullanım istatistikleri (`plays`, `averageScore`, `averageAccuracy`, `lastPlayedAt`).
- `author`: Quiz'i oluşturan kullanıcı.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Neden önemli?

- Mağazada listelenen quizleri buradan okuruz.
- Popülerlik için `meta.plays` indeksleri kullanılır.
- Kaydederken soru listesi değiştiyse soru sayısı otomatik güncellenir.
