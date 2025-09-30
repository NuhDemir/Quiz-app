// Social auth via Clerk token exchange
// POST /.netlify/functions/auth-social-clerk { clerkToken }
// In production you would verify the Clerk session/token via Clerk backend API.
// For this implementation we mock verification unless CLERK_PUBLISHABLE_KEY & CLERK_SECRET_KEY integration is later added.

const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  sanitizeUser,
  signToken,
  handleError,
  hashPassword,
} = require("./auth-helpers");
const crypto = require("crypto");
const { verifyClerkToken } = require("./clerk-verify");

// Simple mock decode: expecting clerkToken format: mock::<clerkUserId>::<email>::<username>
function parseMockToken(token) {
  if (!token.startsWith("mock::")) return null;
  const parts = token.split("::");
  if (parts.length < 4) return null;
  return { clerkUserId: parts[1], email: parts[2], username: parts[3] };
}

async function verifyClerkReal(token) {
  const payload = await verifyClerkToken(token);
  // Clerk payload may include email fields differently; attempt several keys
  const email =
    payload.email ||
    payload.email_address ||
    payload.emails?.[0] ||
    payload.primary_email_address_id;
  if (!email) throw createHttpError(400, "Email not present in Clerk token");
  return {
    clerkUserId: payload.sub,
    email,
    username: payload.username || payload.sub,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const body = parseBody(event.body);
    const clerkToken = body.clerkToken?.trim();
    if (!clerkToken) throw createHttpError(400, "clerkToken is required");

    const hasRealKeys =
      process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY;
    let payload;
    if (hasRealKeys) {
      // Attempt real verify (not yet implemented)
      payload = await verifyClerkReal(clerkToken);
    } else {
      payload = parseMockToken(clerkToken);
    }
    if (!payload)
      throw createHttpError(401, "Invalid social token (mock mode)");

    const email = payload.email.toLowerCase();

    // Try existing by clerkUserId first
    let user = await User.findOne({ clerkUserId: payload.clerkUserId });

    if (!user) {
      // Optionally link existing email-based account
      user = await User.findOne({ email });
      if (user) {
        // Attach clerk id
        user.clerkUserId = payload.clerkUserId;
        user.emailVerified = true; // Social providers generally verified
        if (!user.passwordHash) {
          user.passwordHash = await hashPassword(
            crypto.randomBytes(12).toString("hex")
          );
        }
        await user.save();
      } else {
        // Ensure unique username fallback
        let baseUsername = payload.username?.trim() || email.split("@")[0];
        let candidate = baseUsername;
        let counter = 1;
        while (await User.findOne({ username: candidate })) {
          candidate = baseUsername + "_" + counter++;
        }
        user = await User.create({
          username: candidate,
          email,
          passwordHash: await hashPassword(
            crypto.randomBytes(12).toString("hex")
          ),
          emailVerified: true,
          clerkUserId: payload.clerkUserId,
        });
      }
    }

    const token = signToken(user, { expiresIn: "30d" });
    return respond(200, {
      message: "Social auth success",
      user: sanitizeUser(user),
      token,
      mode: hasRealKeys ? "clerk-real" : "mock",
    });
  } catch (error) {
    return handleError(error, "auth-social-clerk");
  }
};
