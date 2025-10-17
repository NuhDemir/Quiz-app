# NestJS Middleware, Guards, Interceptors ve Pipes

## İçindekiler
1. [Request Lifecycle](#request-lifecycle)
2. [Middleware](#middleware)
3. [Guards](#guards)
4. [Interceptors](#interceptors)
5. [Pipes](#pipes)
6. [Exception Filters](#exception-filters)
7. [Execution Context](#execution-context)
8. [Custom Decorators](#custom-decorators)
9. [Combining Multiple Features](#combining-multiple-features)
10. [Best Practices](#best-practices)

## Request Lifecycle

NestJS'te bir HTTP request'in yaşam döngüsü belirli bir sıra takip eder:

```
Incoming Request
      ↓
1. Middleware
      ↓
2. Guards
      ↓
3. Interceptors (before)
      ↓
4. Pipes
      ↓
5. Controller/Route Handler
      ↓
6. Interceptors (after)
      ↓
7. Exception Filters (if exception occurs)
      ↓
Outgoing Response
```

### Request Lifecycle Visualization

```typescript
import { Injectable, NestMiddleware, CanActivate, NestInterceptor, PipeTransform, ExceptionFilter } from '@nestjs/common';

// 1. Middleware - İlk çalışan
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    console.log('1. Middleware executed');
    next();
  }
}

// 2. Guard - Authentication/Authorization
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    console.log('2. Guard executed');
    return true;
  }
}

// 3. Interceptor - Request/Response transformation
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('3. Interceptor - Before handler');
    
    return next.handle().pipe(
      tap(() => console.log('6. Interceptor - After handler'))
    );
  }
}

// 4. Pipe - Data validation/transformation
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('4. Pipe executed');
    return value;
  }
}

// 5. Controller - Business logic
@Controller('example')
export class ExampleController {
  @Get()
  @UseGuards(AuthGuard)
  @UseInterceptors(LoggingInterceptor)
  getExample(@Body(ValidationPipe) body: any) {
    console.log('5. Controller handler executed');
    return { message: 'Success' };
  }
}
```

## Middleware

Middleware, route handler'dan önce çalışan fonksiyonlardır. Express middleware'leri ile uyumludur.

### Function Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

// Simple function middleware
export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
}

// Middleware with configuration
export function corsMiddleware(options: { origin: string[] }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (options.origin.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    next();
  };
}

// Apply middleware in module
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(logger)
      .forRoutes('*'); // Apply to all routes
      
    consumer
      .apply(corsMiddleware({ origin: ['http://localhost:3000'] }))
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
```

### Class Middleware

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length');
      const responseTime = Date.now() - startTime;

      console.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${responseTime}ms`
      );
    });

    next();
  }
}

// Authentication middleware
@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        req.user = payload;
      } catch (error) {
        // Token invalid, but don't block request
        // Let guards handle authentication
      }
    }
    
    next();
  }
}

// Rate limiting middleware
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, { count: number; resetTime: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;

    const clientData = this.requests.get(ip);

    if (!clientData || now > clientData.resetTime) {
      this.requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
    next();
  }
}
```

### Middleware Configuration

```typescript
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';

@Module({
  // ... module configuration
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply to all routes
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');

    // Apply to specific routes
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.GET },
        { path: 'users/*', method: RequestMethod.ALL }
      );

    // Apply to specific controllers
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(UsersController, ProductsController);

    // Exclude specific routes
    consumer
      .apply(AuthenticationMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        'health'
      )
      .forRoutes('*');

    // Multiple middleware in sequence
    consumer
      .apply(LoggerMiddleware, AuthenticationMiddleware, RateLimitMiddleware)
      .forRoutes('api/*');
  }
}
```

## Guards

Guards, route'a erişim kontrolü yapar. Authentication ve authorization için kullanılır.

### Basic Guards

```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

// Simple authentication guard
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Validate token logic here
    return this.validateToken(token);
  }

  private validateToken(token: string): boolean {
    // Simple token validation
    return token === 'Bearer valid-token';
  }
}

// JWT Authentication Guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Role-Based Guards

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Role decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Roles guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some(role => user.roles?.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

// Permission-based guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = requiredPermissions.every(permission =>
      user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

// Usage in controller
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  
  @Get('users')
  @Permissions('users:read')
  @UseGuards(PermissionsGuard)
  getUsers() {
    return 'Admin users list';
  }

  @Delete('users/:id')
  @Permissions('users:delete')
  @UseGuards(PermissionsGuard)
  deleteUser(@Param('id') id: string) {
    return `Delete user ${id}`;
  }
}
```

### Resource-Based Guards

```typescript
// Resource ownership guard
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private postsService: PostsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;
    const resourceType = this.getResourceType(context);

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Admin can access everything
    if (user.roles?.includes('admin')) {
      return true;
    }

    // Check resource ownership
    const isOwner = await this.checkOwnership(user.id, resourceType, resourceId);
    
    if (!isOwner) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }

  private getResourceType(context: ExecutionContext): string {
    const controller = context.getClass().name;
    return controller.replace('Controller', '').toLowerCase();
  }

  private async checkOwnership(userId: number, resourceType: string, resourceId: string): Promise<boolean> {
    switch (resourceType) {
      case 'users':
        return userId.toString() === resourceId;
      case 'posts':
        const post = await this.postsService.findOne(+resourceId);
        return post?.authorId === userId;
      default:
        return false;
    }
  }
}

