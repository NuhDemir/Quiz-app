const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const User = require("../models/User");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");

const {
  handler: registerHandler,
} = require("../netlify/functions/auth-register");
const { handler: loginHandler } = require("../netlify/functions/auth-login");
const {
  handler: quizSubmitHandler,
} = require("../netlify/functions/quiz-submit");
const { handler: progressHandler } = require("../netlify/functions/progress");
const Badge = require("../models/Badge");

let mongoServer;

async function createQuiz() {
  const q1 = await Question.create({
    text: "Capital of France?",
    options: ["Paris", "Rome", "Berlin"],
    correctAnswer: "Paris",
    category: "geo",
  });
  const q2 = await Question.create({
    text: "2 + 2 = ?",
    options: ["3", "4", "5"],
    correctAnswer: "4",
    category: "math",
  });
  const quiz = await Quiz.create({
    title: "Sample Quiz",
    slug: "sample-quiz",
    description: "Test quiz",
    category: "mixed",
    questions: [q1._id, q2._id],
    isPublished: true,
  });
  return { quiz, questions: [q1, q2] };
}

function buildAuthHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe("quiz-submit flow", () => {
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

  test("authenticated submission creates QuizAttempt and updates user stats", async () => {
    // register
    const regEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        username: "alice",
        email: "alice@example.com",
        password: "password123",
      }),
    };
    const regRes = await registerHandler(regEvent);
    expect(regRes.statusCode).toBe(201);
    const regBody = JSON.parse(regRes.body);
    // Email doğrulama kaldırıldı; doğrudan login.

    // login
    const loginEvent = {
      httpMethod: "POST",
      body: JSON.stringify({ identifier: "alice", password: "password123" }),
    };
    const loginRes = await loginHandler(loginEvent);
    const loginBody = JSON.parse(loginRes.body);
    const token = loginBody.token;

    // create quiz & questions
    const { quiz, questions } = await createQuiz();

    const answersPayload = {
      quizId: quiz._id.toString(),
      answers: [
        { questionId: questions[0]._id.toString(), answer: "Paris" }, // correct
        { questionId: questions[1]._id.toString(), answer: "3" }, // wrong
      ],
    };

    const submitEvent = {
      httpMethod: "POST",
      headers: buildAuthHeader(token),
      body: JSON.stringify(answersPayload),
    };
    const submitRes = await quizSubmitHandler(submitEvent);
    expect(submitRes.statusCode).toBe(200);
    const submitBody = JSON.parse(submitRes.body);
    expect(submitBody.attemptId).toBeTruthy();
    expect(submitBody.userStats.totalQuizzes).toBe(1);
    expect(submitBody.userStats.totalCorrect).toBe(1);
    expect(submitBody.userStats.totalWrong).toBe(1);

    const attemptCount = await QuizAttempt.countDocuments();
    expect(attemptCount).toBe(1);

    // progress endpoint should reflect aggregates
    const progressEvent = {
      httpMethod: "GET",
      queryStringParameters: { userId: loginBody.user.id },
    };
    const progressRes = await progressHandler(progressEvent);
    expect(progressRes.statusCode).toBe(200);
    const progressBody = JSON.parse(progressRes.body);
    expect(progressBody.progress.totalQuizzes).toBe(1);
    expect(progressBody.progress.accuracy).toBe(50); // 1 / 2
  }, 30000);

  test("first quiz awards FIRST_QUIZ badge automatically", async () => {
    // Prepare badge doc with code FIRST_QUIZ
    await Badge.create({
      code: "FIRST_QUIZ",
      title: "First Quiz",
      description: "Complete your first quiz",
    });

    // register & login
    const regEvent = {
      httpMethod: "POST",
      body: JSON.stringify({
        username: "bob",
        email: "bob@example.com",
        password: "password123",
      }),
    };
    const regRes2 = await registerHandler(regEvent);
    const loginEvent = {
      httpMethod: "POST",
      body: JSON.stringify({ identifier: "bob", password: "password123" }),
    };
    const loginRes = await loginHandler(loginEvent);
    const loginBody = JSON.parse(loginRes.body);
    const token = loginBody.token;

    const { quiz, questions } = await createQuiz();
    const answersPayload = {
      quizId: quiz._id.toString(),
      answers: [
        { questionId: questions[0]._id.toString(), answer: "Paris" },
        { questionId: questions[1]._id.toString(), answer: "4" },
      ],
    };
    const submitEvent = {
      httpMethod: "POST",
      headers: buildAuthHeader(token),
      body: JSON.stringify(answersPayload),
    };
    const submitRes = await quizSubmitHandler(submitEvent);
    const submitBody = JSON.parse(submitRes.body);
    expect(submitBody.newlyAwarded.some((a) => a.code === "FIRST_QUIZ")).toBe(
      true
    );
  }, 30000);

  test("unauthenticated submission returns result without persistence", async () => {
    const { quiz, questions } = await createQuiz();
    const payload = {
      quizId: quiz._id.toString(),
      answers: [
        { questionId: questions[0]._id.toString(), answer: "Paris" },
        { questionId: questions[1]._id.toString(), answer: "4" },
      ],
    };
    const submitEvent = { httpMethod: "POST", body: JSON.stringify(payload) };
    const submitRes = await quizSubmitHandler(submitEvent);
    const body = JSON.parse(submitRes.body);
    expect(body.persisted).toBe(false);
    expect(body.attemptId).toBeFalsy();
    const attemptCount = await QuizAttempt.countDocuments();
    expect(attemptCount).toBe(0);
  }, 20000);
});
