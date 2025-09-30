const connectDB = require("../netlify/functions/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const crypto = require("crypto");

const { handler: register } = require("../netlify/functions/auth-register");
const {
  handler: verifyEmail,
} = require("../netlify/functions/auth-verify-email");
const { handler: login } = require("../netlify/functions/auth-login");
const {
  handler: resetRequest,
} = require("../netlify/functions/auth-password-reset-request");
const {
  handler: resetPerform,
} = require("../netlify/functions/auth-password-reset");

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

describe("Password Reset Flow", () => {
  test("happy path: request -> reset -> login with new password", async () => {
    const email = "resetuser@example.com";
    const username = "resetuser";

    // Register
    const regRes = await register(
      buildEvent({ username, email, password: "OldPass123!" })
    );
    const regBody = JSON.parse(regRes.body);
    const verificationToken = regBody.emailVerificationToken;

    // Verify email
    const verifyRes = await verifyEmail(
      buildEvent({ token: verificationToken })
    );
    expect(verifyRes.statusCode).toBe(200);

    // Request reset
    const reqRes = await resetRequest(buildEvent({ email }));
    expect(reqRes.statusCode).toBe(200);
    const reqBody = JSON.parse(reqRes.body);
    const devResetToken = reqBody.devResetToken; // available in dev
    expect(devResetToken).toBeTruthy();

    // Perform reset
    const newPassword = "NewPass456!";
    const performRes = await resetPerform(
      buildEvent({ token: devResetToken, password: newPassword })
    );
    expect(performRes.statusCode).toBe(200);

    // Old password should fail
    const oldLogin = await login(
      buildEvent({ identifier: email, password: "OldPass123!" })
    );
    expect(oldLogin.statusCode).toBe(401);

    // New password works
    const newLogin = await login(
      buildEvent({ identifier: email, password: newPassword })
    );
    expect(newLogin.statusCode).toBe(200);
  });

  test("invalid token should fail", async () => {
    const res = await resetPerform(
      buildEvent({ token: "invalidtoken", password: "SomePass123!" })
    );
    expect(res.statusCode).toBe(400);
  });

  test("unknown email should still return generic response", async () => {
    const res = await resetRequest(
      buildEvent({ email: "nope-not-exist@example.com" })
    );
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).not.toHaveProperty("error");
  });
});
