const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const {
  handler: listGrammarHandler,
} = require("../netlify/functions/quiz-list-grammar");

let mongoServer;

async function createQuestion(overrides = {}) {
  return Question.create({
    text: "Sample question?",
    options: ["Yes", "No"],
    correctAnswer: "Yes",
    category: "grammar",
    ...overrides,
  });
}

describe("quiz-list-grammar function", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  test("returns only published grammar quizzes", async () => {
    const baseQuestion = await createQuestion();

    await Quiz.create({
      title: "Grammar Basics",
      slug: "grammar-basics",
      description: "Grammar focused quiz",
      category: "Grammar",
      tags: ["grammar", "structure"],
      questions: [baseQuestion._id],
      isPublished: true,
      level: "A2",
    });

    await Quiz.create({
      title: "Vocabulary Starter",
      slug: "vocabulary-starter",
      description: "Vocabulary quiz",
      category: "vocabulary",
      tags: ["words"],
      questions: [baseQuestion._id],
      isPublished: true,
      level: "A1",
    });

    // unpublished grammar quiz should be ignored
    await Quiz.create({
      title: "Draft Grammar",
      slug: "draft-grammar",
      description: "Draft grammar quiz",
      category: "grammar",
      tags: ["grammar"],
      questions: [baseQuestion._id],
      isPublished: false,
      level: "B1",
    });

    const response = await listGrammarHandler({
      httpMethod: "GET",
      queryStringParameters: {},
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].slug).toBe("grammar-basics");
    expect(payload.meta).toMatchObject({
      category: "grammar",
      filter: {
        search: null,
      },
    });
  });

  test("applies level filter when provided", async () => {
    const question = await createQuestion();

    await Quiz.create({
      title: "Grammar B1",
      slug: "grammar-b1",
      description: "Intermediate grammar",
      category: "grammar",
      tags: ["grammar"],
      questions: [question._id],
      isPublished: true,
      level: "B1",
    });

    await Quiz.create({
      title: "Grammar C1",
      slug: "grammar-c1",
      description: "Advanced grammar",
      category: "grammar",
      tags: ["grammar"],
      questions: [question._id],
      isPublished: true,
      level: "C1",
    });

    const response = await listGrammarHandler({
      httpMethod: "GET",
      queryStringParameters: { level: "B1" },
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].slug).toBe("grammar-b1");
  });
});
