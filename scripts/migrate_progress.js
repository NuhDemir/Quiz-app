#!/usr/bin/env node
/**
 * Progress -> User.quizStats + QuizAttempt migration script
 *
 * 1. Reads all documents from Progress collection
 * 2. For each progress:
 *    - Finds matching User by _id (string) or ObjectId
 *    - Updates User.quizStats fields (totalQuizzes, accuracy, streak -> currentStreak)
 *    - Converts recentSessions into QuizAttempt docs (if not already migrated)
 *    - Deduplicates badges into User.badges (if Badge model uses codes, this step may need mapping)
 * 3. Optionally keeps a migration log collection (skipped here - console output only)
 *
 * SAFE: Does not delete original Progress documents. Re-run safe.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Progress = require("../models/Progress");
const User = require("../models/User");
const QuizAttempt = require("../models/QuizAttempt");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("[migration] Connected");

  const progresses = await Progress.find({}).lean();
  console.log(`[migration] Found ${progresses.length} progress docs`);

  let updatedUsers = 0;
  let createdAttempts = 0;

  for (const p of progresses) {
    const userId = p.userId; // stored as string
    if (!userId) continue;

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`[migration] User not found for progress userId=${userId}`);
      continue;
    }

    // Update quizStats aggregate fields
    user.quizStats = user.quizStats || {};
    user.quizStats.totalQuizzes = p.totalQuizzes || 0;
    user.quizStats.totalQuestions = p.recentSessions?.reduce(
      (a, s) => a + (s.questionsCount || 0),
      0
    );
    user.quizStats.totalCorrect = p.recentSessions?.reduce(
      (a, s) => a + (s.correctCount || 0),
      0
    );
    user.quizStats.totalWrong = Math.max(
      0,
      (user.quizStats.totalQuestions || 0) - (user.quizStats.totalCorrect || 0)
    );
    user.quizStats.currentStreak = p.streak || 0;
    user.quizStats.longestStreak = Math.max(
      user.quizStats.longestStreak || 0,
      p.streak || 0
    );

    // Accuracy fallback
    if (!user.quizStats.totalWrong && !user.quizStats.totalCorrect) {
      user.quizStats.totalWrong = 0;
    }

    // Badges merge (Progress stores strings; assume they are codes or ids)
    if (Array.isArray(p.badges) && p.badges.length) {
      const existing = new Set((user.badges || []).map((b) => b.toString()));
      for (const b of p.badges) {
        // Only push if not present; This assumes same collection/object id values.
        if (!existing.has(b.toString())) {
          user.badges.push(b);
        }
      }
    }

    await user.save();
    updatedUsers++;

    // Create QuizAttempt docs from recentSessions if not already present
    if (Array.isArray(p.recentSessions) && p.recentSessions.length) {
      for (const session of p.recentSessions) {
        // Check existing by quiz + takenAt approx (heuristic)
        const existingAttempt = await QuizAttempt.findOne({
          user: user._id,
          quiz: session.quizId || undefined,
          startedAt: {
            $gte: new Date(new Date(session.takenAt).getTime() - 1000),
          },
        });
        if (existingAttempt) continue;

        await QuizAttempt.create({
          user: user._id,
          quiz: session.quizId || undefined,
          questionCount: session.questionsCount || 0,
          correctCount:
            session.correctCount ||
            Math.round((session.accuracy || 0) * (session.questionsCount || 0)),
          wrongCount: 0, // cannot derive precisely if not stored
          accuracy: session.accuracy || 0,
          score: session.score || 0,
          durationSec: session.duration || 0,
          startedAt: session.takenAt ? new Date(session.takenAt) : new Date(),
          finishedAt: session.takenAt ? new Date(session.takenAt) : new Date(),
          answers: [],
          meta: { streakDelta: session.streakDelta || 0, xpEarned: 0 },
        });
        createdAttempts++;
      }
    }
  }

  console.log(`[migration] Updated users: ${updatedUsers}`);
  console.log(`[migration] Created quiz attempts: ${createdAttempts}`);
  console.log("[migration] Done (original Progress docs preserved).");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[migration] Failed", err);
  process.exit(1);
});
