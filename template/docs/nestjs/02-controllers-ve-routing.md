# NestJS Controllers ve Routing

## İçindekiler
1. [Controller Temelleri](#controller-temelleri)
2. [HTTP Method Decorators](#http-method-decorators)
3. [Route Parameters](#route-parameters)
4. [Query Parameters](#query-parameters)
5. [Request Body Handling](#request-body-handling)
6. [Response Handling](#response-handling)
7. [Route Grouping ve Prefixes](#route-grouping-ve-prefixes)
8. [Middleware ve Guards](#middleware-ve-guards)
9. [Error Handling](#error-handling)
10. [Advanced Routing Patterns](#advanced-routing-patterns)

## Controller Temelleri

Controllers, NestJS'te HTTP isteklerini handle eden ve response dönen sınıflardır. `@Controller()` decorator'ı ile tanımlanır ve routing logic'ini içerir.

### Temel Controller Yapısı

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('products') // Swagger grouping
@Controller('products') // Base route: /products
export class ProductsController {
  
  // GET /products
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(): string {
    return 'This action returns all products';
  }

  // GET /products/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string): string {
    return `This action returns product #${id}`;
  }

  // POST /products
  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() createProductDto: any): string {
    return 'This action adds a new product';
  }

  // PUT /products/:id
  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() updateProductDto: any): string {
    return `This action updates product #${id}`;
  }

  // DELETE /products/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  remove(@Param('id') id: string): string {
    return `This action removes product #${id}`;
  }
}
```

### Controller Registration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController], // Controller'ı module'e register et
  providers: [ProductsService],
})
export class AppModule {}
```

### Dependency Injection in Controllers

```typescript
import { Controller, Get, Post, Body, Param, Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  // Service injection through constructor
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(+id);
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }
}

// products.service.ts
@Injectable()
export class ProductsService {
  private products: Product[] = [];

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product {
    return this.products.find(product => product.id === id);
  }

  create(createProductDto: CreateProductDto): Product {
    const newProduct = {
      id: Date.now(),
      ...createProductDto,
      createdAt: new Date(),
    };
    this.products.push(newProduct);
    return newProduct;
  }
}
```

## HTTP Method Decorators

NestJS, tüm standart HTTP metodları için decorator'lar sağlar.

### Temel HTTP Method Decorators

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Delete, 
  Head, 
  Options,
  All 
} from '@nestjs/common';

@Controller('api')
export class ApiController {
  
  @Get('users')
  getUsers() {
    return 'GET /api/users';
  }

  @Post('users')
  createUser() {
    return 'POST /api/users';
  }

  @Put('users/:id')
  updateUser() {
    return 'PUT /api/users/:id';
  }

  @Patch('users/:id')
  patchUser() {
    return 'PATCH /api/users/:id';
  }

  @Delete('users/:id')
  deleteUser() {
    return 'DELETE /api/users/:id';
  }

  @Head('users')
  headUsers() {
    return 'HEAD /api/users';
  }

  @Options('users')
  optionsUsers() {
    return 'OPTIONS /api/users';
  }

  @All('catch-all')
  catchAll() {
    return 'Handles all HTTP methods';
  }
}
```

### Advanced HTTP Method Usage

```typescript
import { Controller, Get, Post, HttpCode, HttpStatus, Header } from '@nestjs/common';

@Controller('advanced')
export class AdvancedController {
  
  // Custom HTTP status code
  @Post('users')
  @HttpCode(HttpStatus.CREATED) // 201
  createUser() {
    return { message: 'User created successfully' };
  }

  // Custom headers
  @Get('download')
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment; filename="file.pdf"')
  downloadFile() {
    return 'File content';
  }

  // Multiple routes for same method
  @Get(['users', 'members', 'people'])
  getUsers() {
    return 'Multiple route patterns';
  }

  // Wildcard routes
  @Get('files/*')
  getFile() {
    return 'Wildcard route';
  }
}
```

## Route Parameters

Route parameters, URL'den dinamik değerler almak için kullanılır.

### Basic Route Parameters

```typescript
import { Controller, Get, Post, Param, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';

@Controller('users')
export class UsersController {
  
  // Single parameter
  @Get(':id')
  findOne(@Param('id') id: string) {
    return `User ID: ${id}`;
  }

  // Multiple parameters
  @Get(':userId/posts/:postId')
  findUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string
  ) {
    return `User ${userId}, Post ${postId}`;
  }

  // All parameters as object
  @Get(':userId/comments/:commentId')
  findUserComment(@Param() params: any) {
    return `User ${params.userId}, Comment ${params.commentId}`;
  }

  // Parameter with validation pipe
  @Get(':id/profile')
  getUserProfile(@Param('id', ParseIntPipe) id: number) {
    return `User profile for ID: ${id} (type: ${typeof id})`;
  }

  // UUID parameter validation
  @Get('uuid/:id')
  findByUUID(@Param('id', ParseUUIDPipe) id: string) {
    return `User with UUID: ${id}`;
  }
}
```

### Custom Parameter Decorators

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom decorator to extract user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Custom decorator with data parameter
export const GetParam = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return key ? request.params[key] : request.params;
  },
);

@Controller('custom')
export class CustomController {
  
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return `Current user: ${user.name}`;
  }

  @Get(':id/details')
  getDetails(@GetParam('id') id: string) {
    return `Details for: ${id}`;
  }
}
```

### Parameter Validation and Transformation

```typescript
import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  ParseBoolPipe,
  ParseArrayPipe,
  ParseEnumPipe,
  DefaultValuePipe,
  ValidationPipe
} from '@nestjs/common';

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

@Controller('validation')
export class ValidationController {
  
  // Integer validation with custom error message
  @Get('users/:id')
  findUser(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) 
    id: number
  ) {
    return `User ID: ${id}`;
  }

  // Boolean parameter
  @Get('posts/:id/published/:isPublished')
  findPost(
    @Param('id', ParseIntPipe) id: number,
    @Param('isPublished', ParseBoolPipe) isPublished: boolean
  ) {
    return `Post ${id}, Published: ${isPublished}`;
  }

  // Enum validation
  @Get('users/role/:role')
  findByRole(
    @Param('role', new ParseEnumPipe(UserRole)) role: UserRole
  ) {
    return `Users with role: ${role}`;
  }

  // Array parameter (comma-separated)
  @Get('tags/:tags')
  findByTags(
    @Param('tags', new ParseArrayPipe({ items: String, separator: ',' }))
    tags: string[]
  ) {
    return `Tags: ${tags.join(', ')}`;
  }

  // Custom validation pipe
  @Get('custom/:value')
  customValidation(
    @Param('value', new ValidationPipe({ transform: true }))
    value: any
  ) {
    return `Validated value: ${value}`;
  }
}
```

## Query Parameters

Query parameters, URL'deki `?` işaretinden sonraki parametrelerdir.

### Basic Query Parameters

```typescript
import { Controller, Get, Query, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';

@Controller('search')
export class SearchController {
  
  // Single query parameter
  @Get('users')
  searchUsers(@Query('name') name: string) {
    return `Searching users with name: ${name}`;
  }

  // Multiple query parameters
  @Get('products')
  searchProducts(
    @Query('category') category: string,
    @Query('minPrice') minPrice: string,
    @Query('maxPrice') maxPrice: string
  ) {
    return {
      category,
      minPrice: +minPrice,
      maxPrice: +maxPrice
    };
  }

  // All query parameters as object
  @Get('advanced')
  advancedSearch(@Query() query: any) {
    return `Query parameters: ${JSON.stringify(query)}`;
  }

  // Query parameter with validation
  @Get('paginated')
  getPaginated(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean
  ) {
    return {
      page,
      limit,
      active,
      offset: (page - 1) * limit
    };
  }
}
```

### Query Parameter DTOs

```typescript
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Include inactive items' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean = false;
}

@Controller('products')
export class ProductsController {
  
  @Get()
  findAll(@Query() query: SearchQueryDto) {
    return {
      query,
      offset: (query.page - 1) * query.limit,
      filters: {
        category: query.category,
        active: !query.includeInactive
      }
    };
  }
}
```

### Advanced Query Handling

```typescript
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, IsArray, IsDateString } from 'class-validator';

// Custom transform decorator for arrays
const TransformStringToArray = () => 
  Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim());
    }
    return value;
  });

// Custom transform decorator for dates
const TransformStringToDate = () =>
  Transform(({ value }) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      return date;
    }
    return value;
  });

export class AdvancedQueryDto {
  @IsOptional()
  @IsArray()
  @TransformStringToArray()
  tags?: string[];

  @IsOptional()
  @TransformStringToDate()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @TransformStringToDate()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    const parsed = JSON.parse(value);
    return parsed;
  })
  filters?: Record<string, any>;
}

@Controller('advanced-search')
export class AdvancedSearchController {
  
  @Get()
  search(@Query() query: AdvancedQueryDto) {
    return {
      tags: query.tags,
      dateRange: {
        start: query.startDate,
        end: query.endDate
      },
      customFilters: query.filters
    };
  }

  // Example: /advanced-search?tags=tech,programming&startDate=2023-01-01&filters={"status":"active"}
}
```

## Request Body Handling

Request body'den gelen data'yı handle etmek için `@Body()` decorator'ı kullanılır.

### Basic Body Handling

```typescript
import { Controller, Post, Body, Put, Patch } from '@nestjs/common';

interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}

@Controller('users')
export class UsersController {
  
  // Entire body
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return `Creating user: ${JSON.stringify(createUserDto)}`;
  }

  // Specific body property
  @Post('quick')
  quickCreate(@Body('name') name: string, @Body('email') email: string) {
    return `Creating user: ${name} (${email})`;
  }

  // Partial update
  @Patch(':id')
  update(@Body() updateData: Partial<CreateUserDto>) {
    return `Updating with: ${JSON.stringify(updateData)}`;
  }
}
```

### DTO Validation

```typescript
import { IsEmail, IsString, IsNumber, IsOptional, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 25, description: 'Age of the user', minimum: 18, maximum: 100 })
  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  age?: number;
}

@Controller('users')
export class UsersController {
  
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // DTO automatically validated by ValidationPipe
    return createUserDto;
  }

  @Put(':id')
  update(@Body() updateUserDto: UpdateUserDto) {
    return updateUserDto;
  }
}
```

### Complex Body Structures

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsObject, ValidateNested, IsEnum } from 'class-validator';

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered'
}

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

class ShippingAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

export class CreateOrderDto {
  @IsString()
  customerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('orders')
export class OrdersController {
  
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return {
      message: 'Order created',
      order: createOrderDto,
      totalItems: createOrderDto.items.length,
      totalAmount: createOrderDto.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      )
    };
  }
}
```

## Response Handling

NestJS'te response handling için çeşitli yöntemler mevcuttur.

### Basic Response Handling

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  HttpCode, 
  HttpStatus, 
  Header,
  Redirect,
  Res,
  Response
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';

@Controller('responses')
export class ResponseController {
  
  // Default response (200 for GET, 201 for POST)
  @Get('default')
  getDefault() {
    return { message: 'Default response' };
  }

  // Custom status code
  @Post('custom-status')
  @HttpCode(HttpStatus.ACCEPTED) // 202
  customStatus() {
    return { message: 'Accepted' };
  }

  // Custom headers
  @Get('with-headers')
  @Header('X-Custom-Header', 'Custom Value')
  @Header('Cache-Control', 'no-cache')
  withHeaders() {
    return { message: 'Response with custom headers' };
  }

  // Redirect response
  @Get('redirect')
  @Redirect('https://example.com', HttpStatus.MOVED_PERMANENTLY)
  redirect() {
    // This method body won't be executed
  }

  // Dynamic redirect
  @Get('dynamic-redirect')
  dynamicRedirect() {
    return {
      url: 'https://dynamic-example.com',
      statusCode: HttpStatus.FOUND
    };
  }

  // Manual response handling
  @Get('manual')
  manual(@Res() res: ExpressResponse) {
    res.status(200).json({
      message: 'Manual response',
      timestamp: new Date().toISOString()
    });
  }

  // Streaming response
  @Get('stream')
  stream(@Res() res: ExpressResponse) {
    res.setHeader('Content-Type', 'text/plain');
    res.write('Chunk 1\n');
    
    setTimeout(() => {
      res.write('Chunk 2\n');
      res.end('Final chunk\n');
    }, 1000);
  }
}
```

### Response DTOs and Serialization

```typescript
import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @Exclude() // Password won't be included in response
  password: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @ApiProperty()
  @Expose()
  get fullName(): string {
    return this.name;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

@Controller('users')
export class UsersController {
  
  @Get()
  async findAll(): Promise<PaginatedResponseDto<UserResponseDto>> {
    const users = await this.usersService.findAll();
    const total = await this.usersService.count();
    
    return new PaginatedResponseDto(users, total, 1, 10);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(+id);
  }
}
```

### Error Responses

```typescript
import { 
  Controller, 
  Get, 
  HttpException, 
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';

@Controller('errors')
export class ErrorController {
  
  @Get('not-found')
  notFound() {
    throw new NotFoundException('Resource not found');
  }

  @Get('bad-request')
  badRequest() {
    throw new BadRequestException('Invalid request data');
  }

  @Get('unauthorized')
  unauthorized() {
    throw new UnauthorizedException('Authentication required');
  }

  @Get('forbidden')
  forbidden() {
    throw new ForbiddenException('Access denied');
  }

  @Get('conflict')
  conflict() {
    throw new ConflictException('Resource already exists');
  }

  @Get('custom-error')
  customError() {
    throw new HttpException(
      {
        status: HttpStatus.I_AM_A_TEAPOT,
        error: 'I am a teapot',
        message: 'Cannot brew coffee with a teapot',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.I_AM_A_TEAPOT
    );
  }

  @Get('validation-error')
  validationError() {
    throw new BadRequestException({
      message: 'Validation failed',
      errors: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Age must be between 18 and 100' }
      ]
    });
  }
}
```

## Route Grouping ve Prefixes

Route'ları organize etmek için çeşitli grouping stratejileri kullanılabilir.

### Controller Prefixes

```typescript
// Version-based grouping
@Controller('v1/users')
export class V1UsersController {
  @Get()
  findAll() {
    return 'V1 Users API';
  }
}

@Controller('v2/users')
export class V2UsersController {
  @Get()
  findAll() {
    return 'V2 Users API';
  }
}

// Feature-based grouping
@Controller('admin/users')
export class AdminUsersController {
  @Get()
  findAll() {
    return 'Admin Users Management';
  }
}

@Controller('public/users')
export class PublicUsersController {
  @Get()
  findAll() {
    return 'Public Users Info';
  }
}
```

### Global Prefix

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');
  
  await app.listen(3000);
}
bootstrap();

// Now all routes will be prefixed with /api/v1
// Example: /api/v1/users, /api/v1/products
```

### Nested Routes

```typescript
@Controller('users')
export class UsersController {
  
  // GET /users/:userId/posts
  @Get(':userId/posts')
  getUserPosts(@Param('userId') userId: string) {
    return `Posts for user ${userId}`;
  }

  // GET /users/:userId/posts/:postId
  @Get(':userId/posts/:postId')
  getUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string
  ) {
    return `Post ${postId} for user ${userId}`;
  }

  // POST /users/:userId/posts
  @Post(':userId/posts')
  createUserPost(
    @Param('userId') userId: string,
    @Body() createPostDto: any
  ) {
    return `Creating post for user ${userId}`;
  }

  // GET /users/:userId/posts/:postId/comments
  @Get(':userId/posts/:postId/comments')
  getPostComments(
    @Param('userId') userId: string,
    @Param('postId') postId: string
  ) {
    return `Comments for post ${postId} of user ${userId}`;
  }
}
```

### Route Modules Organization

```typescript
// users/users.module.ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

// posts/posts.module.ts
@Module({
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

// admin/admin.module.ts
@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

// app.module.ts
@Module({
  imports: [
    UsersModule,
    PostsModule,
    AdminModule,
  ],
})
export class AppModule {}
```

Bu kapsamlı rehber, NestJS'te controllers ve routing sisteminin tüm yönlerini detaylı bir şekilde ele almaktadır. Sonraki derslerde middleware, guards, interceptors gibi daha ileri seviye konuları inceleyeceğiz.