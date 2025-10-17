# TypeScript Interface ve Class Yapıları

## İçindekiler
1. [Interface Temelleri](#interface-temelleri)
2. [Interface Inheritance](#interface-inheritance)
3. [Class Tanımlama ve Kullanımı](#class-tanımlama-ve-kullanımı)
4. [Access Modifiers](#access-modifiers)
5. [Abstract Classes](#abstract-classes)
6. [Class Inheritance](#class-inheritance)
7. [Interface Implementation](#interface-implementation)
8. [Static Members](#static-members)
9. [Getters ve Setters](#getters-ve-setters)
10. [Advanced Patterns](#advanced-patterns)

## Interface Temelleri

Interface'ler TypeScript'te object şekillerini tanımlamak için kullanılan güçlü bir yapıdır. Compile time'da tip kontrolü sağlar ve runtime'da herhangi bir kod üretmez.

### Temel Interface Tanımlaması

```typescript
// Basit interface tanımı
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
}

// Optional properties
interface UserProfile {
    id: number;
    name: string;
    email: string;
    age?: number; // Optional
    bio?: string; // Optional
    avatar?: string; // Optional
}

// Readonly properties
interface ImmutableUser {
    readonly id: number;
    readonly createdAt: Date;
    name: string;
    email: string;
}

// Function signatures in interfaces
interface UserService {
    createUser(userData: Omit<User, 'id'>): Promise<User>;
    getUserById(id: number): Promise<User | null>;
    updateUser(id: number, updates: Partial<User>): Promise<User>;
    deleteUser(id: number): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
}

// Method overloading in interfaces
interface Calculator {
    add(a: number, b: number): number;
    add(a: string, b: string): string;
    add(a: number[], b: number[]): number[];
}

// Index signatures
interface StringDictionary {
    [key: string]: string;
}

interface FlexibleConfig {
    apiUrl: string;
    timeout: number;
    [key: string]: any; // Additional properties allowed
}

// Hybrid types (callable interfaces)
interface Counter {
    (start: number): string;
    interval: number;
    reset(): void;
}

function createCounter(): Counter {
    let counter = function(start: number) {
        return `Count: ${start}`;
    } as Counter;
    
    counter.interval = 1000;
    counter.reset = function() {
        console.log('Counter reset');
    };
    
    return counter;
}
```

### Generic Interfaces

```typescript
// Generic interface tanımı
interface Repository<T> {
    findById(id: number): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(entity: Omit<T, 'id'>): Promise<T>;
    update(id: number, updates: Partial<T>): Promise<T>;
    delete(id: number): Promise<boolean>;
}

// Multiple generic parameters
interface ApiResponse<TData, TError = string> {
    success: boolean;
    data?: TData;
    error?: TError;
    timestamp: Date;
}

// Generic constraints
interface Identifiable {
    id: number;
}

interface TimestampedRepository<T extends Identifiable> extends Repository<T> {
    findByDateRange(start: Date, end: Date): Promise<T[]>;
    findRecent(limit: number): Promise<T[]>;
}

// Conditional types in interfaces
interface ConditionalResponse<T> {
    data: T extends string ? { message: T } : T;
    status: T extends Error ? 'error' : 'success';
}

// Mapped types in interfaces
interface Readonly<T> {
    readonly [P in keyof T]: T[P];
}

interface Optional<T> {
    [P in keyof T]?: T[P];
}

// Practical generic interface examples
interface EventEmitter<TEvents extends Record<string, any[]>> {
    on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
    off<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
    emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
}

interface Cache<TKey, TValue> {
    get(key: TKey): TValue | undefined;
    set(key: TKey, value: TValue, ttl?: number): void;
    delete(key: TKey): boolean;
    clear(): void;
    has(key: TKey): boolean;
    size(): number;
}

// Implementation example
class MemoryCache<TKey, TValue> implements Cache<TKey, TValue> {
    private cache = new Map<TKey, { value: TValue; expires?: number }>();
    
    get(key: TKey): TValue | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;
        
        if (item.expires && Date.now() > item.expires) {
            this.cache.delete(key);
            return undefined;
        }
        
        return item.value;
    }
    
    set(key: TKey, value: TValue, ttl?: number): void {
        const expires = ttl ? Date.now() + ttl * 1000 : undefined;
        this.cache.set(key, { value, expires });
    }
    
    delete(key: TKey): boolean {
        return this.cache.delete(key);
    }
    
    clear(): void {
        this.cache.clear();
    }
    
    has(key: TKey): boolean {
        const item = this.cache.get(key);
        if (!item) return false;
        
        if (item.expires && Date.now() > item.expires) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }
    
    size(): number {
        // Clean expired items first
        for (const [key, item] of this.cache.entries()) {
            if (item.expires && Date.now() > item.expires) {
                this.cache.delete(key);
            }
        }
        return this.cache.size;
    }
}
```

## Interface Inheritance

### Single Inheritance

```typescript
// Base interface
interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

// Extending interface
interface User extends BaseEntity {
    name: string;
    email: string;
    role: 'user' | 'admin' | 'moderator';
}

interface Product extends BaseEntity {
    name: string;
    description: string;
    price: number;
    categoryId: number;
    inStock: boolean;
}

// Further extension
interface AdminUser extends User {
    permissions: string[];
    lastLoginAt?: Date;
}

interface PremiumUser extends User {
    subscriptionType: 'monthly' | 'yearly';
    subscriptionEndDate: Date;
    features: string[];
}
```

### Multiple Inheritance

```typescript
// Multiple interface inheritance
interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

interface Auditable {
    createdBy: string;
    updatedBy: string;
}

interface Versioned {
    version: number;
}

interface SoftDeletable {
    deletedAt?: Date;
    isDeleted: boolean;
}

// Combining multiple interfaces
interface FullAuditEntity extends Timestamped, Auditable, Versioned, SoftDeletable {
    id: number;
}

interface Document extends FullAuditEntity {
    title: string;
    content: string;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
}

// Mixin pattern with interfaces
interface Flyable {
    fly(): void;
    altitude: number;
}

interface Swimmable {
    swim(): void;
    depth: number;
}

interface Walkable {
    walk(): void;
    speed: number;
}

// Multiple capability interfaces
interface Bird extends Flyable, Walkable {
    species: string;
    wingspan: number;
}

interface Fish extends Swimmable {
    species: string;
    waterType: 'fresh' | 'salt';
}

interface Duck extends Flyable, Swimmable, Walkable {
    species: string;
    canMigrate: boolean;
}
```

### Interface Merging

```typescript
// Interface declaration merging
interface Window {
    customProperty: string;
}

interface Window {
    anotherProperty: number;
}

// Now Window has both properties
// window.customProperty and window.anotherProperty

// Practical example - extending existing libraries
interface Array<T> {
    chunk(size: number): T[][];
    unique(): T[];
    groupBy<K extends keyof T>(key: K): Record<string, T[]>;
}

// Implementation (would be in a separate file)
Array.prototype.chunk = function<T>(this: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < this.length; i += size) {
        chunks.push(this.slice(i, i + size));
    }
    return chunks;
};

Array.prototype.unique = function<T>(this: T[]): T[] {
    return [...new Set(this)];
};

Array.prototype.groupBy = function<T, K extends keyof T>(this: T[], key: K): Record<string, T[]> {
    return this.reduce((groups, item) => {
        const group = String(item[key]);
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {} as Record<string, T[]>);
};
```

## Class Tanımlama ve Kullanımı

### Temel Class Yapısı

```typescript
// Basit class tanımı
class Person {
    // Properties
    name: string;
    age: number;
    email: string;
    
    // Constructor
    constructor(name: string, age: number, email: string) {
        this.name = name;
        this.age = age;
        this.email = email;
    }
    
    // Methods
    greet(): string {
        return `Hello, I'm ${this.name} and I'm ${this.age} years old.`;
    }
    
    celebrateBirthday(): void {
        this.age++;
        console.log(`Happy birthday! Now I'm ${this.age} years old.`);
    }
    
    updateEmail(newEmail: string): void {
        this.email = newEmail;
    }
}

// Class usage
const person = new Person("John Doe", 30, "john@example.com");
console.log(person.greet());
person.celebrateBirthday();
```

### Constructor Shorthand

```typescript
// Constructor parameter properties
class User {
    constructor(
        public readonly id: number,
        public name: string,
        public email: string,
        private password: string,
        protected createdAt: Date = new Date()
    ) {}
    
    // Methods can access all properties
    authenticate(inputPassword: string): boolean {
        return this.password === inputPassword;
    }
    
    getAge(): number {
        return new Date().getFullYear() - this.createdAt.getFullYear();
    }
}

// Equivalent to the verbose version:
class UserVerbose {
    public readonly id: number;
    public name: string;
    public email: string;
    private password: string;
    protected createdAt: Date;
    
    constructor(id: number, name: string, email: string, password: string, createdAt: Date = new Date()) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
    }
}
```

### Generic Classes

```typescript
// Generic class definition
class Container<T> {
    private items: T[] = [];
    
    add(item: T): void {
        this.items.push(item);
    }
    
    get(index: number): T | undefined {
        return this.items[index];
    }
    
    getAll(): T[] {
        return [...this.items];
    }
    
    remove(index: number): T | undefined {
        return this.items.splice(index, 1)[0];
    }
    
    find(predicate: (item: T) => boolean): T | undefined {
        return this.items.find(predicate);
    }
    
    filter(predicate: (item: T) => boolean): T[] {
        return this.items.filter(predicate);
    }
    
    map<U>(mapper: (item: T) => U): U[] {
        return this.items.map(mapper);
    }
    
    size(): number {
        return this.items.length;
    }
    
    isEmpty(): boolean {
        return this.items.length === 0;
    }
    
    clear(): void {
        this.items = [];
    }
}

// Generic class with constraints
interface Identifiable {
    id: number;
}

class EntityManager<T extends Identifiable> {
    private entities: Map<number, T> = new Map();
    
    add(entity: T): void {
        this.entities.set(entity.id, entity);
    }
    
    getById(id: number): T | undefined {
        return this.entities.get(id);
    }
    
    update(id: number, updates: Partial<T>): T | undefined {
        const entity = this.entities.get(id);
        if (entity) {
            const updated = { ...entity, ...updates };
            this.entities.set(id, updated);
            return updated;
        }
        return undefined;
    }
    
    delete(id: number): boolean {
        return this.entities.delete(id);
    }
    
    getAll(): T[] {
        return Array.from(this.entities.values());
    }
    
    count(): number {
        return this.entities.size;
    }
}

// Usage examples
const stringContainer = new Container<string>();
stringContainer.add("hello");
stringContainer.add("world");

const userManager = new EntityManager<User>();
const user = new User(1, "John", "john@example.com", "password");
userManager.add(user);
```

## Access Modifiers

### Public, Private, Protected

```typescript
class BankAccount {
    public readonly accountNumber: string;
    public accountHolder: string;
    private balance: number;
    protected transactionHistory: Transaction[] = [];
    
    constructor(accountNumber: string, accountHolder: string, initialBalance: number = 0) {
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.balance = initialBalance;
    }
    
    // Public methods
    public getBalance(): number {
        return this.balance;
    }
    
    public deposit(amount: number): void {
        if (amount <= 0) {
            throw new Error("Deposit amount must be positive");
        }
        
        this.balance += amount;
        this.addTransaction('deposit', amount);
    }
    
    public withdraw(amount: number): void {
        if (amount <= 0) {
            throw new Error("Withdrawal amount must be positive");
        }
        
        if (amount > this.balance) {
            throw new Error("Insufficient funds");
        }
        
        this.balance -= amount;
        this.addTransaction('withdrawal', amount);
    }
    
    // Private method - only accessible within this class
    private addTransaction(type: 'deposit' | 'withdrawal', amount: number): void {
        this.transactionHistory.push({
            id: Date.now(),
            type,
            amount,
            timestamp: new Date(),
            balanceAfter: this.balance
        });
    }
    
    // Protected method - accessible in this class and subclasses
    protected getTransactionHistory(): Transaction[] {
        return [...this.transactionHistory];
    }
}

interface Transaction {
    id: number;
    type: 'deposit' | 'withdrawal';
    amount: number;
    timestamp: Date;
    balanceAfter: number;
}

// Subclass demonstrating protected access
class SavingsAccount extends BankAccount {
    private interestRate: number;
    
    constructor(accountNumber: string, accountHolder: string, initialBalance: number, interestRate: number) {
        super(accountNumber, accountHolder, initialBalance);
        this.interestRate = interestRate;
    }
    
    public calculateInterest(): number {
        return this.getBalance() * this.interestRate / 100;
    }
    
    public applyInterest(): void {
        const interest = this.calculateInterest();
        this.deposit(interest);
    }
    
    // Can access protected method from parent class
    public getAccountStatement(): Transaction[] {
        return this.getTransactionHistory();
    }
}
```

### Private Fields (ES2022)

```typescript
class ModernBankAccount {
    // Private fields (ES2022 syntax)
    #balance: number;
    #pin: string;
    #transactionHistory: Transaction[] = [];
    
    public readonly accountNumber: string;
    public accountHolder: string;
    
    constructor(accountNumber: string, accountHolder: string, pin: string, initialBalance: number = 0) {
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.#balance = initialBalance;
        this.#pin = pin;
    }
    
    public authenticate(pin: string): boolean {
        return this.#pin === pin;
    }
    
    public getBalance(pin: string): number {
        if (!this.authenticate(pin)) {
            throw new Error("Invalid PIN");
        }
        return this.#balance;
    }
    
    public deposit(amount: number, pin: string): void {
        if (!this.authenticate(pin)) {
            throw new Error("Invalid PIN");
        }
        
        if (amount <= 0) {
            throw new Error("Deposit amount must be positive");
        }
        
        this.#balance += amount;
        this.#addTransaction('deposit', amount);
    }
    
    #addTransaction(type: 'deposit' | 'withdrawal', amount: number): void {
        this.#transactionHistory.push({
            id: Date.now(),
            type,
            amount,
            timestamp: new Date(),
            balanceAfter: this.#balance
        });
    }
}
```

## Abstract Classes

### Abstract Class Definition

```typescript
// Abstract base class
abstract class Shape {
    protected x: number;
    protected y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    
    // Abstract methods must be implemented by subclasses
    abstract area(): number;
    abstract perimeter(): number;
    abstract draw(): void;
    
    // Concrete methods can be used by subclasses
    move(deltaX: number, deltaY: number): void {
        this.x += deltaX;
        this.y += deltaY;
    }
    
    getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }
    
    // Template method pattern
    render(): void {
        console.log(`Rendering shape at (${this.x}, ${this.y})`);
        this.draw();
        console.log(`Area: ${this.area()}, Perimeter: ${this.perimeter()}`);
    }
}

// Concrete implementations
class Circle extends Shape {
    private radius: number;
    
    constructor(x: number, y: number, radius: number) {
        super(x, y);
        this.radius = radius;
    }
    
    area(): number {
        return Math.PI * this.radius * this.radius;
    }
    
    perimeter(): number {
        return 2 * Math.PI * this.radius;
    }
    
    draw(): void {
        console.log(`Drawing circle with radius ${this.radius}`);
    }
    
    getRadius(): number {
        return this.radius;
    }
}

class Rectangle extends Shape {
    private width: number;
    private height: number;
    
    constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = width;
        this.height = height;
    }
    
    area(): number {
        return this.width * this.height;
    }
    
    perimeter(): number {
        return 2 * (this.width + this.height);
    }
    
    draw(): void {
        console.log(`Drawing rectangle ${this.width}x${this.height}`);
    }
    
    getDimensions(): { width: number; height: number } {
        return { width: this.width, height: this.height };
    }
}

// Abstract class with generic type
abstract class Repository<T> {
    protected items: T[] = [];
    
    // Abstract methods
    abstract validate(item: T): boolean;
    abstract serialize(item: T): string;
    abstract deserialize(data: string): T;
    
    // Concrete methods
    add(item: T): void {
        if (!this.validate(item)) {
            throw new Error("Invalid item");
        }
        this.items.push(item);
    }
    
    getAll(): T[] {
        return [...this.items];
    }
    
    find(predicate: (item: T) => boolean): T | undefined {
        return this.items.find(predicate);
    }
    
    export(): string {
        return JSON.stringify(this.items.map(item => this.serialize(item)));
    }
    
    import(data: string): void {
        const serializedItems = JSON.parse(data);
        this.items = serializedItems.map((item: string) => this.deserialize(item));
    }
}

// Concrete repository implementation
class UserRepository extends Repository<User> {
    validate(user: User): boolean {
        return user.name.length > 0 && user.email.includes('@');
    }
    
    serialize(user: User): string {
        return JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        });
    }
    
    deserialize(data: string): User {
        const parsed = JSON.parse(data);
        return new User(parsed.id, parsed.name, parsed.email, '');
    }
    
    findByEmail(email: string): User | undefined {
        return this.find(user => user.email === email);
    }
}
```

## Class Inheritance

### Single Inheritance

```typescript
// Base class
class Animal {
    protected name: string;
    protected age: number;
    
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
    
