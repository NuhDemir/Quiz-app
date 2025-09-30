// Reusable achievements / badges evaluation engine
// Export evaluateAchievements(userDoc) -> { newlyAwarded: [...], mutated: boolean }

const Badge = require("../../models/Badge");
const Achievement = require("../../models/Achievement");

// Central criteria registry; can be extended or made data-driven later.
// type: 'badge' | 'achievement'
// code must correspond to Badge.code or Achievement.code if documents exist.
const CRITERIA = [
  {
    code: "FIRST_QUIZ",
    type: "badge",
    test: (u) => (u.quizStats?.totalQuizzes || 0) >= 1,
  },
  {
    code: "QUIZ_MASTER_10",
    type: "achievement",
    test: (u) => (u.quizStats?.totalQuizzes || 0) >= 10,
  },
  { code: "ACCURACY_80", type: "badge", test: (u) => u.accuracy >= 80 },
  {
    code: "STREAK_5",
    type: "achievement",
    test: (u) => (u.quizStats?.currentStreak || 0) >= 5,
  },
];

async function evaluateAchievements(user) {
  const newlyAwarded = [];
  let mutated = false;

  // preload sets for quick membership
  const badgeIds = new Set((user.badges || []).map((b) => b.toString()));
  const achievementIds = new Set(
    (user.achievements || []).map((a) => a.toString())
  );

  for (const crit of CRITERIA) {
    try {
      if (!crit.test(user)) continue;
      if (crit.type === "badge") {
        const badgeDoc = await Badge.findOne({ code: crit.code });
        if (badgeDoc && !badgeIds.has(badgeDoc._id.toString())) {
          user.badges.push(badgeDoc._id);
          badgeIds.add(badgeDoc._id.toString());
          newlyAwarded.push({ type: "badge", code: crit.code });
          mutated = true;
        }
      } else if (crit.type === "achievement") {
        const achDoc = await Achievement.findOne({ code: crit.code });
        if (achDoc && !achievementIds.has(achDoc._id.toString())) {
          user.achievements.push(achDoc._id);
          achievementIds.add(achDoc._id.toString());
          newlyAwarded.push({ type: "achievement", code: crit.code });
          mutated = true;
        }
      }
    } catch (e) {
      // swallow individual criterion errors to not break main flow
      // could log e for diagnostics
    }
  }

  return { newlyAwarded, mutated };
}

module.exports = { evaluateAchievements, CRITERIA };
