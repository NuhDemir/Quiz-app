# Modular Monolith Design'a Giriş

## İçindekiler
1. [Modular Monolith Nedir?](#modular-monolith-nedir)
2. [Geleneksel Monolith vs Modular Monolith](#geleneksel-monolith-vs-modular-monolith)
3. [Microservices vs Modular Monolith](#microservices-vs-modular-monolith)
4. [Modular Monolith'in Avantajları](#modular-monolithin-avantajları)
5. [Modular Monolith'in Dezavantajları](#modular-monolithin-dezavantajları)
6. [Ne Zaman Kullanmalı?](#ne-zaman-kullanmalı)
7. [Temel Prensipler](#temel-prensipler)
8. [Modül Tasarım Stratejileri](#modül-tasarım-stratejileri)
9. [Implementation Patterns](#implementation-patterns)
10. [Best Practices](#best-practices)

## Modular Monolith Nedir?

Modular Monolith, tek bir deployable unit olarak çalışan ancak içerisinde iyi tanımlanmış, gevşek bağlı modüllerden oluşan bir mimari yaklaşımdır. Bu yaklaşım, monolith'in basitliği ile microservices'in modülerliğini birleştirmeyi hedefler.

### Temel Karakteristikler

```typescript
// Modular Monolith yapısı örneği
src/
├── modules/
│   ├── user-management/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── order-management/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── inventory/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   └── payment/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
├── shared/
│   ├── domain/
│   ├── infrastructure/
│   └── utils/
└── main.ts
```

### Modül Boundaries

```typescript
// User Management Module
export interface UserManagementModule {
  // Public API - diğer modüller bu interface'i kullanır
  getUserById(id: string): Promise<User>;
  createUser(userData: CreateUserRequest): Promise<User>;
  updateUser(id: string, userData: UpdateUserRequest): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Events - diğer modüllere bildirim
  onUserCreated: EventEmitter<UserCreatedEvent>;
  onUserUpdated: EventEmitter<UserUpdatedEvent>;
  onUserDeleted: EventEmitter<UserDeletedEvent>;
}

// Order Management Module
export interface OrderManagementModule {
  createOrder(orderData: CreateOrderRequest): Promise<Order>;
  getOrderById(id: string): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  cancelOrder(id: string): Promise<void>;
  
  // Events
  onOrderCreated: EventEmitter<OrderCreatedEvent>;
  onOrderStatusChanged: EventEmitter<OrderStatusChangedEvent>;
}

// Module Registry - Dependency Injection Container
class ModuleRegistry {
  private modules = new Map<string, any>();
  
  register<T>(name: string, module: T): void {
    this.modules.set(name, module);
  }
  
  get<T>(name: string): T {
    return this.modules.get(name);
  }
}

// Application composition
class Application {
  private moduleRegistry = new ModuleRegistry();
  
  async bootstrap() {
    // Initialize modules
    const userModule = new UserManagementModuleImpl();
    const orderModule = new OrderManagementModuleImpl();
    const inventoryModule = new InventoryModuleImpl();
    const paymentModule = new PaymentModuleImpl();
    
    // Register modules
    this.moduleRegistry.register('user', userModule);
    this.moduleRegistry.register('order', orderModule);
    this.moduleRegistry.register('inventory', inventoryModule);
    this.moduleRegistry.register('payment', paymentModule);
    
    // Setup inter-module communication
    this.setupEventHandlers();
    
    // Start application
    await this.startServer();
  }
  
  private setupEventHandlers() {
    const userModule = this.moduleRegistry.get<UserManagementModule>('user');
    const orderModule = this.moduleRegistry.get<OrderManagementModule>('order');
    
    // User events
    userModule.onUserCreated.subscribe(async (event) => {
      // Initialize user preferences, send welcome email, etc.
    });
    
    // Order events
    orderModule.onOrderCreated.subscribe(async (event) => {
      // Update inventory, process payment, send notifications
    });
  }
}
```

## Geleneksel Monolith vs Modular Monolith

### Geleneksel Monolith Problemi

```typescript
// Geleneksel Monolith - Tightly Coupled
class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private orderService: OrderService, // Direct dependency
    private inventoryService: InventoryService, // Direct dependency
    private paymentService: PaymentService // Direct dependency
  ) {}
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    // User creation logic
    const user = await this.userRepository.save(userData);
    
    // Tightly coupled operations
    await this.emailService.sendWelcomeEmail(user.email);
    await this.orderService.initializeUserCart(user.id);
    await this.inventoryService.reserveWelcomeGift(user.id);
    await this.paymentService.setupUserWallet(user.id);
    
    return user;
  }
}

// Problems:
// 1. High coupling between services
// 2. Difficult to test in isolation
// 3. Changes in one service affect others
// 4. Hard to understand and maintain
// 5. Deployment risks - one bug affects everything
```

### Modular Monolith Çözümü

```typescript
// Modular Monolith - Loosely Coupled
class UserService {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus // Only dependency on event system
  ) {}
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Core user creation logic
    const user = await this.userRepository.save(userData);
    
    // Publish event instead of direct calls
    await this.eventBus.publish(new UserCreatedEvent({
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt
    }));
    
    return user;
  }
}

// Other modules listen to events
class EmailModule {
  @EventHandler(UserCreatedEvent)
  async handleUserCreated(event: UserCreatedEvent) {
    await this.emailService.sendWelcomeEmail(event.email);
  }
}

class OrderModule {
  @EventHandler(UserCreatedEvent)
  async handleUserCreated(event: UserCreatedEvent) {
    await this.orderService.initializeUserCart(event.userId);
  }
}

// Benefits:
// 1. Low coupling between modules
// 2. Easy to test each module independently
// 3. Changes in one module don't affect others
// 4. Clear separation of concerns
// 5. Easier to understand and maintain
```

## Microservices vs Modular Monolith

### Microservices Challenges

```typescript
// Microservices - Distributed Complexity
class OrderService {
  constructor(
    private userServiceClient: UserServiceClient,
    private inventoryServiceClient: InventoryServiceClient,
    private paymentServiceClient: PaymentServiceClient
  ) {}
  
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      // Network call to User Service
      const user = await this.userServiceClient.getUser(orderData.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Network call to Inventory Service
      const availability = await this.inventoryServiceClient.checkAvailability(
        orderData.items
      );
      if (!availability.available) {
        throw new Error('Items not available');
      }
      
      // Network call to Payment Service
      const paymentResult = await this.paymentServiceClient.processPayment({
        userId: orderData.userId,
        amount: orderData.totalAmount
      });
      
      // Create order
      const order = await this.orderRepository.save({
        ...orderData,
        paymentId: paymentResult.id,
        status: 'confirmed'
      });
      
      return order;
      
    } catch (error) {
      // Complex error handling for distributed failures
      // Compensation logic, circuit breakers, retries, etc.
      throw error;
    }
  }
}

// Challenges:
// 1. Network latency and failures
// 2. Distributed transactions complexity
// 3. Service discovery and load balancing
// 4. Data consistency challenges
// 5. Monitoring and debugging complexity
// 6. Deployment and orchestration overhead
```

### Modular Monolith Simplicity

```typescript
// Modular Monolith - In-Process Communication
class OrderService {
  constructor(
    private userModule: UserManagementModule,
    private inventoryModule: InventoryModule,
    private paymentModule: PaymentModule,
    private eventBus: EventBus
  ) {}
  
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // In-process calls - no network overhead
    const user = await this.userModule.getUserById(orderData.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const availability = await this.inventoryModule.checkAvailability(
      orderData.items
    );
    if (!availability.available) {
      throw new Error('Items not available');
    }
    
    const paymentResult = await this.paymentModule.processPayment({
      userId: orderData.userId,
      amount: orderData.totalAmount
    });
    
    // Database transaction ensures consistency
    const order = await this.orderRepository.transaction(async (manager) => {
      const order = await manager.save(Order, {
        ...orderData,
        paymentId: paymentResult.id,
        status: 'confirmed'
      });
      
      await this.inventoryModule.reserveItems(orderData.items);
      
      return order;
    });
    
    // Publish event for other modules
    await this.eventBus.publish(new OrderCreatedEvent(order));
    
    return order;
  }
}

// Benefits:
// 1. No network latency
// 2. ACID transactions
// 3. Simple debugging and monitoring
// 4. Single deployment unit
// 5. Easier testing and development
```

## Modular Monolith'in Avantajları

### 1. Development Velocity

```typescript
// Fast development cycle
class DevelopmentWorkflow {
  async developFeature() {
    // 1. Single codebase - easy to navigate
    // 2. Shared types and interfaces
    // 3. Refactoring across modules is safe
    // 4. Single build and test process
    // 5. No service versioning complexity
  }
  
  async testing() {
    // 1. Integration tests are straightforward
    // 2. No need for service mocking
    // 3. End-to-end testing in single process
    // 4. Debugging is simple
  }
  
  async deployment() {
    // 1. Single deployment artifact
    // 2. No orchestration complexity
    // 3. Rollback is simple
    // 4. No distributed deployment issues
  }
}
```

### 2. Data Consistency

```typescript
// ACID transactions across modules
class OrderProcessingService {
  async processOrder(orderData: CreateOrderRequest): Promise<Order> {
    return await this.database.transaction(async (manager) => {
      // All operations in single transaction
      const order = await this.orderModule.createOrder(orderData, manager);
      await this.inventoryModule.updateStock(orderData.items, manager);
      await this.paymentModule.chargeCustomer(orderData.payment, manager);
      await this.notificationModule.scheduleNotifications(order, manager);
      
      // Either all succeed or all rollback
      return order;
    });
  }
}
```

### 3. Performance

```typescript
// No network overhead
class PerformanceComparison {
  // Microservices - Network calls
  async microservicesApproach() {
    const user = await this.httpClient.get('/users/123'); // 50ms
    const orders = await this.httpClient.get('/orders?userId=123'); // 50ms
    const preferences = await this.httpClient.get('/preferences/123'); // 50ms
    // Total: ~150ms + serialization overhead
  }
  
  // Modular Monolith - In-process calls
  async modularMonolithApproach() {
    const user = await this.userModule.getUserById('123'); // 1ms
    const orders = await this.orderModule.getOrdersByUserId('123'); // 1ms
    const preferences = await this.preferencesModule.getPreferences('123'); // 1ms
    // Total: ~3ms
  }
}
```

## Modular Monolith'in Dezavantajları

### 1. Scaling Limitations

```typescript
// Cannot scale modules independently
class ScalingChallenges {
  // Problem: CPU-intensive module affects entire application
  async heavyComputationModule() {
    // This blocks the entire application
    const result = await this.performHeavyCalculation();
    return result;
  }
  
  // Solution: Extract to separate service when needed
  async extractToMicroservice() {
    // Move heavy computation to dedicated service
    const result = await this.computationServiceClient.calculate();
    return result;
  }
}
```

### 2. Technology Diversity

```typescript
// Single technology stack
class TechnologyConstraints {
  // All modules must use same:
  // - Programming language
  // - Framework version
  // - Database technology
  // - Runtime environment
  
  // Cannot optimize per module needs
  async moduleSpecificNeeds() {
    // Analytics module might benefit from different database
    // Real-time module might need different runtime
    // But all must use same stack
  }
}
```

### 3. Team Boundaries

```typescript
// Shared codebase coordination
class TeamCoordination {
  async developmentChallenges() {
    // 1. Merge conflicts in shared code
    // 2. Coordination needed for breaking changes
    // 3. Shared CI/CD pipeline
    // 4. Code review across teams
    // 5. Release coordination
  }
}
```

## Ne Zaman Kullanmalı?

### Modular Monolith İçin İdeal Durumlar

```typescript
class WhenToUseModularMonolith {
  // 1. Startup or early-stage projects
  earlyStage() {
    return {
      teamSize: 'small (< 20 developers)',
      requirements: 'evolving rapidly',
      complexity: 'moderate',
      scalingNeeds: 'predictable',
      recommendation: 'Start with modular monolith'
    };
  }
  
  // 2. Well-defined domain boundaries
  clearDomains() {
    return {
      domains: ['user-management', 'order-processing', 'inventory'],
      coupling: 'low between domains',
      dataSharing: 'minimal cross-domain',
      recommendation: 'Good fit for modular monolith'
    };
  }
  
  // 3. ACID transaction requirements
  consistencyNeeds() {
    return {
      transactions: 'cross-domain transactions needed',
      consistency: 'strong consistency required',
      complexity: 'distributed transactions too complex',
      recommendation: 'Modular monolith preferred'
    };
  }
  
  // 4. Limited operational expertise
  operationalCapacity() {
    return {
      devOpsTeam: 'small or inexperienced',
      infrastructure: 'simple deployment preferred',
      monitoring: 'basic monitoring capabilities',
      recommendation: 'Start with modular monolith'
    };
  }
}
```

### Microservices'e Geçiş Zamanı

```typescript
class WhenToSplitToMicroservices {
  // 1. Scaling bottlenecks
  scalingIssues() {
    return {
      problem: 'Different modules have different scaling needs',
      solution: 'Extract high-load modules to separate services',
      example: 'Analytics module needs different resources'
    };
  }
  
  // 2. Team growth
  teamGrowth() {
    return {
      problem: 'Large teams causing coordination overhead',
      solution: 'Split along team boundaries',
      threshold: '> 50 developers'
    };
  }
  
  // 3. Technology diversity needs
  technologyNeeds() {
    return {
      problem: 'Modules need different technologies',
      solution: 'Extract modules with specific tech needs',
      example: 'ML module needs Python, main app is Node.js'
    };
  }
  
  // 4. Independent deployment needs
  deploymentNeeds() {
    return {
      problem: 'Modules have different release cycles',
      solution: 'Extract modules that need frequent deployment',
      example: 'Pricing module changes daily'
    };
  }
}
```

## Temel Prensipler

### 1. Module Boundaries

```typescript
// Clear module boundaries
interface ModuleBoundary {
  // Public API - what module exposes
  publicApi: {
    services: Service[];
    events: Event[];
    types: Type[];
  };
  
  // Private implementation - hidden from other modules
  privateImplementation: {
    repositories: Repository[];
    domainServices: DomainService[];
    valueObjects: ValueObject[];
  };
}

// Example: User Management Module
export class UserManagementModule implements ModuleBoundary {
  // Public API
  public readonly userService: UserService;
  public readonly events: UserEvents;
  
  // Private - not exported
  private readonly userRepository: UserRepository;
  private readonly passwordService: PasswordService;
  private readonly userValidator: UserValidator;
  
  constructor() {
    // Initialize private components
    this.userRepository = new UserRepository();
    this.passwordService = new PasswordService();
    this.userValidator = new UserValidator();
    
    // Initialize public API
    this.userService = new UserService(
      this.userRepository,
      this.passwordService,
      this.userValidator
    );
    this.events = new UserEvents();
  }
}
```

### 2. Dependency Direction

```typescript
// Dependencies should flow inward
class DependencyDirection {
  // ❌ Wrong - Core depends on infrastructure
  class UserService {
    constructor(private emailClient: SMTPEmailClient) {} // Infrastructure dependency
  }
  
  // ✅ Correct - Infrastructure depends on core
  interface EmailService {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
  }
  
  class UserService {
    constructor(private emailService: EmailService) {} // Abstraction dependency
  }
  
  class SMTPEmailService implements EmailService {
    async sendEmail(to: string, subject: string, body: string): Promise<void> {
      // SMTP implementation
    }
  }
}
```

### 3. Event-Driven Communication

```typescript
// Modules communicate through events
class EventDrivenCommunication {
  // Publisher
  class OrderService {
    async createOrder(orderData: CreateOrderRequest): Promise<Order> {
      const order = await this.orderRepository.save(orderData);
      
      // Publish event instead of direct calls
      await this.eventBus.publish(new OrderCreatedEvent({
        orderId: order.id,
        userId: order.userId,
        items: order.items,
        totalAmount: order.totalAmount
      }));
      
      return order;
    }
  }
  
  // Subscribers
  class InventoryService {
    @EventHandler(OrderCreatedEvent)
    async handleOrderCreated(event: OrderCreatedEvent) {
      await this.reserveItems(event.items);
    }
  }
  
  class NotificationService {
    @EventHandler(OrderCreatedEvent)
    async handleOrderCreated(event: OrderCreatedEvent) {
      await this.sendOrderConfirmation(event.userId, event.orderId);
    }
  }
}
```

Bu kapsamlı giriş, Modular Monolith Design'ın temellerini, avantajlarını, dezavantajlarını ve ne zaman kullanılması gerektiğini detaylı bir şekilde ele almaktadır. Sonraki derslerde implementation detayları, patterns ve best practices konularını inceleyeceğiz.