    eat(): void {
        console.log(`${this.name} is eating`);
    }
    
    sleep(): void {
        console.log(`${this.name} is sleeping`);
    }
    
    makeSound(): void {
        console.log(`${this.name} makes a sound`);
    }
    
    getInfo(): string {
        return `${this.name} is ${this.age} years old`;
    }
}

// Derived class
class Dog extends Animal {
    private breed: string;
    
    constructor(name: string, age: number, breed: string) {
        super(name, age); // Call parent constructor
        this.breed = breed;
    }
    
    // Override parent method
    makeSound(): void {
        console.log(`${this.name} barks: Woof! Woof!`);
    }
    
    // Additional methods
    fetch(): void {
        console.log(`${this.name} is fetching the ball`);
    }
    
    wagTail(): void {
        console.log(`${this.name} is wagging tail happily`);
    }
    
    // Override and extend parent method
    getInfo(): string {
        return `${super.getInfo()} and is a ${this.breed}`;
    }
}

class Cat extends Animal {
    private isIndoor: boolean;
    
    constructor(name: string, age: number, isIndoor: boolean = true) {
        super(name, age);
        this.isIndoor = isIndoor;
    }
    
    makeSound(): void {
        console.log(`${this.name} meows: Meow! Meow!`);
    }
    
    climb(): void {
        console.log(`${this.name} is climbing`);
    }
    
