# Modular Monolith Architecture Plan

Bu doküman mevcut **English Quiz Master** projesini modüler monolith yapılandırmasına dönüştürürken izlenebilecek yol haritasını ve klasör organizasyonunu detaylı olarak açıklar. Amaç, ileride mikroservis mimarisine geçişi kolaylaştıracak şekilde domain odaklı, güçlü sınırlar içeren ve yeniden kullanılabilir bir backend tasarlamaktır.

---

## 🎯 Hedefler ve İlkeler

- **Domain-Driven Tasarım (DDD) odaklı modüller**: Her modül belirli bir iş alanını kapsar.
- **Katmanlı yapı**: Domain, Application, Infrastructure, Interface katmanlarının ayrılması.
- **Gevşek bağlı, yüksek iç uyum**: Modüller kendi içlerinde bağımlılıkları yönetir; modüller arası iletişim kontratlar aracılığıyla yapılır.
- **Rehberli büyüme**: Modüler monolith olarak başlayıp, belirli modüller olgunlaştığında mikroservis olarak ayrılabilecek altyapı hazırlığı.
- **Tek repository (monorepo)**: Tüm modüller, paylaşılan bileşenler ve client uygulamaları tek repo içinde yapılandırılır.

---

## 🧭 Üst Seviye Yapı

```
Quiz-app/
├── apps/
│   ├── frontend/               # React (Vite) client
│   └── admin-console/          # (Planlı) ayrı admin UI veya CLI
├── libs/
│   ├── shared-kernel/          # Ortak tipler, util fonksiyonlar, baz modeller
│   ├── messaging/              # Domain event & integration event kontratları
│   └── observability/          # Logging, metrics, tracing adapter'ları
└── services/
    ├── api-gateway/            # Express tabanlı modüler monolith uygulaması
    │   ├── src/
    │   │   ├── app/            # Express app cradle
    │   │   ├── config/         # Konfigürasyon yönetimi (dotenv, convict, vb.)
    │   │   ├── core/           # HTTP katmanı, middleware, auth guard, error handler
    │   │   ├── infrastructure/ # Global altyapı: Mongo bağlantısı, cache, queue, mail
    │   │   ├── modules/        # Aşağıda detaylanan domain modülleri
    │   │   ├── plugins/        # Modüllere enjekte edilen ortak plugin'ler
    │   │   ├── routing/        # API endpoint tanımları (REST, GraphQL, gRPC proxy)
    │   │   ├── server.js
    │   │   └── boot.js         # Modül yükleme ve yaşam döngüsü yönetimi
    │   └── tests/
    └── workers/                # (Opsiyonel) background job runner, cron, event consumer
```

---

## 🧩 Modül Önerileri ve Sınırlar

| Modül               | Sorumluluk                                                 | Öne çıkan Aggregate'ler                                 | Kontratlar                                                 |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| **Auth**            | Kullanıcı kimlik doğrulama, token üretimi, sosyal giriş    | `UserIdentity`, `Session`                               | `AuthService`, `TokenService`                              |
| **UserProfile**     | Kullanıcı profil bilgileri, tercihler, avatar, hedefler    | `UserProfile`, `Preference`                             | `ProfileService`, `PreferenceService`                      |
| **QuizCatalog**     | Quiz, Soru, Kategori, Seviye yönetimi                      | `Quiz`, `Question`, `Category`, `Level`                 | `QuizQuery`, `QuizCommand`, `QuestionBank`                 |
| **QuizSession**     | Quiz oturumları, cevap kayıtları, skor hesaplama, sonuçlar | `QuizAttempt`, `AnswerSheet`                            | `QuizSessionService`, domain event `QuizCompleted`         |
| **GrammarProgress** | Gramer konuları, ilerleme takipleri                        | `GrammarTopic`, `GrammarProgress`                       | `GrammarProgressService`                                   |
| **Vocabulary**      | Kelime kategorileri, kelime girişleri, öğrenme planı       | `WordEntry`, `VocabularyCategory`, `VocabularyProgress` | `VocabularyService`, `ReviewScheduler`                     |
| **Gamification**    | Rozet, başarımlar, XP, streak                              | `Badge`, `Achievement`, `UserGamificationStats`         | `GamificationService`, event handler `AchievementUnlocked` |
| **Leaderboard**     | Liderlik tabloları, snapshot, peer comparison              | `Leaderboard`, `LeaderboardSnapshot`                    | `LeaderboardService`, projection `LeaderboardProjection`   |
| **StatsReporting**  | İstatistikler, raporlar, özetler                           | `UserStats`, `DailyStat`                                | `StatsQuery`, `StatsAggregator`                            |
| **Settings**        | Uygulama ayarları, feature flag                            | `AppSetting`, `UserSetting`                             | `SettingsService`                                          |
| **Administration**  | Quiz & vocabulary CRUD, toplu import, rol yönetimi         | reuse from domain modüller + `AdminAudit`               | `AdminService`, `ImportService`, `RoleService`             |

> Not: Her modül kendi `modules/<name>/` klasörü altında katmanlara bölünür.

---

## 🏗️ Modül İç Yapısı

