import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { vocabularyApi } from "../utils/endpoints";

const LETTERS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const MAX_POOL_SIZE = 180;
const MAX_FETCH_PAGES = 8;
const FALLBACK_CATEGORY_KEY = "__all__";

const DIFFICULTY_PRESETS = {
  advanced: {
    key: "advanced",
    label: "İleri",
    description: "14×14 tahta · 12 kelime · 3 can",
    boardSize: 14,
    maxWords: 12,
    minWordsTarget: 8,
    minWordLength: 4,
    lives: 3,
    allowDiagonals: true,
    allowReverse: true,
    scoreMultiplier: 24,
  },
  expert: {
    key: "expert",
    label: "Usta",
    description: "16×16 tahta · 14 kelime · 3 can",
    boardSize: 16,
    maxWords: 14,
    minWordsTarget: 9,
    minWordLength: 4,
    lives: 3,
    allowDiagonals: true,
    allowReverse: true,
    scoreMultiplier: 28,
  },
  nightmare: {
    key: "nightmare",
    label: "Kabus",
    description: "18×18 tahta · 16 kelime · 2 can",
    boardSize: 18,
    maxWords: 16,
    minWordsTarget: 10,
    minWordLength: 5,
    lives: 2,
    allowDiagonals: true,
    allowReverse: true,
    scoreMultiplier: 32,
  },
};

const sanitizeTerm = (term) =>
  term
    ?.toString()
    .toLocaleUpperCase("tr-TR")
    .replace(/[^A-ZÇĞİÖŞÜ]/g, "")
    .trim();

const normalizeWord = (item) => {
  const term = item?.term?.trim();
  const sanitized = sanitizeTerm(term);
  if (!sanitized || sanitized.length < 3) return null;

  return {
    id: item?._id || item?.id || sanitized,
    term: term || sanitized,
    translation:
      item?.translation?.trim() ||
      item?.definition?.trim() ||
      (Array.isArray(item?.examples) ? item.examples[0] : ""),
    sanitized,
    length: sanitized.length,
  };
};

const shuffleArray = (input) => {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const randomIntInclusive = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getStartRange = (size, delta, length) => {
  if (delta === 0) {
    return [0, size - 1];
  }
  if (delta > 0) {
    return [0, size - length];
  }
  return [length - 1, size - 1];
};

const createEmptyBoard = (size) =>
  Array.from({ length: size }, () => Array(size).fill(null));

const fillRandomLetters = (board) => {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (!board[row][col]) {
        const randomIndex = Math.floor(Math.random() * LETTERS.length);
        board[row][col] = LETTERS[randomIndex];
      }
    }
  }
  return board;
};

const getDirections = (allowDiagonals) => {
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  if (allowDiagonals) {
    directions.push(
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 }
    );
  }

  return directions;
};

const placeWordOnBoard = (board, letters, preset) => {
  const directions = shuffleArray(getDirections(preset.allowDiagonals));
  const maxAttempts = Math.max(120, board.length * board.length * 2);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const direction = directions[attempt % directions.length];
    const useReverse = preset.allowReverse && Math.random() < 0.5;
    const activeLetters = useReverse ? [...letters].reverse() : [...letters];

    const [minRow, maxRow] = getStartRange(
      board.length,
      direction.dy,
      activeLetters.length
    );
    const [minCol, maxCol] = getStartRange(
      board.length,
      direction.dx,
      activeLetters.length
    );

    if (minRow > maxRow || minCol > maxCol) continue;

    const startRow = randomIntInclusive(minRow, maxRow);
    const startCol = randomIntInclusive(minCol, maxCol);

    let fits = true;
    const positions = [];

    for (let idx = 0; idx < activeLetters.length; idx += 1) {
      const row = startRow + direction.dy * idx;
      const col = startCol + direction.dx * idx;
      const current = board[row]?.[col];
      const letter = activeLetters[idx];

      if (current && current !== letter) {
        fits = false;
        break;
      }

      positions.push({ row, col });
    }

    if (!fits) continue;

    positions.forEach((pos, idx) => {
      board[pos.row][pos.col] = activeLetters[idx];
    });

    return {
      positions,
      orientation: {
        dx: direction.dx,
        dy: direction.dy,
        reversed: useReverse,
      },
    };
  }

  return null;
};