    purr(): void {
        console.log(`${this.name} is purring contentedly`);
    }
    
    getInfo(): string {
        const location = this.isIndoor ? "indoor" : "outdoor";
        return `${super.getInfo()} and is an ${location} cat`;
    }
}
```

### Method Overriding and Super

```typescript
class Vehicle {
    protected brand: string;
    protected model: string;
    protected year: number;
    
    constructor(brand: string, model: string, year: number) {
        this.brand = brand;
        this.model = model;
        this.year = year;
    }
    
    start(): void {
        console.log(`${this.getDisplayName()} is starting...`);
    }
    
    stop(): void {
        console.log(`${this.getDisplayName()} has stopped.`);
    }
    
    getDisplayName(): string {
        return `${this.year} ${this.brand} ${this.model}`;
    }
    
    getAge(): number {
        return new Date().getFullYear() - this.year;
    }
}

class Car extends Vehicle {
    private doors: number;
    private fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
    
    constructor(brand: string, model: string, year: number, doors: number, fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid') {
        super(brand, model, year);
        this.doors = doors;
        this.fuelType = fuelType;
    }
    
    // Override with additional functionality
    start(): void {
        console.log("Checking fuel level...");
        super.start(); // Call parent method
        console.log("Car is ready to drive!");
    }
    
