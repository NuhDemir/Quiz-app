# QuizAttempt modeli

**Kısa özet:** Kullanıcının bir quiz denemesini baştan sona kaydeder. Hangi soruya ne cevap verdiğini burada buluruz.

## Öne çıkan alanlar

- `user`: Denemeyi yapan kullanıcı.
- `quiz`: Çözülen quiz.
- `questionCount`: Quizdeki soru sayısı.
- `correctCount` / `wrongCount`: Kaç doğru, kaç yanlış yaptı.
- `accuracy`: Doğruluk oranı.
- `score`: Puan karşılığı.
- `durationSec`: Toplam süre.
- `startedAt` / `finishedAt`: Denemenin başı ve sonu.
- `answers`: Her soru için seçilen şık, süre ve doğruluk bilgisi.
- `meta`: Streak artışı, XP, puan, charms gibi bonus veriler.
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Ne işe yarar?

- Kullanıcıya sonuç ekranını göstermek.
- Performans analizi yaparken geçmiş denemeleri listelemek.