const generateBoardFromPool = (pool, preset) => {
  let size = preset.boardSize;
  let result = { board: [], words: [] };

  for (let expand = 0; expand < 3; expand += 1) {
    const board = createEmptyBoard(size + expand);
    const placedWords = [];
    const candidates = shuffleArray(pool);

    for (const candidate of candidates) {
      if (placedWords.length >= preset.maxWords) break;
      if (candidate.length > board.length) continue;
      if (candidate.length < preset.minWordLength) continue;

      const placement = placeWordOnBoard(
        board,
        candidate.sanitized.split(""),
        preset
      );

      if (!placement) continue;

      placedWords.push({
        ...candidate,
        positions: placement.positions,
        orientation: placement.orientation,
        isFound: false,
      });
    }

    fillRandomLetters(board);

    result = { board, words: placedWords };

    if (placedWords.length >= preset.minWordsTarget) {
      break;
    }
  }

  return result;
};

export default function useWordHuntGame({ autoStart = false, category } = {}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [board, setBoard] = useState([]);
  const [words, setWords] = useState([]);
  const [livesRemaining, setLivesRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [gameResult, setGameResult] = useState({
    correct: 0,
    incorrect: 0,
    xpEarned: 0,
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [difficultyKey, setDifficultyKey] = useState(
    DIFFICULTY_PRESETS.expert.key
  );

  const [wordPool, setWordPool] = useState([]);
  const poolCategoryRef = useRef(FALLBACK_CATEGORY_KEY);

  const categoryKey = category || FALLBACK_CATEGORY_KEY;

  useEffect(() => {
    setWordPool([]);
    poolCategoryRef.current = FALLBACK_CATEGORY_KEY;
  }, [categoryKey]);

  const loadWordPool = useCallback(async () => {
    const unique = new Map();
    let cursor = 0;
    let page = 0;

    while (page < MAX_FETCH_PAGES && unique.size < MAX_POOL_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      const response = await vocabularyApi.list({
        category,
        limit: 100,
        cursor: page === 0 ? undefined : cursor,
      });

      const items = response?.items ?? [];
      for (const rawWord of items) {
        const normalized = normalizeWord(rawWord);
        if (!normalized) continue;
        if (normalized.length > 18) continue;
        if (!unique.has(normalized.sanitized)) {
          unique.set(normalized.sanitized, normalized);
        }
      }

      page += 1;
      if (response?.nextCursor != null && unique.size < MAX_POOL_SIZE) {
        cursor = response.nextCursor;
      } else {
        break;
      }
    }

    const pool = Array.from(unique.values());
    if (!pool.length) {
      throw new Error("Bu kategori için yeterli kelime bulunamadı.");
    }

    poolCategoryRef.current = categoryKey;
    setWordPool(pool);
    return pool;
  }, [category, categoryKey]);

  const ensureWordPool = useCallback(async () => {
    if (wordPool.length && poolCategoryRef.current === categoryKey) {
      return wordPool;
    }
    return loadWordPool();
  }, [categoryKey, loadWordPool, wordPool]);

  const startGame = useCallback(
    async ({ difficulty } = {}) => {
      const requestedKey = difficulty || difficultyKey;
      const preset =
        DIFFICULTY_PRESETS[requestedKey] || DIFFICULTY_PRESETS.expert;

      setDifficultyKey(preset.key);
      setLoading(true);
      setSubmitting(false);
      setError(null);

      try {
        const pool = await ensureWordPool();
        const usablePool = pool.filter(
          (item) =>
            item.length <= preset.boardSize &&
            item.length >= preset.minWordLength
        );

        if (!usablePool.length) {
          throw new Error(
            "Bu kategori için bulmaca oluşturmak üzere yeterli uzunlukta kelime bulunamadı."
          );
        }

        const { board: generatedBoard, words: placedWords } =
          generateBoardFromPool(usablePool, preset);

        if (!placedWords.length) {
          throw new Error(
            "Kelime tahtası oluşturulamadı. Lütfen tekrar deneyin."
          );
        }

        setBoard(generatedBoard.map((row) => [...row]));
        setWords(placedWords);
        setLivesRemaining(preset.lives);
        setScore(0);
        setGameResult({ correct: 0, incorrect: 0, xpEarned: 0 });
        setIsCompleted(false);
      } catch (err) {
        setBoard([]);
        setWords([]);
        setLivesRemaining(0);
        setScore(0);
        setGameResult({ correct: 0, incorrect: 0, xpEarned: 0 });
        setIsCompleted(true);
        setError(
          err instanceof Error ? err : new Error("Kelime Avı başlatılamadı.")
        );
      } finally {
        setLoading(false);
      }
    },
    [difficultyKey, ensureWordPool]
  );

  const submitSelection = useCallback(
    async ({ wordId, positions }) => {
      if (!wordId || !Array.isArray(positions) || positions.length === 0) {
        return { success: false, reason: "empty" };
      }

      const preset =
        DIFFICULTY_PRESETS[difficultyKey] || DIFFICULTY_PRESETS.expert;

      setSubmitting(true);
      setError(null);

      try {
        const targetWord = words.find((word) => word.id === wordId);
        if (!targetWord) {
          throw new Error("Seçilen kelime tahtada bulunamadı.");
        }
        if (targetWord.isFound) {
          return { success: true, alreadyFound: true, word: targetWord };
        }

        const selection = positions
          .map(({ row, col }) => board[row]?.[col] || "")
          .join("")
          .replace(/[^A-ZÇĞİÖŞÜ]/g, "")
          .toLocaleUpperCase("tr-TR");

        const target = targetWord.sanitized;
        const reversed = [...target].reverse().join("");
        const matches = selection === target || selection === reversed;

        if (matches) {
          let updatedWords;
          setWords((prev) => {
            updatedWords = prev.map((word) =>
              word.id === wordId ? { ...word, isFound: true } : word
            );
            return updatedWords;
          });

          const scoreGain = targetWord.length * preset.scoreMultiplier;
          const xpGain = Math.max(12, Math.round(targetWord.length * 2.5));

          setScore((prev) => prev + scoreGain);
          setGameResult((prev) => ({
            correct: prev.correct + 1,
            incorrect: prev.incorrect,
            xpEarned: prev.xpEarned + xpGain,
          }));

          if (updatedWords?.every((word) => word.isFound)) {
            setIsCompleted(true);
          }

          return {
            success: true,
            word: targetWord,
            scoreGain,
            xpGain,
            completed: updatedWords?.every((word) => word.isFound) ?? false,
          };
        }

        let nextLives = 0;
        setLivesRemaining((prev) => {
          const remaining = Math.max(prev - 1, 0);
          nextLives = remaining;
          return remaining;
        });

        setGameResult((prev) => ({
          correct: prev.correct,
          incorrect: prev.incorrect + 1,
          xpEarned: prev.xpEarned,
        }));

        if (nextLives === 0) {
          setIsCompleted(true);
        }

        return {
          success: false,
          reason: "mismatch",
          remainingLives: nextLives,
          gameOver: nextLives === 0,
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Hamle işlenemedi."));
        return { success: false, reason: "error" };
      } finally {
        setSubmitting(false);
      }
    },
    [board, difficultyKey, words]
  );

  useEffect(() => {
    if (!autoStart) return;
    startGame();
  }, [autoStart, categoryKey, startGame]);

  const remainingWords = useMemo(
    () => words.filter((word) => !word.isFound),
    [words]
  );

  const progress = useMemo(() => {
    const total = words.length;
    const found = words.filter((word) => word.isFound).length;
    return {
      total,
      found,
      percent: total > 0 ? Math.round((found / total) * 100) : 0,
    };
  }, [words]);

  const sessionMeta = useMemo(
    () => ({
      xpEarned: gameResult.xpEarned,
      dailyGoal: null,
      dailyProgress: gameResult.correct,
    }),
    [gameResult]
  );

  const difficultyOptions = useMemo(
    () =>
      Object.values(DIFFICULTY_PRESETS).map(({ key, label, description }) => ({
        key,
        label,
        description,
      })),
    []
  );

  return {
    loading,
    submitting,
    error,
    board,
    words,
    remainingWords,
    progress,
    isCompleted,
    livesRemaining,
    score,
    result: gameResult,
    sessionMeta,
    difficulty: difficultyKey,
    difficultyOptions,
    setDifficulty: setDifficultyKey,
    startGame,
    submitSelection,
  };
}
