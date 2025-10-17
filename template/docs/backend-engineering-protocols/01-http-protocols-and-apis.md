# HTTP Protocols ve APIs

## İçindekiler
1. [HTTP Protocol Temelleri](#http-protocol-temelleri)
2. [HTTP Methods ve Status Codes](#http-methods-ve-status-codes)
3. [RESTful API Design](#restful-api-design)
4. [HTTP Headers ve Authentication](#http-headers-ve-authentication)
5. [Content Negotiation](#content-negotiation)
6. [Caching Strategies](#caching-strategies)
7. [CORS ve Security](#cors-ve-security)
8. [HTTP/2 ve HTTP/3](#http2-ve-http3)
9. [API Versioning](#api-versioning)
10. [Best Practices](#best-practices)

## HTTP Protocol Temelleri

HTTP (HyperText Transfer Protocol), web'in temelini oluşturan application layer protocol'üdür. Client-server architecture üzerine kurulu, stateless bir protokoldür.

### HTTP Request/Response Cycle

```typescript
// HTTP Request yapısı
interface HttpRequest {
  method: string;           // GET, POST, PUT, DELETE, etc.
  url: string;             // /api/users/123
  version: string;         // HTTP/1.1, HTTP/2
  headers: Record<string, string>;
  body?: any;
}

// HTTP Response yapısı
interface HttpResponse {
  statusCode: number;      // 200, 404, 500, etc.
  statusMessage: string;   // OK, Not Found, Internal Server Error
  headers: Record<string, string>;
  body?: any;
}

// Node.js ile HTTP Server
import http from 'http';
import url from 'url';

class HttpServer {
  private server: http.Server;
  private routes: Map<string, Map<string, Function>> = new Map();

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const parsedUrl = url.parse(req.url || '', true);
    const path = parsedUrl.pathname || '/';
    const method = req.method || 'GET';

    console.log(`${method} ${path}`);

    // Request headers
    console.log('Headers:', req.headers);

    // Parse request body for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          this.routeRequest(method, path, parsedBody, req, res);
        } catch (error) {
          this.sendResponse(res, 400, { error: 'Invalid JSON' });
        }
      });
    } else {
      this.routeRequest(method, path, null, req, res);
    }
  }

  private routeRequest(
    method: string, 
    path: string, 
    body: any, 
    req: http.IncomingMessage, 
    res: http.ServerResponse
  ) {
    const methodRoutes = this.routes.get(method);
    const handler = methodRoutes?.get(path);

    if (handler) {
      try {
        handler(req, res, body);
      } catch (error) {
        this.sendResponse(res, 500, { error: 'Internal Server Error' });
      }
    } else {
      this.sendResponse(res, 404, { error: 'Not Found' });
    }
  }

  private sendResponse(res: http.ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
  }

  public addRoute(method: string, path: string, handler: Function) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }

  public listen(port: number, callback?: () => void) {
    this.server.listen(port, callback);
  }
}

// Usage
const server = new HttpServer();

// Add routes
server.addRoute('GET', '/api/health', (req, res) => {
  server.sendResponse(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
});

server.addRoute('GET', '/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  server.sendResponse(res, 200, { users });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## HTTP Methods ve Status Codes

### HTTP Methods (Verbs)

```typescript
// RESTful HTTP Methods
enum HttpMethod {
  GET = 'GET',           // Retrieve data
  POST = 'POST',         // Create new resource
  PUT = 'PUT',           // Update/replace entire resource
  PATCH = 'PATCH',       // Partial update
  DELETE = 'DELETE',     // Remove resource
  HEAD = 'HEAD',         // Get headers only
  OPTIONS = 'OPTIONS'    // Get allowed methods
}

// HTTP Methods implementation
class UserController {
  private users: User[] = [];
  private nextId = 1;

  // GET /api/users - Retrieve all users
  async getUsers(req: Request, res: Response) {
    const { page = 1, limit = 10, search } = req.query;
    
    let filteredUsers = this.users;
    
    if (search) {
      filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(search.toString().toLowerCase()) ||
        user.email.toLowerCase().includes(search.toString().toLowerCase())
      );
    }
    
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.status(200).json({
      users: paginatedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / Number(limit))
      }
    });
  }

  // GET /api/users/:id - Retrieve specific user
  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    const user = this.users.find(u => u.id === Number(id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ user });
  }

  // POST /api/users - Create new user
  async createUser(req: Request, res: Response) {
    const { name, email, age } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }
    
    // Check if email already exists
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }
    
    const newUser: User = {
      id: this.nextId++,
      name,
      email,
      age,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(newUser);
    
    res.status(201).json({ 
      user: newUser,
      message: 'User created successfully'
    });
  }

  // PUT /api/users/:id - Update entire user
  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { name, email, age } = req.body;
    
    const userIndex = this.users.findIndex(u => u.id === Number(id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }
    
    // Check email uniqueness (excluding current user)
    const existingUser = this.users.find(u => 
      u.email === email && u.id !== Number(id)
    );
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already in use by another user' 
      });
    }
    
    // Replace entire user object
    this.users[userIndex] = {
      ...this.users[userIndex],
      name,
      email,
      age,
      updatedAt: new Date()
    };
    
    res.status(200).json({ 
      user: this.users[userIndex],
      message: 'User updated successfully'
    });
  }

  // PATCH /api/users/:id - Partial update
  async patchUser(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;
    
    const userIndex = this.users.findIndex(u => u.id === Number(id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check email uniqueness if email is being updated
    if (updates.email) {
      const existingUser = this.users.find(u => 
        u.email === updates.email && u.id !== Number(id)
      );
      if (existingUser) {
        return res.status(409).json({ 
          error: 'Email already in use by another user' 
        });
      }
    }
    
    // Apply partial updates
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    res.status(200).json({ 
      user: this.users[userIndex],
      message: 'User updated successfully'
    });
  }

  // DELETE /api/users/:id - Remove user
  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    
    const userIndex = this.users.findIndex(u => u.id === Number(id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const deletedUser = this.users.splice(userIndex, 1)[0];
    
    res.status(200).json({ 
      message: 'User deleted successfully',
      deletedUser
    });
  }

  // HEAD /api/users/:id - Check if user exists
  async checkUser(req: Request, res: Response) {
    const { id } = req.params;
    const user = this.users.find(u => u.id === Number(id));
    
    if (user) {
      res.status(200).end();
    } else {
      res.status(404).end();
    }
  }

  // OPTIONS /api/users - Get allowed methods
  async getOptions(req: Request, res: Response) {
    res.set({
      'Allow': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS'
    });
    res.status(200).end();
  }
}
```

### HTTP Status Codes

```typescript
// HTTP Status Code kategorileri ve anlamları
enum HttpStatusCode {
  // 1xx Informational
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,

  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,

  // 3xx Redirection
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,

  // 4xx Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// Status code usage examples
class ApiResponse {
  static success(res: Response, data: any, message?: string) {
    return res.status(HttpStatusCode.OK).json({
      success: true,
      data,
      message: message || 'Request successful'
    });
  }

  static created(res: Response, data: any, message?: string) {
    return res.status(HttpStatusCode.CREATED).json({
      success: true,
      data,
      message: message || 'Resource created successfully'
    });
  }

  static noContent(res: Response) {
    return res.status(HttpStatusCode.NO_CONTENT).end();
  }

  static badRequest(res: Response, message: string, errors?: any) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      success: false,
      error: {
        message,
        errors
      }
    });
  }

  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      success: false,
      error: {
        message
      }
    });
  }

  static forbidden(res: Response, message: string = 'Forbidden') {
    return res.status(HttpStatusCode.FORBIDDEN).json({
      success: false,
      error: {
        message
      }
    });
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return res.status(HttpStatusCode.NOT_FOUND).json({
      success: false,
      error: {
        message
      }
    });
  }

  static conflict(res: Response, message: string) {
    return res.status(HttpStatusCode.CONFLICT).json({
      success: false,
      error: {
        message
      }
    });
  }

  static tooManyRequests(res: Response, retryAfter?: number) {
    const response = res.status(HttpStatusCode.TOO_MANY_REQUESTS);
    
    if (retryAfter) {
      response.set('Retry-After', retryAfter.toString());
    }
    
    return response.json({
      success: false,
      error: {
        message: 'Too many requests'
      }
    });
  }

  static internalServerError(res: Response, message: string = 'Internal server error') {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message
      }
    });
  }
}
```

## RESTful API Design

### REST Principles

```typescript
// RESTful API design principles
interface RestfulResource {
  // 1. Uniform Interface
  // 2. Stateless
  // 3. Cacheable
  // 4. Client-Server Architecture
  // 5. Layered System
  // 6. Code on Demand (optional)
}

