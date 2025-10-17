# NestJS Providers ve Dependency Injection

## İçindekiler
1. [Provider Temelleri](#provider-temelleri)
2. [Dependency Injection Sistemi](#dependency-injection-sistemi)
3. [Service Classes](#service-classes)
4. [Custom Providers](#custom-providers)
5. [Provider Scopes](#provider-scopes)
6. [Circular Dependencies](#circular-dependencies)
7. [Dynamic Modules](#dynamic-modules)
8. [Async Providers](#async-providers)
9. [Optional Dependencies](#optional-dependencies)
10. [Advanced DI Patterns](#advanced-di-patterns)

## Provider Temelleri

Providers, NestJS'in dependency injection sisteminin temel yapı taşlarıdır. Service'ler, repository'ler, factory'ler, helper'lar ve diğer sınıflar provider olarak tanımlanabilir.

### Temel Provider Tanımı

```typescript
import { Injectable } from '@nestjs/common';

// Basic service provider
@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  create(user: Omit<User, 'id'>): User {
    const newUser = {
      id: Date.now(),
      ...user,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, updateData: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = { ...this.users[userIndex], ...updateData };
    return this.users[userIndex];
  }

  remove(id: number): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }
}

// Provider registration in module
@Module({
  providers: [UsersService], // Short syntax
  controllers: [UsersController],
})
export class UsersModule {}
```

### Provider Types

```typescript
// 1. Class providers (most common)
@Injectable()
export class DatabaseService {
  connect(): void {
    console.log('Database connected');
  }
}

// 2. Value providers
const databaseConfig = {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
};

// 3. Factory providers
const databaseFactory = {
  provide: 'DATABASE_CONNECTION',
  useFactory: (config: any) => {
    return new DatabaseConnection(config);
  },
  inject: ['DATABASE_CONFIG'],
};

// 4. Alias providers
const aliasProvider = {
  provide: 'LEGACY_SERVICE',
  useExisting: 'NEW_SERVICE',
};

@Module({
  providers: [
    DatabaseService, // Class provider
    { provide: 'DATABASE_CONFIG', useValue: databaseConfig }, // Value provider
    databaseFactory, // Factory provider
    aliasProvider, // Alias provider
  ],
})
export class DatabaseModule {}
```

## Dependency Injection Sistemi

NestJS'in DI sistemi, constructor-based injection kullanır ve compile-time'da type safety sağlar.

### Constructor Injection

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly logger: Logger,
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    // Validate user data
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create user
    const user = await this.userRepository.create(userData);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    // Log user creation
    this.logger.log(`User created: ${user.id}`);

    return user;
  }
}

// Repository provider
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(userData: CreateUserDto): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }
}

// Email service provider
@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_CONFIG') private readonly config: EmailConfig,
    private readonly logger: Logger,
  ) {}

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      // Email sending logic
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error);
      throw error;
    }
  }
}
```

### Property Injection

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Property injection (less common, use when constructor injection is not possible)
  @Inject(UserRepository)
  private readonly userRepository: UserRepository;

  @Inject('CACHE_SERVICE')
  private readonly cacheService: CacheService;

  async findUser(id: number): Promise<User> {
    // Check cache first
    const cached = await this.cacheService.get(`user:${id}`);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.userRepository.findById(id);
    
    // Cache the result
    await this.cacheService.set(`user:${id}`, user, 300); // 5 minutes TTL
    
    return user;
  }
}
```

### Injection Tokens

```typescript
// String tokens
export const DATABASE_CONFIG = 'DATABASE_CONFIG';
export const CACHE_SERVICE = 'CACHE_SERVICE';
export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

// Symbol tokens (preferred for avoiding collisions)
export const DATABASE_CONFIG_TOKEN = Symbol('DATABASE_CONFIG');
export const CACHE_SERVICE_TOKEN = Symbol('CACHE_SERVICE');

// Class tokens (automatic)
@Injectable()
export class UserService {} // Token is the class itself

// Custom injection tokens
export class InjectionTokens {
  static readonly DATABASE_CONFIG = 'DATABASE_CONFIG';
  static readonly CACHE_SERVICE = 'CACHE_SERVICE';
  static readonly EMAIL_PROVIDER = 'EMAIL_PROVIDER';
}

@Injectable()
export class ConfigurableService {
  constructor(
    @Inject(InjectionTokens.DATABASE_CONFIG) 
    private readonly dbConfig: DatabaseConfig,
    
    @Inject(InjectionTokens.CACHE_SERVICE) 
    private readonly cache: CacheService,
  ) {}
}
```

## Service Classes

Service classes, business logic'i içeren provider'lardır.

### Basic Service Implementation

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private users: User[] = [];
  private nextId = 1;

  async findAll(filters?: { search?: string; limit?: number; offset?: number }): Promise<User[]> {
    let result = [...this.users];

    // Apply search filter
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    if (filters?.offset !== undefined) {
      result = result.slice(filters.offset);
    }
    
    if (filters?.limit !== undefined) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async findById(id: number): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user: User = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async update(id: number, updateData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const user = await this.findById(id);

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    Object.assign(user, updateData, { updatedAt: new Date() });
    return user;
  }

  async remove(id: number): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.users.splice(userIndex, 1);
  }

  async count(): Promise<number> {
    return this.users.length;
  }
}
```

### Service with External Dependencies

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating order for customer: ${orderData.customerId}`);

    try {
      // 1. Validate inventory
      await this.validateInventory(orderData.items);

      // 2. Calculate total amount
      const totalAmount = this.calculateTotal(orderData.items);

      // 3. Process payment
      const paymentResult = await this.paymentService.processPayment({
        amount: totalAmount,
        customerId: orderData.customerId,
        paymentMethod: orderData.paymentMethod,
      });

      // 4. Reserve inventory
      await this.inventoryService.reserveItems(orderData.items);

      // 5. Create order record
      const order = await this.orderRepository.create({
        ...orderData,
        totalAmount,
        paymentId: paymentResult.id,
        status: 'confirmed',
      });

      // 6. Send confirmation email
      await this.emailService.sendOrderConfirmation(order);

      // 7. Emit order created event
      this.eventEmitter.emit('order.created', { order });

      this.logger.log(`Order created successfully: ${order.id}`);
      return order;

    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async validateInventory(items: OrderItem[]): Promise<void> {
    for (const item of items) {
      const available = await this.inventoryService.checkAvailability(
        item.productId, 
        item.quantity
      );
      
      if (!available) {
        throw new BadRequestException(
          `Insufficient inventory for product: ${item.productId}`
        );
      }
    }
  }

  private calculateTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}
