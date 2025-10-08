# Question modeli

**Kısa özet:** Quiz sorularının kendisi. Sorunun metni, seçenekleri ve doğru cevabı burada durur.

## Temel alanlar

- `text`: Kullanıcıya gösterilen soru.
- `explanation`: Sorunun çözümü veya ipucu (isteğe bağlı).
- `options`: Şıklardan oluşan dizi. En az iki tane olmak zorunda.
- `correctAnswer`: Doğru şık (string olarak).
- `category`: Örn. kelime, gramer gibi gruplama etiketi.
- `level`: CEFR seviyeleri (A1-C2 veya `mixed`).
- `difficulty`: `easy`, `medium`, `hard`.
- `tags`: Hızlı arama için etiket listesi.
- `source`: Sorunun geldiği yer.
- `author`: Soruyu kimin yazdığı (User referansı).
- `stats`: Kullanım istatistikleri (`timesUsed`, `correctCount`, `wrongCount`, `lastUsedAt`).
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Nerede kullanılır?

- Quiz oluştururken soruları seçmek.
- Soruların başarı oranını takip etmek için istatistikler.
