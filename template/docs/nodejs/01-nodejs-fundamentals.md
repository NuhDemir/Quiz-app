# Node.js Fundamentals

## İçindekiler
1. [Node.js Nedir?](#nodejs-nedir)
2. [Event Loop ve Non-blocking I/O](#event-loop-ve-non-blocking-io)
3. [Modules ve CommonJS](#modules-ve-commonjs)
4. [NPM ve Package Management](#npm-ve-package-management)
5. [File System Operations](#file-system-operations)
6. [Streams ve Buffers](#streams-ve-buffers)
7. [HTTP Server ve Client](#http-server-ve-client)
8. [Error Handling](#error-handling)
9. [Environment Variables](#environment-variables)
10. [Performance ve Optimization](#performance-ve-optimization)

## Node.js Nedir?

Node.js, Chrome'un V8 JavaScript engine'i üzerine inşa edilmiş bir JavaScript runtime environment'ıdır. Server-side JavaScript geliştirme imkanı sunar ve event-driven, non-blocking I/O model kullanır.

### Temel Özellikler

```javascript
// Node.js'in temel özellikleri
const fs = require('fs');
const http = require('http');
const path = require('path');

// 1. Non-blocking I/O
console.log('Start');

fs.readFile('large-file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  console.log('File read complete');
});

console.log('End'); // Bu önce çalışır

// 2. Event-driven architecture
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

myEmitter.on('event', (data) => {
  console.log('Event received:', data);
});

myEmitter.emit('event', 'Hello World');

// 3. Single-threaded event loop
setImmediate(() => console.log('setImmediate'));
process.nextTick(() => console.log('nextTick'));
setTimeout(() => console.log('setTimeout'), 0);
console.log('Synchronous');

// Output order:
// Synchronous
// nextTick
// setImmediate
// setTimeout
```

### Node.js Architecture

```javascript
// Node.js mimarisi ve bileşenleri
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  
  // CPU core sayısı kadar worker oluştur
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Yeni worker başlat
  });
  
} else {
  // Worker process
  const http = require('http');
  
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from worker ${process.pid}\n`);
  });
  
  server.listen(3000);
  console.log(`Worker ${process.pid} started`);
}
```

## Event Loop ve Non-blocking I/O

Event Loop, Node.js'in kalbidir ve asynchronous operations'ları handle eder.

### Event Loop Phases

```javascript
// Event Loop'un farklı phase'leri
const fs = require('fs');

console.log('=== Event Loop Demo ===');

// 1. Timer phase
setTimeout(() => console.log('Timer 1'), 0);
setTimeout(() => console.log('Timer 2'), 0);

// 2. I/O callbacks phase
fs.readFile(__filename, () => {
  console.log('File read callback');
  
  // 3. Poll phase içinde
  setTimeout(() => console.log('Timer in I/O'), 0);
  setImmediate(() => console.log('Immediate in I/O'));
});

// 4. Check phase
setImmediate(() => console.log('Immediate 1'));
setImmediate(() => console.log('Immediate 2'));

// 5. Close callbacks phase
const server = require('http').createServer();
server.on('close', () => console.log('Server closed'));
server.close();

// 6. nextTick ve Promise (microtasks)
process.nextTick(() => console.log('NextTick 1'));
Promise.resolve().then(() => console.log('Promise 1'));
process.nextTick(() => console.log('NextTick 2'));
Promise.resolve().then(() => console.log('Promise 2'));

console.log('Synchronous end');
```

### Asynchronous Patterns

```javascript
// Callback pattern
function readFileCallback(filename, callback) {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      return callback(err);
    }
    callback(null, data);
  });
}

// Promise pattern
function readFilePromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// Async/await pattern
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

async function readFileAsyncAwait(filename) {
  try {
    const data = await readFileAsync(filename, 'utf8');
    return data;
  } catch (error) {
    throw error;
  }
}

// Usage examples
async function demonstratePatterns() {
  const filename = 'example.txt';
  
  // Callback
  readFileCallback(filename, (err, data) => {
    if (err) {
      console.error('Callback error:', err);
    } else {
      console.log('Callback success:', data.length);
    }
  });
  
  // Promise
  readFilePromise(filename)
    .then(data => console.log('Promise success:', data.length))
    .catch(err => console.error('Promise error:', err));
  
  // Async/await
  try {
    const data = await readFileAsyncAwait(filename);
    console.log('Async/await success:', data.length);
  } catch (error) {
    console.error('Async/await error:', error);
  }
}
```

### Event Emitters

```javascript
const EventEmitter = require('events');

class DatabaseConnection extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }
  
  connect() {
    console.log('Attempting to connect to database...');
    
    // Simulate connection attempt
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate
      
      if (success) {
        this.connected = true;
        this.emit('connected');
      } else {
        this.retryCount++;
        this.emit('error', new Error('Connection failed'));
        
        if (this.retryCount < this.maxRetries) {
          this.emit('retry', this.retryCount);
          setTimeout(() => this.connect(), 1000);
        } else {
          this.emit('maxRetriesReached');
        }
      }
    }, 1000);
  }
  
  disconnect() {
    if (this.connected) {
      this.connected = false;
      this.emit('disconnected');
    }
  }
  
  query(sql) {
    if (!this.connected) {
      this.emit('error', new Error('Not connected to database'));
      return;
    }
    
    // Simulate query
    setTimeout(() => {
      this.emit('queryResult', { sql, results: [] });
    }, 100);
  }
}