    // Override with different implementation
    stop(): void {
        console.log("Applying brakes...");
        console.log("Engaging parking brake...");
        super.stop();
    }
    
    // Additional methods
    honk(): void {
        console.log(`${this.getDisplayName()} honks: Beep! Beep!`);
    }
    
    // Override and extend
    getDisplayName(): string {
        return `${super.getDisplayName()} (${this.doors}-door ${this.fuelType})`;
    }
}

class Motorcycle extends Vehicle {
    private engineSize: number;
    
    constructor(brand: string, model: string, year: number, engineSize: number) {
        super(brand, model, year);
        this.engineSize = engineSize;
    }
    
    start(): void {
        console.log("Kick starting...");
        super.start();
        console.log("Motorcycle is ready to ride!");
    }
    
    wheelie(): void {
        console.log(`${this.getDisplayName()} is doing a wheelie!`);
    }
    
    getDisplayName(): string {
        return `${super.getDisplayName()} (${this.engineSize}cc)`;
    }
}
```

## Interface Implementation

### Single Interface Implementation

```typescript
// Interface definition
interface Flyable {
    altitude: number;
    fly(): void;
    land(): void;
}

interface Swimmable {
    depth: number;
    swim(): void;
    surface(): void;
}

// Class implementing single interface
class Airplane implements Flyable {
    altitude: number = 0;
    private model: string;
    private passengers: number;
    
