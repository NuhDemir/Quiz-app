// moved from tests/socialAuthReal.test.js
const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDB = require("../netlify/functions/db");
const User = require("../models/User");
const https = require("https");

const { handler: social } = require("../netlify/functions/auth-social-clerk");

const buildEvent = (bodyObj) => ({
  httpMethod: "POST",
  body: JSON.stringify(bodyObj),
});

function generateKeyPair() {
  return crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
}
function base64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
function signJwt(privateKey, header, payload) {
  const h = base64Url(Buffer.from(JSON.stringify(header)));
  const p = base64Url(Buffer.from(JSON.stringify(payload)));
  const d = h + "." + p;
  const s = crypto.createSign("RSA-SHA256");
  s.update(d);
  s.end();
  return d + "." + base64Url(s.sign(privateKey));
}
function mockHttpsGetOnce(responseObj) {
  const original = https.get;
  https.get = (url, cb) => {
    const events = {};
    const res = {
      on: (ev, handler) => {
        events[ev] = handler;
        if (ev === "data")
          process.nextTick(() => handler(JSON.stringify(responseObj)));
        if (ev === "end")
          process.nextTick(() => events["end"] && events["end"]());
      },
    };
    process.nextTick(() => cb(res));
    return { on: () => {} };
  };
  return () => (https.get = original);
}

describe("Social Auth Real (JWKS)", () => {
  let restore;
  let publicKey;
  let privateKey;
  let kid;
  const issuer = "https://clerk.example.com";
  beforeAll(async () => {
    await connectDB();
    ({ publicKey, privateKey } = generateKeyPair());
    kid = "test-key-1";
    process.env.CLERK_SECRET_KEY = "dummy";
    process.env.CLERK_PUBLISHABLE_KEY = "dummy_pub";
    process.env.CLERK_ISSUER = issuer;
  });
  afterAll(async () => {
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_ISSUER;
    await mongoose.connection.close();
  });
  test("verifies token and creates user", async () => {
    const jwk = publicKey.export({ format: "jwk" });
    jwk.use = "sig";
    jwk.alg = "RS256";
    jwk.kid = kid;
    restore = mockHttpsGetOnce({ keys: [jwk] });
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: "clerk-real-123",
      email: "realclerk@example.com",
      iss: issuer,
      exp: now + 60,
    };
    const header = { alg: "RS256", typ: "JWT", kid };
    const token = signJwt(privateKey, header, payload);
    const res = await social(buildEvent({ clerkToken: token }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.mode).toBe("clerk-real");
    expect(body.user.email).toBe("realclerk@example.com");
    const user = await User.findOne({ clerkUserId: "clerk-real-123" });
    expect(user).toBeTruthy();
    restore();
  });
});
