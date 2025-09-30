// moved from tests/socialAuth.test.js
const mongoose = require("mongoose");
const connectDB = require("../netlify/functions/db");
const User = require("../models/User");

const { handler: social } = require("../netlify/functions/auth-social-clerk");

const buildEvent = (bodyObj) => ({
  httpMethod: "POST",
  body: JSON.stringify(bodyObj),
});

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Social Auth (Clerk Mock)", () => {
  test("first-time social login creates user", async () => {
    const token = "mock::clerk123::socialuser@example.com::socialuser";
    const res = await social(buildEvent({ clerkToken: token }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe("socialuser@example.com");
    expect(body.user.emailVerified).toBe(true);
    const dbUser = await User.findOne({ clerkUserId: "clerk123" });
    expect(dbUser).toBeTruthy();
  });

  test("second social login returns same user (idempotent)", async () => {
    const token = "mock::clerk123::socialuser@example.com::socialuser";
    const res = await social(buildEvent({ clerkToken: token }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const res2 = await social(buildEvent({ clerkToken: token }));
    const body2 = JSON.parse(res2.body);
    expect(body.user.id).toBe(body2.user.id);
  });

  test("invalid token rejected", async () => {
    const res = await social(buildEvent({ clerkToken: "notvalidformat" }));
    expect(res.statusCode).toBe(401);
  });
});
