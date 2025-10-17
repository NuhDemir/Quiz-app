# TypeScript'e Giriş ve Kurulum

## İçindekiler
1. [TypeScript Nedir?](#typescript-nedir)
2. [Neden TypeScript Kullanmalıyız?](#neden-typescript-kullanmalıyız)
3. [JavaScript vs TypeScript](#javascript-vs-typescript)
4. [TypeScript Kurulumu](#typescript-kurulumu)
5. [İlk TypeScript Projesi](#ilk-typescript-projesi)
6. [TypeScript Compiler (tsc)](#typescript-compiler-tsc)
7. [tsconfig.json Dosyası](#tsconfigjson-dosyası)
8. [IDE ve Editor Desteği](#ide-ve-editor-desteği)
9. [Debugging TypeScript](#debugging-typescript)
10. [Best Practices](#best-practices)

## TypeScript Nedir?

TypeScript, Microsoft tarafından geliştirilen ve JavaScript'in bir üst kümesi (superset) olan açık kaynaklı bir programlama dilidir. TypeScript, JavaScript'e statik tip kontrolü ve modern programlama dili özelliklerini ekler.

### Temel Özellikler

**1. Statik Tip Sistemi**
```typescript
// JavaScript
function greet(name) {
    return "Hello, " + name;
}

// TypeScript
function greet(name: string): string {
    return "Hello, " + name;
}
```

**2. Compile-time Hata Kontrolü**
```typescript
function add(a: number, b: number): number {
    return a + b;
}

add(5, "10"); // Hata: Argument of type 'string' is not assignable to parameter of type 'number'
```

**3. Modern JavaScript Özellikleri**
```typescript
// ES6+ özellikler
class Person {
    constructor(private name: string, private age: number) {}
    
    greet(): string {
        return `Hello, I'm ${this.name} and I'm ${this.age} years old.`;
    }
}

const person = new Person("John", 30);
console.log(person.greet());
```

**4. Interface ve Type Definitions**
```typescript
interface User {
    id: number;
    name: string;
    email: string;
    isActive?: boolean; // Optional property
}

function createUser(userData: User): User {
    return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        isActive: userData.isActive ?? true
    };
}
```

## Neden TypeScript Kullanmalıyız?

### 1. Hata Yakalama ve Önleme

**Compile-time Hata Yakalama:**
```typescript
// Bu kod compile edilmez
function calculateArea(width: number, height: number): number {
    return width * height;
}

calculateArea("10", 20); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Runtime Hatalarını Önleme:**
```typescript
interface ApiResponse {
    data: any[];
    status: number;
    message: string;
}

function processApiResponse(response: ApiResponse) {
    // response.data'nın array olduğundan emin olabiliriz
    return response.data.map(item => item.id);
}
```

### 2. Gelişmiş IDE Desteği

**IntelliSense ve Autocomplete:**
```typescript
interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
}

function displayProduct(product: Product) {
    // IDE otomatik olarak Product interface'inin özelliklerini önerir
    console.log(product.); // id, name, price, category, inStock
}
```

**Refactoring Desteği:**
```typescript
class UserService {
    private users: User[] = [];
    
    // Method adını değiştirdiğimizde, tüm kullanımları otomatik güncellenir
    findUserById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }
}
```

### 3. Kod Kalitesi ve Maintainability

**Self-Documenting Code:**
```typescript
// Fonksiyonun ne aldığı ve ne döndürdüğü açık
function calculateTax(
    amount: number, 
    taxRate: number, 
    includeDiscount: boolean = false
): { netAmount: number; taxAmount: number; totalAmount: number } {
    const discount = includeDiscount ? amount * 0.1 : 0;
    const netAmount = amount - discount;
    const taxAmount = netAmount * taxRate;
    const totalAmount = netAmount + taxAmount;
    
    return { netAmount, taxAmount, totalAmount };
}
```

**Large Scale Development:**
```typescript
// Büyük projelerde tip güvenliği kritik
namespace PaymentSystem {
    export interface PaymentMethod {
        id: string;
        type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
        isDefault: boolean;
    }
    
    export interface PaymentRequest {
        amount: number;
        currency: string;
        paymentMethodId: string;
        description?: string;
    }
    
    export class PaymentProcessor {
        processPayment(request: PaymentRequest): Promise<PaymentResult> {
            // Implementation
        }
    }
}
```

## JavaScript vs TypeScript

### Syntax Karşılaştırması

**JavaScript:**
```javascript
// Değişken tanımlama
var name = "John";
let age = 30;
const isActive = true;

// Fonksiyon tanımlama
function add(a, b) {
    return a + b;
}

// Object tanımlama
const user = {
    id: 1,
    name: "John Doe",
    email: "john@example.com"
};

// Array tanımlama
const numbers = [1, 2, 3, 4, 5];
```

**TypeScript:**
```typescript
// Tip belirtmeli değişken tanımlama
let name: string = "John";
let age: number = 30;
const isActive: boolean = true;

// Tip belirtmeli fonksiyon tanımlama
function add(a: number, b: number): number {
    return a + b;
}

// Interface ile object tanımlama
interface User {
    id: number;
    name: string;
    email: string;
}

const user: User = {
    id: 1,
    name: "John Doe",
    email: "john@example.com"
};

// Tip belirtmeli array tanımlama
const numbers: number[] = [1, 2, 3, 4, 5];
const users: User[] = [];
```

### Gelişmiş TypeScript Özellikleri

**Generics:**
```typescript
function identity<T>(arg: T): T {
    return arg;
}

let output1 = identity<string>("myString");
let output2 = identity<number>(100);

// Generic interface
interface Repository<T> {
    findById(id: number): T | undefined;
    save(entity: T): T;
    delete(id: number): boolean;
}

class UserRepository implements Repository<User> {
    private users: User[] = [];
    
    findById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }
    
    save(entity: User): User {
        this.users.push(entity);
        return entity;
    }
    
    delete(id: number): boolean {
        const index = this.users.findIndex(user => user.id === id);
        if (index > -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    }
}
```

**Union Types:**
```typescript
type Status = 'pending' | 'approved' | 'rejected';
type ID = string | number;

interface Task {
    id: ID;
    title: string;
    status: Status;
    assignee?: User;
}

function updateTaskStatus(taskId: ID, newStatus: Status): void {
    // Implementation
}
```

**Intersection Types:**
```typescript
interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

interface Auditable {
    createdBy: string;
    updatedBy: string;
}

type AuditableEntity = Timestamped & Auditable;

interface Product extends AuditableEntity {
    id: number;
    name: string;
    price: number;
}
```

## TypeScript Kurulumu

### 1. Node.js Kurulumu

TypeScript'i kullanmak için önce Node.js kurulu olmalıdır.

```bash
# Node.js versiyonunu kontrol et
node --version
npm --version
```

### 2. Global TypeScript Kurulumu

```bash
# Global olarak TypeScript compiler kurulumu
npm install -g typescript

# Versiyon kontrolü
tsc --version
```

### 3. Proje Bazlı Kurulum

```bash
# Yeni proje oluştur
mkdir my-typescript-project
cd my-typescript-project

# package.json oluştur
npm init -y

# TypeScript'i dev dependency olarak kur
npm install --save-dev typescript
npm install --save-dev @types/node

# TypeScript config dosyası oluştur
npx tsc --init
```

### 4. Development Dependencies

```bash
# Geliştirme için yararlı paketler
npm install --save-dev ts-node nodemon
npm install --save-dev @types/node

# ESLint ve Prettier (opsiyonel)
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier
```

### 5. Package.json Scripts

```json
{
  "name": "my-typescript-project",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "watch": "tsc --watch",
    "dev:watch": "nodemon --exec ts-node src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0",
    "ts-node": "^10.0.0",
    "nodemon": "^2.0.0"
  }
}
```

## İlk TypeScript Projesi

### Proje Yapısı

```
my-typescript-project/
├── src/
│   ├── index.ts
│   ├── models/
│   │   └── User.ts
│   ├── services/
│   │   └── UserService.ts
│   └── utils/
│       └── helpers.ts
├── dist/
├── node_modules/
├── package.json
├── tsconfig.json
└── README.md
```

### 1. Model Tanımlama (src/models/User.ts)

```typescript
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    email: string;
    age: number;
}

export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    age?: number;
    isActive?: boolean;
}

export class UserEntity implements User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: CreateUserRequest) {
        this.id = Math.floor(Math.random() * 10000);
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.age = data.age;
        this.isActive = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    update(data: UpdateUserRequest): void {
        if (data.firstName !== undefined) this.firstName = data.firstName;
        if (data.lastName !== undefined) this.lastName = data.lastName;
        if (data.email !== undefined) this.email = data.email;
        if (data.age !== undefined) this.age = data.age;
        if (data.isActive !== undefined) this.isActive = data.isActive;
        this.updatedAt = new Date();
    }

    toJSON(): User {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            age: this.age,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
```

### 2. Service Katmanı (src/services/UserService.ts)

```typescript
import { User, UserEntity, CreateUserRequest, UpdateUserRequest } from '../models/User';

export class UserService {
    private users: UserEntity[] = [];
    private static instance: UserService;

    private constructor() {}

    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    createUser(userData: CreateUserRequest): User {
        // Email validation
        if (!this.isValidEmail(userData.email)) {
            throw new Error('Invalid email format');
        }

        // Check if email already exists
        if (this.findByEmail(userData.email)) {
            throw new Error('Email already exists');
        }

        // Age validation
        if (userData.age < 0 || userData.age > 150) {
            throw new Error('Invalid age');
        }

        const user = new UserEntity(userData);
        this.users.push(user);
        return user.toJSON();
    }

    findById(id: number): User | undefined {
        const user = this.users.find(u => u.id === id);
        return user?.toJSON();
    }

    findByEmail(email: string): User | undefined {
        const user = this.users.find(u => u.email === email);
        return user?.toJSON();
    }

    getAllUsers(): User[] {
        return this.users.map(user => user.toJSON());
    }

    getActiveUsers(): User[] {
        return this.users
            .filter(user => user.isActive)
            .map(user => user.toJSON());
    }

    updateUser(id: number, updateData: UpdateUserRequest): User | undefined {
        const userIndex = this.users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        // Email validation if email is being updated
        if (updateData.email && !this.isValidEmail(updateData.email)) {
            throw new Error('Invalid email format');
        }

        // Check if new email already exists
        if (updateData.email) {
            const existingUser = this.findByEmail(updateData.email);
            if (existingUser && existingUser.id !== id) {
                throw new Error('Email already exists');
            }
        }

        // Age validation if age is being updated
        if (updateData.age !== undefined && (updateData.age < 0 || updateData.age > 150)) {
            throw new Error('Invalid age');
        }

        this.users[userIndex].update(updateData);
        return this.users[userIndex].toJSON();
    }

    deleteUser(id: number): boolean {
        const userIndex = this.users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return false;
        }

        this.users.splice(userIndex, 1);
        return true;
    }

    deactivateUser(id: number): User | undefined {
        return this.updateUser(id, { isActive: false });
    }

    activateUser(id: number): User | undefined {
        return this.updateUser(id, { isActive: true });
    }

    searchUsers(query: string): User[] {
        const lowercaseQuery = query.toLowerCase();
        return this.users
            .filter(user => 
                user.firstName.toLowerCase().includes(lowercaseQuery) ||
                user.lastName.toLowerCase().includes(lowercaseQuery) ||
                user.email.toLowerCase().includes(lowercaseQuery)
            )
            .map(user => user.toJSON());
    }

    getUsersByAgeRange(minAge: number, maxAge: number): User[] {
        return this.users
            .filter(user => user.age >= minAge && user.age <= maxAge)
            .map(user => user.toJSON());
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Statistics methods
    getTotalUsersCount(): number {
        return this.users.length;
    }

    getActiveUsersCount(): number {
        return this.users.filter(user => user.isActive).length;
    }

    getAverageAge(): number {
        if (this.users.length === 0) return 0;
        const totalAge = this.users.reduce((sum, user) => sum + user.age, 0);
        return Math.round(totalAge / this.users.length * 100) / 100;
    }
}
```

### 3. Utility Functions (src/utils/helpers.ts)

```typescript
export class DateHelper {
    static formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    static formatDateTime(date: Date): string {
        return date.toLocaleString();
    }

    static isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    static daysSince(date: Date): number {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

export class ValidationHelper {
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidAge(age: number): boolean {
        return age >= 0 && age <= 150;
    }

    static isValidName(name: string): boolean {
        return name.trim().length >= 2 && name.trim().length <= 50;
    }

    static sanitizeString(input: string): string {
        return input.trim().replace(/[<>]/g, '');
    }
}

export class ArrayHelper {
    static chunk<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    static unique<T>(array: T[]): T[] {
        return [...new Set(array)];
    }

    static groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
        return array.reduce((groups, item) => {
            const group = String(item[key]);
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {} as Record<string, T[]>);
    }

    static sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
}

export class Logger {
    private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

    static setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
        Logger.logLevel = level;
    }

    static debug(message: string, ...args: any[]): void {
        if (Logger.shouldLog('debug')) {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    static info(message: string, ...args: any[]): void {
        if (Logger.shouldLog('info')) {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    static warn(message: string, ...args: any[]): void {
        if (Logger.shouldLog('warn')) {
            console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }

    static error(message: string, error?: Error, ...args: any[]): void {
        if (Logger.shouldLog('error')) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...args);
        }
    }

    private static shouldLog(level: string): boolean {
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(Logger.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
}
```

### 4. Ana Uygulama (src/index.ts)

```typescript
import { UserService } from './services/UserService';
import { CreateUserRequest } from './models/User';
import { Logger, DateHelper, ValidationHelper } from './utils/helpers';

// Logger seviyesini ayarla
Logger.setLogLevel('debug');

function main(): void {
    Logger.info('TypeScript uygulaması başlatılıyor...');

    const userService = UserService.getInstance();

    try {
        // Test kullanıcıları oluştur
        const testUsers: CreateUserRequest[] = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                age: 30
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                age: 25
            },
            {
                firstName: 'Bob',
                lastName: 'Johnson',
                email: 'bob.johnson@example.com',
                age: 35
            }
        ];

        Logger.info('Test kullanıcıları oluşturuluyor...');
        
        testUsers.forEach(userData => {
            try {
                const user = userService.createUser(userData);
                Logger.debug('Kullanıcı oluşturuldu:', user);
            } catch (error) {
                Logger.error('Kullanıcı oluşturma hatası:', error as Error);
            }
        });

        // Tüm kullanıcıları listele
        Logger.info('Tüm kullanıcılar:');
        const allUsers = userService.getAllUsers();
        allUsers.forEach(user => {
            console.log(`- ${user.fullName} (${user.email}) - Yaş: ${user.age}`);
            console.log(`  Oluşturulma: ${DateHelper.formatDateTime(user.createdAt)}`);
            console.log(`  Aktif: ${user.isActive ? 'Evet' : 'Hayır'}`);
        });

        // İstatistikler
        Logger.info('\n=== İstatistikler ===');
        console.log(`Toplam kullanıcı sayısı: ${userService.getTotalUsersCount()}`);
        console.log(`Aktif kullanıcı sayısı: ${userService.getActiveUsersCount()}`);
        console.log(`Ortalama yaş: ${userService.getAverageAge()}`);

        // Kullanıcı arama
        Logger.info('\n=== Arama Testi ===');
        const searchResults = userService.searchUsers('john');
        console.log(`"john" araması sonuçları (${searchResults.length} sonuç):`);
        searchResults.forEach(user => {
            console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
        });

        // Yaş aralığına göre filtreleme
        const ageRangeResults = userService.getUsersByAgeRange(25, 35);
        console.log(`\n25-35 yaş arası kullanıcılar (${ageRangeResults.length} sonuç):`);
        ageRangeResults.forEach(user => {
            console.log(`- ${user.firstName} ${user.lastName} - Yaş: ${user.age}`);
        });

        // Kullanıcı güncelleme
        Logger.info('\n=== Güncelleme Testi ===');
        const firstUser = allUsers[0];
        if (firstUser) {
            Logger.info(`${firstUser.firstName} kullanıcısı güncelleniyor...`);
            const updatedUser = userService.updateUser(firstUser.id, {
                age: 31,
                firstName: 'Johnny'
            });
            
            if (updatedUser) {
                console.log('Güncellenmiş kullanıcı:', updatedUser);
            }
        }

        // Hata testi
        Logger.info('\n=== Hata Testi ===');
        try {
            userService.createUser({
                firstName: 'Test',
                lastName: 'User',
                email: 'invalid-email',
                age: 25
            });
        } catch (error) {
            Logger.warn('Beklenen hata yakalandı:', (error as Error).message);
        }

        try {
            userService.createUser({
                firstName: 'Test',
                lastName: 'User',
                email: 'john.doe@example.com', // Zaten var olan email
                age: 25
            });
        } catch (error) {
            Logger.warn('Beklenen hata yakalandı:', (error as Error).message);
        }

        Logger.info('Uygulama başarıyla tamamlandı!');

    } catch (error) {
        Logger.error('Uygulama hatası:', error as Error);
        process.exit(1);
    }
}

// Uygulamayı başlat
main();
```

## TypeScript Compiler (tsc)

### Temel Kullanım

```bash
# Tek dosya compile etme
tsc index.ts

# Tüm projeyi compile etme
tsc

# Watch mode (değişiklikleri izle)
tsc --watch

# Belirli bir config dosyası ile
tsc --project tsconfig.production.json
```

### Compiler Options

```bash
# Target JavaScript version
tsc --target ES2020 index.ts

# Module system
tsc --module commonjs index.ts

# Output directory
tsc --outDir dist src/**/*.ts

# Source maps oluştur
tsc --sourceMap index.ts

# Strict mode
tsc --strict index.ts

# Declaration files oluştur
tsc --declaration index.ts
```

## tsconfig.json Dosyası

### Temel Konfigürasyon

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### Gelişmiş Konfigürasyon

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@models/*": ["src/models/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"]
    },
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "inlineSources": true,
    "removeComments": false,
    "importHelpers": true,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": [
    "src/**/*",
    "types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.e2e-spec.ts"
  ],
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  }
}
```

## IDE ve Editor Desteği

### Visual Studio Code

**Önerilen Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

**VS Code Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.quoteStyle": "single",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.ts": "typescript"
  }
}
```

### WebStorm/IntelliJ IDEA

**TypeScript Service Ayarları:**
- File → Settings → Languages & Frameworks → TypeScript
- TypeScript Service: Enabled
- Use TypeScript Service: Always
- Recompile on changes: Yes

## Debugging TypeScript

### VS Code Debug Configuration

**.vscode/launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TypeScript",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Compiled JS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "tsc: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Source Maps

**tsconfig.json için source map ayarları:**
```json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true,
    "sourceRoot": "/"
  }
}
```

## Best Practices

### 1. Tip Güvenliği

```typescript
// ✅ İyi
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User | null {
  // Implementation
}

// ❌ Kötü
function getUser(id: any): any {
  // Implementation
}
```

### 2. Null Safety

```typescript
// ✅ İyi
function processUser(user: User | null): string {
  if (user === null) {
    return "User not found";
  }
  return `Hello, ${user.name}`;
}

// Optional chaining kullanımı
const userName = user?.profile?.name ?? "Unknown";

// ❌ Kötü
function processUser(user: User): string {
  return `Hello, ${user.name}`; // user null olabilir
}
```

### 3. Generic Kullanımı

```typescript
// ✅ İyi
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // Implementation
}

// ❌ Kötü
interface ApiResponse {
  data: any;
  status: number;
  message: string;
}
```

### 4. Enum vs Union Types

```typescript
// ✅ İyi - String literal union types
type Status = 'pending' | 'approved' | 'rejected';

// ✅ İyi - Const assertions
const STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

type Status = typeof STATUSES[keyof typeof STATUSES];

// ⚠️ Dikkatli kullan - Numeric enums
enum Status {
  Pending,
  Approved,
  Rejected
}
```

### 5. Interface vs Type

```typescript
// ✅ Interface - Genişletilebilir objeler için
interface User {
  id: number;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}

// ✅ Type - Union types, primitives, computed types için
type ID = string | number;
type EventHandler<T> = (event: T) => void;
type UserKeys = keyof User;
```

Bu kapsamlı TypeScript giriş rehberi, dilin temellerinden başlayarak pratik kullanım örneklerine kadar geniş bir yelpazede bilgi sunmaktadır. Sonraki derslerde daha ileri seviye konuları ele alacağız.