// Resource-based URLs
class RestfulRoutes {
  // ✅ Good RESTful URLs
  static readonly GOOD_URLS = {
    // Collection operations
    'GET /api/users': 'Get all users',
    'POST /api/users': 'Create new user',
    
    // Resource operations
    'GET /api/users/123': 'Get user with ID 123',
    'PUT /api/users/123': 'Update user with ID 123',
    'PATCH /api/users/123': 'Partially update user with ID 123',
    'DELETE /api/users/123': 'Delete user with ID 123',
    
    // Nested resources
    'GET /api/users/123/posts': 'Get posts by user 123',
    'POST /api/users/123/posts': 'Create post for user 123',
    'GET /api/users/123/posts/456': 'Get post 456 by user 123',
    
    // Filtering and pagination
    'GET /api/users?page=1&limit=10': 'Paginated users',
    'GET /api/users?status=active': 'Filter active users',
    'GET /api/users?search=john': 'Search users',
    
    // Sorting
    'GET /api/users?sort=name': 'Sort by name ascending',
    'GET /api/users?sort=-created_at': 'Sort by creation date descending'
  };

  // ❌ Bad non-RESTful URLs
  static readonly BAD_URLS = {
    'GET /api/getUsers': 'Should be GET /api/users',
    'POST /api/createUser': 'Should be POST /api/users',
    'POST /api/updateUser/123': 'Should be PUT/PATCH /api/users/123',
    'GET /api/deleteUser/123': 'Should be DELETE /api/users/123',
    'GET /api/users/search?name=john': 'Should be GET /api/users?search=john'
  };
}

