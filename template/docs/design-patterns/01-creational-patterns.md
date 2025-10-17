# Creational Design Patterns

## İçindekiler
1. [Creational Patterns Nedir?](#creational-patterns-nedir)
2. [Singleton Pattern](#singleton-pattern)
3. [Factory Method Pattern](#factory-method-pattern)
4. [Abstract Factory Pattern](#abstract-factory-pattern)
5. [Builder Pattern](#builder-pattern)
6. [Prototype Pattern](#prototype-pattern)
7. [Dependency Injection Pattern](#dependency-injection-pattern)
8. [Object Pool Pattern](#object-pool-pattern)
9. [Registry Pattern](#registry-pattern)
10. [Best Practices](#best-practices)

## Creational Patterns Nedir?

Creational Design Patterns, object creation sürecini organize eden ve kontrol eden pattern'lerdir. Bu pattern'ler, object'lerin nasıl oluşturulacağını, ne zaman oluşturulacağını ve hangi class'ın instance'ının oluşturulacağını belirler.

### Temel Amaçlar

```typescript
// Problem: Direct object creation
class EmailService {
  private smtpClient: SMTPClient;
  
  constructor() {
    // Tightly coupled to specific implementation
    this.smtpClient = new SMTPClient({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@gmail.com',
        pass: 'password'
      }
    });
  }
}

// Solution: Using creational patterns
interface EmailClient {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

class EmailService {
  constructor(private emailClient: EmailClient) {}
  
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.emailClient.sendEmail(to, subject, body);
  }
}

// Factory creates appropriate implementation
class EmailClientFactory {
  static create(provider: 'smtp' | 'sendgrid' | 'ses'): EmailClient {
    switch (provider) {
      case 'smtp':
        return new SMTPEmailClient();
      case 'sendgrid':
        return new SendGridEmailClient();
      case 'ses':
        return new SESEmailClient();
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }
}
```

## Singleton Pattern

Singleton pattern, bir class'ın sadece bir instance'ının oluşturulmasını garanti eder ve bu instance'a global erişim sağlar.

### Basic Singleton Implementation

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: any;
  private isConnected: boolean = false;

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      this.connection = await this.createConnection();
      this.isConnected = true;
      console.log('Database connected');
    }
  }

  public async query(sql: string): Promise<any[]> {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.connection.query(sql);
  }

  private async createConnection(): Promise<any> {
    // Database connection logic
    return {
      query: (sql: string) => Promise.resolve([])
    };
  }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true - same instance
```

### Thread-Safe Singleton

```typescript
class ThreadSafeSingleton {
  private static instance: ThreadSafeSingleton;
  private static isCreating: boolean = false;

  private constructor() {}

  public static async getInstance(): Promise<ThreadSafeSingleton> {
    if (!ThreadSafeSingleton.instance) {
      if (ThreadSafeSingleton.isCreating) {
        // Wait for creation to complete
        while (ThreadSafeSingleton.isCreating) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        return ThreadSafeSingleton.instance;
      }

      ThreadSafeSingleton.isCreating = true;
      
      try {
        if (!ThreadSafeSingleton.instance) {
          ThreadSafeSingleton.instance = new ThreadSafeSingleton();
        }
      } finally {
        ThreadSafeSingleton.isCreating = false;
      }
    }
    
    return ThreadSafeSingleton.instance;
  }
}
```

### Singleton with Lazy Initialization

```typescript
class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Map<string, any>;
  private initialized: boolean = false;

  private constructor() {
    this.config = new Map();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async initialize(): Promise<void> {
    if (!this.initialized) {
      // Load configuration from file, environment, etc.
      await this.loadConfiguration();
      this.initialized = true;
    }
  }

  public get<T>(key: string, defaultValue?: T): T {
    if (!this.initialized) {
      throw new Error('Configuration not initialized');
    }
    return this.config.get(key) ?? defaultValue;
  }

  public set(key: string, value: any): void {
    this.config.set(key, value);
  }

  private async loadConfiguration(): Promise<void> {
    // Simulate loading configuration
    this.config.set('database.host', 'localhost');
    this.config.set('database.port', 5432);
    this.config.set('api.timeout', 5000);
  }
}

// Usage
const config = ConfigurationManager.getInstance();
await config.initialize();
const dbHost = config.get<string>('database.host');
```

## Factory Method Pattern

Factory Method pattern, object creation logic'ini subclass'lara delegate eder ve hangi class'ın instance'ının oluşturulacağını runtime'da belirler.

### Basic Factory Method

```typescript
// Product interface
interface Logger {
  log(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}

// Concrete products
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }
}

class FileLogger implements Logger {
  constructor(private filePath: string) {}

  log(message: string): void {
    this.writeToFile(`[LOG] ${new Date().toISOString()}: ${message}`);
  }

  error(message: string): void {
    this.writeToFile(`[ERROR] ${new Date().toISOString()}: ${message}`);
  }

  warn(message: string): void {
    this.writeToFile(`[WARN] ${new Date().toISOString()}: ${message}`);
  }

  private writeToFile(message: string): void {
    // File writing logic
    console.log(`Writing to ${this.filePath}: ${message}`);
  }
}

class DatabaseLogger implements Logger {
  constructor(private connectionString: string) {}

  log(message: string): void {
    this.writeToDatabase('LOG', message);
  }

  error(message: string): void {
    this.writeToDatabase('ERROR', message);
  }

  warn(message: string): void {
    this.writeToDatabase('WARN', message);
  }

  private writeToDatabase(level: string, message: string): void {
    // Database writing logic
    console.log(`Writing to DB: ${level} - ${message}`);
  }
}

// Creator abstract class
abstract class LoggerFactory {
  abstract createLogger(): Logger;

  // Template method using factory method
  public logMessage(message: string): void {
    const logger = this.createLogger();
    logger.log(message);
  }
}

// Concrete creators
class ConsoleLoggerFactory extends LoggerFactory {
  createLogger(): Logger {
    return new ConsoleLogger();
  }
}

class FileLoggerFactory extends LoggerFactory {
  constructor(private filePath: string) {
    super();
  }

  createLogger(): Logger {
    return new FileLogger(this.filePath);
  }
}

class DatabaseLoggerFactory extends LoggerFactory {
  constructor(private connectionString: string) {
    super();
  }

  createLogger(): Logger {
    return new DatabaseLogger(this.connectionString);
  }
}

// Usage
const consoleFactory = new ConsoleLoggerFactory();
const fileFactory = new FileLoggerFactory('/var/log/app.log');
const dbFactory = new DatabaseLoggerFactory('mongodb://localhost:27017/logs');

consoleFactory.logMessage('Console log message');
fileFactory.logMessage('File log message');
dbFactory.logMessage('Database log message');
```

### Parameterized Factory Method

```typescript
type LoggerType = 'console' | 'file' | 'database';

interface LoggerConfig {
  type: LoggerType;
  filePath?: string;
  connectionString?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

class LoggerFactory {
  static createLogger(config: LoggerConfig): Logger {
    switch (config.type) {
      case 'console':
        return new ConsoleLogger();
      case 'file':
        if (!config.filePath) {
          throw new Error('File path is required for file logger');
        }
        return new FileLogger(config.filePath);
      case 'database':
        if (!config.connectionString) {
          throw new Error('Connection string is required for database logger');
        }
        return new DatabaseLogger(config.connectionString);
      default:
        throw new Error(`Unknown logger type: ${config.type}`);
    }
  }

  static createMultiLogger(configs: LoggerConfig[]): Logger {
    const loggers = configs.map(config => this.createLogger(config));
    return new MultiLogger(loggers);
  }
}

class MultiLogger implements Logger {
  constructor(private loggers: Logger[]) {}

  log(message: string): void {
    this.loggers.forEach(logger => logger.log(message));
  }

  error(message: string): void {
    this.loggers.forEach(logger => logger.error(message));
  }

  warn(message: string): void {
    this.loggers.forEach(logger => logger.warn(message));
  }
}

// Usage
const logger = LoggerFactory.createLogger({
  type: 'file',
  filePath: '/var/log/app.log'
});

const multiLogger = LoggerFactory.createMultiLogger([
  { type: 'console' },
  { type: 'file', filePath: '/var/log/app.log' },
  { type: 'database', connectionString: 'mongodb://localhost:27017/logs' }
]);
```

## Abstract Factory Pattern

Abstract Factory pattern, related object'lerin family'lerini oluşturmak için interface sağlar.

### UI Component Factory Example

```typescript
// Abstract products
interface Button {
  render(): string;
  onClick(handler: () => void): void;
}

interface Input {
  render(): string;
  setValue(value: string): void;
  getValue(): string;
}

interface Modal {
  render(): string;
  show(): void;
  hide(): void;
}

// Windows implementations
class WindowsButton implements Button {
  render(): string {
    return '<button class="windows-button">Windows Button</button>';
  }

  onClick(handler: () => void): void {
    console.log('Windows button clicked');
    handler();
  }
}

class WindowsInput implements Input {
  private value: string = '';

  render(): string {
    return '<input class="windows-input" />';
  }

  setValue(value: string): void {
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}

class WindowsModal implements Modal {
  render(): string {
    return '<div class="windows-modal">Windows Modal</div>';
  }

  show(): void {
    console.log('Showing Windows modal');
  }

  hide(): void {
    console.log('Hiding Windows modal');
  }
}

// Mac implementations
class MacButton implements Button {
  render(): string {
    return '<button class="mac-button">Mac Button</button>';
  }

  onClick(handler: () => void): void {
    console.log('Mac button clicked');
    handler();
  }
}

class MacInput implements Input {
  private value: string = '';

  render(): string {
    return '<input class="mac-input" />';
  }

  setValue(value: string): void {
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }
}

class MacModal implements Modal {
  render(): string {
    return '<div class="mac-modal">Mac Modal</div>';
  }

  show(): void {
    console.log('Showing Mac modal');
  }

  hide(): void {
    console.log('Hiding Mac modal');
  }
}

// Abstract factory
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
  createModal(): Modal;
}

// Concrete factories
class WindowsUIFactory implements UIFactory {
  createButton(): Button {
    return new WindowsButton();
  }

  createInput(): Input {
    return new WindowsInput();
  }

  createModal(): Modal {
    return new WindowsModal();
  }
}

class MacUIFactory implements UIFactory {
  createButton(): Button {
    return new MacButton();
  }

  createInput(): Input {
    return new MacInput();
  }

  createModal(): Modal {
    return new MacModal();
  }
}

// Client code
class Application {
  private button: Button;
  private input: Input;
  private modal: Modal;

  constructor(factory: UIFactory) {
    this.button = factory.createButton();
    this.input = factory.createInput();
    this.modal = factory.createModal();
  }

  render(): string {
    return `
      ${this.button.render()}
      ${this.input.render()}
      ${this.modal.render()}
    `;
  }
}

// Usage
const os = process.platform === 'darwin' ? 'mac' : 'windows';
const factory = os === 'mac' ? new MacUIFactory() : new WindowsUIFactory();
const app = new Application(factory);
console.log(app.render());
```

## Builder Pattern

Builder pattern, complex object'lerin step-by-step construction'ını sağlar.

### Database Query Builder

```typescript
interface QueryResult {
  sql: string;
  parameters: any[];
}

class QueryBuilder {
  private selectFields: string[] = [];
  private fromTable: string = '';
  private joinClauses: string[] = [];
  private whereConditions: string[] = [];
  private orderByFields: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private parameters: any[] = [];

  select(fields: string | string[]): QueryBuilder {
    if (typeof fields === 'string') {
      this.selectFields.push(fields);
    } else {
      this.selectFields.push(...fields);
    }
    return this;
  }

  from(table: string): QueryBuilder {
    this.fromTable = table;
    return this;
  }

  join(table: string, condition: string): QueryBuilder {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table: string, condition: string): QueryBuilder {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  where(condition: string, ...params: any[]): QueryBuilder {
    this.whereConditions.push(condition);
    this.parameters.push(...params);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByFields.push(`${field} ${direction}`);
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitValue = count;
    return this;
  }

  offset(count: number): QueryBuilder {
    this.offsetValue = count;
    return this;
  }

  build(): QueryResult {
    if (!this.fromTable) {
      throw new Error('FROM clause is required');
    }

    let sql = 'SELECT ';
    sql += this.selectFields.length > 0 ? this.selectFields.join(', ') : '*';
    sql += ` FROM ${this.fromTable}`;

    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses.join(' ');
    }

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    if (this.orderByFields.length > 0) {
      sql += ' ORDER BY ' + this.orderByFields.join(', ');
    }

    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return {
      sql,
      parameters: this.parameters
    };
  }

  // Reset builder for reuse
  reset(): QueryBuilder {
    this.selectFields = [];
    this.fromTable = '';
    this.joinClauses = [];
    this.whereConditions = [];
    this.orderByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.parameters = [];
    return this;
  }
}

// Usage
const queryBuilder = new QueryBuilder();

const userQuery = queryBuilder
  .select(['u.id', 'u.name', 'u.email', 'p.title'])
  .from('users u')
  .leftJoin('profiles p', 'u.id = p.user_id')
  .where('u.active = ?', true)
  .where('u.created_at > ?', '2023-01-01')
  .orderBy('u.name', 'ASC')
  .limit(10)
  .offset(20)
  .build();

console.log(userQuery.sql);
console.log(userQuery.parameters);
```

### HTTP Request Builder

```typescript
interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout: number;
}

class HttpRequestBuilder {
  private method: string = 'GET';
  private baseUrl: string = '';
  private path: string = '';
  private queryParams: Record<string, string> = {};
  private headers: Record<string, string> = {};
  private body: any = null;
  private timeout: number = 5000;

  setMethod(method: string): HttpRequestBuilder {
    this.method = method.toUpperCase();
    return this;
  }

  setBaseUrl(url: string): HttpRequestBuilder {
    this.baseUrl = url;
    return this;
  }

  setPath(path: string): HttpRequestBuilder {
    this.path = path;
    return this;
  }

  addQueryParam(key: string, value: string): HttpRequestBuilder {
    this.queryParams[key] = value;
    return this;
  }

  addHeader(key: string, value: string): HttpRequestBuilder {
    this.headers[key] = value;
    return this;
  }

  setAuthToken(token: string): HttpRequestBuilder {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  setContentType(contentType: string): HttpRequestBuilder {
    this.headers['Content-Type'] = contentType;
    return this;
  }

  setBody(body: any): HttpRequestBuilder {
    this.body = body;
    return this;
  }

  setTimeout(timeout: number): HttpRequestBuilder {
    this.timeout = timeout;
    return this;
  }

  build(): HttpRequest {
    let url = this.baseUrl + this.path;

    const queryString = Object.entries(this.queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    if (queryString) {
      url += '?' + queryString;
    }

    return {
      method: this.method,
      url,
      headers: this.headers,
      body: this.body,
      timeout: this.timeout
    };
  }
}

// Usage
const request = new HttpRequestBuilder()
  .setMethod('POST')
  .setBaseUrl('https://api.example.com')
  .setPath('/users')
  .addQueryParam('include', 'profile')
  .addQueryParam('fields', 'id,name,email')
  .setAuthToken('abc123')
  .setContentType('application/json')
  .setBody({ name: 'John Doe', email: 'john@example.com' })
  .setTimeout(10000)
  .build();

console.log(request);
```

## Builder Pattern

Builder pattern, complex object'lerin step-by-step construction'ını sağlar ve immutable object'ler oluşturmak için de kullanılabilir.

### Configuration Builder

```typescript
interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly ssl: boolean;
  readonly connectionTimeout: number;
  readonly maxConnections: number;
  readonly retryAttempts: number;
}

class DatabaseConfigBuilder {
  private host: string = 'localhost';
  private port: number = 5432;
  private database: string = '';
  private username: string = '';
  private password: string = '';
  private ssl: boolean = false;
  private connectionTimeout: number = 30000;
  private maxConnections: number = 10;
  private retryAttempts: number = 3;

  setHost(host: string): DatabaseConfigBuilder {
    this.host = host;
    return this;
  }

  setPort(port: number): DatabaseConfigBuilder {
    if (port <= 0 || port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }
    this.port = port;
    return this;
  }

  setDatabase(database: string): DatabaseConfigBuilder {
    if (!database.trim()) {
      throw new Error('Database name cannot be empty');
    }
    this.database = database;
    return this;
  }

  setCredentials(username: string, password: string): DatabaseConfigBuilder {
    this.username = username;
    this.password = password;
    return this;
  }

  enableSsl(): DatabaseConfigBuilder {
    this.ssl = true;
    return this;
  }

  disableSsl(): DatabaseConfigBuilder {
    this.ssl = false;
    return this;
  }

  setConnectionTimeout(timeout: number): DatabaseConfigBuilder {
    if (timeout <= 0) {
      throw new Error('Connection timeout must be positive');
    }
    this.connectionTimeout = timeout;
    return this;
  }

  setMaxConnections(max: number): DatabaseConfigBuilder {
    if (max <= 0) {
      throw new Error('Max connections must be positive');
    }
    this.maxConnections = max;
    return this;
  }

  setRetryAttempts(attempts: number): DatabaseConfigBuilder {
    if (attempts < 0) {
      throw new Error('Retry attempts cannot be negative');
    }
    this.retryAttempts = attempts;
    return this;
  }

  build(): DatabaseConfig {
    if (!this.database) {
      throw new Error('Database name is required');
    }
    if (!this.username) {
      throw new Error('Username is required');
    }

    return Object.freeze({
      host: this.host,
      port: this.port,
      database: this.database,
      username: this.username,
      password: this.password,
      ssl: this.ssl,
      connectionTimeout: this.connectionTimeout,
      maxConnections: this.maxConnections,
      retryAttempts: this.retryAttempts
    });
  }
}

// Usage
const dbConfig = new DatabaseConfigBuilder()
  .setHost('prod-db.example.com')
  .setPort(5432)
  .setDatabase('myapp')
  .setCredentials('dbuser', 'secretpassword')
  .enableSsl()
  .setConnectionTimeout(60000)
  .setMaxConnections(20)
  .setRetryAttempts(5)
  .build();

console.log(dbConfig);
```

Bu kapsamlı rehber, Creational Design Patterns'ın temellerini ve pratik kullanım örneklerini detaylı bir şekilde ele almaktadır. Bu pattern'ler, object creation sürecini daha esnek, maintainable ve testable hale getirir.