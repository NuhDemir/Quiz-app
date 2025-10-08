import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import useWordHuntGame from "../../hooks/useWordHuntGame";
import { BoltIcon, InfoIcon, RefreshIcon, TranslateIcon } from "../icons";

const formatLives = (lives) =>
  new Array(Math.max(lives, 0)).fill("❤️").join(" ") || "—";

const formatNumber = (value, fallback = "0") =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("tr-TR")
    : fallback;

const clampPercent = (value) =>
  Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

const VocabularyWordHuntGame = ({ category }) => {
  const {
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
    result,
    sessionMeta,
    difficulty,
    difficultyOptions,
    setDifficulty,
    startGame,
    submitSelection,
  } = useWordHuntGame({ autoStart: true, category });

  const [activeWordId, setActiveWordId] = useState(null);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const xpEarned = sessionMeta?.xpEarned ?? result?.xpEarned ?? 0;
  const difficultyMeta = useMemo(
    () =>
      difficultyOptions.find((option) => option.key === difficulty) ||
      difficultyOptions[0],
    [difficulty, difficultyOptions]
  );

  const boardRows = useMemo(() => board || [], [board]);
  const boardRowCount = boardRows.length;
  const boardColCount = boardRows[0]?.length || 0;

  const totalWords = progress?.total ?? words.length ?? 0;
  const foundWords =
    progress?.found ?? totalWords - (remainingWords?.length ?? 0);
  const progressPercent = clampPercent(
    progress?.percent ?? (totalWords > 0 ? (foundWords / totalWords) * 100 : 0)
  );

  useEffect(() => {
    if (!boardRows.length) return;
    setSelectedPositions([]);
  }, [boardRows]);

  useEffect(() => {
    if (remainingWords.length === 0) {
      setActiveWordId(null);
      return;
    }
    if (
      !activeWordId ||
      !remainingWords.some((word) => word.id === activeWordId)
    ) {
      setActiveWordId(remainingWords[0].id);
      setSelectedPositions([]);
    }
  }, [remainingWords, activeWordId]);

  useEffect(() => {
    if (!statusMessage) return undefined;
    if (typeof window === "undefined") return undefined;
    const timeout = window.setTimeout(() => setStatusMessage(null), 4800);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (isCompleted) {
      setSelectedPositions([]);
    }
  }, [isCompleted]);

  const sortedWords = useMemo(() => {
    const notFound = words.filter((word) => !word.isFound);
    const discovered = words.filter((word) => word.isFound);
    return [...notFound, ...discovered];
  }, [words]);

  const activeWord = useMemo(
    () => sortedWords.find((word) => word.id === activeWordId) || null,
    [sortedWords, activeWordId]
  );

  const toggleCell = (rowIndex, colIndex) => {
    if (!activeWord || isCompleted || loading) return;
    setSelectedPositions((prev) => {
      const key = `${rowIndex}:${colIndex}`;
      const exists = prev.some((item) => item.key === key);
      if (exists) {
        return prev.filter((item) => item.key !== key);
      }
      return [...prev, { row: rowIndex, col: colIndex, key }];
    });
  };

  const handleSubmit = async () => {
    if (!activeWord || selectedPositions.length === 0) return;
    try {
      const response = await submitSelection({
        wordId: activeWord.id,
        positions: selectedPositions.map(({ row, col }) => ({ row, col })),
      });

      if (response?.success) {
        setStatusMessage({
          type: "success",
          title: `“${activeWord.term}” bulundu!`,
          text:
            response?.scoreGain || response?.xpGain
              ? `+${formatNumber(
                  response.scoreGain ?? 0
                )} puan · +${formatNumber(response.xpGain ?? 0)} XP`
              : "Harika seçim!",
        });
        setSelectedPositions([]);
        setShowHint(false);
      } else if (response?.alreadyFound) {
        setStatusMessage({
          type: "info",
          title: "Bu kelime zaten bulunmuş",
          text: "Listeye göz atarak farklı bir kelime seçebilirsin.",
        });
        setSelectedPositions([]);
      } else {
        const remaining = response?.remainingLives ?? livesRemaining - 1;
        setStatusMessage({
          type: "error",
          title: "Seçim yanlış",
          text: remaining > 0 ? `${remaining} canın kaldı.` : "Oyun sona erdi.",
        });
      }
    } catch (submitError) {
      setStatusMessage({
        type: "error",
        title: "İşlem başarısız",
        text: submitError.message || "Seçim gönderilemedi",
      });
    }
  };

  const restartGame = (nextDifficulty = difficulty) => {
    setSelectedPositions([]);
    setStatusMessage(null);
    setShowHint(false);
    startGame({ difficulty: nextDifficulty });
  };

  const handleDifficultyChange = (nextDifficulty) => {
    if (nextDifficulty === difficulty || loading || submitting) return;
    setDifficulty(nextDifficulty);
    restartGame(nextDifficulty);
  };

  const wordsRemainingCount = remainingWords.length;
  const lastCorrectCount = result?.correct ?? 0;
  const lastIncorrectCount = result?.incorrect ?? 0;
  const dailyGoal = sessionMeta?.dailyGoal ?? null;
  const dailyProgress = sessionMeta?.dailyProgress ?? result?.correct ?? 0;

  const headerStats = useMemo(
    () => [
      {
        id: "progress",
        label: "İlerleme",
        value:
          totalWords > 0
            ? `${formatNumber(foundWords, "0")} / ${formatNumber(
                totalWords,
                "—"
              )}`
            : `${formatNumber(foundWords, "0")} / —`,
        description:
          wordsRemainingCount > 0
            ? `${formatNumber(wordsRemainingCount, "0")} kelime kaldı`
            : "Tüm kelimeler bulundu",
      },
      {
        id: "score",
        label: "Skor",
        value: formatNumber(score, "0"),
        description: `${formatNumber(
          lastCorrectCount,
          "0"
        )} doğru · ${formatNumber(lastIncorrectCount, "0")} yanlış`,
      },
      {
        id: "xp",
        label: "XP",
        value: formatNumber(xpEarned, "0"),
        description:
          dailyGoal != null
            ? `${formatNumber(dailyProgress, "0")} / ${formatNumber(
                dailyGoal,
                "0"
              )} hedef`
            : "Bonus XP topluyorsun",
      },
      {
        id: "difficulty",
        label: "Zorluk",
        value: difficultyMeta?.label ?? "—",
        description: difficultyMeta?.description ?? "",
      },
      {
        id: "lives",
        label: "Can",
        value: formatNumber(livesRemaining, "0"),
        description: formatLives(livesRemaining),
      },
    ],
    [
      dailyGoal,
      dailyProgress,
      difficultyMeta,
      foundWords,
      lastCorrectCount,
      lastIncorrectCount,
      livesRemaining,
      score,
      totalWords,
      wordsRemainingCount,
      xpEarned,
    ]
  );

  const renderStatusMessage = () => {
    if (!statusMessage) return null;
    const tone =
      statusMessage.type === "success"
        ? "success"
        : statusMessage.type === "info"
        ? "info"
        : "warning";
    return (
      <div className={`alert alert--${tone}`} role="status">
        <strong>{statusMessage.title}</strong>
        {statusMessage.text ? <p>{statusMessage.text}</p> : null}
      </div>
    );
  };

  return (
    <section className="surface-card card-content vocabulary-panel vocabulary-panel--word-hunt">
      <header className="vocabulary-panel__header">
        <div className="vocabulary-panel__intro">
          <span className="chip chip--accent">Kelime Avı</span>
          <h2 className="vocabulary-panel__title">Kelime Avı</h2>
          <p className="vocabulary-panel__subtitle">
            Seçilen kategorideki tüm kelimelerle dolu bir tahta üzerinde
            kelimeleri bul.
          </p>
          <div className="vocabulary-word-hunt__toolbar" aria-live="polite">
            <div className="vocabulary-word-hunt__difficulty">
              <BoltIcon
                fontSize="small"
                className="vocabulary-word-hunt__difficulty-icon"
              />
              <div role="group" aria-label="Zorluk seçenekleri">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`chip chip--ghost${
                      option.key === difficulty ? " is-active" : ""
                    }`}
                    onClick={() => handleDifficultyChange(option.key)}
                    disabled={loading || submitting}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="vocabulary-word-hunt__toolbar-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowHint((prev) => !prev)}
              >
                <TranslateIcon fontSize="small" />
                {showHint ? "İpucunu gizle" : "İpucu göster"}
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => restartGame()}
                disabled={loading || submitting}
                title="Yeni oyun başlat"
                aria-label="Yeni oyun başlat"
              >
                <RefreshIcon fontSize="inherit" />
              </button>
            </div>
          </div>
        </div>
        {headerStats.length > 0 && (
          <div className="vocabulary-panel__stats">
            {headerStats.map((stat) => (
              <article key={stat.id} className="vocabulary-panel__stat">
                <header>
                  <span className="label">{stat.label}</span>
                </header>
                <strong>{stat.value}</strong>
                {stat.description ? <p>{stat.description}</p> : null}
              </article>
            ))}
          </div>
        )}
      </header>

      {error && (
        <div className="alert alert--error" role="alert">
          {error.message || "Kelime Avı oyunu yüklenemedi"}
        </div>
      )}

      <div className="vocabulary-panel__layout">
        <div className="vocabulary-panel__primary">
          <section className="vocabulary-panel__section" aria-live="polite">
            <div className="vocabulary-word-hunt__progress">
              <div className="vocabulary-word-hunt__progress-bar">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-secondary">
                {formatNumber(foundWords, "0")} /{" "}
                {formatNumber(totalWords, "—")} kelime bulundu
              </span>
            </div>

            {loading ? (
              <div className="vocabulary-panel__placeholder">
                Kelime tahtası hazırlanıyor...
              </div>
            ) : boardRows.length === 0 ? (
              <div className="vocabulary-panel__placeholder">
                Tahta henüz hazır değil. Yeniden başlatmayı deneyin.
              </div>
            ) : (
              <div
                className="vocabulary-word-hunt__board"
                data-rows={boardRowCount}
                data-cols={boardColCount}
                style={{ "--word-hunt-cols": boardColCount || 1 }}
              >
                {boardRows.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}`}
                    className="vocabulary-word-hunt__row"
                    style={{
                      "--word-hunt-cols": boardColCount || row.length || 1,
                    }}
                  >
                    {row.map((cell, colIndex) => {
                      const key = `${rowIndex}:${colIndex}`;
                      const isSelected = selectedPositions.some(
                        (item) => item.key === key
                      );
                      const isDiscovered = words.some(
                        (word) =>
                          word.isFound &&
                          (word.positions || []).some(
                            (pos) =>
                              pos.row === rowIndex && pos.col === colIndex
                          )
                      );

                      return (
                        <button
                          key={key}
                          type="button"
                          className={`vocabulary-word-hunt__cell${
                            isSelected ? " is-selected" : ""
                          }${isDiscovered ? " is-discovered" : ""}`}
                          onClick={() => toggleCell(rowIndex, colIndex)}
                          disabled={isCompleted}
                        >
                          {cell || ""}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="vocabulary-panel__secondary">
          <section className="vocabulary-panel__section">
            <div className="vocabulary-word-hunt__words">
              <header className="vocabulary-word-hunt__words-header">
                <h3 className="text-sm">Kelime listesi</h3>
                <span className="text-xs text-secondary">
                  {formatNumber(wordsRemainingCount, "0")} kelime kaldı
                </span>
              </header>
              <ul className="vocabulary-word-hunt__word-list">
                {sortedWords.map((word) => (
                  <li key={word.id}>
                    <button
                      type="button"
                      className={`vocabulary-word-hunt__word${
                        word.id === activeWordId ? " is-active" : ""
                      }${word.isFound ? " is-found" : ""}`}
                      onClick={() => {
                        if (word.isFound) return;
                        setActiveWordId(word.id);
                        setSelectedPositions([]);
                        setShowHint(false);
                      }}
                    >
                      <span className="vocabulary-word-hunt__word-term">
                        {word.term}
                      </span>
                      <span className="vocabulary-word-hunt__word-meta">
                        {showHint || word.isFound ? (
                          <>
                            {word.translation} ·{" "}
                            {formatNumber(word.length, "0")} harf
                          </>
                        ) : (
                          <>
                            <InfoIcon fontSize="inherit" /> İpucu kapalı
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="vocabulary-word-hunt__actions">
                {activeWord ? (
                  <>
                    <p className="text-sm">
                      <strong>{activeWord.term}</strong> kelimesinin Türkçe
                      karşılığını bulmak için sırayla harfleri seç.
                    </p>
                    {showHint && activeWord.translation ? (
                      <p className="text-xs text-secondary" aria-live="polite">
                        İpucu: {activeWord.translation}
                      </p>
                    ) : null}
                    <div className="vocabulary-word-hunt__selection">
                      <span>
                        Seçim: {formatNumber(selectedPositions.length, "0")}{" "}
                        harf
                      </span>
                      <div className="vocabulary-word-hunt__selection-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setSelectedPositions([])}
                          disabled={
                            selectedPositions.length === 0 || submitting
                          }
                        >
                          Temizle
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={handleSubmit}
                          disabled={
                            selectedPositions.length === 0 || submitting
                          }
                        >
                          Onayla
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm">
                    Oynamak için bir kelime seç veya yeni oyun başlat.
                  </p>
                )}

                {renderStatusMessage()}
              </div>
            </div>
          </section>

          {isCompleted && (
            <section className="vocabulary-panel__section">
              <h3 className="vocabulary-panel__section-title">
                Oyun tamamlandı!
              </h3>
              <p className="vocabulary-panel__section-subtitle">
                {formatNumber(lastCorrectCount, "0")} doğru ·{" "}
                {formatNumber(lastIncorrectCount, "0")} yanlış · Skor{" "}
                {formatNumber(score, "0")}
              </p>
              <div className="vocabulary-panel__actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => restartGame()}
                >
                  Yeni oyun
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
};

VocabularyWordHuntGame.propTypes = {
  category: PropTypes.string,
};

VocabularyWordHuntGame.defaultProps = {
  category: null,
};

export default VocabularyWordHuntGame;