// RESTful API implementation
class BlogAPI {
  private posts: Post[] = [];
  private comments: Comment[] = [];

  // Posts collection
  async getPosts(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      author, 
      tag,
      sort = '-created_at'
    } = req.query;

    let filteredPosts = [...this.posts];

    // Apply filters
    if (status) {
      filteredPosts = filteredPosts.filter(post => post.status === status);
    }
    
    if (author) {
      filteredPosts = filteredPosts.filter(post => 
        post.author.toLowerCase().includes(author.toString().toLowerCase())
      );
    }
    
    if (tag) {
      filteredPosts = filteredPosts.filter(post => 
        post.tags.includes(tag.toString())
      );
    }

    // Apply sorting
    const [sortField, sortDirection] = sort.toString().startsWith('-') 
      ? [sort.toString().slice(1), 'desc']
      : [sort.toString(), 'asc'];

    filteredPosts.sort((a, b) => {
      const aVal = a[sortField as keyof Post];
      const bVal = b[sortField as keyof Post];
      
      if (sortDirection === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    res.status(200).json({
      posts: paginatedPosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / Number(limit))
      },
      filters: { status, author, tag, sort }
    });
  }

  async createPost(req: Request, res: Response) {
    const { title, content, author, tags = [], status = 'draft' } = req.body;

    // Validation
    if (!title || !content || !author) {
      return ApiResponse.badRequest(res, 'Title, content, and author are required');
    }

    const newPost: Post = {
      id: Date.now(),
      title,
      content,
      author,
      tags,
      status,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.posts.push(newPost);

    // Return created resource with Location header
    res.set('Location', `/api/posts/${newPost.id}`);
    return ApiResponse.created(res, newPost);
  }

  async getPost(req: Request, res: Response) {
    const { id } = req.params;
    const post = this.posts.find(p => p.id === Number(id));

    if (!post) {
      return ApiResponse.notFound(res, 'Post not found');
    }

    return ApiResponse.success(res, post);
  }

  async updatePost(req: Request, res: Response) {
    const { id } = req.params;
    const updates = req.body;

    const postIndex = this.posts.findIndex(p => p.id === Number(id));
    if (postIndex === -1) {
      return ApiResponse.notFound(res, 'Post not found');
    }

    // Apply updates
    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updates,
      updated_at: new Date()
    };

    return ApiResponse.success(res, this.posts[postIndex]);
  }