// Usage
@Controller('posts')
export class PostsController {
  
  @Get(':id')
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  getPost(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, ResourceOwnerGuard)
  updatePost(@Param('id') id: string, @Body() updateData: any) {
    return this.postsService.update(+id, updateData);
  }
}
```

## Interceptors

Interceptors, request/response cycle'ını intercept ederek transformation, logging, caching gibi işlemler yapar.

### Basic Interceptors

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

// Logging interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    console.log(`Incoming Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        console.log(`Outgoing Response: ${method} ${url} - ${responseTime}ms`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        console.log(`Error Response: ${method} ${url} - ${responseTime}ms - ${error.message}`);
        throw error;
      })
    );
  }
}

// Response transformation interceptor
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url,
        data,
      }))
    );
  }
}

// Error handling interceptor
@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        // Log error
        console.error('Interceptor caught error:', error);
        
        // Transform error if needed
        if (error.name === 'ValidationError') {
          throw new BadRequestException('Validation failed');
        }
        
        throw error;
      })
    );
  }
}
```

### Caching Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    // Check if response is cached
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit:', cacheKey);
      return of(this.cache.get(cacheKey));
    }

    // Execute handler and cache response
    return next.handle().pipe(
      tap(response => {
        console.log('Caching response:', cacheKey);
        this.cache.set(cacheKey, response);
        
        // Set TTL for cache entry
        setTimeout(() => {
          this.cache.delete(cacheKey);
        }, 300000); // 5 minutes
      })
    );
  }

  private generateCacheKey(request: any): string {
    const { method, url, query, user } = request;
    return `${method}:${url}:${JSON.stringify(query)}:${user?.id || 'anonymous'}`;
  }
}

// Advanced caching with Redis
@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.getCacheKey(context);
    const ttl = this.getCacheTTL(context);

    if (!cacheKey) {
      return next.handle();
    }

    // Try to get from cache
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheManager.set(cacheKey, response, ttl);
      })
    );
  }

  private getCacheKey(context: ExecutionContext): string | null {
    const cacheKey = this.reflector.get<string>('cacheKey', context.getHandler());
    if (!cacheKey) return null;

    const request = context.switchToHttp().getRequest();
    return `${cacheKey}:${JSON.stringify(request.params)}:${JSON.stringify(request.query)}`;
  }

  private getCacheTTL(context: ExecutionContext): number {
    return this.reflector.get<number>('cacheTTL', context.getHandler()) || 300;
  }
}

// Cache decorators
export const CacheKey = (key: string) => SetMetadata('cacheKey', key);
export const CacheTTL = (ttl: number) => SetMetadata('cacheTTL', ttl);

// Usage
@Controller('products')
export class ProductsController {
  
  @Get()
  @UseInterceptors(RedisCacheInterceptor)
  @CacheKey('products:list')
  @CacheTTL(600) // 10 minutes
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }
}
```

### Timeout Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutValue: number = 5000) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutValue),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException('Request timeout'));
        }
        return throwError(() => err);
      })
    );
  }
}

// Configurable timeout interceptor
@Injectable()
export class ConfigurableTimeoutInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timeoutValue = this.reflector.get<number>('timeout', context.getHandler()) || 5000;

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException(`Request timeout after ${timeoutValue}ms`));
        }
        return throwError(() => err);
      })
    );
  }
}

// Timeout decorator
export const Timeout = (ms: number) => SetMetadata('timeout', ms);

// Usage
@Controller('api')
export class ApiController {
  
  @Get('slow-operation')
  @UseInterceptors(ConfigurableTimeoutInterceptor)
  @Timeout(10000) // 10 seconds timeout
  slowOperation() {
    return this.someSlowService.performOperation();
  }
}
```

## Pipes

Pipes, input data'yı transform eder ve validate eder.

### Built-in Pipes

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  DefaultValuePipe,
  ValidationPipe
} from '@nestjs/common';

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

@Controller('users')
export class UsersController {
  
  // Parse integer parameter
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return `User ID: ${id} (type: ${typeof id})`;
  }

  // Parse boolean query parameter
  @Get()
  findAll(
    @Query('active', new DefaultValuePipe(true), ParseBoolPipe) active: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return { active, page, limit };
  }

  // Parse array parameter
  @Get('by-ids/:ids')
  findByIds(
    @Param('ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
  ) {
    return `User IDs: ${ids.join(', ')}`;
  }

  // Parse UUID parameter
  @Get('uuid/:id')
  findByUUID(@Param('id', ParseUUIDPipe) id: string) {
    return `User UUID: ${id}`;
  }

  // Parse enum parameter
  @Get('role/:role')
  findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {
    return `Users with role: ${role}`;
  }

  // Validation pipe for request body
  @Post()
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return createUserDto;
  }
}
```

