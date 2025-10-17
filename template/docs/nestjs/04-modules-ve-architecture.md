# NestJS Modules ve Architecture

## İçindekiler
1. [Module Temelleri](#module-temelleri)
2. [Feature Modules](#feature-modules)
3. [Shared Modules](#shared-modules)
4. [Global Modules](#global-modules)
5. [Dynamic Modules](#dynamic-modules)
6. [Module Re-exporting](#module-re-exporting)
7. [Lazy Loading Modules](#lazy-loading-modules)
8. [Module Architecture Patterns](#module-architecture-patterns)
9. [Monorepo ve Workspace](#monorepo-ve-workspace)
10. [Best Practices](#best-practices)

## Module Temelleri

Modules, NestJS uygulamalarının organizasyonel yapı taşlarıdır. Her uygulama en az bir root module'e sahiptir ve feature'lar modüler yapıda organize edilir.

### Temel Module Yapısı

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';

@Module({
  imports: [],      // Bu module'ün import ettiği diğer module'ler
  controllers: [UsersController], // Bu module'e ait controller'lar
  providers: [UsersService, UserRepository], // Bu module'e ait provider'lar
  exports: [UsersService], // Diğer module'lerin kullanabileceği provider'lar
})
export class UsersModule {}
```

### Root Module (AppModule)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: configValidationSchema,
    }),

    // Database
    DatabaseModule,

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
      max: 1000, // maximum number of items in cache
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Event system
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Logging
    LoggerModule,

    // Feature modules
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Module Metadata

```typescript
import { Module, DynamicModule, Provider } from '@nestjs/common';

// Module metadata interface
interface ModuleMetadata {
  imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  controllers?: Type<any>[];
  providers?: Provider[];
  exports?: Array<DynamicModule | Promise<DynamicModule> | string | symbol | Provider | ForwardReference | Abstract<any> | Function>;
}

// Example with all metadata properties
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    CacheModule.register(),
  ],
  controllers: [
    UsersController,
    ProfilesController,
  ],
  providers: [
    UsersService,
    ProfilesService,
    UserRepository,
    ProfileRepository,
    {
      provide: 'USER_CONFIG',
      useValue: { maxUsers: 1000 },
    },
  ],
  exports: [
    UsersService,
    ProfilesService,
    'USER_CONFIG',
  ],
})
export class UsersModule {}
```

## Feature Modules

Feature modules, belirli bir domain veya özellik etrafında organize edilmiş modüllerdir.

### Users Feature Module

```typescript
// users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    EmailModule, // Import email functionality
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    ProfileRepository,
  ],
  exports: [
    UsersService, // Export for other modules to use
    UserRepository,
  ],
})
export class UsersModule {}

// users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user
    const user = await this.userRepository.create(createUserDto);

    // Create default profile
    await this.profileRepository.create({
      userId: user.id,
      displayName: createUserDto.name,
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return user;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    return this.userRepository.findWithPagination(page, limit);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(id);
  }
}
```

### Products Feature Module

```typescript
// products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductRepository } from './repositories/product.repository';
import { CategoryRepository } from './repositories/category.repository';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]),
    InventoryModule,
    CacheModule.register({
      ttl: 600, // 10 minutes cache for products
    }),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    CategoryRepository,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}

// products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Inject, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductRepository } from './repositories/product.repository';
import { InventoryService } from '../inventory/inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryService: InventoryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.productRepository.create(createProductDto);
    
    // Initialize inventory
    await this.inventoryService.initializeStock(product.id, createProductDto.initialStock || 0);
    
    // Clear cache
    await this.cacheManager.del('products:*');
    
    return product;
  }

  async findAll(categoryId?: number): Promise<Product[]> {
    const cacheKey = `products:category:${categoryId || 'all'}`;
    
    // Try to get from cache
    let products = await this.cacheManager.get<Product[]>(cacheKey);
    
    if (!products) {
      // Fetch from database
      products = await this.productRepository.findByCategory(categoryId);
      
      // Cache the result
      await this.cacheManager.set(cacheKey, products, 600); // 10 minutes
    }
    
    return products;
  }

  async findOne(id: number): Promise<Product> {
    const cacheKey = `product:${id}`;
    
    let product = await this.cacheManager.get<Product>(cacheKey);
    
    if (!product) {
      product = await this.productRepository.findById(id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      
      await this.cacheManager.set(cacheKey, product, 600);
    }
    
    return product;
  }
}
```

## Shared Modules

Shared modules, birden fazla module tarafından kullanılan ortak functionality'leri içerir.

### Database Module

```typescript
// database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { DatabaseConfig } from './database.config';

@Global() // Makes this module available globally
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}

// database/database.config.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      logging: this.configService.get('NODE_ENV') === 'development',
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
}

// database/database.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getHealth(): Promise<{ status: string; info: any }> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
        info: {
          database: 'connected',
        },
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        info: {
          database: 'disconnected',
          error: error.message,
        },
      };
    }
  }

  async runMigrations(): Promise<void> {
    await this.dataSource.runMigrations();
    this.logger.log('Migrations executed successfully');
  }

  async revertMigration(): Promise<void> {
    await this.dataSource.undoLastMigration();
    this.logger.log('Last migration reverted');
  }
}
```

### Logger Module

```typescript
// logger/logger.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { LoggerConfig } from './logger.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    LoggerConfig,
  ],
  exports: [LoggerService],
})
export class LoggerModule {}

// logger/logger.service.ts
import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.logger = winston.createLogger({
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: any, context?: string): void {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context: context || this.context });
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context: context || this.context });
  }
}
```

### Email Module

```typescript
// email/email.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailConfig } from './email.config';
import { EmailTemplateService } from './email-template.service';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailService,
    EmailConfig,
    EmailTemplateService,
  ],
  exports: [EmailService],
})
export class EmailModule {}

