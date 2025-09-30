const nodemailer = require("nodemailer");
const https = require("https");

/**
 * Generic email sender supporting either RESEND API (simpler, transactional) or SMTP fallback.
 * Environment variables supported:
 *  RESEND_API_KEY              (if set, use Resend API)
 *  RESEND_FROM_EMAIL           (mandatory if using Resend) eg: noreply@domain.com
 *  SMTP_HOST / SMTP_PORT / SMTP_SECURE ("true"/"false") / SMTP_USER / SMTP_PASS / SMTP_FROM
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) throw new Error("Missing to");
  if (!subject) throw new Error("Missing subject");

  // Prefer Resend if API key available
  if (process.env.RESEND_API_KEY) {
    const from = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
    const payload = JSON.stringify({ from, to, subject, html, text });
    const options = {
      method: "POST",
      hostname: "api.resend.com",
      path: "/emails",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };
    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve();
          reject(new Error(`Resend failed ${res.statusCode}: ${data}`));
        });
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
    return { provider: "resend" };
  }

  // SMTP fallback
  const host = process.env.SMTP_HOST;
  if (!host)
    throw new Error("No email provider configured (RESEND_API_KEY or SMTP_*)");
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({ from, to, subject, html, text });
  return { provider: "smtp" };
}

module.exports = { sendEmail };
