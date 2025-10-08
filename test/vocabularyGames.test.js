const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const {
  handler: registerHandler,
} = require("../netlify/functions/auth-register");
const { handler: loginHandler } = require("../netlify/functions/auth-login");
const {
  handler: wordHuntHandler,
} = require("../netlify/functions/vocabulary-game-wordhunt");
const {
  handler: speedChallengeHandler,
} = require("../netlify/functions/vocabulary-game-speed-challenge");
const {
  handler: flashcardBattleHandler,
} = require("../netlify/functions/vocabulary-game-flashcard-battle");
const WordEntry = require("../models/WordEntry");
const VocabularyProgress = require("../models/VocabularyProgress");
const User = require("../models/User");

let mongoServer;

const buildEvent = ({ method = "GET", token, body, query = {} } = {}) => ({
  httpMethod: method,
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
  body: body ? JSON.stringify(body) : undefined,
  queryStringParameters: query,
});

const registerAndLogin = async ({
  username = "player",
  email = "player@example.com",
  password = "password123",
} = {}) => {
  const registerEvent = buildEvent({
    method: "POST",
    body: { username, email, password },
  });
  const registerResponse = await registerHandler(registerEvent);
  expect(registerResponse.statusCode).toBe(201);

  const loginEvent = buildEvent({
    method: "POST",
    body: { email, password },
  });
  const loginResponse = await loginHandler(loginEvent);
  expect(loginResponse.statusCode).toBe(200);
  const loginPayload = JSON.parse(loginResponse.body);
  return loginPayload.token;
};

describe("Vocabulary mini-game functions", () => {
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

  const seedWords = async () => {
    const baseWords = [
      { term: "blue", translation: "mavi" },
      { term: "ship", translation: "gemi" },
      { term: "tulip", translation: "lale" },
      { term: "river", translation: "dere" },
      { term: "plate", translation: "tabak" },
      { term: "garden", translation: "bahce" },
    ];

    const docs = await WordEntry.insertMany(
      baseWords.map((word) => ({
        ...word,
        status: "published",
      }))
    );

    return docs;
  };

  test("Word Hunt session starts successfully", async () => {
    const token = await registerAndLogin();
    await seedWords();

    const response = await wordHuntHandler(
      buildEvent({ method: "GET", token, query: { limit: "4" } })
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.session).toBeTruthy();
    expect(payload.session.board).toBeInstanceOf(Array);
    expect(payload.session.words.length).toBeGreaterThan(0);
  });

  test("Speed Challenge session starts successfully", async () => {
    const email = "speed@example.com";
    const token = await registerAndLogin({
      username: "speedster",
      email,
    });
    const user = await User.findOne({ email });
    const words = await seedWords();

    await VocabularyProgress.insertMany(
      words.slice(0, 6).map((word) => ({
        user: user._id,
        word: word._id,
        status: "review",
        nextReviewAt: new Date(Date.now() - 60 * 1000),
      }))
    );

    const response = await speedChallengeHandler(
      buildEvent({ method: "GET", token })
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.session).toBeTruthy();
    expect(payload.session.cards.length).toBeGreaterThan(0);
  });

  test("Flashcard Battle session starts successfully", async () => {
    const email = "battle@example.com";
    const token = await registerAndLogin({
      username: "battler",
      email,
    });
    const user = await User.findOne({ email });
    const words = await seedWords();

    await VocabularyProgress.insertMany(
      words.slice(0, 5).map((word) => ({
        user: user._id,
        word: word._id,
        status: "learning",
      }))
    );

    const response = await flashcardBattleHandler(
      buildEvent({ method: "GET", token })
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.session).toBeTruthy();
    expect(payload.session.rounds.length).toBeGreaterThan(0);
  });
});