    constructor(model: string, passengers: number) {
        this.model = model;
        this.passengers = passengers;
    }
    
    fly(): void {
        this.altitude = 35000;
        console.log(`${this.model} is flying at ${this.altitude} feet with ${this.passengers} passengers`);
    }
    
    land(): void {
        this.altitude = 0;
        console.log(`${this.model} has landed safely`);
    }
    
    takeOff(): void {
        console.log(`${this.model} is taking off...`);
        this.fly();
    }
}

// Class implementing multiple interfaces
class Duck implements Flyable, Swimmable {
    altitude: number = 0;
    depth: number = 0;
    private name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    fly(): void {
        this.altitude = 100;
        this.depth = 0;
        console.log(`${this.name} is flying at ${this.altitude} meters`);
    }
    
    land(): void {
        this.altitude = 0;
        console.log(`${this.name} has landed`);
    }
    
    swim(): void {
        this.depth = 2;
        this.altitude = 0;
        console.log(`${this.name} is swimming at ${this.depth} meters depth`);
    }
    
    surface(): void {
        this.depth = 0;
        console.log(`${this.name} has surfaced`);
    }
    
    quack(): void {
        console.log(`${this.name} says: Quack! Quack!`);
    }
}
```

### Interface with Class Inheritance

```typescript
// Base interface
interface Drawable {
    draw(): void;
    getColor(): string;
}

