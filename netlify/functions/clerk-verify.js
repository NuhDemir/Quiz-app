// Clerk JWT verification via JWKS (RS256)
// Minimal implementation to verify a Clerk-issued token when CLERK_SECRET_KEY is provided.
// For production harden: caching headers respect, error monitoring, and fallback refresh logic.

const crypto = require("crypto");
const https = require("https");
const { createHttpError } = require("./auth-helpers");

// In Clerk, issuer often like: https://clerk.your-domain.com or https://api.clerk.com
// JWKS URL pattern can be issuer + '/.well-known/jwks.json'

let jwksCache = { keys: null, fetchedAt: 0 };
const JWKS_TTL_MS = 5 * 60 * 1000; // 5 minutes

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function getJwks() {
  const issuer = process.env.CLERK_ISSUER;
  const explicit = process.env.CLERK_JWKS_URL;
  const jwksUrl =
    explicit ||
    (issuer ? issuer.replace(/\/$/, "") + "/.well-known/jwks.json" : null);
  if (!jwksUrl) throw createHttpError(500, "Clerk JWKS URL not configured");

  if (jwksCache.keys && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const json = await fetchJson(jwksUrl);
  if (!json.keys) throw createHttpError(500, "Invalid JWKS response");
  jwksCache = { keys: json.keys, fetchedAt: Date.now() };
  return jwksCache.keys;
}

function importPublicKey(jwk) {
  // Rely on Node's native JWK import (Node 15+). Falls back with clear error if unsupported.
  try {
    const keyObj = crypto.createPublicKey({ key: jwk, format: "jwk" });
    const pem = keyObj.export({ format: "pem", type: "spki" });
    return pem.toString();
  } catch (e) {
    throw createHttpError(500, "Failed to import JWKS key: " + e.message);
  }
}

function decodeJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw createHttpError(401, "Invalid token structure");
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf8")
  );
  const header = JSON.parse(
    Buffer.from(parts[0], "base64url").toString("utf8")
  );
  return { header, payload, signature: parts[2] };
}

function verifySignature(token, pem, alg) {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(headerB64 + "." + payloadB64);
  verifier.end();
  const sig = Buffer.from(signatureB64, "base64url");
  const ok = verifier.verify(pem, sig);
  if (!ok) throw createHttpError(401, "Invalid signature");
}

async function verifyClerkToken(token) {
  const { header, payload } = decodeJwt(token);
  if (header.alg !== "RS256") throw createHttpError(400, "Unsupported alg");
  const keys = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw createHttpError(401, "Unknown key id");
  const pem = importPublicKey(jwk);
  verifySignature(token, pem, header.alg);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now)
    throw createHttpError(401, "Token expired");
  const issuer = process.env.CLERK_ISSUER?.replace(/\/$/, "");
  if (issuer && payload.iss && payload.iss.replace(/\/$/, "") !== issuer) {
    throw createHttpError(401, "Invalid issuer");
  }
  // aud validation optional here, can add if required
  return payload; // contains sub (user id), email addresses etc.
}

module.exports = { verifyClerkToken };
