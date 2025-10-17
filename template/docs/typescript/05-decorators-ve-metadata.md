# TypeScript Decorators ve Metadata

## İçindekiler
1. [Decorator Temelleri](#decorator-temelleri)
2. [Class Decorators](#class-decorators)
3. [Method Decorators](#method-decorators)
4. [Property Decorators](#property-decorators)
5. [Parameter Decorators](#parameter-decorators)
6. [Decorator Factories](#decorator-factories)
7. [Metadata API](#metadata-api)
8. [Reflect Metadata](#reflect-metadata)
9. [Practical Examples](#practical-examples)
10. [Advanced Patterns](#advanced-patterns)

## Decorator Temelleri

Decorators, TypeScript'te sınıflar, metodlar, özellikler ve parametreler üzerinde metadata eklemek ve davranışlarını değiştirmek için kullanılan özel bir syntax'tır. Experimental bir özellik olduğu için `tsconfig.json`'da etkinleştirilmesi gerekir.

### Decorator Konfigürasyonu

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

### Temel Decorator Syntax

```typescript
// Decorator function signature
type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;
type PropertyDecorator = (target: any, propertyKey: string | symbol) => void;
type MethodDecorator = <T>(target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
type ParameterDecorator = (target: any, propertyKey: string | symbol, parameterIndex: number) => void;

// Simple decorator example
function simpleDecorator(target: any) {
    console.log('Decorator applied to:', target.name);
}

@simpleDecorator
class ExampleClass {
    constructor() {
        console.log('ExampleClass instantiated');
    }
}

// Decorator execution order
function first() {
    console.log("first(): factory evaluated");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("first(): called");
    };
}

function second() {
    console.log("second(): factory evaluated");
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("second(): called");
    };
}

class ExampleClass2 {
    @first()
    @second()
    method() {}
}

// Output:
// first(): factory evaluated
// second(): factory evaluated
// second(): called
// first(): called
```

## Class Decorators

Class decorators, sınıfın constructor'ına uygulanır ve sınıfın davranışını değiştirmek için kullanılır.

### Basic Class Decorators

```typescript
// Simple class decorator
function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}

@sealed
class BugReport {
    type = "report";
    title: string;

    constructor(t: string) {
        this.title = t;
    }
}

// Class decorator with return value
function classDecorator<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        newProperty = "new property";
        hello = "override";
    };
}

@classDecorator
class Greeter {
    property = "property";
    hello: string;
    constructor(m: string) {
        this.hello = m;
    }
}

console.log(new Greeter("world")); // { property: "property", hello: "override", newProperty: "new property" }

// Timestamp decorator
function timestamp<T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
        timestamp = new Date();
        
        getTimestamp() {
            return this.timestamp;
        }
    };
}

@timestamp
class User {
    constructor(public name: string, public email: string) {}
}

const user = new User("John", "john@example.com");
console.log((user as any).getTimestamp()); // Current date

// Singleton decorator
function singleton<T extends { new(...args: any[]): {} }>(constructor: T) {
    let instance: T;
    
    return class extends constructor {
        constructor(...args: any[]) {
            if (instance) {
                return instance;
            }
            super(...args);
            instance = this as any;
            return instance;
        }
    } as T;
}

@singleton
class DatabaseConnection {
    constructor(public connectionString: string) {
        console.log(`Creating connection to: ${connectionString}`);
    }
    
    query(sql: string) {
        console.log(`Executing: ${sql}`);
    }
}

const db1 = new DatabaseConnection("localhost:5432");
const db2 = new DatabaseConnection("localhost:5432");
console.log(db1 === db2); // true
```

### Advanced Class Decorators

```typescript
// Validation decorator
interface ValidatorMetadata {
    propertyKey: string;
    validator: (value: any) => boolean;
    message: string;
}

const validationMetadata = new Map<Function, ValidatorMetadata[]>();

function validate(target: any) {
    const original = target;
    
    function construct(constructor: any, args: any[]) {
        const instance = new constructor(...args);
        const validators = validationMetadata.get(constructor) || [];
        
        for (const validator of validators) {
            const value = (instance as any)[validator.propertyKey];
            if (!validator.validator(value)) {
                throw new Error(`Validation failed for ${validator.propertyKey}: ${validator.message}`);
            }
        }
        
        return instance;
    }
    
    const newConstructor: any = function (...args: any[]) {
        return construct(original, args);
    };
    
    newConstructor.prototype = original.prototype;
    validationMetadata.set(newConstructor, validationMetadata.get(original) || []);
    
    return newConstructor;
}

// Property validator decorators
function required(message: string = "Field is required") {
    return function (target: any, propertyKey: string) {
        const constructor = target.constructor;
        const validators = validationMetadata.get(constructor) || [];
        validators.push({
            propertyKey,
            validator: (value) => value !== null && value !== undefined && value !== "",
            message
        });
        validationMetadata.set(constructor, validators);
    };
}

function minLength(min: number, message?: string) {
    return function (target: any, propertyKey: string) {
        const constructor = target.constructor;
        const validators = validationMetadata.get(constructor) || [];
        validators.push({
            propertyKey,
            validator: (value) => typeof value === 'string' && value.length >= min,
            message: message || `Minimum length is ${min}`
        });
        validationMetadata.set(constructor, validators);
    };
}

function email(message: string = "Invalid email format") {
    return function (target: any, propertyKey: string) {
        const constructor = target.constructor;
        const validators = validationMetadata.get(constructor) || [];
        validators.push({
            propertyKey,
            validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message
        });
        validationMetadata.set(constructor, validators);
    };
}

@validate
class CreateUserRequest {
    @required("Name is required")
    @minLength(2, "Name must be at least 2 characters")
    name: string;
    
    @required("Email is required")
    @email("Please provide a valid email")
    email: string;
    
    constructor(name: string, email: string) {
        this.name = name;
        this.email = email;
    }
}

// Usage
try {
    const validUser = new CreateUserRequest("John Doe", "john@example.com"); // OK
    const invalidUser = new CreateUserRequest("", "invalid-email"); // Throws validation error
} catch (error) {
    console.error(error.message);
}

// Dependency injection decorator
interface ServiceMetadata {
    token: string;
    singleton?: boolean;
}

const serviceRegistry = new Map<string, any>();
const serviceMetadata = new Map<Function, ServiceMetadata>();

function injectable(metadata: ServiceMetadata) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        serviceMetadata.set(constructor, metadata);
        
        if (metadata.singleton) {
            let instance: any;
            return class extends constructor {
                constructor(...args: any[]) {
                    if (instance) {
                        return instance;
                    }
                    super(...args);
                    instance = this;
                    serviceRegistry.set(metadata.token, instance);
                    return instance;
                }
            } as T;
        } else {
            return class extends constructor {
                constructor(...args: any[]) {
                    super(...args);
                    serviceRegistry.set(metadata.token, this);
                }
            } as T;
        }
    };
}

function inject(token: string) {
    return function (target: any, propertyKey: string) {
        Object.defineProperty(target, propertyKey, {
            get: () => serviceRegistry.get(token),
            enumerable: true,
            configurable: true
        });
    };
}

@injectable({ token: 'UserService', singleton: true })
class UserService {
    getUsers() {
        return ['user1', 'user2'];
    }
}

@injectable({ token: 'Logger', singleton: true })
class Logger {
    log(message: string) {
        console.log(`[LOG] ${message}`);
    }
}

class UserController {
    @inject('UserService')
    private userService!: UserService;
    
    @inject('Logger')
    private logger!: Logger;
    
    getUsers() {
        this.logger.log('Getting users');
        return this.userService.getUsers();
    }
}

// Initialize services
new UserService();
new Logger();

const controller = new UserController();
console.log(controller.getUsers());
```

## Method Decorators

Method decorators, sınıf metodlarına uygulanır ve metodun davranışını değiştirmek için kullanılır.

### Basic Method Decorators

```typescript
// Simple method decorator
function log(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
        console.log(`Calling ${propertyName} with arguments:`, args);
        const result = method.apply(this, args);
        console.log(`${propertyName} returned:`, result);
        return result;
    };
}

class Calculator {
    @log
    add(a: number, b: number): number {
        return a + b;
    }
    
    @log
    multiply(a: number, b: number): number {
        return a * b;
    }
}

const calc = new Calculator();
calc.add(2, 3); // Logs method call and result
calc.multiply(4, 5); // Logs method call and result

// Performance measurement decorator
function measure(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
        const start = performance.now();
        const result = method.apply(this, args);
        const end = performance.now();
        console.log(`${propertyName} took ${end - start} milliseconds`);
        return result;
    };
}

class DataProcessor {
    @measure
    processLargeDataset(data: number[]): number {
        // Simulate heavy computation
        return data.reduce((sum, num) => sum + num, 0);
    }
}

// Retry decorator
function retry(maxAttempts: number = 3, delay: number = 1000) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function (...args: any[]) {
            let lastError: Error;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await method.apply(this, args);
                } catch (error) {
                    lastError = error as Error;
                    console.log(`Attempt ${attempt} failed:`, error);
                    
                    if (attempt < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            throw lastError!;
        };
    };
}

class ApiClient {
    @retry(3, 2000)
    async fetchData(url: string): Promise<any> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }
}

// Cache decorator
const methodCache = new Map<string, { result: any; timestamp: number; ttl: number }>();

function cache(ttlSeconds: number = 300) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
            const cached = methodCache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
                console.log(`Cache hit for ${propertyName}`);
                return cached.result;
            }
            
            const result = method.apply(this, args);
            methodCache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                ttl: ttlSeconds
            });
            
            console.log(`Cache miss for ${propertyName}, result cached`);
            return result;
        };
    };
}

class ExpensiveOperations {
    @cache(60) // Cache for 60 seconds
    calculatePrimes(max: number): number[] {
        console.log(`Calculating primes up to ${max}`);
        const primes: number[] = [];
        
        for (let i = 2; i <= max; i++) {
            let isPrime = true;
            for (let j = 2; j < i; j++) {
                if (i % j === 0) {
                    isPrime = false;
                    break;
                }
            }
            if (isPrime) primes.push(i);
        }
        
        return primes;
    }
}
```

### Advanced Method Decorators

```typescript
// Authorization decorator
interface AuthContext {
    user: { id: number; role: string; permissions: string[] };
}

const authContexts = new WeakMap<any, AuthContext>();

function authorize(requiredPermission: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            const context = authContexts.get(this);
            
            if (!context) {
                throw new Error('No authentication context found');
            }
            
            if (!context.user.permissions.includes(requiredPermission)) {
                throw new Error(`Access denied. Required permission: ${requiredPermission}`);
            }
            
            return method.apply(this, args);
        };
    };
}

class UserService2 {
    setAuthContext(context: AuthContext) {
        authContexts.set(this, context);
    }
    
    @authorize('user:read')
    getUsers(): string[] {
        return ['user1', 'user2', 'user3'];
    }
    
    @authorize('user:write')
    createUser(name: string): string {
        return `Created user: ${name}`;
    }
    
    @authorize('user:delete')
    deleteUser(id: number): string {
        return `Deleted user: ${id}`;
    }
}

// Usage
const userService = new UserService2();
userService.setAuthContext({
    user: {
        id: 1,
        role: 'admin',
        permissions: ['user:read', 'user:write', 'user:delete']
    }
});

console.log(userService.getUsers()); // OK
console.log(userService.createUser('John')); // OK

// Rate limiting decorator
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            const key = `${target.constructor.name}.${propertyName}`;
            const now = Date.now();
            const limit = rateLimits.get(key);
            
            if (!limit || now > limit.resetTime) {
                rateLimits.set(key, { count: 1, resetTime: now + windowMs });
                return method.apply(this, args);
            }
            
            if (limit.count >= maxRequests) {
                throw new Error(`Rate limit exceeded. Try again in ${limit.resetTime - now}ms`);
            }
            
            limit.count++;
            return method.apply(this, args);
        };
    };
}

class ApiService {
    @rateLimit(5, 60000) // 5 requests per minute
    processRequest(data: any): string {
        return `Processed: ${JSON.stringify(data)}`;
    }
}

// Validation decorator for methods
function validateArgs(...validators: ((arg: any) => boolean)[]) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            for (let i = 0; i < validators.length && i < args.length; i++) {
                if (!validators[i](args[i])) {
                    throw new Error(`Validation failed for argument ${i} in ${propertyName}`);
                }
            }
            
            return method.apply(this, args);
        };
    };
}

// Validator functions
const isString = (value: any): boolean => typeof value === 'string';
const isNumber = (value: any): boolean => typeof value === 'number';
const isPositive = (value: any): boolean => typeof value === 'number' && value > 0;
const isEmail = (value: any): boolean => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

class UserManager {
    @validateArgs(isString, isEmail, isPositive)
    createUser(name: string, email: string, age: number): string {
        return `Created user: ${name} (${email}), age: ${age}`;
    }
    
    @validateArgs(isPositive)
    getUserById(id: number): string {
        return `User with ID: ${id}`;
    }
}

const userManager = new UserManager();
console.log(userManager.createUser("John", "john@example.com", 25)); // OK
// userManager.createUser("", "invalid-email", -5); // Throws validation error
```

## Property Decorators

Property decorators, sınıf özelliklerine uygulanır ve özelliğin davranışını değiştirmek için kullanılır.

### Basic Property Decorators

```typescript
// Simple property decorator
function readonly(target: any, propertyKey: string) {
    let value: any;
    
    Object.defineProperty(target, propertyKey, {
        get: () => value,
        set: (newValue: any) => {
            if (value !== undefined) {
                throw new Error(`Cannot modify readonly property: ${propertyKey}`);
            }
            value = newValue;
        },
        enumerable: true,
        configurable: false
    });
}

class Configuration {
    @readonly
    apiUrl: string = "https://api.example.com";
    
    @readonly
    version: string = "1.0.0";
}

const config = new Configuration();
console.log(config.apiUrl); // OK
// config.apiUrl = "new-url"; // Throws error

// Default value decorator
function defaultValue(value: any) {
    return function (target: any, propertyKey: string) {
        let _value = value;
        
        Object.defineProperty(target, propertyKey, {
            get: () => _value,
            set: (newValue: any) => {
                _value = newValue !== undefined ? newValue : value;
            },
            enumerable: true,
            configurable: true
        });
    };
}

class UserSettings {
    @defaultValue("light")
    theme: string;
    
    @defaultValue(true)
    notifications: boolean;
    
    @defaultValue(10)
    itemsPerPage: number;
    
    constructor() {
        // Properties already have default values
    }
}

const settings = new UserSettings();
console.log(settings.theme); // "light"
console.log(settings.notifications); // true

// Observable property decorator
type PropertyChangeListener<T> = (oldValue: T, newValue: T) => void;

const propertyListeners = new WeakMap<any, Map<string, PropertyChangeListener<any>[]>>();

function observable(target: any, propertyKey: string) {
    let value: any;
    
    Object.defineProperty(target, propertyKey, {
        get: () => value,
        set: (newValue: any) => {
            const oldValue = value;
            value = newValue;
            
            const instanceListeners = propertyListeners.get(target);
            if (instanceListeners) {
                const listeners = instanceListeners.get(propertyKey);
                if (listeners) {
                    listeners.forEach(listener => listener(oldValue, newValue));
                }
            }
        },
        enumerable: true,
        configurable: true
    });
}

function addPropertyListener<T>(
    instance: any, 
    propertyKey: string, 
    listener: PropertyChangeListener<T>
) {
    if (!propertyListeners.has(instance)) {
        propertyListeners.set(instance, new Map());
    }
    
    const instanceListeners = propertyListeners.get(instance)!;
    if (!instanceListeners.has(propertyKey)) {
        instanceListeners.set(propertyKey, []);
    }
    
    instanceListeners.get(propertyKey)!.push(listener);
}

class ObservableModel {
    @observable
    name: string = "";
    
    @observable
    age: number = 0;
    
    @observable
    email: string = "";
}

const model = new ObservableModel();

addPropertyListener(model, 'name', (oldValue, newValue) => {
    console.log(`Name changed from "${oldValue}" to "${newValue}"`);
});

addPropertyListener(model, 'age', (oldValue, newValue) => {
    console.log(`Age changed from ${oldValue} to ${newValue}`);
});

model.name = "John"; // Logs: Name changed from "" to "John"
model.age = 25; // Logs: Age changed from 0 to 25
```

### Advanced Property Decorators

```typescript
// Validation property decorator
interface PropertyValidator {
    validate: (value: any) => boolean;
    message: string;
}

const propertyValidators = new WeakMap<any, Map<string, PropertyValidator[]>>();

function addValidator(target: any, propertyKey: string, validator: PropertyValidator) {
    if (!propertyValidators.has(target)) {
        propertyValidators.set(target, new Map());
    }
    
    const targetValidators = propertyValidators.get(target)!;
    if (!targetValidators.has(propertyKey)) {
        targetValidators.set(propertyKey, []);
    }
    
    targetValidators.get(propertyKey)!.push(validator);
}

function validateProperty(instance: any, propertyKey: string, value: any): void {
    const targetValidators = propertyValidators.get(Object.getPrototypeOf(instance));
    if (targetValidators) {
        const validators = targetValidators.get(propertyKey);
        if (validators) {
            for (const validator of validators) {
                if (!validator.validate(value)) {
                    throw new Error(`Validation failed for ${propertyKey}: ${validator.message}`);
                }
            }
        }
    }
}

function required2(message: string = "Field is required") {
    return function (target: any, propertyKey: string) {
        addValidator(target, propertyKey, {
            validate: (value) => value !== null && value !== undefined && value !== "",
            message
        });
        
        let _value: any;
        
        Object.defineProperty(target, propertyKey, {
            get: () => _value,
            set: (newValue: any) => {
                validateProperty(target, propertyKey, newValue);
                _value = newValue;
            },
            enumerable: true,
            configurable: true
        });
    };
}

function minLength2(min: number, message?: string) {
    return function (target: any, propertyKey: string) {
        addValidator(target, propertyKey, {
            validate: (value) => typeof value === 'string' && value.length >= min,
            message: message || `Minimum length is ${min}`
        });
        
        let _value: any;
        
        Object.defineProperty(target, propertyKey, {
            get: () => _value,
            set: (newValue: any) => {
                validateProperty(target, propertyKey, newValue);
                _value = newValue;
            },
            enumerable: true,
            configurable: true
        });
    };
}

function range(min: number, max: number, message?: string) {
    return function (target: any, propertyKey: string) {
        addValidator(target, propertyKey, {
            validate: (value) => typeof value === 'number' && value >= min && value <= max,
            message: message || `Value must be between ${min} and ${max}`
        });
        
        let _value: any;
        
        Object.defineProperty(target, propertyKey, {
            get: () => _value,
            set: (newValue: any) => {
                validateProperty(target, propertyKey, newValue);
                _value = newValue;
            },
            enumerable: true,
            configurable: true
        });
    };
}

class ValidatedUser {
    @required2("Name is required")
    @minLength2(2, "Name must be at least 2 characters")
    name: string;
    
    @required2("Email is required")
    email: string;
    
    @range(0, 150, "Age must be between 0 and 150")
    age: number;
    
    constructor(name: string, email: string, age: number) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
}

// Usage
try {
    const user = new ValidatedUser("John Doe", "john@example.com", 25); // OK
    user.age = 200; // Throws validation error
} catch (error) {
    console.error(error.message);
}

// Computed property decorator
function computed(dependencies: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const getter = descriptor.get;
        if (!getter) {
            throw new Error('Computed decorator can only be applied to getters');
        }
        
        const cache = new WeakMap();
        const dependencyValues = new WeakMap();
        
        descriptor.get = function () {
            const currentValues = dependencies.map(dep => (this as any)[dep]);
            const cachedValues = dependencyValues.get(this);
            
            if (cachedValues && JSON.stringify(cachedValues) === JSON.stringify(currentValues)) {
                return cache.get(this);
            }
            
            const result = getter.call(this);
            cache.set(this, result);
            dependencyValues.set(this, currentValues);
            
            return result;
        };
    };
}

class Person2 {
    firstName: string = "";
    lastName: string = "";
    age: number = 0;
    
    @computed(['firstName', 'lastName'])
    get fullName(): string {
        console.log('Computing full name...');
        return `${this.firstName} ${this.lastName}`;
    }
    
    @computed(['age'])
    get isAdult(): boolean {
        console.log('Computing adult status...');
        return this.age >= 18;
    }
}

const person = new Person2();
person.firstName = "John";
person.lastName = "Doe";

console.log(person.fullName); // Computes and caches
console.log(person.fullName); // Returns cached value
person.firstName = "Jane";
console.log(person.fullName); // Recomputes because dependency changed
```

## Parameter Decorators

Parameter decorators, method parametrelerine uygulanır ve parametre hakkında metadata saklamak için kullanılır.

### Basic Parameter Decorators

```typescript
// Simple parameter decorator
function logParameter(target: any, propertyKey: string, parameterIndex: number) {
    console.log(`Parameter decorator applied to parameter ${parameterIndex} of method ${propertyKey}`);
}

class ExampleService {
    processData(@logParameter data: string, @logParameter options: any): string {
        return `Processed: ${data}`;
    }
}

// Parameter validation decorator
const parameterValidators = new Map<string, Map<number, (value: any) => boolean>>();

function validateParam(validator: (value: any) => boolean) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const key = `${target.constructor.name}.${propertyKey}`;
        
        if (!parameterValidators.has(key)) {
            parameterValidators.set(key, new Map());
        }
        
        parameterValidators.get(key)!.set(parameterIndex, validator);
        
        // Wrap the original method
        const originalMethod = target[propertyKey];
        target[propertyKey] = function (...args: any[]) {
            const validators = parameterValidators.get(key);
            if (validators) {
                for (const [index, validate] of validators.entries()) {
                    if (!validate(args[index])) {
                        throw new Error(`Parameter validation failed for parameter ${index} of ${propertyKey}`);
                    }
                }
            }
            
            return originalMethod.apply(this, args);
        };
    };
}

// Validator functions
const isStringParam = (value: any): boolean => typeof value === 'string';
const isNumberParam = (value: any): boolean => typeof value === 'number';
const isPositiveParam = (value: any): boolean => typeof value === 'number' && value > 0;

class ValidationService {
    createUser(
        @validateParam(isStringParam) name: string,
        @validateParam(isStringParam) email: string,
        @validateParam(isPositiveParam) age: number
    ): string {
        return `Created user: ${name} (${email}), age: ${age}`;
    }
}

const validationService = new ValidationService();
console.log(validationService.createUser("John", "john@example.com", 25)); // OK
// validationService.createUser("", "john@example.com", -5); // Throws validation error

// Dependency injection parameter decorator
const parameterTypes = new Map<string, Map<number, string>>();

function inject2(token: string) {
    return function (target: any, propertyKey: string, parameterIndex: number) {
        const key = `${target.constructor.name}.${propertyKey}`;
        
        if (!parameterTypes.has(key)) {
            parameterTypes.set(key, new Map());
        }
        
        parameterTypes.get(key)!.set(parameterIndex, token);
    };
}

// Service registry for DI
const serviceRegistry2 = new Map<string, any>();

function registerService(token: string, service: any) {
    serviceRegistry2.set(token, service);
}

function createInstance(constructor: any, methodName: string): any {
    const key = `${constructor.name}.${methodName}`;
    const types = parameterTypes.get(key);
    
    if (!types) {
        return new constructor();
    }
    
    const args: any[] = [];
    for (const [index, token] of types.entries()) {
        const service = serviceRegistry2.get(token);
        if (!service) {
            throw new Error(`Service not found for token: ${token}`);
        }
        args[index] = service;
    }
    
    return new constructor(...args);
}

class DatabaseService {
    query(sql: string): any[] {
        console.log(`Executing query: ${sql}`);
        return [];
    }
}

class LoggerService {
    log(message: string): void {
        console.log(`[LOG] ${message}`);
    }
}

class UserController2 {
    constructor(
        @inject2('DatabaseService') private db: DatabaseService,
        @inject2('LoggerService') private logger: LoggerService
    ) {}
    
    getUsers(): any[] {
        this.logger.log('Getting users');
        return this.db.query('SELECT * FROM users');
    }
}

// Register services
registerService('DatabaseService', new DatabaseService());
registerService('LoggerService', new LoggerService());

// Create instance with injected dependencies
const controller2 = createInstance(UserController2, 'constructor');
controller2.getUsers();
```

## Decorator Factories

Decorator factories, parametreli decorators oluşturmanızı sağlar.

### Basic Decorator Factories

```typescript
// Simple decorator factory
function configurable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = value;
    };
}

function enumerable(value: boolean) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.enumerable = value;
    };
}

class Point {
    private _x: number;
    private _y: number;
    
    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
    
    @configurable(false)
    @enumerable(false)
    get x() { return this._x; }
    
    @configurable(false)
    @enumerable(false)
    get y() { return this._y; }
}

// Advanced decorator factory with options
interface LogOptions {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeArgs: boolean;
    includeResult: boolean;
    includeTimestamp: boolean;
}

function advancedLog(options: Partial<LogOptions> = {}) {
    const defaultOptions: LogOptions = {
        level: 'info',
        includeArgs: true,
        includeResult: true,
        includeTimestamp: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
            const timestamp = config.includeTimestamp ? new Date().toISOString() : '';
            const argsStr = config.includeArgs ? JSON.stringify(args) : '';
            
            console.log(`[${config.level.toUpperCase()}] ${timestamp} Calling ${propertyKey}${argsStr ? ` with args: ${argsStr}` : ''}`);
            
            const result = method.apply(this, args);
            
            if (config.includeResult) {
                console.log(`[${config.level.toUpperCase()}] ${timestamp} ${propertyKey} returned:`, result);
            }
            
            return result;
        };
    };
}

class AdvancedCalculator {
    @advancedLog({ level: 'debug', includeTimestamp: false })
    add(a: number, b: number): number {
        return a + b;
    }
    
    @advancedLog({ level: 'warn', includeArgs: false })
    divide(a: number, b: number): number {
        if (b === 0) {
            throw new Error('Division by zero');
        }
        return a / b;
    }
}

// Conditional decorator factory
function conditionalDecorator(condition: () => boolean, decorator: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (condition()) {
            return decorator(target, propertyKey, descriptor);
        }
    };
}

const isDevelopment = () => process.env.NODE_ENV === 'development';

class ProductionService {
    @conditionalDecorator(isDevelopment, log)
    sensitiveOperation(data: any): any {
        return { processed: data };
    }
}

// Decorator composition factory
function compose(...decorators: any[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        decorators.reverse().forEach(decorator => {
            if (typeof decorator === 'function') {
                const result = decorator(target, propertyKey, descriptor);
                if (result) {
                    descriptor = result;
                }
            }
        });
        return descriptor;
    };
}

class ComposedService {
    @compose(
        measure,
        log,
        cache(30)
    )
    expensiveCalculation(n: number): number {
        // Simulate expensive calculation
        let result = 0;
        for (let i = 0; i < n; i++) {
            result += Math.sqrt(i);
        }
        return result;
    }
}
```

Bu kapsamlı rehber, TypeScript decorators ve metadata sisteminin tüm yönlerini detaylı bir şekilde ele almaktadır. Decorators, modern TypeScript uygulamalarında dependency injection, validation, logging, caching gibi cross-cutting concerns'leri elegant bir şekilde yönetmek için güçlü bir araçtır.