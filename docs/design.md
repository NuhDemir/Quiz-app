# İngilizce Quiz Uygulaması - Tasarım Belgesi

## 1. Sistem Mimarisi

### 1.1 Genel Mimari
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Veritabanı    │
│   (React)       │◄──►│  (Node.js +     │◄──►│   (MongoDB)     │
│                 │    │   Express.js)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │  File Storage   │    │   External      │
│   Assets        │    │  (AWS S3/       │    │   Services      │
│                 │    │   Cloudinary)   │    │  (Email, Auth)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 Katmanlı Mimari (Layered Architecture)

#### Frontend Katmanları:
1. **Presentation Layer (UI Components)**
   - React Components
   - Material-UI/Ant Design
   - Responsive Design

2. **State Management Layer**
   - Redux Store
   - Context API
   - Local Component State

3. **Service Layer**
   - API Calls
   - HTTP Client (Axios)
   - Error Handling

4. **Utility Layer**
   - Helper Functions
   - Constants
   - Validators

#### Backend Katmanları:
1. **Router Layer**
   - Express Routes
   - Middleware
   - Request Validation

2. **Controller Layer**
   - Business Logic
   - Request/Response Handling
   - Error Management

3. **Service Layer**
   - Core Business Logic
   - External API Integration
   - File Processing

4. **Data Access Layer**
   - MongoDB Operations
   - Mongoose Models
   - Query Optimization

## 2. Veritabanı Tasarımı

### 2.1 MongoDB Koleksiyonları

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed),
  profile: {
    firstName: String,
    lastName: String,
    avatar: String (URL),
    age: Number,
    currentLevel: String, // A1, A2, B1, B2, C1, C2
    targetLevel: String,
    nativeLanguage: String
  },
  stats: {
    totalQuestions: Number,
    correctAnswers: Number,
    accuracy: Number,
    streak: Number,
    lastActiveDate: Date,
    totalStudyTime: Number // minutes
  },
  preferences: {
    language: String, // tr, en
    notifications: Boolean,
    soundEffects: Boolean,
    theme: String // light, dark
  },
  achievements: [{
    badgeId: ObjectId,
    earnedDate: Date,
    category: String
  }],
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  emailVerified: Boolean,
  socialLogins: {
    google: String,
    facebook: String
  }
}
```

#### Questions Collection
```javascript
{
  _id: ObjectId,
  title: String,
  type: String, // multiple-choice, fill-blank, true-false, matching
  category: String, // grammar, vocabulary, reading, structure, idioms
  level: String, // A1, A2, B1, B2, C1, C2
  difficulty: Number, // 1-5
  question: {
    text: String,
    image: String (URL),
    options: [String], // for multiple choice
    blanks: [String], // for fill-in-the-blank
    pairs: [{left: String, right: String}] // for matching
  },
  correctAnswer: {
    value: String/Array,
    explanation: String
  },
  tags: [String],
  timeLimit: Number, // seconds
  points: Number,
  statistics: {
    totalAttempts: Number,
    correctAttempts: Number,
    averageTime: Number
  },
  createdBy: ObjectId, // admin user
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

#### UserAnswers Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  questionId: ObjectId,
  quizSessionId: ObjectId,
  userAnswer: String/Array,
  isCorrect: Boolean,
  timeTaken: Number, // seconds
  pointsEarned: Number,
  answeredAt: Date,
  hintsUsed: Number
}
```

#### QuizSessions Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  sessionType: String, // practice, challenge, tournament
  category: String,
  level: String,
  questions: [ObjectId],
  startedAt: Date,
  completedAt: Date,
  totalQuestions: Number,
  correctAnswers: Number,
  totalPoints: Number,
  accuracy: Number,
  totalTime: Number, // seconds
  isCompleted: Boolean
}
```

#### Badges Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  icon: String (URL),
  category: String, // streak, accuracy, time, quantity
  requirements: {
    type: String, // streak, correct_answers, time_spent, etc.
    value: Number,
    category: String // optional
  },
  rarity: String, // common, rare, epic, legendary
  points: Number,
  isActive: Boolean
}
```

### 2.2 İndeksler
```javascript
// Users Collection
db.users.createIndex({ email: 1 })
db.users.createIndex({ "stats.accuracy": -1 })
db.users.createIndex({ createdAt: -1 })

