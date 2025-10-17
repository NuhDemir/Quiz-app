# TypeScript Temel Tipler ve Tip Sistemi

## İçindekiler
1. [Primitive Types](#primitive-types)
2. [Array ve Tuple Types](#array-ve-tuple-types)
3. [Object Types](#object-types)
4. [Union ve Intersection Types](#union-ve-intersection-types)
5. [Literal Types](#literal-types)
6. [Enum Types](#enum-types)
7. [Function Types](#function-types)
8. [Type Assertions](#type-assertions)
9. [Type Guards](#type-guards)
10. [Utility Types](#utility-types)

## Primitive Types

TypeScript, JavaScript'in tüm primitive tiplerini destekler ve bunlara ek olarak bazı yeni tipler sunar.

### String Type

```typescript
// Temel string tanımlaması
let firstName: string = "John";
let lastName: string = 'Doe';
let fullName: string = `${firstName} ${lastName}`;

// Template literals
let age: number = 30;
let greeting: string = `Hello, I'm ${firstName} and I'm ${age} years old.`;

// String methods - TypeScript otomatik tamamlama sağlar
let message: string = "Hello World";
let upperMessage: string = message.toUpperCase();
let messageLength: number = message.length;
let firstChar: string = message.charAt(0);

// String validation example
function validateEmail(email: string): boolean {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// String manipulation utilities
class StringUtils {
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    static truncate(str: string, maxLength: number): string {
        return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
    }
    
    static slugify(str: string): string {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    
    static isEmptyOrWhitespace(str: string): boolean {
        return !str || str.trim().length === 0;
    }
}

// Usage examples
console.log(StringUtils.capitalize("hello world")); // "Hello world"
console.log(StringUtils.truncate("This is a long text", 10)); // "This is a..."
console.log(StringUtils.slugify("Hello World! 123")); // "hello-world-123"
```

### Number Type

```typescript
// Temel number tanımlaması
let decimal: number = 42;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let big: number = 1_000_000; // Underscore separator

// Floating point numbers
let pi: number = 3.14159;
let e: number = 2.71828;

// Special number values
let notANumber: number = NaN;
let infinity: number = Infinity;
let negativeInfinity: number = -Infinity;

// Number validation and utilities
class NumberUtils {
    static isInteger(value: number): boolean {
        return Number.isInteger(value);
    }
    
    static isFinite(value: number): boolean {
        return Number.isFinite(value);
    }
    
    static isNaN(value: number): boolean {
        return Number.isNaN(value);
    }
    
    static round(value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
    
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
    
    static randomBetween(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Mathematical operations with type safety
function calculateCircleArea(radius: number): number {
    if (radius < 0) {
        throw new Error("Radius cannot be negative");
    }
    return Math.PI * radius * radius;
}

function calculateCompoundInterest(
    principal: number,
    rate: number,
    time: number,
    compoundFrequency: number = 1
): number {
    return principal * Math.pow(1 + rate / compoundFrequency, compoundFrequency * time);
}

// Usage examples
console.log(NumberUtils.round(3.14159, 2)); // 3.14
console.log(NumberUtils.clamp(150, 0, 100)); // 100
console.log(calculateCircleArea(5)); // 78.54
```

### Boolean Type

```typescript
// Temel boolean tanımlaması
let isActive: boolean = true;
let isCompleted: boolean = false;

// Boolean from expressions
let isAdult: boolean = age >= 18;
let hasPermission: boolean = user.role === 'admin' || user.role === 'moderator';

// Boolean utilities and validation
class BooleanUtils {
    static parseBoolean(value: string | number | boolean): boolean {
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
        }
        
        if (typeof value === 'number') {
            return value !== 0;
        }
        
        return false;
    }
    
    static isTruthy(value: any): boolean {
        return Boolean(value);
    }
    
    static isFalsy(value: any): boolean {
        return !Boolean(value);
    }
}

// Boolean logic examples
interface UserPermissions {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canAdmin: boolean;
}

class PermissionChecker {
    static canPerformAction(
        permissions: UserPermissions,
        action: 'read' | 'write' | 'delete' | 'admin'
    ): boolean {
        switch (action) {
            case 'read':
                return permissions.canRead;
            case 'write':
                return permissions.canWrite && permissions.canRead;
            case 'delete':
                return permissions.canDelete && permissions.canWrite && permissions.canRead;
            case 'admin':
                return permissions.canAdmin;
            default:
                return false;
        }
    }
    
    static hasAnyPermission(permissions: UserPermissions): boolean {
        return permissions.canRead || permissions.canWrite || 
               permissions.canDelete || permissions.canAdmin;
    }
    
    static hasAllPermissions(permissions: UserPermissions): boolean {
        return permissions.canRead && permissions.canWrite && 
               permissions.canDelete && permissions.canAdmin;
    }
}
```

### BigInt Type

```typescript
// BigInt for large integers
let bigNumber: bigint = 9007199254740991n;
let anotherBig: bigint = BigInt(9007199254740991);

// BigInt operations
let sum: bigint = bigNumber + 1n;
let product: bigint = bigNumber * 2n;

// BigInt utilities
class BigIntUtils {
    static fromString(str: string): bigint {
        return BigInt(str);
    }
    
    static toString(value: bigint): string {
        return value.toString();
    }
    
    static max(...values: bigint[]): bigint {
        return values.reduce((max, current) => current > max ? current : max);
    }
    
    static min(...values: bigint[]): bigint {
        return values.reduce((min, current) => current < min ? current : min);
    }
    
    static abs(value: bigint): bigint {
        return value < 0n ? -value : value;
    }
}
```

### Symbol Type

```typescript
// Unique symbols
let sym1: symbol = Symbol();
let sym2: symbol = Symbol("description");
let sym3: symbol = Symbol("description");

console.log(sym2 === sym3); // false - her symbol benzersizdir

// Symbol as object keys
const CACHE_KEY: unique symbol = Symbol("cache");
const USER_ID: unique symbol = Symbol("userId");

interface CacheableObject {
    [CACHE_KEY]?: any;
    [USER_ID]?: number;
}

// Well-known symbols
class CustomIterable {
    private items: string[] = [];
    
    add(item: string): void {
        this.items.push(item);
    }
    
    *[Symbol.iterator](): Iterator<string> {
        for (const item of this.items) {
            yield item;
        }
    }
    
    [Symbol.toStringTag]: string = "CustomIterable";
}

const iterable = new CustomIterable();
iterable.add("item1");
iterable.add("item2");

for (const item of iterable) {
    console.log(item); // item1, item2
}
```

## Array ve Tuple Types

### Array Types

```typescript
// Array tanımlama yöntemleri
let numbers: number[] = [1, 2, 3, 4, 5];
let strings: Array<string> = ["hello", "world"];
let booleans: boolean[] = [true, false, true];

// Mixed type arrays (union types ile)
let mixed: (string | number)[] = ["hello", 42, "world", 100];

// Nested arrays
let matrix: number[][] = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

// Array methods with type safety
class ArrayUtils {
    static sum(numbers: number[]): number {
        return numbers.reduce((sum, num) => sum + num, 0);
    }
    
    static average(numbers: number[]): number {
        return numbers.length > 0 ? this.sum(numbers) / numbers.length : 0;
    }
    
    static unique<T>(array: T[]): T[] {
        return [...new Set(array)];
    }
    
    static chunk<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static flatten<T>(arrays: T[][]): T[] {
        return arrays.reduce((flat, arr) => flat.concat(arr), []);
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
    
    static findDuplicates<T>(array: T[]): T[] {
        const seen = new Set<T>();
        const duplicates = new Set<T>();
        
        for (const item of array) {
            if (seen.has(item)) {
                duplicates.add(item);
            } else {
                seen.add(item);
            }
        }
        
        return Array.from(duplicates);
    }
}

// Advanced array operations
interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
}

class ProductService {
    private products: Product[] = [];
    
    addProduct(product: Product): void {
        this.products.push(product);
    }
    
    getProductsByCategory(category: string): Product[] {
        return this.products.filter(p => p.category === category);
    }
    
    getAvailableProducts(): Product[] {
        return this.products.filter(p => p.inStock);
    }
    
    getProductsByPriceRange(min: number, max: number): Product[] {
        return this.products.filter(p => p.price >= min && p.price <= max);
    }
    
    sortProductsByPrice(direction: 'asc' | 'desc' = 'asc'): Product[] {
        return ArrayUtils.sortBy(this.products, 'price', direction);
    }
    
    getProductStatistics(): {
        total: number;
        inStock: number;
        averagePrice: number;
        categories: string[];
    } {
        const inStockProducts = this.getAvailableProducts();
        const prices = this.products.map(p => p.price);
        const categories = ArrayUtils.unique(this.products.map(p => p.category));
        
        return {
            total: this.products.length,
            inStock: inStockProducts.length,
            averagePrice: ArrayUtils.average(prices),
            categories
        };
    }
}
```

### Tuple Types

```typescript
// Temel tuple tanımlaması
let person: [string, number] = ["John", 30];
let coordinates: [number, number] = [10.5, 20.3];
let rgb: [number, number, number] = [255, 128, 0];

// Named tuple elements (TypeScript 4.0+)
let namedTuple: [name: string, age: number, isActive: boolean] = ["John", 30, true];

// Optional tuple elements
let optionalTuple: [string, number?] = ["hello"];
let optionalTuple2: [string, number?] = ["hello", 42];

// Rest elements in tuples
let restTuple: [string, ...number[]] = ["prefix", 1, 2, 3, 4];
let restTuple2: [string, number, ...boolean[]] = ["test", 42, true, false, true];

// Readonly tuples
let readonlyTuple: readonly [string, number] = ["immutable", 42];
// readonlyTuple[0] = "new value"; // Error: Cannot assign to '0' because it is a read-only property

// Tuple utilities
class TupleUtils {
    static first<T extends readonly unknown[]>(tuple: T): T[0] {
        return tuple[0];
    }
    
    static last<T extends readonly unknown[]>(tuple: T): T extends readonly [...unknown[], infer L] ? L : never {
        return tuple[tuple.length - 1] as any;
    }
    
    static length<T extends readonly unknown[]>(tuple: T): T['length'] {
        return tuple.length;
    }
    
    static reverse<T extends readonly unknown[]>(tuple: T): T {
        return [...tuple].reverse() as T;
    }
}

// Practical tuple examples
type Point2D = [x: number, y: number];
type Point3D = [x: number, y: number, z: number];
type Color = [red: number, green: number, blue: number];
type RGBA = [red: number, green: number, blue: number, alpha: number];

class GeometryUtils {
    static distance2D(point1: Point2D, point2: Point2D): number {
        const [x1, y1] = point1;
        const [x2, y2] = point2;
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    static distance3D(point1: Point3D, point2: Point3D): number {
        const [x1, y1, z1] = point1;
        const [x2, y2, z2] = point2;
        return Math.sqrt(
            Math.pow(x2 - x1, 2) + 
            Math.pow(y2 - y1, 2) + 
            Math.pow(z2 - z1, 2)
        );
    }
    
    static midpoint2D(point1: Point2D, point2: Point2D): Point2D {
        const [x1, y1] = point1;
        const [x2, y2] = point2;
        return [(x1 + x2) / 2, (y1 + y2) / 2];
    }
}

class ColorUtils {
    static rgbToHex([r, g, b]: Color): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    static hexToRgb(hex: string): Color | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }
    
    static rgbaToString([r, g, b, a]: RGBA): string {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
}
```

## Object Types

### Interface Definitions

```typescript
// Temel interface tanımlaması
interface User {
    id: number;
    name: string;
    email: string;
    age?: number; // Optional property
    readonly createdAt: Date; // Readonly property
}

// Method signatures in interfaces
interface UserService {
    createUser(userData: Omit<User, 'id' | 'createdAt'>): User;
    getUserById(id: number): User | undefined;
    updateUser(id: number, updates: Partial<User>): User | undefined;
    deleteUser(id: number): boolean;
}

// Index signatures
interface StringDictionary {
    [key: string]: string;
}

interface NumberDictionary {
    [key: string]: number;
}

interface FlexibleObject {
    name: string;
    [key: string]: any; // Additional properties allowed
}

// Extending interfaces
interface BaseEntity {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

interface User extends BaseEntity {
    name: string;
    email: string;
    role: 'user' | 'admin' | 'moderator';
}

interface Product extends BaseEntity {
    name: string;
    price: number;
    category: string;
    inStock: boolean;
}

// Multiple interface inheritance
interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

interface Auditable {
    createdBy: string;
    updatedBy: string;
}

interface AuditableEntity extends Timestamped, Auditable {
    id: number;
}

// Generic interfaces
interface Repository<T> {
    findById(id: number): T | undefined;
    findAll(): T[];
    save(entity: T): T;
    delete(id: number): boolean;
}

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
    errors?: string[];
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
```

### Type Aliases

```typescript
// Temel type aliases
type ID = string | number;
type Status = 'pending' | 'approved' | 'rejected';
type EventHandler<T> = (event: T) => void;

// Object type aliases
type Point = {
    x: number;
    y: number;
};

type Circle = {
    center: Point;
    radius: number;
};

type Rectangle = {
    topLeft: Point;
    bottomRight: Point;
};

// Function type aliases
type Predicate<T> = (item: T) => boolean;
type Mapper<T, U> = (item: T) => U;
type Reducer<T, U> = (accumulator: U, current: T) => U;

// Complex type compositions
type UserRole = 'user' | 'admin' | 'moderator';
type Permission = 'read' | 'write' | 'delete' | 'admin';

type UserWithRole = User & {
    role: UserRole;
    permissions: Permission[];
};

type CreateUserRequest = Omit<User, 'id' | 'createdAt'>;
type UpdateUserRequest = Partial<Omit<User, 'id' | 'createdAt'>>;

// Conditional types
type NonNullable<T> = T extends null | undefined ? never : T;
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// Mapped types
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

type Partial<T> = {
    [P in keyof T]?: T[P];
};

type Required<T> = {
    [P in keyof T]-?: T[P];
};

// Template literal types
type EventName = `on${Capitalize<string>}`;
type CSSProperty = `--${string}`;
type APIEndpoint = `/api/${string}`;

// Practical examples
class TypedEventEmitter<T extends Record<string, any[]>> {
    private listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};
    
    on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }
    
    emit<K extends keyof T>(event: K, ...args: T[K]): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            eventListeners.forEach(listener => listener(...args));
        }
    }
    
    off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }
}

// Usage
type AppEvents = {
    userLogin: [user: User];
    userLogout: [userId: number];
    dataUpdate: [data: any, timestamp: Date];
    error: [error: Error, context?: string];
};

const eventEmitter = new TypedEventEmitter<AppEvents>();

eventEmitter.on('userLogin', (user) => {
    console.log(`User ${user.name} logged in`);
});

eventEmitter.on('error', (error, context) => {
    console.error(`Error in ${context}:`, error.message);
});
```

## Union ve Intersection Types

### Union Types

```typescript
// Temel union types
type StringOrNumber = string | number;
type Status = 'loading' | 'success' | 'error';
type Theme = 'light' | 'dark' | 'auto';

// Function parameters with union types
function formatValue(value: string | number): string {
    if (typeof value === 'string') {
        return value.toUpperCase();
    }
    return value.toFixed(2);
}

// Discriminated unions (Tagged unions)
interface LoadingState {
    status: 'loading';
}

interface SuccessState {
    status: 'success';
    data: any;
}

interface ErrorState {
    status: 'error';
    error: string;
}

type AsyncState = LoadingState | SuccessState | ErrorState;

// Type guards for union types
function handleAsyncState(state: AsyncState): string {
    switch (state.status) {
        case 'loading':
            return 'Loading...';
        case 'success':
            return `Data loaded: ${JSON.stringify(state.data)}`;
        case 'error':
            return `Error: ${state.error}`;
        default:
            // Exhaustiveness check
            const _exhaustiveCheck: never = state;
            return _exhaustiveCheck;
    }
}

// Complex union types
interface Circle {
    kind: 'circle';
    radius: number;
}

interface Rectangle {
    kind: 'rectangle';
    width: number;
    height: number;
}

interface Triangle {
    kind: 'triangle';
    base: number;
    height: number;
}

type Shape = Circle | Rectangle | Triangle;

class ShapeCalculator {
    static area(shape: Shape): number {
        switch (shape.kind) {
            case 'circle':
                return Math.PI * shape.radius * shape.radius;
            case 'rectangle':
                return shape.width * shape.height;
            case 'triangle':
                return (shape.base * shape.height) / 2;
            default:
                const _exhaustiveCheck: never = shape;
                throw new Error(`Unknown shape: ${_exhaustiveCheck}`);
        }
    }
    
    static perimeter(shape: Shape): number {
        switch (shape.kind) {
            case 'circle':
                return 2 * Math.PI * shape.radius;
            case 'rectangle':
                return 2 * (shape.width + shape.height);
            case 'triangle':
                // Assuming equilateral triangle for simplicity
                return 3 * shape.base;
            default:
                const _exhaustiveCheck: never = shape;
                throw new Error(`Unknown shape: ${_exhaustiveCheck}`);
        }
    }
}
```

### Intersection Types

```typescript
// Temel intersection types
interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

interface Auditable {
    createdBy: string;
    updatedBy: string;
}

type AuditableTimestamped = Timestamped & Auditable;

// Mixin pattern with intersection types
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

type Duck = Flyable & Swimmable & Walkable;

class RealDuck implements Duck {
    altitude: number = 0;
    depth: number = 0;
    speed: number = 5;
    
    fly(): void {
        this.altitude = 100;
        console.log(`Flying at altitude ${this.altitude}m`);
    }
    
    swim(): void {
        this.depth = 2;
        console.log(`Swimming at depth ${this.depth}m`);
    }
    
    walk(): void {
        console.log(`Walking at speed ${this.speed} km/h`);
    }
}

// Advanced intersection patterns
interface BaseConfig {
    apiUrl: string;
    timeout: number;
}

interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
}

interface CacheConfig {
    redis: {
        host: string;
        port: number;
    };
    ttl: number;
}

type AppConfig = BaseConfig & DatabaseConfig & CacheConfig;

// Conditional intersection types
type MergeObjects<T, U> = {
    [K in keyof T | keyof U]: K extends keyof T
        ? K extends keyof U
            ? T[K] | U[K]
            : T[K]
        : K extends keyof U
        ? U[K]
        : never;
};

// Utility functions for intersection types
class ObjectUtils {
    static merge<T, U>(obj1: T, obj2: U): T & U {
        return { ...obj1, ...obj2 };
    }
    
    static deepMerge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
        const result = { ...obj1 } as T & U;
        
        for (const key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                const value = obj2[key];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    (result as any)[key] = this.deepMerge((result as any)[key] || {}, value);
                } else {
                    (result as any)[key] = value;
                }
            }
        }
        
        return result;
    }
}
```

## Literal Types

### String Literal Types

```typescript
// String literal types
type Direction = 'north' | 'south' | 'east' | 'west';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;
type CSSVariable<T extends string> = `--${T}`;
type APIRoute<T extends string> = `/api/${T}`;

// Practical examples
class Logger {
    private static logLevel: LogLevel = 'info';
    
    static setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }
    
    static log(level: LogLevel, message: string): void {
        const levels: Record<LogLevel, number> = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        if (levels[level] >= levels[this.logLevel]) {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    }
}

// HTTP client with literal types
class HttpClient {
    async request<T>(
        method: HttpMethod,
        url: string,
        data?: any
    ): Promise<T> {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    get<T>(url: string): Promise<T> {
        return this.request<T>('GET', url);
    }
    
    post<T>(url: string, data: any): Promise<T> {
        return this.request<T>('POST', url, data);
    }
    
    put<T>(url: string, data: any): Promise<T> {
        return this.request<T>('PUT', url, data);
    }
    
    delete<T>(url: string): Promise<T> {
        return this.request<T>('DELETE', url);
    }
}
```

### Numeric Literal Types

```typescript
// Numeric literal types
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;
type Port = 3000 | 8000 | 8080;

// Boolean literal types
type True = true;
type False = false;

// Mixed literal types
type Config = {
    environment: 'development' | 'staging' | 'production';
    port: 3000 | 8000 | 8080;
    debug: true | false;
    version: '1.0' | '2.0' | '3.0';
};

// Utility types with literals
type ExtractLiterals<T> = T extends string | number | boolean | null | undefined ? T : never;

// Template literal patterns
type Size = 'small' | 'medium' | 'large';
type Color = 'red' | 'green' | 'blue';
type Variant = `${Size}-${Color}`;

// Advanced template literals
type HTTPSUrl = `https://${string}`;
type EmailAddress = `${string}@${string}.${string}`;
type CSSPixelValue = `${number}px`;
type CSSPercentValue = `${number}%`;

// Validation functions for literal types
class ValidationUtils {
    static isValidHttpMethod(method: string): method is HttpMethod {
        return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    }
    
    static isValidLogLevel(level: string): level is LogLevel {
        return ['debug', 'info', 'warn', 'error'].includes(level);
    }
    
    static isValidDirection(direction: string): direction is Direction {
        return ['north', 'south', 'east', 'west'].includes(direction);
    }
}
```

Bu kapsamlı TypeScript tipler rehberi, dilin tip sisteminin temellerini ve ileri seviye özelliklerini detaylı bir şekilde ele almaktadır. Sonraki derslerde daha spesifik konuları inceleyeceğiz.