### Custom Validation Pipes

```typescript
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        return Object.values(error.constraints || {}).join(', ');
      });
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// Transformation pipe
@Injectable()
export class ParseDatePipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): Date {
    if (!value) {
      throw new BadRequestException('Date value is required');
    }

    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return date;
  }
}

// Sanitization pipe
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      // Remove HTML tags and trim whitespace
      return value.replace(/<[^>]*>/g, '').trim();
    }
    
    if (typeof value === 'object' && value !== null) {
      // Recursively sanitize object properties
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.transform(val, metadata);
      }
      return sanitized;
    }

    return value;
  }
}

// File validation pipe
@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly maxSize: number = 5 * 1024 * 1024, // 5MB
    private readonly allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']
  ) {}

  transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check file size
    if (file.size > this.maxSize) {
      throw new BadRequestException(`File size exceeds ${this.maxSize / 1024 / 1024}MB limit`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    return file;
  }
}
```

### Advanced Pipes

```typescript
// JSON parsing pipe with validation
@Injectable()
export class ParseJsonPipe implements PipeTransform {
  constructor(private readonly schema?: any) {}

  transform(value: string, metadata: ArgumentMetadata) {
    try {
      const parsed = JSON.parse(value);
      
      if (this.schema) {
        const { error } = this.schema.validate(parsed);
        if (error) {
          throw new BadRequestException(`JSON validation failed: ${error.message}`);
        }
      }
      
      return parsed;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid JSON format');
    }
  }
}

// Pagination pipe
@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const page = parseInt(value.page) || 1;
    const limit = parseInt(value.limit) || 10;
    const maxLimit = 100;

    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit < 1 || limit > maxLimit) {
      throw new BadRequestException(`Limit must be between 1 and ${maxLimit}`);
    }

    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }
}

// Usage examples
@Controller('posts')
export class PostsController {
  
  @Get()
  findAll(@Query(PaginationPipe) pagination: any) {
    return this.postsService.findAll(pagination);
  }

  @Post()
  create(
    @Body(SanitizePipe, CustomValidationPipe) createPostDto: CreatePostDto
  ) {
    return this.postsService.create(createPostDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile(FileValidationPipe) file: Express.Multer.File) {
    return { filename: file.filename, size: file.size };
  }

  @Get('by-date/:date')
  findByDate(@Param('date', ParseDatePipe) date: Date) {
    return this.postsService.findByDate(date);
  }
}
```

## Exception Filters

Exception filters, uygulamada oluşan exception'ları handle eder ve custom error response'ları oluşturur.

### Basic Exception Filters

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

// HTTP exception filter
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
    };

    response.status(status).json(errorResponse);
  }
}

// All exceptions filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: (exception as Error).stack }),
    };

    console.error('Exception caught by filter:', exception);

    response.status(status).json(errorResponse);
  }
}

// Validation exception filter
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse() as any;
    
    const errorResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      errors: Array.isArray(exceptionResponse.message) 
        ? exceptionResponse.message 
        : [exceptionResponse.message],
    };

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
```

### Database Exception Filters

```typescript
import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError, EntityNotFoundError, CannotCreateEntityIdMapError } from 'typeorm';

@Catch(QueryFailedError, EntityNotFoundError, CannotCreateEntityIdMapError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Entity not found';
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      
      // Handle specific database errors
      if (exception.driverError?.code === '23505') { // Unique constraint violation
        message = 'Resource already exists';
        status = HttpStatus.CONFLICT;
      } else if (exception.driverError?.code === '23503') { // Foreign key constraint
        message = 'Referenced resource does not exist';
        status = HttpStatus.BAD_REQUEST;
      } else if (exception.driverError?.code === '23502') { // Not null constraint
        message = 'Required field is missing';
        status = HttpStatus.BAD_REQUEST;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        details: exception.message,
        query: exception.query,
        parameters: exception.parameters 
      }),
    };

    response.status(status).json(errorResponse);
  }
}
```

Bu kapsamlı rehber, NestJS'te middleware, guards, interceptors, pipes ve exception filters'ın tüm yönlerini detaylı bir şekilde ele almaktadır. Bu bileşenler, NestJS uygulamalarında cross-cutting concerns'leri elegant bir şekilde yönetmek için güçlü araçlardır.