// Extended interface
interface Resizable extends Drawable {
    resize(factor: number): void;
    getSize(): { width: number; height: number };
}

// Abstract class implementing interface
abstract class GraphicElement implements Drawable {
    protected color: string;
    protected x: number;
    protected y: number;
    
    constructor(color: string, x: number, y: number) {
        this.color = color;
        this.x = x;
        this.y = y;
    }
    
    getColor(): string {
        return this.color;
    }
    
    setColor(color: string): void {
        this.color = color;
    }
    
    move(deltaX: number, deltaY: number): void {
        this.x += deltaX;
        this.y += deltaY;
    }
    
    // Abstract method to be implemented by subclasses
    abstract draw(): void;
}

// Concrete class extending abstract class and implementing additional interface
class ResizableRectangle extends GraphicElement implements Resizable {
    private width: number;
    private height: number;
    
    constructor(color: string, x: number, y: number, width: number, height: number) {
        super(color, x, y);
        this.width = width;
        this.height = height;
    }
    
    draw(): void {
        console.log(`Drawing ${this.color} rectangle at (${this.x}, ${this.y}) with size ${this.width}x${this.height}`);
    }
    
    resize(factor: number): void {
        this.width *= factor;
        this.height *= factor;
    }
    
    getSize(): { width: number; height: number } {
        return { width: this.width, height: this.height };
    }
}

// Interface for event handling
interface EventHandler<T> {
    handle(event: T): void;
}

// Generic class implementing interface
class Logger<T> implements EventHandler<T> {
    private logLevel: 'debug' | 'info' | 'warn' | 'error';
    
    constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
        this.logLevel = logLevel;
    }
    
    handle(event: T): void {
        console.log(`[${this.logLevel.toUpperCase()}] ${new Date().toISOString()}:`, event);
    }
    
    setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
        this.logLevel = level;
    }
}
```

## Static Members

### Static Properties and Methods

```typescript
class MathUtils {
    // Static constants
    static readonly PI = 3.14159265359;
    static readonly E = 2.71828182846;
    
