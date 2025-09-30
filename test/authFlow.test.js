const mongoose = require("mongoose");
const User = require("../models/User");
const {
  handler: registerHandler,
} = require("../netlify/functions/auth-register");
const { handler: loginHandler } = require("../netlify/functions/auth-login");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Patch env before requiring db helper inside functions
let mongoServer;

describe("Auth flow (register -> login)", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = "testsecret";
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test("register then login", async () => {
    const registerEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        username: "tester",
        email: "tester@example.com",
        password: "password123",
      }),
    };

    const regRes = await registerHandler(registerEvent);
    expect(regRes.statusCode).toBe(201);
    const regBody = JSON.parse(regRes.body);
    expect(regBody.user.username).toBe("tester");
    expect(regBody.token).toBeTruthy();
    // Email doğrulama kaldırıldı; direkt login edilebilir.

    const loginEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        identifier: "tester",
        password: "password123",
      }),
    };

    const loginRes = await loginHandler(loginEvent);
    expect(loginRes.statusCode).toBe(200);
    const loginBody = JSON.parse(loginRes.body);
    expect(loginBody.user.email).toBe("tester@example.com");
    expect(loginBody.token).toBeTruthy();

    const userCount = await User.countDocuments();
    expect(userCount).toBe(1);
  }, 20000);
});
