const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

let cachedConnection = null; // Mongoose connection objesi
let connectingPromise = null; // Aynı anda birden fazla bağlantı denemesini engelle

const DEFAULT_TIMEOUT_MS = Number(
  process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 8000
);

function formatMongooseError(err) {
  if (err?.name === "MongooseServerSelectionError") {
    return (
      "Veritabanına bağlanılamadı. Olası nedenler: (1) IP adresiniz MongoDB Atlas Network Access listesinde değil (2) MONGODB_URI hatalı (3) İnternet erişimi yok. Atlas panelinden IP'nizi whitelist edin veya 0.0.0.0/0 geçici olarak ekleyin. Orijinal mesaj: " +
      (err.message || "Server selection error")
    );
  }
  return err.message || "Bilinmeyen veritabanı hatası";
}

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (connectingPromise) {
    return connectingPromise; // Devam eden bağlantıyı bekle
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const error = new Error(
      "MONGODB_URI tanımlı değil. .env dosyasına MONGODB_URI ekleyin veya Netlify ortam değişkenini ayarlayın"
    );
    error.statusCode = 500;
    throw error;
  }

  const started = Date.now();
  const debug = process.env.DEBUG_DB === "1";

  if (debug) console.log("[db] Connecting to MongoDB...");

  connectingPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: DEFAULT_TIMEOUT_MS,
      maxPoolSize: 5,
      minPoolSize: 0,
      family: 4, // IPv4 zorla (bazı Windows/IPv6 DNS sorunları için)
    })
    .then((conn) => {
      cachedConnection = conn;
      if (debug)
        console.log(
          `[db] Connected in ${Date.now() - started}ms (state=${
            mongoose.connection.readyState
          })`
        );
      return cachedConnection;
    })
    .catch((err) => {
      if (debug) console.error("[db] Connection failed", err);
      cachedConnection = null;
      const formatted = formatMongooseError(err);
      const error = new Error(formatted);
      error.statusCode = err.statusCode || 503;
      throw error;
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
}

module.exports = connectDB;
