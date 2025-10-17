# TypeScript Generics ve İleri Seviye Tipler

## İçindekiler
1. [Generic Temelleri](#generic-temelleri)
2. [Generic Constraints](#generic-constraints)
3. [Generic Classes](#generic-classes)
4. [Generic Interfaces](#generic-interfaces)
5. [Conditional Types](#conditional-types)
6. [Mapped Types](#mapped-types)
7. [Template Literal Types](#template-literal-types)
8. [Utility Types](#utility-types)
9. [Type Guards ve Type Predicates](#type-guards-ve-type-predicates)
10. [Advanced Type Patterns](#advanced-type-patterns)

## Generic Temelleri

Generics, TypeScript'te tip güvenliğini koruyarak yeniden kullanılabilir kod yazmanızı sağlayan güçlü bir özelliktir. Compile time'da tip kontrolü yaparken, runtime'da herhangi bir performans kaybına neden olmaz.

### Temel Generic Functions

```typescript
// Basit generic function
function identity<T>(arg: T): T {
    return arg;
}

// Kullanım örnekleri
let stringResult = identity<string>("hello"); // string
let numberResult = identity<number>(42); // number
let booleanResult = identity<boolean>(true); // boolean

// Type inference - TypeScript tipi otomatik çıkarır
let inferredString = identity("hello"); // string (inferred)
let inferredNumber = identity(42); // number (inferred)

// Array generic function
function getFirstElement<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[0] : undefined;
}

const numbers = [1, 2, 3, 4, 5];
const strings = ["a", "b", "c"];
const booleans = [true, false, true];

const firstNumber = getFirstElement(numbers); // number | undefined
const firstString = getFirstElement(strings); // string | undefined
const firstBoolean = getFirstElement(booleans); // boolean | undefined

// Multiple generic parameters
function pair<T, U>(first: T, second: U): [T, U] {
    return [first, second];
}

const stringNumberPair = pair("hello", 42); // [string, number]
const booleanStringPair = pair(true, "world"); // [boolean, string]

// Generic function with default type
function createArray<T = string>(length: number, value: T): T[] {
    return Array(length).fill(value);
}

const stringArray = createArray(3, "hello"); // string[]
const numberArray = createArray<number>(3, 42); // number[]
const defaultArray = createArray(3, "default"); // string[] (default type)

// Complex generic function
function map<T, U>(array: T[], transform: (item: T) => U): U[] {
    const result: U[] = [];
    for (const item of array) {
        result.push(transform(item));
    }
    return result;
}

const numbers2 = [1, 2, 3, 4, 5];
const doubled = map(numbers2, x => x * 2); // number[]
const strings2 = map(numbers2, x => x.toString()); // string[]
const booleans2 = map(numbers2, x => x > 3); // boolean[]

// Generic function with object manipulation
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        result[key] = obj[key];
    }
    return result;
}

interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    isActive: boolean;
}

const user: User = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    isActive: true
};

const userBasicInfo = pick(user, ["id", "name", "email"]); // { id: number; name: string; email: string; }
const userStatus = pick(user, ["id", "isActive"]); // { id: number; isActive: boolean; }
```

### Generic Arrow Functions

```typescript
// Generic arrow functions
const identity2 = <T>(arg: T): T => arg;

const getLastElement = <T>(arr: T[]): T | undefined => {
    return arr.length > 0 ? arr[arr.length - 1] : undefined;
};

const filter = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
    return array.filter(predicate);
};

const reduce = <T, U>(
    array: T[], 
    reducer: (acc: U, current: T, index: number) => U, 
    initialValue: U
): U => {
    return array.reduce(reducer, initialValue);
};

// Usage examples
const evenNumbers = filter([1, 2, 3, 4, 5, 6], x => x % 2 === 0); // number[]
const sum = reduce([1, 2, 3, 4, 5], (acc, curr) => acc + curr, 0); // number
const concatenated = reduce(["a", "b", "c"], (acc, curr) => acc + curr, ""); // string

// Generic async functions
const fetchData = async <T>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as T;
};

// Usage with specific types
interface ApiUser {
    id: number;
    username: string;
    email: string;
}

interface ApiPost {
    id: number;
    title: string;
    content: string;
    userId: number;
}

const getUser = (id: number) => fetchData<ApiUser>(`/api/users/${id}`);
const getPosts = () => fetchData<ApiPost[]>('/api/posts');
```

## Generic Constraints

Generic constraints, generic type parametrelerinin belirli özelliklere sahip olmasını zorunlu kılar.

### Extends Constraints

```typescript
// Basic constraint - T must have length property
interface Lengthwise {
    length: number;
}

function logLength<T extends Lengthwise>(arg: T): T {
    console.log(`Length: ${arg.length}`);
    return arg;
}

logLength("hello"); // OK - string has length
logLength([1, 2, 3]); // OK - array has length
logLength({ length: 10, value: 3 }); // OK - object has length
// logLength(123); // Error - number doesn't have length

// Constraint with keyof
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const person = {
    name: "John",
    age: 30,
    email: "john@example.com"
};

const name = getProperty(person, "name"); // string
const age = getProperty(person, "age"); // number
// const invalid = getProperty(person, "invalid"); // Error - 'invalid' is not a key of person

// Multiple constraints
interface Identifiable {
    id: number;
}

interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

function updateEntity<T extends Identifiable & Timestamped>(
    entity: T, 
    updates: Partial<Omit<T, 'id' | 'createdAt'>>
): T {
    return {
        ...entity,
        ...updates,
        updatedAt: new Date()
    };
}

interface Product extends Identifiable, Timestamped {
    name: string;
    price: number;
    category: string;
}

const product: Product = {
    id: 1,
    name: "Laptop",
    price: 999,
    category: "Electronics",
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
};

const updatedProduct = updateEntity(product, { 
    name: "Gaming Laptop", 
    price: 1299 
});

// Conditional constraints
type NonNullable<T> = T extends null | undefined ? never : T;

function processValue<T>(value: NonNullable<T>): NonNullable<T> {
    // value is guaranteed to be non-null and non-undefined
    return value;
}

// Generic constraint with function types
interface Comparable<T> {
    compareTo(other: T): number;
}

function sort<T extends Comparable<T>>(items: T[]): T[] {
    return items.sort((a, b) => a.compareTo(b));
}

class Version implements Comparable<Version> {
    constructor(private version: string) {}
    
    compareTo(other: Version): number {
        return this.version.localeCompare(other.version);
    }
    
    toString(): string {
        return this.version;
    }
}

const versions = [
    new Version("1.0.0"),
    new Version("2.1.0"),
    new Version("1.5.0")
];

const sortedVersions = sort(versions);
```

### Advanced Constraints

```typescript
// Constraint with conditional types
type KeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

interface Example {
    id: number;
    name: string;
    age: number;
    isActive: boolean;
    tags: string[];
}

type StringKeys = KeysOfType<Example, string>; // "name"
type NumberKeys = KeysOfType<Example, number>; // "id" | "age"
type BooleanKeys = KeysOfType<Example, boolean>; // "isActive"
type ArrayKeys = KeysOfType<Example, any[]>; // "tags"

// Function that only accepts string properties
function getStringProperty<T, K extends KeysOfType<T, string>>(
    obj: T, 
    key: K
): T[K] {
    return obj[key];
}

const example: Example = {
    id: 1,
    name: "John",
    age: 30,
    isActive: true,
    tags: ["developer", "typescript"]
};

const nameValue = getStringProperty(example, "name"); // string
// const ageValue = getStringProperty(example, "age"); // Error - age is not a string property

// Recursive constraints
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

interface NestedObject {
    user: {
        profile: {
            name: string;
            settings: {
                theme: string;
                notifications: boolean;
            };
        };
    };
}

type ReadonlyNested = DeepReadonly<NestedObject>;
// All properties at all levels are readonly

// Generic constraint with union types
type AllowedTypes = string | number | boolean;

function processAllowedValue<T extends AllowedTypes>(value: T): string {
    return String(value);
}

processAllowedValue("hello"); // OK
processAllowedValue(42); // OK
processAllowedValue(true); // OK
// processAllowedValue({}); // Error - object is not allowed

// Constraint with function signatures
type EventHandler<T> = (event: T) => void;

function createEventSystem<T, K extends keyof T>() {
    const handlers: { [P in K]?: EventHandler<T[P]>[] } = {};
    
    return {
        on<E extends K>(event: E, handler: EventHandler<T[E]>): void {
            if (!handlers[event]) {
                handlers[event] = [];
            }
            handlers[event]!.push(handler);
        },
        
        emit<E extends K>(event: E, data: T[E]): void {
            const eventHandlers = handlers[event];
            if (eventHandlers) {
                eventHandlers.forEach(handler => handler(data));
            }
        }
    };
}

interface AppEvents {
    userLogin: { userId: number; timestamp: Date };
    userLogout: { userId: number };
    dataUpdate: { table: string; recordId: number };
}

const eventSystem = createEventSystem<AppEvents, keyof AppEvents>();

eventSystem.on('userLogin', (data) => {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

eventSystem.emit('userLogin', { 
    userId: 123, 
    timestamp: new Date() 
});
```

## Generic Classes

Generic classes, farklı tiplerle çalışabilen yeniden kullanılabilir sınıflar oluşturmanızı sağlar.

### Basic Generic Classes

```typescript
// Simple generic class
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

// Usage
const stringContainer = new Container<string>();
stringContainer.add("hello");
stringContainer.add("world");

const numberContainer = new Container<number>();
numberContainer.add(1);
numberContainer.add(2);
numberContainer.add(3);

// Generic class with multiple type parameters
class KeyValueStore<K, V> {
    private store = new Map<K, V>();
    
    set(key: K, value: V): void {
        this.store.set(key, value);
    }
    
    get(key: K): V | undefined {
        return this.store.get(key);
    }
    
    has(key: K): boolean {
        return this.store.has(key);
    }
    
    delete(key: K): boolean {
        return this.store.delete(key);
    }
    
    keys(): K[] {
        return Array.from(this.store.keys());
    }
    
    values(): V[] {
        return Array.from(this.store.values());
    }
    
    entries(): [K, V][] {
        return Array.from(this.store.entries());
    }
    
    size(): number {
        return this.store.size;
    }
    
    clear(): void {
        this.store.clear();
    }
}

const userStore = new KeyValueStore<number, User>();
userStore.set(1, { id: 1, name: "John", email: "john@example.com", age: 30 });

const configStore = new KeyValueStore<string, any>();
configStore.set("apiUrl", "https://api.example.com");
configStore.set("timeout", 5000);
```

### Generic Classes with Constraints

```typescript
// Generic class with constraints
interface Identifiable {
    id: number;
}

class Repository<T extends Identifiable> {
    private entities = new Map<number, T>();
    
    save(entity: T): T {
        this.entities.set(entity.id, entity);
        return entity;
    }
    
    findById(id: number): T | undefined {
        return this.entities.get(id);
    }
    
    findAll(): T[] {
        return Array.from(this.entities.values());
    }
    
    update(id: number, updates: Partial<Omit<T, 'id'>>): T | undefined {
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
    
    count(): number {
        return this.entities.size;
    }
    
    exists(id: number): boolean {
        return this.entities.has(id);
    }
    
    findBy<K extends keyof T>(key: K, value: T[K]): T[] {
        return this.findAll().filter(entity => entity[key] === value);
    }
}

interface User extends Identifiable {
    name: string;
    email: string;
    age: number;
}

interface Product extends Identifiable {
    name: string;
    price: number;
    category: string;
}

const userRepository = new Repository<User>();
const productRepository = new Repository<Product>();

// Generic class with inheritance
abstract class BaseService<T extends Identifiable> {
    protected repository: Repository<T>;
    
    constructor() {
        this.repository = new Repository<T>();
    }
    
    abstract validate(entity: T): boolean;
    
    create(entity: T): T {
        if (!this.validate(entity)) {
            throw new Error("Invalid entity");
        }
        return this.repository.save(entity);
    }
    
    getById(id: number): T | undefined {
        return this.repository.findById(id);
    }
    
    getAll(): T[] {
        return this.repository.findAll();
    }
    
    update(id: number, updates: Partial<Omit<T, 'id'>>): T | undefined {
        return this.repository.update(id, updates);
    }
    
    delete(id: number): boolean {
        return this.repository.delete(id);
    }
}

class UserService extends BaseService<User> {
    validate(user: User): boolean {
        return user.name.length > 0 && 
               user.email.includes('@') && 
               user.age >= 0;
    }
    
    findByEmail(email: string): User | undefined {
        return this.repository.findBy('email', email)[0];
    }
    
    findByAgeRange(minAge: number, maxAge: number): User[] {
        return this.repository.findAll().filter(
            user => user.age >= minAge && user.age <= maxAge
        );
    }
}

class ProductService extends BaseService<Product> {
    validate(product: Product): boolean {
        return product.name.length > 0 && 
               product.price > 0 && 
               product.category.length > 0;
    }
    
    findByCategory(category: string): Product[] {
        return this.repository.findBy('category', category);
    }
    
    findByPriceRange(minPrice: number, maxPrice: number): Product[] {
        return this.repository.findAll().filter(
            product => product.price >= minPrice && product.price <= maxPrice
        );
    }
}
```

### Advanced Generic Class Patterns

```typescript
// Generic class with static methods
class ArrayUtils {
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
    
    static sortBy<T>(
        array: T[], 
        key: keyof T, 
        direction: 'asc' | 'desc' = 'asc'
    ): T[] {
        return [...array].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
}

// Generic singleton pattern
class Singleton<T> {
    private static instances = new Map<any, any>();
    
    static getInstance<T>(this: new () => T): T {
        if (!Singleton.instances.has(this)) {
            Singleton.instances.set(this, new this());
        }
        return Singleton.instances.get(this);
    }
}

class DatabaseConnection extends Singleton<DatabaseConnection> {
    private connectionString: string = "";
    
    connect(connectionString: string): void {
        this.connectionString = connectionString;
        console.log(`Connected to: ${connectionString}`);
    }
    
    query(sql: string): any[] {
        console.log(`Executing: ${sql}`);
        return [];
    }
}

class Logger extends Singleton<Logger> {
    private logLevel: string = "info";
    
    setLevel(level: string): void {
        this.logLevel = level;
    }
    
    log(message: string): void {
        console.log(`[${this.logLevel}] ${message}`);
    }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true - same instance

const logger1 = Logger.getInstance();
const logger2 = Logger.getInstance();
console.log(logger1 === logger2); // true - same instance

// Generic factory pattern
interface Creatable<T> {
    new (...args: any[]): T;
}

class Factory<T> {
    private creators = new Map<string, Creatable<T>>();
    
    register(name: string, creator: Creatable<T>): void {
        this.creators.set(name, creator);
    }
    
    create(name: string, ...args: any[]): T {
        const Creator = this.creators.get(name);
        if (!Creator) {
            throw new Error(`No creator registered for: ${name}`);
        }
        return new Creator(...args);
    }
    
    getRegisteredNames(): string[] {
        return Array.from(this.creators.keys());
    }
}

// Shape factory example
abstract class Shape {
    abstract area(): number;
    abstract perimeter(): number;
}

class Circle extends Shape {
    constructor(private radius: number) {
        super();
    }
    
    area(): number {
        return Math.PI * this.radius * this.radius;
    }
    
    perimeter(): number {
        return 2 * Math.PI * this.radius;
    }
}

class Rectangle extends Shape {
    constructor(private width: number, private height: number) {
        super();
    }
    
    area(): number {
        return this.width * this.height;
    }
    
    perimeter(): number {
        return 2 * (this.width + this.height);
    }
}

const shapeFactory = new Factory<Shape>();
shapeFactory.register('circle', Circle);
shapeFactory.register('rectangle', Rectangle);

const circle = shapeFactory.create('circle', 5);
const rectangle = shapeFactory.create('rectangle', 10, 20);
```

## Generic Interfaces

Generic interfaces, farklı tiplerle çalışabilen interface tanımları oluşturmanızı sağlar.

### Basic Generic Interfaces

```typescript
// Simple generic interface
interface Container<T> {
    value: T;
    getValue(): T;
    setValue(value: T): void;
}

// Implementation
class Box<T> implements Container<T> {
    constructor(public value: T) {}
    
    getValue(): T {
        return this.value;
    }
    
    setValue(value: T): void {
        this.value = value;
    }
}

const stringBox = new Box<string>("hello");
const numberBox = new Box<number>(42);

// Generic interface with multiple parameters
interface Pair<T, U> {
    first: T;
    second: U;
    swap(): Pair<U, T>;
}

class OrderedPair<T, U> implements Pair<T, U> {
    constructor(public first: T, public second: U) {}
    
    swap(): Pair<U, T> {
        return new OrderedPair(this.second, this.first);
    }
}

const stringNumberPair = new OrderedPair("hello", 42);
const swapped = stringNumberPair.swap(); // Pair<number, string>

// Generic interface with methods
interface Repository<T> {
    findById(id: number): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(entity: Omit<T, 'id'>): Promise<T>;
    update(id: number, updates: Partial<T>): Promise<T | null>;
    delete(id: number): Promise<boolean>;
}

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
    timestamp: Date;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Generic interface with constraints
interface Comparable<T> {
    compareTo(other: T): number;
}

interface Sortable<T extends Comparable<T>> {
    items: T[];
    sort(): void;
    sortDescending(): void;
}

class SortableList<T extends Comparable<T>> implements Sortable<T> {
    constructor(public items: T[]) {}
    
    sort(): void {
        this.items.sort((a, b) => a.compareTo(b));
    }
    
    sortDescending(): void {
        this.items.sort((a, b) => b.compareTo(a));
    }
}
```

### Advanced Generic Interfaces

```typescript
// Generic interface with conditional types
interface ConditionalContainer<T> {
    value: T;
    process(): T extends string ? string : T extends number ? number : unknown;
}

// Generic interface with mapped types
interface Readonly<T> {
    readonly [P in keyof T]: T[P];
}

interface Optional<T> {
    [P in keyof T]?: T[P];
}

interface Nullable<T> {
    [P in keyof T]: T[P] | null;
}

// Generic event emitter interface
interface EventEmitter<TEvents extends Record<string, any[]>> {
    on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
    off<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
    emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void;
    once<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void;
    removeAllListeners<K extends keyof TEvents>(event?: K): void;
}

// Implementation
class TypedEventEmitter<TEvents extends Record<string, any[]>> implements EventEmitter<TEvents> {
    private listeners: { [K in keyof TEvents]?: Array<(...args: TEvents[K]) => void> } = {};
    private onceListeners: { [K in keyof TEvents]?: Array<(...args: TEvents[K]) => void> } = {};
    
    on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }
    
    off<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }
    
    emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void {
        // Regular listeners
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            eventListeners.forEach(listener => listener(...args));
        }
        
        // Once listeners
        const onceListeners = this.onceListeners[event];
        if (onceListeners) {
            onceListeners.forEach(listener => listener(...args));
            this.onceListeners[event] = [];
        }
    }
    
    once<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void {
        if (!this.onceListeners[event]) {
            this.onceListeners[event] = [];
        }
        this.onceListeners[event]!.push(listener);
    }
    
    removeAllListeners<K extends keyof TEvents>(event?: K): void {
        if (event) {
            this.listeners[event] = [];
            this.onceListeners[event] = [];
        } else {
            this.listeners = {};
            this.onceListeners = {};
        }
    }
}

// Usage
interface AppEvents {
    userLogin: [user: User];
    userLogout: [userId: number];
    dataUpdate: [table: string, recordId: number];
    error: [error: Error, context?: string];
}

const eventEmitter = new TypedEventEmitter<AppEvents>();

eventEmitter.on('userLogin', (user) => {
    console.log(`User ${user.name} logged in`);
});

eventEmitter.on('error', (error, context) => {
    console.error(`Error in ${context}:`, error.message);
});

// Generic cache interface
interface Cache<K, V> {
    get(key: K): V | undefined;
    set(key: K, value: V, ttl?: number): void;
    delete(key: K): boolean;
    clear(): void;
    has(key: K): boolean;
    size(): number;
    keys(): K[];
    values(): V[];
    entries(): [K, V][];
}

// LRU Cache implementation
class LRUCache<K, V> implements Cache<K, V> {
    private cache = new Map<K, { value: V; timestamp: number; ttl?: number }>();
    private maxSize: number;
    
    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }
    
    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;
        
        // Check TTL
        if (item.ttl && Date.now() > item.timestamp + item.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        
        return item.value;
    }
    
    set(key: K, value: V, ttl?: number): void {
        // Remove if exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttl ? ttl * 1000 : undefined
        });
    }
    
    delete(key: K): boolean {
        return this.cache.delete(key);
    }
    
    clear(): void {
        this.cache.clear();
    }
    
    has(key: K): boolean {
        const item = this.cache.get(key);
        if (!item) return false;
        
        // Check TTL
        if (item.ttl && Date.now() > item.timestamp + item.ttl) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }
    
    size(): number {
        // Clean expired items first
        this.cleanExpired();
        return this.cache.size;
    }
    
    keys(): K[] {
        this.cleanExpired();
        return Array.from(this.cache.keys());
    }
    
    values(): V[] {
        this.cleanExpired();
        return Array.from(this.cache.values()).map(item => item.value);
    }
    
    entries(): [K, V][] {
        this.cleanExpired();
        return Array.from(this.cache.entries()).map(([key, item]) => [key, item.value]);
    }
    
    private cleanExpired(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.ttl && now > item.timestamp + item.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

const userCache = new LRUCache<number, User>(50);
const configCache = new LRUCache<string, any>(20);
```

Bu kapsamlı rehber, TypeScript'te generics ve ileri seviye tiplerin temellerini ve pratik kullanım örneklerini detaylı bir şekilde ele almaktadır. Sonraki bölümlerde conditional types, mapped types ve diğer ileri seviye konuları inceleyeceğiz.