// Questions Collection  
db.questions.createIndex({ category: 1, level: 1 })
db.questions.createIndex({ difficulty: 1 })
db.questions.createIndex({ tags: 1 })
db.questions.createIndex({ "statistics.correctAttempts": -1 })

// UserAnswers Collection
db.userAnswers.createIndex({ userId: 1, answeredAt: -1 })
db.userAnswers.createIndex({ questionId: 1 })
db.userAnswers.createIndex({ quizSessionId: 1 })

// QuizSessions Collection
db.quizSessions.createIndex({ userId: 1, startedAt: -1 })
db.quizSessions.createIndex({ category: 1, level: 1 })
```

## 3. API Tasarımı

### 3.1 RESTful API Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login  
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
```

#### Users
```
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
GET    /api/users/stats
GET    /api/users/achievements
POST   /api/users/avatar
```

#### Questions
```
GET    /api/questions              // with filters
GET    /api/questions/:id
POST   /api/questions              // admin only
PUT    /api/questions/:id          // admin only
DELETE /api/questions/:id          // admin only
GET    /api/questions/random       // for quiz
```

#### Quiz
```
POST   /api/quiz/start
POST   /api/quiz/submit-answer
POST   /api/quiz/complete
GET    /api/quiz/sessions
GET    /api/quiz/sessions/:id
```

#### Statistics
```
GET    /api/stats/user
GET    /api/stats/leaderboard
GET    /api/stats/progress
GET    /api/stats/category-performance
```

### 3.2 WebSocket Events
```javascript
// Real-time features
socket.on('challenge_received', data)
socket.on('challenge_accepted', data)
socket.on('tournament_started', data)
socket.on('leaderboard_updated', data)
```

## 4. Frontend Tasarımı

### 4.1 Komponent Hiyerarşisi
```
App
├── Router
├── Header
│   ├── Navigation
│   ├── UserMenu
│   └── LanguageSelector
├── Main
│   ├── Home
│   ├── Quiz
│   │   ├── QuizLobby
│   │   ├── QuizPlayer
│   │   └── QuizResults
│   ├── Profile
│   │   ├── ProfileInfo
│   │   ├── Statistics
│   │   └── Achievements
│   ├── Leaderboard
│   └── Settings
└── Footer
```

### 4.2 State Management (Redux Store)
```javascript
store = {
  auth: {
    user: {},
    token: '',
    isAuthenticated: false,
    loading: false
  },
  quiz: {
    currentSession: {},
    questions: [],
    currentQuestion: 0,
    answers: [],
    timeRemaining: 0,
    isActive: false
  },
  user: {
    profile: {},
    stats: {},
    achievements: [],
    preferences: {}
  },
  ui: {
    theme: 'light',
    language: 'tr',
    notifications: [],
    loading: false
  }
}
```

### 4.3 Sayfa Yapıları

#### Ana Sayfa (Home)
```
┌─────────────────────────────────────────┐
│              Header                     │
├─────────────────────────────────────────┤
│  Welcome Message & Quick Stats          │
├─────────────────────────────────────────┤
│           Quiz Categories              │
│  [Grammar] [Vocabulary] [Reading]     │
│  [Structure] [Idioms]                 │
├─────────────────────────────────────────┤
│        Recent Activity &               │
│        Progress Chart                  │
├─────────────────────────────────────────┤
│            Footer                      │
└─────────────────────────────────────────┘
```

#### Quiz Oyun Sayfası
```
┌─────────────────────────────────────────┐
│     Progress Bar & Timer               │
├─────────────────────────────────────────┤
│                                         │
│           Question Area                 │
│        (Text/Image)                   │
│                                         │
├─────────────────────────────────────────┤
│           Answer Options               │
│    ○ Option A    ○ Option C           │
│    ○ Option B    ○ Option D           │
├─────────────────────────────────────────┤
│  [Hint] [Skip]    [Previous] [Next]   │
└─────────────────────────────────────────┘
```

