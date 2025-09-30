const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const {
  handler: registerHandler,
} = require("../netlify/functions/auth-register");
const {
  handler: verifyHandler,
} = require("../netlify/functions/auth-verify-email");
const { handler: loginHandler } = require("../netlify/functions/auth-login");

function buildEvent(body) {
  return { httpMethod: "POST", body: JSON.stringify(body) };
}

describe("email verification flow", () => {
  let mongoServer;
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = "testsecret";
    await mongoose.connect(process.env.MONGODB_URI);
  });
  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });
  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  test("unverified login blocked until email verified", async () => {
    const regRes = await registerHandler(
      buildEvent({
        username: "verifyUser",
        email: "verify@example.com",
        password: "password123",
      })
    );
    expect(regRes.statusCode).toBe(201);
    const regBody = JSON.parse(regRes.body);
    expect(regBody.emailVerificationToken).toBeTruthy();

    // attempt login before verify
    const loginAttempt = await loginHandler(
      buildEvent({ identifier: "verifyUser", password: "password123" })
    );
    expect(loginAttempt.statusCode).toBe(403);

    // verify
    const verifyRes = await verifyHandler(
      buildEvent({ token: regBody.emailVerificationToken })
    );
    expect(verifyRes.statusCode).toBe(200);

    // login after verify
    const loginAfter = await loginHandler(
      buildEvent({ identifier: "verifyUser", password: "password123" })
    );
    expect(loginAfter.statusCode).toBe(200);
    const loginBody = JSON.parse(loginAfter.body);
    expect(loginBody.user.emailVerified).toBe(true);
  }, 20000);
});