```

## Custom Providers

Custom provider'lar, özel injection logic'i için kullanılır.

### Value Providers

```typescript
// Configuration values
const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'myapp',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'password',
};

const apiConfig = {
  baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
  timeout: parseInt(process.env.API_TIMEOUT) || 5000,
  retries: parseInt(process.env.API_RETRIES) || 3,
};

@Module({
  providers: [
    {
      provide: 'DATABASE_CONFIG',
      useValue: databaseConfig,
    },
    {
      provide: 'API_CONFIG',
      useValue: apiConfig,
    },
  ],
})
export class ConfigModule {}

// Usage in service
@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DATABASE_CONFIG') private readonly config: typeof databaseConfig,
  ) {}

  connect(): void {
    console.log(`Connecting to ${this.config.host}:${this.config.port}`);
  }
}
```

### Factory Providers

```typescript
// Database connection factory
const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (config: DatabaseConfig): Promise<Connection> => {
      const connection = new Connection(config);
      await connection.connect();
      return connection;
    },
    inject: ['DATABASE_CONFIG'],
  },
];

// HTTP client factory
const httpClientProvider = {
  provide: 'HTTP_CLIENT',
  useFactory: (config: ApiConfig): AxiosInstance => {
    return axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
  inject: ['API_CONFIG'],
};

// Logger factory with custom configuration
const loggerProvider = {
  provide: Logger,
  useFactory: (config: LoggerConfig): Logger => {
    const logger = new Logger();
    logger.setLevel(config.level);
    logger.setFormat(config.format);
    return logger;
  },
  inject: ['LOGGER_CONFIG'],
};

@Module({
  providers: [
    ...databaseProviders,
    httpClientProvider,
    loggerProvider,
  ],
})
export class CoreModule {}
```

### Class Providers

```typescript
// Interface for abstraction
interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

// Different implementations
@Injectable()
export class SMTPEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SMTP implementation
    console.log(`Sending email via SMTP to ${to}`);
  }
}

