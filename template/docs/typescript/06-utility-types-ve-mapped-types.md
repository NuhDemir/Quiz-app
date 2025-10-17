# TypeScript Utility Types ve Mapped Types

## İçindekiler
1. [Utility Types Nedir?](#utility-types-nedir)
2. [Built-in Utility Types](#built-in-utility-types)
3. [Mapped Types](#mapped-types)
4. [Conditional Types](#conditional-types)
5. [Template Literal Types](#template-literal-types)
6. [Custom Utility Types](#custom-utility-types)
7. [Advanced Type Manipulation](#advanced-type-manipulation)
8. [Real-world Examples](#real-world-examples)
9. [Performance Considerations](#performance-considerations)
10. [Best Practices](#best-practices)

## Utility Types Nedir?

Utility Types, TypeScript'te mevcut tiplerden yeni tipler oluşturmak için kullanılan built-in generic type'lardır. Bu tipler, kod tekrarını azaltır ve tip güvenliğini artırır.

### Temel Kavramlar

```typescript
// Utility types'ın temel amacı
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Manuel olarak partial type oluşturmak yerine
interface PartialUser {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Utility type kullanarak
type PartialUserUtility = Partial<User>;

// Manuel olarak pick type oluşturmak yerine
interface UserPublicInfo {
  id: number;
  name: string;
  email: string;
}

// Utility type kullanarak
type UserPublicInfoUtility = Pick<User, 'id' | 'name' | 'email'>;
```

## Built-in Utility Types

### Partial<T>

```typescript
// Partial<T> - Tüm property'leri optional yapar
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
}

type PartialProduct = Partial<Product>;
// Equivalent to:
// {
//   id?: number;
//   name?: string;
//   price?: number;
//   description?: string;
//   category?: string;
//   inStock?: boolean;
// }

// Practical usage
class ProductService {
  private products: Product[] = [];

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) return null;

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updates
    };

    return this.products[productIndex];
  }

  // Usage examples
  exampleUsage() {
    // Only update name
    this.updateProduct(1, { name: "New Product Name" });
    
    // Update multiple fields
    this.updateProduct(2, { 
      price: 99.99, 
      inStock: false 
    });
    
    // All fields are optional
    this.updateProduct(3, {});
  }
}
```

### Required<T>

```typescript
// Required<T> - Tüm property'leri required yapar
interface OptionalConfig {
  host?: string;
  port?: number;
  ssl?: boolean;
  timeout?: number;
  retries?: number;
}

type RequiredConfig = Required<OptionalConfig>;
// Equivalent to:
// {
//   host: string;
//   port: number;
//   ssl: boolean;
//   timeout: number;
//   retries: number;
// }

// Practical usage
class DatabaseConnection {
  private config: RequiredConfig;

  constructor(config: OptionalConfig) {
    // Provide defaults and ensure all required fields
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 5432,
      ssl: config.ssl ?? false,
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };
  }

  connect(): void {
    console.log(`Connecting to ${this.config.host}:${this.config.port}`);
    console.log(`SSL: ${this.config.ssl}`);
    console.log(`Timeout: ${this.config.timeout}ms`);
  }
}

// Usage
const db = new DatabaseConnection({
  host: 'prod-db.example.com',
  ssl: true
  // Other fields will use defaults
});
```

### Pick<T, K>

```typescript
// Pick<T, K> - Belirli property'leri seçer
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  salary: number;
  startDate: Date;
  isActive: boolean;
}

// Public employee info (no sensitive data)
type PublicEmployeeInfo = Pick<Employee, 'id' | 'firstName' | 'lastName' | 'department'>;

// Contact information
type EmployeeContact = Pick<Employee, 'email' | 'phone'>;

// Employment details
type EmploymentDetails = Pick<Employee, 'department' | 'startDate' | 'isActive'>;

// Practical usage
class EmployeeService {
  private employees: Employee[] = [];

  getPublicInfo(id: number): PublicEmployeeInfo | null {
    const employee = this.employees.find(e => e.id === id);
    if (!employee) return null;

    return {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department
    };
  }

  getContactInfo(id: number): EmployeeContact | null {
    const employee = this.employees.find(e => e.id === id);
    if (!employee) return null;

    return {
      email: employee.email,
      phone: employee.phone
    };
  }

  // Bulk operations with picked types
  updateContactInfo(id: number, contact: EmployeeContact): boolean {
    const employeeIndex = this.employees.findIndex(e => e.id === id);
    if (employeeIndex === -1) return false;

    this.employees[employeeIndex] = {
      ...this.employees[employeeIndex],
      ...contact
    };

    return true;
  }
}
```

### Omit<T, K>

```typescript
// Omit<T, K> - Belirli property'leri çıkarır
interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// User creation (no id, timestamps)
type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;

// User response (no password)
type UserResponse = Omit<User, 'password'>;

// User update (no id, createdAt)
type UpdateUserRequest = Omit<User, 'id' | 'createdAt'>;

// Practical usage
class UserService {
  private users: User[] = [];
  private nextId = 1;

  createUser(userData: CreateUserRequest): UserResponse {
    const newUser: User = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(newUser);

    // Return user without password
    const { password, ...userResponse } = newUser;
    return userResponse;
  }

  updateUser(id: number, updates: Partial<UpdateUserRequest>): UserResponse | null {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    const { password, ...userResponse } = this.users[userIndex];
    return userResponse;
  }

  getUserById(id: number): UserResponse | null {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;

    const { password, ...userResponse } = user;
    return userResponse;
  }
}
```

### Record<K, T>

```typescript
// Record<K, T> - Key-value mapping oluşturur
type UserRole = 'admin' | 'user' | 'moderator';
type Permission = 'read' | 'write' | 'delete' | 'admin';

// Role-based permissions
type RolePermissions = Record<UserRole, Permission[]>;

const rolePermissions: RolePermissions = {
  admin: ['read', 'write', 'delete', 'admin'],
  moderator: ['read', 'write', 'delete'],
  user: ['read']
};

// HTTP status codes
type HttpStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;
type StatusMessage = Record<HttpStatusCode, string>;

const statusMessages: StatusMessage = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error'
};

// Dynamic record types
type ApiEndpoints = Record<string, {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: Function;
}>;

const apiEndpoints: ApiEndpoints = {
  getUsers: {
    method: 'GET',
    path: '/api/users',
    handler: () => {}
  },
  createUser: {
    method: 'POST',
    path: '/api/users',
    handler: () => {}
  },
  updateUser: {
    method: 'PUT',
    path: '/api/users/:id',
    handler: () => {}
  }
};

// Practical usage with generics
class ConfigManager<T extends Record<string, any>> {
  private config: T;

  constructor(initialConfig: T) {
    this.config = initialConfig;
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.config[key] = value;
  }

  getAll(): T {
    return { ...this.config };
  }

  update(updates: Partial<T>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Usage
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

const configManager = new ConfigManager<AppConfig>({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  debug: false
});

const apiUrl = configManager.get('apiUrl'); // string
configManager.set('timeout', 10000); // Type-safe
```

## Mapped Types

### Basic Mapped Types

```typescript
// Mapped types - Existing type'ları transform eder
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Example usage
interface User {
  id: number;
  name: string;
  email: string;
}

type ReadonlyUser = Readonly<User>;
// {
//   readonly id: number;
//   readonly name: string;
//   readonly email: string;
// }

type OptionalUser = Optional<User>;
// {
//   id?: number;
//   name?: string;
//   email?: string;
// }

type NullableUser = Nullable<User>;
// {
//   id: number | null;
//   name: string | null;
//   email: string | null;
// }
```

### Advanced Mapped Types

```typescript
// Key remapping with template literals
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

interface Person {
  name: string;
  age: number;
  email: string;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
//   getEmail: () => string;
// }

type PersonSetters = Setters<Person>;
// {
//   setName: (value: string) => void;
//   setAge: (value: number) => void;
//   setEmail: (value: string) => void;
// }

// Combining getters and setters
type AccessorPattern<T> = Getters<T> & Setters<T>;

class PersonClass implements AccessorPattern<Person> {
  constructor(
    private name: string,
    private age: number,
    private email: string
  ) {}

  getName(): string {
    return this.name;
  }

  setName(value: string): void {
    this.name = value;
  }

  getAge(): number {
    return this.age;
  }

  setAge(value: number): void {
    this.age = value;
  }

  getEmail(): string {
    return this.email;
  }

  setEmail(value: string): void {
    this.email = value;
  }
}

// Filtering mapped types
type StringProperties<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

type NumberProperties<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

interface MixedType {
  id: number;
  name: string;
  count: number;
  description: string;
  isActive: boolean;
}

type StringKeys = StringProperties<MixedType>; // "name" | "description"
type NumberKeys = NumberProperties<MixedType>; // "id" | "count"

// Extract only string properties
type StringOnlyProperties<T> = Pick<T, StringProperties<T>>;
type MixedTypeStrings = StringOnlyProperties<MixedType>;
// {
//   name: string;
//   description: string;
// }
```

### Conditional Mapped Types

```typescript
// Conditional transformations in mapped types
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface NestedConfig {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
}

type ReadonlyNestedConfig = DeepReadonly<NestedConfig>;
// All properties at all levels become readonly

type PartialNestedConfig = DeepPartial<NestedConfig>;
// All properties at all levels become optional

// Practical usage
class ConfigurationManager {
  private config: DeepReadonly<NestedConfig>;

  constructor(config: NestedConfig) {
    this.config = config as DeepReadonly<NestedConfig>;
  }

  updateConfig(updates: DeepPartial<NestedConfig>): void {
    // Deep merge logic would go here
    // This ensures type safety for nested updates
  }

  getConfig(): DeepReadonly<NestedConfig> {
    return this.config;
  }
}
```

Bu ders TypeScript'in güçlü tip manipulation özelliklerinin temellerini ele almaktadır. Sonraki bölümlerde daha ileri seviye konuları inceleyeceğiz.