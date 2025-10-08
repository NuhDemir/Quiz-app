# VocabularyGameSession modeli

**Kısa özet:** Kelime oyunları (Kelime Avı, Hızlı Çalışma vb.) sırasında açılan oturumların günlük defteri. Oyunun durumu, sonucu ve yaşanan olaylar burada saklanır.

## Alanlar

- `user`: Oturumu açan kullanıcı (misafir ise boş olabilir).
- `type`: Oyun tipi (`word-hunt`, `speed-challenge`, `flashcard-battle`).
- `startedAt` / `completedAt`: Oturumun başlangıç ve bitiş zamanı.
- `expiresAt`: Oturumun geçerliliği.
- `payload`: Oyuna özel ham malzeme (ör. soru listesi, kelime tahtası).
- `state`: O anki durum.
  - `status`: `active`, `completed` veya `expired`.
  - `livesRemaining`, `timeRemainingMs`, `metadata` gibi alanlar.
- `result`: Skor ve istatistikler (`correct`, `incorrect`, `score`, `xpEarned`, `combo`, `maxCombo`).
- `events`: Oyun sırasında kaydedilmiş küçük günlük girdi dizisi.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Nasıl kullanılır?

- Oyun ekranından kaldığı yerden devam etmek.
- Bittiğinde sonuç ekranını ya da geçmiş oturumları göstermek.
- `expiresAt` alanı sayesinde süresi geçen oturumlar MongoDB tarafından otomatik silinir.
