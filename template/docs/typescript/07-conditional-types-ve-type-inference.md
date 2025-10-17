# TypeScript Conditional Types ve Type Inference

## İçindekiler
1. [Conditional Types Nedir?](#conditional-types-nedir)
2. [Basic Conditional Types](#basic-conditional-types)
3. [Distributive Conditional Types](#distributive-conditional-types)
4. [Type Inference with infer](#type-inference-with-infer)
5. [Advanced Conditional Patterns](#advanced-conditional-patterns)
6. [Recursive Conditional Types](#recursive-conditional-types)
7. [Practical Applications](#practical-applications)
8. [Performance Considerations](#performance-considerations)
9. [Debugging Conditional Types](#debugging-conditional-types)
10. [Best Practices](#best-practices)

## Conditional Types Nedir?

Conditional Types, TypeScript'te tip seviyesinde if-else logic'i yazmamızı sağlayan güçlü bir özelliktir. `T extends U ? X : Y` syntax'ı kullanır.

### Temel Syntax

```typescript
// Basic conditional type syntax
type ConditionalType<T> = T extends string ? "string type" : "not string type";

type Test1 = ConditionalType<string>;    // "string type"
type Test2 = ConditionalType<number>;    // "not string type"
type Test3 = ConditionalType<boolean>;   // "not string type"

// More complex example
type IsArray<T> = T extends any[] ? true : false;

type ArrayTest1 = IsArray<string[]>;     // true
type ArrayTest2 = IsArray<number>;       // false
type ArrayTest3 = IsArray<boolean[]>;    // true

// Function type checking
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type FunctionTest1 = IsFunction<() => void>;           // true
type FunctionTest2 = IsFunction<(x: number) => string>; // true
type FunctionTest3 = IsFunction<string>;               // false
```

### Real-world Example

```typescript
// API Response type based on success/error
type ApiResponse<T, TError = string> = {
  success: true;
  data: T;
} | {
  success: false;
  error: TError;
};

// Conditional type to extract data type
type ExtractData<T> = T extends { success: true; data: infer D } ? D : never;

// Usage
type UserResponse = ApiResponse<{ id: number; name: string }>;
type UserData = ExtractData<UserResponse>; // { id: number; name: string }

// Practical implementation
class ApiClient {
  async request<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Request failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Type-safe data extraction
  extractData<T extends ApiResponse<any>>(response: T): ExtractData<T> | null {
    return response.success ? response.data : null;
  }
}
```

## Basic Conditional Types

### Type Guards with Conditional Types

```typescript
// Null/undefined checking
type NonNullable<T> = T extends null | undefined ? never : T;

type CleanString = NonNullable<string | null | undefined>; // string
type CleanNumber = NonNullable<number | null>;             // number

// Optional property checking
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
}

type UserRequiredKeys = RequiredKeys<User>; // "id" | "name" | "address"
type UserOptionalKeys = OptionalKeys<User>; // "email" | "phone"

// Practical usage
class UserValidator {
  validateRequired<T, K extends RequiredKeys<T>>(
    obj: T, 
    key: K
  ): obj is T & Record<K, NonNullable<T[K]>> {
    return obj[key] != null;
  }

  validateUser(user: Partial<User>): user is User {
    const requiredKeys: RequiredKeys<User>[] = ['id', 'name', 'address'];
    return requiredKeys.every(key => this.validateRequired(user, key));
  }
}
```

### Function Parameter and Return Type Extraction

```typescript
// Extract function parameters
type Parameters<T extends (...args: any) => any> = 
  T extends (...args: infer P) => any ? P : never;

// Extract function return type
type ReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => infer R ? R : any;

// Example functions
function addNumbers(a: number, b: number): number {
  return a + b;
}

function processUser(user: User, options?: { validate: boolean }): Promise<User> {
  return Promise.resolve(user);
}

// Extract types
type AddParams = Parameters<typeof addNumbers>;        // [number, number]
type AddReturn = ReturnType<typeof addNumbers>;        // number
type ProcessParams = Parameters<typeof processUser>;   // [User, { validate: boolean }?]
type ProcessReturn = ReturnType<typeof processUser>;   // Promise<User>

// Practical usage - Function wrapper
class FunctionWrapper {
  static wrap<T extends (...args: any[]) => any>(
    fn: T,
    beforeHook?: (...args: Parameters<T>) => void,
    afterHook?: (result: ReturnType<T>) => void
  ): T {
    return ((...args: Parameters<T>) => {
      beforeHook?.(...args);
      const result = fn(...args);
      afterHook?.(result);
      return result;
    }) as T;
  }
}

// Usage
const wrappedAdd = FunctionWrapper.wrap(
  addNumbers,
  (a, b) => console.log(`Adding ${a} + ${b}`),
  (result) => console.log(`Result: ${result}`)
);

const result = wrappedAdd(5, 3); // Logs: "Adding 5 + 3", "Result: 8"
```

## Distributive Conditional Types

### Understanding Distribution

```typescript
// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;

type StringOrNumberArray = ToArray<string | number>;
// Distributes to: ToArray<string> | ToArray<number>
// Results in: string[] | number[]

// Non-distributive version
type ToArrayNonDistributive<T> = [T] extends [any] ? T[] : never;

type NonDistributiveResult = ToArrayNonDistributive<string | number>;
// Results in: (string | number)[]

// Practical example - Event system
type EventMap = {
  'user:created': { userId: number; timestamp: Date };
  'user:updated': { userId: number; changes: string[] };
  'user:deleted': { userId: number };
  'order:placed': { orderId: number; userId: number; total: number };
};

// Extract event names
type EventNames = keyof EventMap; // 'user:created' | 'user:updated' | 'user:deleted' | 'order:placed'

// Extract user-related events
type UserEvents<T> = T extends `user:${infer _}` ? T : never;
type UserEventNames = UserEvents<EventNames>; // 'user:created' | 'user:updated' | 'user:deleted'

// Event handler type
type EventHandler<T extends EventNames> = (data: EventMap[T]) => void;

// Distributive event listener
type EventListeners = {
  [K in EventNames]: EventHandler<K>[];
};

class EventEmitter {
  private listeners: Partial<EventListeners> = {};

  on<T extends EventNames>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);
  }

  emit<T extends EventNames>(event: T, data: EventMap[T]): void {
    const handlers = this.listeners[event];
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Get all user event handlers
  getUserEventHandlers(): Partial<Pick<EventListeners, UserEventNames>> {
    const userEvents: UserEventNames[] = ['user:created', 'user:updated', 'user:deleted'];
    const result: Partial<Pick<EventListeners, UserEventNames>> = {};
    
    userEvents.forEach(event => {
      if (this.listeners[event]) {
        result[event] = this.listeners[event];
      }
    });
    
    return result;
  }
}
```

## Type Inference with infer

### Basic infer Usage

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type StringElement = ArrayElement<string[]>;     // string
type NumberElement = ArrayElement<number[]>;     // number
type MixedElement = ArrayElement<(string | number)[]>; // string | number

// Extract Promise value type
type PromiseValue<T> = T extends Promise<infer U> ? U : never;

type StringPromise = PromiseValue<Promise<string>>;   // string
type UserPromise = PromiseValue<Promise<User>>;       // User
type NotPromise = PromiseValue<string>;               // never

// Extract function first parameter
type FirstParameter<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

type FirstParam1 = FirstParameter<(x: string, y: number) => void>; // string
type FirstParam2 = FirstParameter<(user: User) => Promise<void>>;   // User
type FirstParam3 = FirstParameter<() => void>;                     // never
```

### Advanced infer Patterns

```typescript
// Deep property access
type DeepGet<T, K extends string> = K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? DeepGet<T[First], Rest>
    : never
  : K extends keyof T
  ? T[K]
  : never;

interface NestedObject {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  system: {
    version: string;
  };
}

type UserName = DeepGet<NestedObject, 'user.profile.name'>;        // string
type UserAge = DeepGet<NestedObject, 'user.profile.age'>;          // number
type Theme = DeepGet<NestedObject, 'user.settings.theme'>;         // 'light' | 'dark'
type Version = DeepGet<NestedObject, 'system.version'>;            // string
type Invalid = DeepGet<NestedObject, 'user.invalid.path'>;         // never

// Practical implementation
class ObjectNavigator {
  static get<T, K extends string>(obj: T, path: K): DeepGet<T, K> {
    const keys = path.split('.');
    let current: any = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined as DeepGet<T, K>;
      }
    }
    
    return current as DeepGet<T, K>;
  }
}

// Usage
const data: NestedObject = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark', notifications: true }
  },
  system: { version: '1.0.0' }
};

const userName = ObjectNavigator.get(data, 'user.profile.name'); // Type: string
const theme = ObjectNavigator.get(data, 'user.settings.theme');  // Type: 'light' | 'dark'
```

### Function Composition with infer

```typescript
// Compose function types
type Compose<F, G> = F extends (arg: infer A) => infer B
  ? G extends (arg: B) => infer C
    ? (arg: A) => C
    : never
  : never;

// Chain multiple functions
type Chain<Functions extends readonly any[]> = Functions extends readonly [
  infer First,
  ...infer Rest
]
  ? Rest extends readonly []
    ? First
    : First extends (arg: any) => any
    ? Rest extends readonly [(arg: any) => any, ...any[]]
      ? Chain<[Compose<First, Rest[0]>, ...Rest extends readonly [any, ...infer RestTail] ? RestTail : []]>
      : never
    : never
  : never;

// Example functions
const toString = (x: number): string => x.toString();
const toUpperCase = (x: string): string => x.toUpperCase();
const addExclamation = (x: string): string => x + '!';

// Function composition utility
class FunctionComposer {
  static compose<A, B, C>(
    f: (arg: A) => B,
    g: (arg: B) => C
  ): (arg: A) => C {
    return (arg: A) => g(f(arg));
  }

  static pipe<T extends readonly [any, ...any[]]>(
    ...functions: T
  ): T extends readonly [(arg: infer A) => any, ...any[]]
    ? (arg: A) => any
    : never {
    return ((arg: any) => {
      return functions.reduce((acc, fn) => fn(acc), arg);
    }) as any;
  }
}

// Usage
const numberToExclamation = FunctionComposer.pipe(
  toString,
  toUpperCase,
  addExclamation
);

const result = numberToExclamation(42); // "42!"
```

## Advanced Conditional Patterns

### Template Literal Type Manipulation

```typescript
// String manipulation with conditional types
type CamelCase<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${First}${Capitalize<CamelCase<Rest>>}`
  : S;

type SnakeCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `_${Lowercase<First>}${SnakeCase<Rest>}`
    : `${First}${SnakeCase<Rest>}`
  : S;

// Examples
type CamelCased = CamelCase<'user_name_field'>;     // "userNameField"
type SnakeCased = SnakeCase<'UserNameField'>;       // "_user_name_field"

// Object key transformation
type CamelCaseKeys<T> = {
  [K in keyof T as K extends string ? CamelCase<K> : K]: T[K];
};

type SnakeCaseKeys<T> = {
  [K in keyof T as K extends string ? SnakeCase<K> : K]: T[K];
};

interface ApiUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  created_at: Date;
}

type ClientUser = CamelCaseKeys<ApiUser>;
// {
//   userId: number;
//   firstName: string;
//   lastName: string;
//   emailAddress: string;
//   createdAt: Date;
// }

// Practical transformer
class ObjectTransformer {
  static toCamelCase<T extends Record<string, any>>(obj: T): CamelCaseKeys<T> {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    
    return result as CamelCaseKeys<T>;
  }

  static toSnakeCase<T extends Record<string, any>>(obj: T): SnakeCaseKeys<T> {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = value;
    }
    
    return result as SnakeCaseKeys<T>;
  }
}
```

### Recursive Type Processing

```typescript
// Deep readonly implementation
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

// Deep partial implementation
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

// Flatten nested object types
type Flatten<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: Flatten<O[K]> }
    : never
  : T;

interface ComplexNested {
  level1: {
    level2: {
      level3: {
        value: string;
        count: number;
      };
      other: boolean;
    };
    simple: string;
  };
  root: number;
}

type ReadonlyComplex = DeepReadonly<ComplexNested>;
type PartialComplex = DeepPartial<ComplexNested>;
type FlatComplex = Flatten<ComplexNested>;

// Practical configuration manager
class ConfigManager<T extends Record<string, any>> {
  private config: DeepReadonly<T>;

  constructor(config: T) {
    this.config = this.deepFreeze(config);
  }

  private deepFreeze<U>(obj: U): DeepReadonly<U> {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = (obj as any)[prop];
      if (value && typeof value === 'object') {
        this.deepFreeze(value);
      }
    });
    return Object.freeze(obj) as DeepReadonly<U>;
  }

  get(): DeepReadonly<T> {
    return this.config;
  }

  update(updates: DeepPartial<T>): ConfigManager<T> {
    const newConfig = this.deepMerge(this.config as T, updates);
    return new ConfigManager(newConfig);
  }

  private deepMerge<U, V>(target: U, source: V): U & V {
    const result = { ...target } as any;
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}
```

Bu ders TypeScript'in conditional types ve type inference özelliklerinin derinlemesine incelenmesini sağlar. Bu güçlü özellikler, tip güvenliği ve kod kalitesini artırmak için kritik araçlardır.