// Usage
const db = new DatabaseConnection();

db.on('connected', () => {
  console.log('✅ Database connected successfully');
  db.query('SELECT * FROM users');
});

db.on('disconnected', () => {
  console.log('❌ Database disconnected');
});

db.on('error', (error) => {
  console.error('🚨 Database error:', error.message);
});

db.on('retry', (attempt) => {
  console.log(`🔄 Retrying connection (attempt ${attempt})`);
});

db.on('maxRetriesReached', () => {
  console.log('💀 Max retries reached, giving up');
});

db.on('queryResult', (result) => {
  console.log('📊 Query result:', result);
});

db.connect();
```

## Modules ve CommonJS

Node.js, CommonJS module system kullanır ve ES6 modules'ı da destekler.

### CommonJS Modules

```javascript
// math.js - Module export
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

// Export methods
module.exports = {
  add,
  subtract,
  multiply,
  divide
};

// Alternative export syntax
// exports.add = add;
// exports.subtract = subtract;

// calculator.js - Module import
const math = require('./math');
const { add, multiply } = require('./math'); // Destructuring

console.log(math.add(5, 3)); // 8
console.log(multiply(4, 2)); // 8

// Built-in modules
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Platform:', os.platform());
console.log('CPU Architecture:', os.arch());
console.log('Total Memory:', os.totalmem());
```

### ES6 Modules

```javascript
// math.mjs - ES6 module export
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export default function multiply(a, b) {
  return a * b;
}

// calculator.mjs - ES6 module import
import multiply, { add, subtract } from './math.mjs';
import * as math from './math.mjs';

console.log(add(5, 3)); // 8
console.log(multiply(4, 2)); // 8
console.log(math.subtract(10, 4)); // 6
```

### Module Caching

```javascript
// counter.js
let count = 0;

function increment() {
  return ++count;
}

function getCount() {
  return count;
}

module.exports = { increment, getCount };

// app.js
const counter1 = require('./counter');
const counter2 = require('./counter');

console.log(counter1.increment()); // 1
console.log(counter2.increment()); // 2 (same instance)
console.log(counter1.getCount()); // 2

// Modules are cached!
console.log(counter1 === counter2); // true

// To get fresh instance, delete from cache
delete require.cache[require.resolve('./counter')];
const counter3 = require('./counter');
console.log(counter3.getCount()); // 0 (fresh instance)
```

## NPM ve Package Management

NPM (Node Package Manager), Node.js'in default package manager'ıdır.

### Package.json Configuration

```json
{
  "name": "my-node-app",
  "version": "1.0.0",
  "description": "A sample Node.js application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "build": "webpack --mode production",
    "lint": "eslint src/**/*.js",
    "lint:fix": "eslint src/**/*.js --fix"
  },
  "keywords": ["node", "javascript", "api"],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0",
    "webpack": "^5.75.0"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### NPM Commands

```bash
# Package installation
npm install express                 # Install and add to dependencies
npm install --save-dev jest        # Install as dev dependency
npm install -g nodemon             # Global installation
npm install express@4.17.1         # Specific version

# Package management
npm list                           # List installed packages
npm list --depth=0                 # Top-level packages only
npm outdated                       # Check for outdated packages
npm update                         # Update packages
npm audit                          # Security audit
npm audit fix                      # Fix security issues

# Scripts
npm run dev                        # Run dev script
npm start                          # Run start script
npm test                           # Run test script

# Package information
npm info express                   # Package information
npm search express                 # Search packages
npm view express versions --json   # Available versions
```

### Creating and Publishing Packages

```javascript
// my-utility/index.js
class StringUtils {
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  static slugify(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  static truncate(str, maxLength) {
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  }
}

class ArrayUtils {
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  static unique(array) {
    return [...new Set(array)];
  }
  
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}

module.exports = {
  StringUtils,
  ArrayUtils
};

// my-utility/package.json
{
  "name": "my-awesome-utils",
  "version": "1.0.0",
  "description": "Utility functions for strings and arrays",
  "main": "index.js",
  "files": ["index.js", "README.md"],
  "repository": {
    "type": "git",
    "url": "https://github.com/username/my-awesome-utils.git"
  },
  "keywords": ["utils", "string", "array", "utility"],
  "author": "Your Name",
  "license": "MIT"
}
```

