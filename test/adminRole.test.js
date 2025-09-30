const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../models/User");
const {
  handler: registerHandler,
} = require("../netlify/functions/auth-register");
const {
  handler: roleSetHandler,
} = require("../netlify/functions/admin-user-role-set");

function buildEvent(bodyObj, token) {
  return {
    httpMethod: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(bodyObj || {}),
  };
}

const { signToken } = require("../netlify/functions/auth-helpers");

describe("admin-user-role-set", () => {
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

  test("first user is admin, can promote second user to admin", async () => {
    // register first user -> becomes admin automatically
    await registerHandler({
      httpMethod: "POST",
      body: JSON.stringify({
        username: "user1",
        email: "u1@example.com",
        password: "password123",
      }),
    });
    const adminUser = await User.findOne({ username: "user1" });
    expect(adminUser.role).toBe("admin");

    // register second user -> normal user
    await registerHandler({
      httpMethod: "POST",
      body: JSON.stringify({
        username: "user2",
        email: "u2@example.com",
        password: "password123",
      }),
    });
    const user2 = await User.findOne({ username: "user2" });
    expect(user2.role).toBe("user");

    // admin promotes second user
    const adminToken = signToken(adminUser);
    const promoteEvent = buildEvent(
      { userId: user2._id.toString(), role: "admin" },
      adminToken
    );
    const promoteRes = await roleSetHandler(promoteEvent);
    expect(promoteRes.statusCode).toBe(200);
    const promoteBody = JSON.parse(promoteRes.body);
    expect(promoteBody.updated).toBe(true);
    const updatedUser2 = await User.findById(user2._id);
    expect(updatedUser2.role).toBe("admin");
  }, 20000);

  test("cannot demote last remaining admin", async () => {
    await registerHandler({
      httpMethod: "POST",
      body: JSON.stringify({
        username: "adminUser",
        email: "admin@example.com",
        password: "password123",
      }),
    });
    const adminUser = await User.findOne({ username: "adminUser" });
    const adminToken = signToken(adminUser);

    const demoteEvent = buildEvent(
      { userId: adminUser._id.toString(), role: "user" },
      adminToken
    );
    const demoteRes = await roleSetHandler(demoteEvent);
    expect(demoteRes.statusCode).toBe(400);
    const body = JSON.parse(demoteRes.body);
    expect(body.error).toMatch(/Cannot demote/);
  }, 20000);
});