Her modül aşağıdaki alt katmanları barındırır:

```
modules/
└── quiz-session/
    ├── application/
    │   ├── commands/
    │   │   ├── StartQuizSessionCommand.js
    │   │   ├── SubmitQuizAnswerCommand.js
    │   │   └── CompleteQuizSessionCommand.js
    │   ├── queries/
    │   │   └── GetQuizSessionSummaryQuery.js
    │   ├── handlers/
    │   │   ├── StartQuizSessionHandler.js
    │   │   ├── SubmitQuizAnswerHandler.js
    │   │   └── CompleteQuizSessionHandler.js
    │   ├── services/
    │   │   └── QuizScoringService.js
    │   └── dto/
    │       └── QuizSessionDto.js
    ├── domain/
    │   ├── aggregates/
    │   │   └── QuizSession.aggregate.js
    │   ├── entities/
    │   ├── value-objects/
    │   ├── events/
    │   │   └── QuizSessionCompleted.event.js
    │   ├── policies/
    │   └── repositories/
    ├── infrastructure/
    │   ├── persistence/
    │   │   └── QuizSessionMongoRepository.js
    │   ├── mappers/
    │   ├── orm/
    │   └── config/
    ├── interface/
    │   ├── http/
    │   │   └── QuizSessionController.js
    │   ├── graphql/
    │   ├── grpc/
    │   └── websocket/
    └── tests/
        ├── unit/
        ├── integration/
        └── contract/
```

### Katmanların Roller:

- **Domain**: Saf iş kuralları, aggregate'ler, value object'ler, domain event'ler.
- **Application**: Use-case odaklı servis ve handler'lar; domain ile infrastructure arasında köprü.
- **Infrastructure**: Mongo repository implementasyonları, third-party adapter'ları.
- **Interface (API)**: REST/GraphQL/gRPC controller'ları, DTO mapping, auth guard.

---

## 🔄 Modüller Arası İletişim

1. **Domain Event'ler**: Örn. `QuizSessionCompleted` olayı Gamification modülü tarafından dinlenir, `AchievementUnlocked` olayı Stats modülünde proje edilir.
2. **Integration Event'ler**: Sistem dışına veya mikroservislere yayınlanacak event'ler `libs/messaging` altında tanımlanır.
3. **Application Katmanı Arası Çağrılar**: Doğrudan servis çağrısı yerine, orchestrator veya mediator pattern (ör. `nestjs/cqrs` benzeri custom mediator) kullanılabilir.
4. **Read Model Paylaşımı**: Read-only senaryolar için paylaşılan view modeller `StatsReporting` modülünde tutulabilir.

---

## 🗄️ Veri ve Repository Stratejisi

- **Modül başına repository**: Her modül kendi repository arayüzleri ve implementasyonlarını içerir.
- **MongoDB koleksiyonları** domain aggregate'lerine göre organize edilir.
- **Transaction ve tutarlılık**: Kritik senaryolarda Mongo `session` ve `transaction` kullanımı, eventual consistency için outbox pattern.
- **Caching**: Sık erişilen read modeller Redis (veya Netlify/Edge cache) üzerinde tutulabilir.
- **Migration**: `scripts/migrations` altında module-specific migration script'leri.

---

## 🧪 Test Stratejisi

- **Unit test**: Domain ve application seviyesinde saf iş kurallarını doğrular.
- **Integration test**: Modüllerin bir arada çalışmasını test eder (in-memory Mongo veya test container).
- **Contract test**: Controller seviyesinde DTO ve response formatlarını kontrol eder.
- **End-to-end test**: API Gateway üzerinden kullanıcı akışlarını jest veya pact ile doğrular.

```
services/api-gateway/tests/
├── auth/
├── quiz-session/
├── vocabulary/
└── shared/
```

---

## 🔐 Güvenlik ve Yetkilendirme

- **Auth modülü** token üretimi ve doğrulama yapar.
- Her modül kendi route guard'ını sağlayabilir (`modules/auth/application/guards`).
- Rol tabanlı kontrol için `AuthorizationService` merkezi kullanılabilir.
- Admin endpoint'leri `Administration` modülüne taşınır.

---

## 📡 API Katmanı

### REST

- `/api/auth/*`
- `/api/quizzes/*`
- `/api/quiz-sessions/*`
- `/api/vocabulary/*`
- `/api/gamification/*`
- `/api/leaderboard/*`

### GraphQL (opsiyonel ek)

- Tek endpoint: `/api/graphql`
- Modül bazlı resolver'lar (`modules/*/interface/graphql`)

### gRPC (opsiyonel, mikroservise geçiş için hazırlık)

- `proto` dosyaları `libs/messaging/proto/` dizininde.
- gRPC server adapter'ları `interface/grpc` altında.

---

## 🏁 Modüler Monolith'ten Mikroservis'e Geçiş Yolu