## File System Operations

Node.js, file system operations için comprehensive API sağlar.

### Basic File Operations

```javascript
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify fs methods
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class FileManager {
  constructor(basePath = './') {
    this.basePath = basePath;
  }
  
  async readFile(filename) {
    try {
      const filePath = path.join(this.basePath, filename);
      const data = await readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      throw new Error(`Failed to read file ${filename}: ${error.message}`);
    }
  }
  
  async writeFile(filename, data) {
    try {
      const filePath = path.join(this.basePath, filename);
      await writeFile(filePath, data, 'utf8');
      return true;
    } catch (error) {
      throw new Error(`Failed to write file ${filename}: ${error.message}`);
    }
  }
  
  async createDirectory(dirName) {
    try {
      const dirPath = path.join(this.basePath, dirName);
      await mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      throw new Error(`Failed to create directory ${dirName}: ${error.message}`);
    }
  }
  
  async listFiles(directory = './') {
    try {
      const dirPath = path.join(this.basePath, directory);
      const files = await readdir(dirPath);
      
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stats = await stat(filePath);
          
          return {
            name: file,
            path: filePath,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );
      
      return fileDetails;
    } catch (error) {
      throw new Error(`Failed to list files in ${directory}: ${error.message}`);
    }
  }
  
  async copyFile(source, destination) {
    try {
      const sourcePath = path.join(this.basePath, source);
      const destPath = path.join(this.basePath, destination);
      
      const data = await readFile(sourcePath);
      await writeFile(destPath, data);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }
  
  async deleteFile(filename) {
    try {
      const filePath = path.join(this.basePath, filename);
      await promisify(fs.unlink)(filePath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete file ${filename}: ${error.message}`);
    }
  }
  
  async fileExists(filename) {
    try {
      const filePath = path.join(this.basePath, filename);
      await stat(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Usage
async function demonstrateFileOperations() {
  const fileManager = new FileManager('./data');
  
  try {
    // Create directory
    await fileManager.createDirectory('logs');
    
    // Write file
    const logData = `Log entry: ${new Date().toISOString()}\n`;
    await fileManager.writeFile('logs/app.log', logData);
    
    // Read file
    const content = await fileManager.readFile('logs/app.log');
    console.log('File content:', content);
    
    // List files
    const files = await fileManager.listFiles('logs');
    console.log('Files in logs directory:', files);
    
    // Check if file exists
    const exists = await fileManager.fileExists('logs/app.log');
    console.log('File exists:', exists);
    
  } catch (error) {
    console.error('File operation error:', error.message);
  }
}
```

### File Watching

```javascript
const fs = require('fs');
const path = require('path');

class FileWatcher {
  constructor() {
    this.watchers = new Map();
  }
  
  watchFile(filename, callback) {
    const watcher = fs.watchFile(filename, (curr, prev) => {
      callback({
        filename,
        current: curr,
        previous: prev,
        changed: curr.mtime !== prev.mtime
      });
    });
    
    this.watchers.set(filename, watcher);
    return watcher;
  }
  
  watchDirectory(directory, callback) {
    const watcher = fs.watch(directory, (eventType, filename) => {
      callback({
        eventType, // 'rename' or 'change'
        filename,
        directory,
        fullPath: path.join(directory, filename)
      });
    });
    
    this.watchers.set(directory, watcher);
    return watcher;
  }
  
  stopWatching(path) {
    const watcher = this.watchers.get(path);
    if (watcher) {
      if (typeof watcher.close === 'function') {
        watcher.close();
      } else {
        fs.unwatchFile(path);
      }
      this.watchers.delete(path);
    }
  }
  
  stopAll() {
    for (const [path, watcher] of this.watchers) {
      this.stopWatching(path);
    }
  }
}

// Usage
const watcher = new FileWatcher();

// Watch a specific file
watcher.watchFile('./config.json', (event) => {
  if (event.changed) {
    console.log(`Config file changed: ${event.filename}`);
    // Reload configuration
  }
});

// Watch a directory
watcher.watchDirectory('./logs', (event) => {
  console.log(`Directory event: ${event.eventType} - ${event.filename}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  watcher.stopAll();
  process.exit(0);
});
```

Bu kapsamlı rehber, Node.js'in temel özelliklerini ve pratik kullanım örneklerini detaylı bir şekilde ele almaktadır. Node.js'in asynchronous nature'ı, module system'i ve file operations'ları modern backend development için kritik konulardır.