    // Static properties
    private static calculationCount = 0;
    
    // Static methods
    static add(a: number, b: number): number {
        this.calculationCount++;
        return a + b;
    }
    
    static multiply(a: number, b: number): number {
        this.calculationCount++;
        return a * b;
    }
    
    static power(base: number, exponent: number): number {
        this.calculationCount++;
        return Math.pow(base, exponent);
    }
    
    static factorial(n: number): number {
        this.calculationCount++;
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    }
    
    static getCalculationCount(): number {
        return this.calculationCount;
    }
    
    static resetCalculationCount(): void {
        this.calculationCount = 0;
    }
    
    // Static method with generics
    static clamp<T extends number>(value: T, min: T, max: T): T {
        return Math.min(Math.max(value, min), max) as T;
    }
}

// Singleton pattern using static members
class DatabaseConnection {
    private static instance: DatabaseConnection;
    private connectionString: string;
    private isConnected: boolean = false;
    
    private constructor(connectionString: string) {
        this.connectionString = connectionString;
    }
    
    static getInstance(connectionString?: string): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            if (!connectionString) {
                throw new Error("Connection string required for first initialization");
            }
            DatabaseConnection.instance = new DatabaseConnection(connectionString);
        }
        return DatabaseConnection.instance;
    }
    
    connect(): void {
        if (!this.isConnected) {
            console.log(`Connecting to database: ${this.connectionString}`);
            this.isConnected = true;
        }
    }
    
    disconnect(): void {
        if (this.isConnected) {
            console.log("Disconnecting from database");
            this.isConnected = false;
        }
    }
    
    query(sql: string): any[] {
        if (!this.isConnected) {
            throw new Error("Database not connected");
        }
        console.log(`Executing query: ${sql}`);
        return [];
    }
}

// Factory pattern using static methods
class ShapeFactory {
    static createCircle(radius: number): Circle {
        return new Circle(0, 0, radius);
    }
    
    static createRectangle(width: number, height: number): Rectangle {
        return new Rectangle(0, 0, width, height);
    }
    
    static createSquare(side: number): Rectangle {
        return new Rectangle(0, 0, side, side);
    }
    
    // Static method with validation
    static createShape(type: 'circle' | 'rectangle', ...args: number[]): Shape {
        switch (type) {
            case 'circle':
                if (args.length !== 1) {
                    throw new Error("Circle requires exactly one argument (radius)");
                }
                return this.createCircle(args[0]);
            case 'rectangle':
                if (args.length !== 2) {
                    throw new Error("Rectangle requires exactly two arguments (width, height)");
                }
                return this.createRectangle(args[0], args[1]);
            default:
                throw new Error(`Unknown shape type: ${type}`);
        }
    }
}
```

## Getters ve Setters

### Property Accessors

```typescript
class Temperature {
    private _celsius: number;
    
    constructor(celsius: number) {
        this._celsius = celsius;
    }
    
    // Getter for Celsius
    get celsius(): number {
        return this._celsius;
    }
    
    // Setter for Celsius with validation
    set celsius(value: number) {
        if (value < -273.15) {
            throw new Error("Temperature cannot be below absolute zero (-273.15°C)");
        }
        this._celsius = value;
    }
    
    // Getter for Fahrenheit (computed property)
    get fahrenheit(): number {
        return (this._celsius * 9/5) + 32;
    }
    
    // Setter for Fahrenheit
    set fahrenheit(value: number) {
        this.celsius = (value - 32) * 5/9;
    }
    
    // Getter for Kelvin (computed property)
    get kelvin(): number {
        return this._celsius + 273.15;
    }
    
    // Setter for Kelvin
    set kelvin(value: number) {
        this.celsius = value - 273.15;
    }
    
    // Read-only property
    get absoluteZero(): number {
        return -273.15;
    }
}

// Advanced getter/setter example
class BankAccount {
    private _balance: number;
    private _transactions: Transaction[] = [];
    private _isLocked: boolean = false;
    
    constructor(initialBalance: number) {
        this._balance = initialBalance;
    }
    
    // Read-only balance
    get balance(): number {
        return this._balance;
    }
    
