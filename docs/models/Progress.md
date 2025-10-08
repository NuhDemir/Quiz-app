# Progress modeli

**Kısa özet:** Kullanıcının genel quiz performansını tek satırda toplar. "Bu kişi toplam kaç quiz çözdü?" sorusunun cevabı burada.

## Alanlar

- `userId`: Kullanıcıyı eşsiz şekilde tanımlar (string tutulmuş).
- `totalQuizzes`: Bitirdiği toplam quiz sayısı.
- `accuracy`: Genel doğruluk yüzdesi.
- `streak`: Quiz çözme serisi.
- `xp`: Toplam XP.
- `badges`: String rozet kodları (eski sistem mirası).
- `recentSessions`: Son quiz denemelerinin kısa özeti.
  - Her oturumda `quizId`, `score`, `accuracy`, `duration`, `streakDelta`, `takenAt` gibi alanlar var.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Ne için saklıyoruz?

- Profilde istatistik kartlarını hızlı göstermek.
- Liderlik veya kişisel rapor ekranlarında toplamları hızlıca okumak.