@Injectable()
export class SendGridEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // SendGrid implementation
    console.log(`Sending email via SendGrid to ${to}`);
  }
}

@Injectable()
export class MockEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Mock implementation for testing
    console.log(`Mock email sent to ${to}: ${subject}`);
  }
}

// Provider configuration based on environment
const emailServiceProvider = {
  provide: 'EMAIL_SERVICE',
  useClass: process.env.NODE_ENV === 'test' 
    ? MockEmailService 
    : process.env.EMAIL_PROVIDER === 'sendgrid'
    ? SendGridEmailService
    : SMTPEmailService,
};

@Module({
  providers: [
    SMTPEmailService,
    SendGridEmailService,
    MockEmailService,
    emailServiceProvider,
  ],
})
export class EmailModule {}

// Usage
@Injectable()
export class NotificationService {
  constructor(
    @Inject('EMAIL_SERVICE') private readonly emailService: IEmailService,
  ) {}

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    await this.emailService.sendEmail(
      userEmail,
      'Welcome!',
      `Hello ${userName}, welcome to our platform!`
    );
  }
}
```

### Existing Providers (Aliases)

```typescript
// Legacy service that needs to be replaced
@Injectable()
export class LegacyUserService {
  getUsers(): User[] {
    return [];
  }
}

// New service implementation
@Injectable()
export class UserService {
  getUsers(): User[] {
    return [];
  }
}

@Module({
  providers: [
    UserService,
    LegacyUserService,
    // Alias provider for backward compatibility
    {
      provide: 'LEGACY_USER_SERVICE',
      useExisting: UserService, // Points to UserService
    },
  ],
})
export class UsersModule {}

// Usage - both will use the same UserService instance
@Injectable()
export class SomeService {
  constructor(
    private readonly userService: UserService,
    @Inject('LEGACY_USER_SERVICE') private readonly legacyService: UserService,
  ) {
    console.log(userService === legacyService); // true
  }
}
```

## Provider Scopes

Provider scope'ları, instance'ların yaşam döngüsünü belirler.

### Singleton Scope (Default)

```typescript
import { Injectable, Scope } from '@nestjs/common';

// Default scope - singleton
@Injectable()
export class SingletonService {
  private counter = 0;

  increment(): number {
    return ++this.counter;
  }

  getCount(): number {
    return this.counter;
  }
}

// Explicit singleton scope
@Injectable({ scope: Scope.DEFAULT })
export class ExplicitSingletonService {
  private data: any[] = [];

  addData(item: any): void {
    this.data.push(item);
  }