  async deletePost(req: Request, res: Response) {
    const { id } = req.params;

    const postIndex = this.posts.findIndex(p => p.id === Number(id));
    if (postIndex === -1) {
      return ApiResponse.notFound(res, 'Post not found');
    }

    this.posts.splice(postIndex, 1);
    return ApiResponse.noContent(res);
  }

  // Nested resource: Post comments
  async getPostComments(req: Request, res: Response) {
    const { postId } = req.params;
    
    const post = this.posts.find(p => p.id === Number(postId));
    if (!post) {
      return ApiResponse.notFound(res, 'Post not found');
    }

    const comments = this.comments.filter(c => c.postId === Number(postId));
    return ApiResponse.success(res, comments);
  }

  async createPostComment(req: Request, res: Response) {
    const { postId } = req.params;
    const { content, author } = req.body;

    const post = this.posts.find(p => p.id === Number(postId));
    if (!post) {
      return ApiResponse.notFound(res, 'Post not found');
    }

    if (!content || !author) {
      return ApiResponse.badRequest(res, 'Content and author are required');
    }

    const newComment: Comment = {
      id: Date.now(),
      postId: Number(postId),
      content,
      author,
      created_at: new Date()
    };

    this.comments.push(newComment);

    res.set('Location', `/api/posts/${postId}/comments/${newComment.id}`);
    return ApiResponse.created(res, newComment);
  }
}
```

### HATEOAS (Hypermedia as the Engine of Application State)

```typescript
// HATEOAS implementation
interface HATEOASLink {
  rel: string;
  href: string;
  method: string;
  type?: string;
}

interface HATEOASResource {
  _links: HATEOASLink[];
}

class HATEOASResponse {
  static addLinks<T>(resource: T, links: HATEOASLink[]): T & HATEOASResource {
    return {
      ...resource,
      _links: links
    };
  }

  static createUserLinks(userId: number, baseUrl: string): HATEOASLink[] {
    return [
      {
        rel: 'self',
        href: `${baseUrl}/api/users/${userId}`,
        method: 'GET'
      },
      {
        rel: 'update',
        href: `${baseUrl}/api/users/${userId}`,
        method: 'PUT',
        type: 'application/json'
      },
      {
        rel: 'delete',
        href: `${baseUrl}/api/users/${userId}`,
        method: 'DELETE'
      },
      {
        rel: 'posts',
        href: `${baseUrl}/api/users/${userId}/posts`,
        method: 'GET'
      },
      {
        rel: 'collection',
        href: `${baseUrl}/api/users`,
        method: 'GET'
      }
    ];
  }

  static createPostLinks(postId: number, baseUrl: string): HATEOASLink[] {
    return [
      {
        rel: 'self',
        href: `${baseUrl}/api/posts/${postId}`,
        method: 'GET'
      },
      {
        rel: 'update',
        href: `${baseUrl}/api/posts/${postId}`,
        method: 'PUT',
        type: 'application/json'
      },
      {
        rel: 'delete',
        href: `${baseUrl}/api/posts/${postId}`,
        method: 'DELETE'
      },
      {
        rel: 'comments',
        href: `${baseUrl}/api/posts/${postId}/comments`,
        method: 'GET'
      },
      {
        rel: 'add-comment',
        href: `${baseUrl}/api/posts/${postId}/comments`,
        method: 'POST',
        type: 'application/json'
      }
    ];
  }
}

// Usage in controller
class UserController {
  async getUser(req: Request, res: Response) {
    const { id } = req.params;
    const user = await this.userService.findById(Number(id));

    if (!user) {
      return ApiResponse.notFound(res, 'User not found');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const userWithLinks = HATEOASResponse.addLinks(
      user,
      HATEOASResponse.createUserLinks(user.id, baseUrl)
    );

    return ApiResponse.success(res, userWithLinks);
  }
}
```

Bu kapsamlı rehber, HTTP protocols ve API design'ın temellerini, RESTful principles'ları ve best practices'leri detaylı bir şekilde ele almaktadır. Modern web development için kritik olan bu konular, scalable ve maintainable API'lar oluşturmak için gereklidir.