    // Computed property for account status
    get status(): 'active' | 'locked' | 'overdrawn' {
        if (this._isLocked) return 'locked';
        if (this._balance < 0) return 'overdrawn';
        return 'active';
    }
    
    // Getter for transaction history (returns copy)
    get transactions(): Transaction[] {
        return [...this._transactions];
    }
    
    // Computed property for last transaction
    get lastTransaction(): Transaction | undefined {
        return this._transactions[this._transactions.length - 1];
    }
    
    // Setter for account lock status
    set locked(value: boolean) {
        this._isLocked = value;
        console.log(`Account ${value ? 'locked' : 'unlocked'}`);
    }
    
    get locked(): boolean {
        return this._isLocked;
    }
    
    // Methods that modify balance
    deposit(amount: number): void {
        if (this._isLocked) {
            throw new Error("Account is locked");
        }
        
        this._balance += amount;
        this._transactions.push({
            id: Date.now(),
            type: 'deposit',
            amount,
            timestamp: new Date(),
            balanceAfter: this._balance
        });
    }
    
    withdraw(amount: number): void {
        if (this._isLocked) {
            throw new Error("Account is locked");
        }
        
        if (amount > this._balance) {
            throw new Error("Insufficient funds");
        }
        
        this._balance -= amount;
        this._transactions.push({
            id: Date.now(),
            type: 'withdrawal',
            amount,
            timestamp: new Date(),
            balanceAfter: this._balance
        });
    }
}

// Validation in setters
class Person {
    private _name: string;
    private _age: number;
    private _email: string;
    
    constructor(name: string, age: number, email: string) {
        this.name = name; // Use setter for validation
        this.age = age;   // Use setter for validation
        this.email = email; // Use setter for validation
    }
    
    get name(): string {
        return this._name;
    }
    
    set name(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error("Name cannot be empty");
        }
        if (value.length > 50) {
            throw new Error("Name cannot exceed 50 characters");
        }
        this._name = value.trim();
    }
    
    get age(): number {
        return this._age;
    }
    
    set age(value: number) {
        if (value < 0 || value > 150) {
            throw new Error("Age must be between 0 and 150");
        }
        this._age = value;
    }
    
    get email(): string {
        return this._email;
    }
    
    set email(value: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error("Invalid email format");
        }
        this._email = value.toLowerCase();
    }
    
    // Computed properties
    get isAdult(): boolean {
        return this._age >= 18;
    }
    
    get initials(): string {
        return this._name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .join('.');
    }
}
```

## Advanced Patterns

### Decorator Pattern

```typescript
// Method decorator
function log(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
        console.log(`Calling ${propertyName} with arguments:`, args);
        const result = method.apply(this, args);
        console.log(`${propertyName} returned:`, result);
        return result;
    };
}

// Class decorator
function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}

// Property decorator
function readonly(target: any, propertyName: string) {
    Object.defineProperty(target, propertyName, {
        writable: false
    });
}

@sealed
class Calculator {
    @readonly
    version: string = "1.0.0";
    
    @log
    add(a: number, b: number): number {
        return a + b;
    }
    
    @log
    multiply(a: number, b: number): number {
        return a * b;
    }
}
```

### Mixin Pattern

```typescript
// Mixin types
type Constructor<T = {}> = new (...args: any[]) => T;

// Mixin functions
function Timestamped<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        timestamp = new Date();
        
        getTimestamp() {
            return this.timestamp;
        }
    };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        isActive = false;
        
        activate() {
            this.isActive = true;
        }
        
        deactivate() {
            this.isActive = false;
        }
    };
}

// Base class
class User {
    constructor(public name: string) {}
}

// Apply mixins
const TimestampedUser = Timestamped(User);
const ActivatableUser = Activatable(User);
const TimestampedActivatableUser = Timestamped(Activatable(User));

// Usage
const user = new TimestampedActivatableUser("John");
user.activate();
console.log(user.getTimestamp());
console.log(user.isActive);
```

Bu kapsamlı rehber, TypeScript'te interface ve class yapılarının tüm yönlerini detaylı bir şekilde ele almaktadır. Sonraki derslerde daha ileri seviye konuları inceleyeceğiz.