  getData(): any[] {
    return this.data;
  }
}
```

### Request Scope

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

// New instance for each request
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  private requestId: string;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    this.requestId = Math.random().toString(36).substr(2, 9);
    console.log(`RequestScopedService created for request: ${this.requestId}`);
  }

  getRequestId(): string {
    return this.requestId;
  }

  getUserFromRequest(): any {
    return this.request.user;
  }

  getRequestHeaders(): any {
    return this.request.headers;
  }
}

// Request-scoped logger
@Injectable({ scope: Scope.REQUEST })
export class RequestLogger {
  private logs: string[] = [];

  constructor(@Inject(REQUEST) private readonly request: Request) {}

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const method = this.request.method;
    const url = this.request.url;
    
    this.logs.push(`[${timestamp}] ${method} ${url} - ${message}`);
  }

  getLogs(): string[] {
    return this.logs;
  }
}
```

### Transient Scope

```typescript
import { Injectable, Scope } from '@nestjs/common';

// New instance every time it's injected
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  private instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    console.log(`TransientService instance created: ${this.instanceId}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}

// Usage example
@Injectable()
export class ConsumerService {
  constructor(
    private readonly transient1: TransientService,
    private readonly transient2: TransientService,
  ) {
    // transient1 and transient2 are different instances
    console.log('Instance 1:', transient1.getInstanceId());
    console.log('Instance 2:', transient2.getInstanceId());
  }
}
```

### Scope Inheritance

```typescript
// When a provider depends on a request-scoped provider,
// it automatically becomes request-scoped too

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedRepository {
  constructor(@Inject(REQUEST) private readonly request: Request) {}
}

@Injectable() // This becomes request-scoped due to dependency
export class UserService {
  constructor(
    private readonly requestScopedRepo: RequestScopedRepository, // Request-scoped
    private readonly singletonRepo: SingletonRepository, // Singleton
  ) {}
}
```

## Circular Dependencies

Circular dependency'leri çözmek için forward reference kullanılır.

### Forward Reference

```typescript
import { Injectable, Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
  ) {}

  async getUserWithPosts(userId: number): Promise<any> {
    const user = await this.findById(userId);
    const posts = await this.postService.findByUserId(userId);
    return { ...user, posts };
  }

  async findById(id: number): Promise<any> {
    // Implementation
    return { id, name: 'John Doe' };
  }
}

@Injectable()
export class PostService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async findByUserId(userId: number): Promise<any[]> {
    // Implementation
    return [{ id: 1, title: 'Post 1', userId }];
  }

  async getPostWithAuthor(postId: number): Promise<any> {
    const post = await this.findById(postId);
    const author = await this.userService.findById(post.userId);
    return { ...post, author };
  }

  async findById(id: number): Promise<any> {
    // Implementation
    return { id, title: 'Sample Post', userId: 1 };
  }
}

// Module with forward reference
@Module({
  providers: [UserService, PostService],
  exports: [UserService, PostService],
})
export class UsersModule {}
```

### Alternative Solutions

```typescript
// 1. Event-driven approach to avoid circular dependencies
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async createUser(userData: any): Promise<any> {
    const user = await this.saveUser(userData);
    
    // Emit event instead of direct dependency
    this.eventEmitter.emit('user.created', { user });
    
    return user;
  }

  private async saveUser(userData: any): Promise<any> {
    // Save user logic
    return { id: 1, ...userData };
  }
}

@Injectable()
export class PostService {
  @OnEvent('user.created')
  async handleUserCreated(payload: { user: any }): Promise<void> {
    // Create welcome post for new user
    await this.createWelcomePost(payload.user.id);
  }

  private async createWelcomePost(userId: number): Promise<void> {
    // Create welcome post logic
    console.log(`Creating welcome post for user ${userId}`);
  }
}

// 2. Mediator pattern
@Injectable()
export class UserPostMediator {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  async getUserWithPosts(userId: number): Promise<any> {
    const user = await this.userService.findById(userId);
    const posts = await this.postService.findByUserId(userId);
    return { ...user, posts };
  }
}
```

Bu kapsamlı rehber, NestJS'te providers ve dependency injection sisteminin tüm yönlerini detaylı bir şekilde ele almaktadır. Sonraki derslerde modules, middleware ve diğer ileri seviye konuları inceleyeceğiz.