### 4.4 Responsive Breakpoints
```css
/* Mobile First Approach */
/* Small devices (phones) */
@media (max-width: 576px) { ... }

/* Medium devices (tablets) */
@media (min-width: 577px) and (max-width: 768px) { ... }

/* Large devices (desktops) */
@media (min-width: 769px) and (max-width: 1024px) { ... }

/* Extra large devices (large desktops) */
@media (min-width: 1025px) { ... }
```

## 5. UI/UX Tasarım Prensipleri

### 5.1 Renk Paleti
```css
:root {
  /* Primary Colors */
  --primary-blue: #2196F3;
  --primary-dark: #1976D2;
  --primary-light: #64B5F6;
  
  /* Secondary Colors */
  --secondary-green: #4CAF50;
  --secondary-orange: #FF9800;
  --secondary-red: #F44336;
  
  /* Neutral Colors */
  --neutral-white: #FFFFFF;
  --neutral-light: #F5F5F5;
  --neutral-medium: #9E9E9E;
  --neutral-dark: #424242;
  --neutral-black: #212121;
  
  /* Status Colors */
  --success: #4CAF50;
  --warning: #FF9800;
  --error: #F44336;
  --info: #2196F3;
}
```

### 5.2 Typography
```css
/* Font Families */
--font-primary: 'Roboto', sans-serif;
--font-secondary: 'Open Sans', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */  
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### 5.3 Component Design Guidelines

#### Buttons
- Primary: Mavi arka plan, beyaz metin
- Secondary: Şeffaf arka plan, mavi kenarlık
- Success: Yeşil arka plan, beyaz metin  
- Danger: Kırmızı arka plan, beyaz metin

#### Cards
- Hafif gölge efekti
- Yuvarlatılmış köşeler (8px)
- Beyaz arka plan
- Padding: 16-24px

#### Form Elements
- Material Design stil
- Label animasyonları
- Validation mesajları
- Focus states

### 5.4 Animasyon ve Geçişler
```css
/* Transition Timing */
--transition-fast: 0.15s ease-in-out;
--transition-normal: 0.3s ease-in-out;
--transition-slow: 0.5s ease-in-out;

/* Common Animations */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.slide-up {
  animation: slideUp 0.4s ease-out;
}

.bounce {
  animation: bounce 0.6s ease-in-out;
}
```

## 6. Güvenlik Tasarımı

### 6.1 Authentication & Authorization
- JWT Token tabanlı kimlik doğrulama
- Refresh token mekanizması
- Role-based access control (RBAC)
- Session timeout

### 6.2 Veri Güvenliği
- Şifre hashleme (bcrypt)
- Input validation ve sanitization
- SQL injection koruması
- XSS koruması
- CSRF koruması

### 6.3 API Güvenliği
- Rate limiting
- CORS konfigürasyonu  
- Helmet.js güvenlik headers
- Request size limiting

## 7. Performans Optimizasyonu

### 7.1 Frontend Optimizasyon
- Code splitting (React.lazy)
- Image lazy loading
- Component memoization
- Bundle optimization
- Service Worker (PWA)

### 7.2 Backend Optimizasyon
- Database indexing
- Query optimization
- Caching (Redis)
- Compression middleware
- CDN kullanımı

### 7.3 Veritabanı Optimizasyon
- Proper indexing strategy
- Query performance monitoring
- Connection pooling
- Data pagination

## 8. Monitoring ve Analytics

### 8.1 Application Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- API monitoring

### 8.2 Business Metrics
- User engagement
- Quiz completion rates
- Learning progress
- Feature usage statistics

## 9. Deployment Architecture

### 9.1 Development Environment
```
Developer Machine
├── Frontend (React Dev Server)
├── Backend (Node.js + Nodemon)  
├── Database (MongoDB Local)
└── File Storage (Local)
```

### 9.2 Production Environment
```
CDN (CloudFlare)
├── Frontend (Vercel/Netlify)
├── Load Balancer
├── Backend Servers (Multiple Instances)
├── Database Cluster (MongoDB Atlas)
└── File Storage (AWS S3/Cloudinary)
```

Bu tasarım belgesi, uygulamanın tüm teknik aspektlerini kapsar ve geliştiriciler için net bir rehber sağlar.