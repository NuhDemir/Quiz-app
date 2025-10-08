# DailyUserStat modeli

**Kısa özet:** Kullanıcının bir gün içinde yaptığı işleri toplayan tablo. Bir kullanıcı + bir tarih = tek satır.

## Neler kaydedilir?

- `user`: Hangi kullanıcı için olduğunun kimliği.
- `date`: Günün etiketi, `YYYY-MM-DD` formatında düz metin.
- `quizzesCompleted`: O gün bitirdiği quiz sayısı.
- `wordsReviewed`: Tekrar ettiği kelime adedi.
- `wordsMastered`: Ustalaştığı kelime sayısı.
- `grammarReviewed`: Çalıştığı gramer konu adedi.
- `xpEarned`: Kazandığı XP.
- `pointsEarned`: Topladığı puan.
- `streakActive`: O gün streak devam etti mi?
- `createdAt` / `updatedAt`: Otomatik zaman damgaları.

## Ne işimize yarar?

- Günlük performans grafikleri.
- Streak (seri) takibinde aynı güne ikinci kayıt düşmesini engellemek için `user+date` eşsiz indeksini kullanır.