1. **Bounded Context netliği**: Her modül kendi bounded context'ine sahip olmalı.
2. **Event izolasyonu**: Domain event'ler modül sınırları içinde, integration event'ler dışa açık.
3. **Infrastructure adapter ayrışması**: Her modülün infrastructure bağımlılıkları soyut arayüzler üzerinden.
4. **Shared Kernel minimizasyonu**: `libs/shared-kernel` minimal tutulur, modüller arası coupling azaltılır.
5. **Veri erişim sınırları**: Başka modülün verisini doğrudan okumak yerine API veya event projection.
6. **Outbox pattern**: Mesaj kuyruğu veya event bus devreye alındığında kolay geçiş.
7. **Feature toggle**: Mikroservise taşınan modüllerin yeni endpoint'leri feature flag ile aktive edilir.

---

## 🚀 Uygulama Adımları

1. **Klasör Yeniden Yapılandırması**

   - `netlify/functions` yerine `services/api-gateway` altında Express tabanlı modüler uygulama kur.
   - Mevcut modelleri ilgili modüllerin domain katmanına taşı.

2. **Domain Model Refactoring**

   - Her module için aggregate root'ları belirle.
   - Value object ve entity ayrımlarını yap.

3. **Application Katmanı Kurulumu**

   - CQRS yaklaşımıyla command/handler ve query/handler yapısı kurgula.
   - DTO ve mapper'ları domain'den ayır.

4. **Infrastructure Adapter'ları**

   - Mongoose schema'larını infrastructure katmanına taşı.
   - Repository interface'lerini domain veya application katmanında tanımla.

5. **Interface Katmanı**

   - Router/controller'ları modül bazlı organize et.
   - Middleware (auth, validation, rate limit) modüler olarak ekle.

6. **Cross-Cutting Concern Modulizasyonu**

   - Logging, validation, error handling `core/` altında merkezi hale getir.
   - Observability (metrics, tracing) `libs/observability` altında soyutla.

7. **Test Suite Güncellemesi**
   - Modül başına unit/integration coverage sağla.
   - Eski jest testlerini yeni yapıya göre düzenle.

---

## 📂 Örnek Modül: Gamification

```
modules/gamification/
├── application/
│   ├── commands/
│   │   ├── EvaluateAchievementsCommand.js
│   │   └── AwardBadgeCommand.js
│   ├── handlers/
│   │   ├── EvaluateAchievementsHandler.js
│   │   └── AwardBadgeHandler.js
│   ├── services/
│   │   ├── AchievementEvaluator.js
│   │   └── BadgeService.js
│   └── dto/
│       └── AchievementDto.js
├── domain/
│   ├── aggregates/
│   │   └── GamificationProfile.aggregate.js
│   ├── entities/
│   │   ├── Badge.entity.js
│   │   └── Achievement.entity.js
│   ├── value-objects/
│   │   └── Tier.vo.js
│   ├── policies/
│   │   └── RepeatableAchievementPolicy.js
│   └── events/
│       └── AchievementUnlocked.event.js
├── infrastructure/
│   ├── persistence/
│   │   └── GamificationProfileRepository.js
│   └── mappers/
│       └── GamificationProfileMapper.js
├── interface/
│   └── http/
│       └── GamificationController.js
└── tests/
    ├── unit/
    ├── integration/
    └── contract/
```

---

## 🔄 Deployment ve Operasyon

- **Tek servis deploy**: Modüler monolith `api-gateway` servisi tek Node.js uygulaması olarak yayınlanır.
- **CI Pipeline**:
  1. Lint + Unit Test (module bazlı)
  2. Integration Test (mock infrastructure)
  3. Contract Test
  4. Build & package (Docker image)
- **Observability**: Centralized logging (ELK), metrics (Prometheus), tracing (Jaeger) adaptörleri.
- **Feature Toggle**: Config-based veya LaunchDarkly/Toggles servisleri.

---

## 🧭 Sonraki Adımlar için Kontrol Listesi

- [ ] Mevcut kod tabanını modül sınırlarına göre analiz et.
- [ ] Bounded context diyagramı çıkar.
- [ ] Shared modelleri ayrıştır, shared-kernel'i minimize et.
- [ ] Event akışlarını tanımla (domain vs integration event).
- [ ] API kontratlarını modül bazlı yeniden tanımla.
- [ ] Infrastructure bağımlılıklarını soyutla (mail, queue, storage).
- [ ] CI pipeline'ı modüler yapıya göre düzenle.
- [ ] Observability planını yeniden yapılandır.
- [ ] Gelecek mikroservis geçişi için context map oluştur.

---

## 📘 Ek Kaynaklar

- **Kitap**: _Implementing Domain-Driven Design_ – Vaughn Vernon
- **Makale**: "Modular Monoliths" – Kamil Grzybek
- **Makale**: "From Monolith to Microservices" – Sam Newman
- **Video**: .NET Community Standup – Modular Monoliths

---

Bu plan uygulamanın sürdürülebilirliğini, test edilebilirliğini ve ileride mikroservis mimarisine geçiş kabiliyetini artırmayı hedefler. Her modül bağımsız olarak evrilebilir, yeni işlevler eklendikçe domain sınırları korunarak teknik borç yönetilebilir. Gelecekte mikroservis mimarisi için gerekli olan contract, event ve altyapı soyutlamaları modüler yapı sayesinde şimdiden hazırlanır.
