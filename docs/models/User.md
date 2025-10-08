# User modeli

**Kısa özet:** Platformdaki her insanın ana kaydı. Hesap bilgileri, ayarlar, puanlar ve ilerleme başlıkları burada tutulur.

## Ana bilgiler

- `username`, `email`, `passwordHash`: Giriş için gereken temel alanlar.
- `role`: `user` veya `admin` rolü.
- `settings`: Kullanıcının kişisel tercihleri (tema, dil vb.).
- `points`, `charms`: Oyun içi para birimleri.
- `badges`, `achievements`: Kazandığı rozet ve başarıların referans listeleri.

## Quiz istatistikleri

- `quizStats.totalQuizzes`, `totalQuestions`, `totalCorrect`, `totalWrong`: Genel sayılar.
- `quizStats.currentStreak`, `longestStreak`: Seri bilgileri.
- `quizStats.category` / `level`: Kategori ve seviye bazlı istatistikler (Map olarak saklanır).

## Öğrenme ilerlemeleri

- `wordProgress`: Her kelime için durum (`new`, `learning`, `review`, `mastered`) ve tarih bilgileri.
- `grammarProgress`: Hangi gramer konularının hangi bölümlerini geçtiği.
- `studyStats`: Özet rakamlar (kaç kelime eklendi, ustalaşıldı vb.).
- `vocabularyStats`: Kelime oyunlarındaki XP, streak, günlük hedef gibi detaylar + son ödül ve oturum bilgisi.

## Diğer notlar

- Çeşitli indeksler liderlik tablolarını hızlandırır.
- `accuracy` adlı sanal alan otomatik hesaplanır.
- `toPublicJSON` metodu: Profilde paylaşılacak güvenli alanları hazırlar.
