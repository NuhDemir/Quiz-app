const {
  signToken,
  verifyToken,
  sanitizeUser,
  createHttpError,
} = require("../netlify/functions/auth-helpers");

describe("auth-helpers", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = "testsecret";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("sanitizeUser strips sensitive fields", () => {
    const user = {
      _id: "507f191e810c19729de860ea",
      username: "alice",
      email: "alice@example.com",
      passwordHash: "xxx",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { theme: "dark" },
      role: "user",
    };
    const sanitized = sanitizeUser(user);
    expect(sanitized).toEqual({
      id: user._id,
      username: "alice",
      email: "alice@example.com",
      role: "user",
      settings: { theme: "dark" },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    expect(sanitized.passwordHash).toBeUndefined();
  });

  test("signToken & verifyToken roundtrip", () => {
    const token = signToken({
      _id: "507f191e810c19729de860ea",
      username: "bob",
      email: "bob@example.com",
    });
    const decoded = verifyToken(token);
    expect(decoded.username).toBe("bob");
    expect(decoded.email).toBe("bob@example.com");
  });

  test("createHttpError sets status", () => {
    const err = createHttpError(418, "I am a teapot");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I am a teapot");
  });
});