// email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private templateService: EmailTemplateService,
  ) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;
      let text = options.text;

      // Use template if provided
      if (options.template) {
        const rendered = await this.templateService.render(options.template, options.context);
        html = rendered.html;
        text = rendered.text;
      }

      const mailOptions = {
        from: this.configService.get('SMTP_FROM'),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error.stack);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Our Platform!',
      template: 'welcome',
      context: { name },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: { resetUrl },
    });
  }
}
```

## Global Modules

Global modules, tüm uygulama boyunca erişilebilir olan modüllerdir.

### Global Configuration Module

```typescript
// config/config.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfigService } from './app-config.service';
import databaseConfig from './database.config';
import authConfig from './auth.config';
import emailConfig from './email.config';

const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  
  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  
  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
});

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, emailConfig],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService, ConfigService],
})
export class ConfigModule {}

// config/app-config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV');
  }

  get port(): number {
    return this.configService.get<number>('PORT');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  // Database configuration
  get databaseConfig() {
    return {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
    };
  }

  // JWT configuration
  get jwtConfig() {
    return {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    };
  }

  // Email configuration
  get emailConfig() {
    return {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      user: this.configService.get<string>('SMTP_USER'),
      pass: this.configService.get<string>('SMTP_PASS'),
    };
  }
}
```

### Global Cache Module

```typescript
// cache/cache.module.ts
import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
        });

        return {
          store: store as any,
          ttl: 300, // 5 minutes default TTL
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}

// cache/cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // Utility methods
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === undefined) {
      value = await factory();
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Implementation depends on cache store
    // For Redis, you might use SCAN command
  }

  generateKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}
```

## Dynamic Modules

Dynamic modules, runtime'da konfigüre edilebilen modüllerdir.

### Database Dynamic Module

```typescript
// database/database.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';

export interface DatabaseModuleOptions {
  type: 'postgres' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  entities?: any[];
  synchronize?: boolean;
  logging?: boolean;
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: options.type,
          host: options.host,
          port: options.port,
          username: options.username,
          password: options.password,
          database: options.database,
          entities: options.entities || [],
          synchronize: options.synchronize || false,
          logging: options.logging || false,
        }),
      ],
      providers: [DatabaseService],
      exports: [DatabaseService],
      global: true,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: options.useFactory,
          inject: options.inject,
        }),
      ],
      providers: [DatabaseService],
      exports: [DatabaseService],
      global: true,
    };
  }

  static forFeature(entities: any[]): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: [TypeOrmModule],
    };
  }
}

// Usage examples:
// Synchronous configuration
@Module({
  imports: [
    DatabaseModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'myapp',
      entities: [User, Product],
      synchronize: true,
    }),
  ],
})
export class AppModule {}

// Asynchronous configuration
@Module({
  imports: [
    DatabaseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Product],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### HTTP Client Dynamic Module

```typescript
// http-client/http-client.module.ts
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';

export interface HttpClientModuleOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface HttpClientModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<HttpClientModuleOptions> | HttpClientModuleOptions;
  inject?: any[];
}

@Module({})
export class HttpClientModule {
  static forRoot(options: HttpClientModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'HTTP_CLIENT_OPTIONS',
        useValue: options,
      },
      HttpClientService,
    ];

    return {
      module: HttpClientModule,
      imports: [
        HttpModule.register({
          baseURL: options.baseURL,
          timeout: options.timeout || 5000,
          headers: options.headers,
        }),
      ],
      providers,
      exports: [HttpClientService],
    };
  }

  static forRootAsync(options: HttpClientModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'HTTP_CLIENT_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      HttpClientService,
    ];

    return {
      module: HttpClientModule,
      imports: [
        HttpModule.registerAsync({
          useFactory: (config: HttpClientModuleOptions) => ({
            baseURL: config.baseURL,
            timeout: config.timeout || 5000,
            headers: config.headers,
          }),
          inject: ['HTTP_CLIENT_OPTIONS'],
        }),
      ],
      providers,
      exports: [HttpClientService],
    };
  }
}

// http-client/http-client.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import { HttpClientModuleOptions } from './http-client.module';

@Injectable()
export class HttpClientService {
  constructor(
    private readonly httpService: HttpService,
    @Inject('HTTP_CLIENT_OPTIONS') private readonly options: HttpClientModuleOptions,
  ) {}

  get<T>(url: string, config?: any): Observable<T> {
    return this.httpService.get(url, config).pipe(
      retry(this.options.retries || 3),
      map((response: AxiosResponse<T>) => response.data),
      catchError(this.handleError),
    );
  }

  post<T>(url: string, data?: any, config?: any): Observable<T> {
    return this.httpService.post(url, data, config).pipe(
      retry(this.options.retries || 3),
      map((response: AxiosResponse<T>) => response.data),
      catchError(this.handleError),
    );
  }

  put<T>(url: string, data?: any, config?: any): Observable<T> {
    return this.httpService.put(url, data, config).pipe(
      retry(this.options.retries || 3),
      map((response: AxiosResponse<T>) => response.data),
      catchError(this.handleError),
    );
  }

  delete<T>(url: string, config?: any): Observable<T> {
    return this.httpService.delete(url, config).pipe(
      retry(this.options.retries || 3),
      map((response: AxiosResponse<T>) => response.data),
      catchError(this.handleError),
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('HTTP Client Error:', error);
    throw error;
  }
}
```

Bu kapsamlı rehber, NestJS'te modules ve architecture sisteminin tüm yönlerini detaylı bir şekilde ele almaktadır. Sonraki derslerde middleware, guards, interceptors ve diğer ileri seviye konuları inceleyeceğiz.