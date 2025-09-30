const mongoose = require("mongoose");
const connectDB = require("../netlify/functions/db");

describe("Database connection helper", () => {
  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  test("throws if MONGODB_URI missing", async () => {
    const original = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow(/MONGODB_URI/);
    process.env.MONGODB_URI = original; // restore
  });

  test("fails fast for invalid URI", async () => {
    const original = process.env.MONGODB_URI;
    process.env.MONGODB_URI = "mongodb+srv://invalid/xxx";
    await expect(connectDB()).rejects.toThrow(
      /Veritabanına bağlanılamadı|bağlantı hatası|invalid|URI must include/i
    );
    process.env.MONGODB_URI = original;
  });
});
