import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import {
  VocabularyLayout,
  VocabularyCategoryPanel,
  VocabularyQuizShelf,
  VocabularyReviewQueue,
  VocabularyLearnGame,
  VocabularyWordHuntGame,
  VocabularySpeedChallengeGame,
  VocabularyFlashcardBattleGame,
} from "../components/vocabulary";
import {
  MenuBookIcon,
  PlayIcon,
  RefreshIcon,
  TargetIcon,
  TrophyIcon,
  BoltIcon,
  FireIcon,
} from "../components/icons";
import useVocabularyReview from "../hooks/useVocabularyReview";
import useVocabularyCategories from "../hooks/useVocabularyCategories";
import { quizApi } from "../utils/endpoints";

const Vocabulary = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("quizzes");
  const [activeCategorySlug, setActiveCategorySlug] = useState(null);
  const [isCategoryOverlayOpen, setCategoryOverlayOpen] = useState(false);
  const reviewStartRef = useRef(null);
  const learnStartRef = useRef(null);
  const [quizShelf, setQuizShelf] = useState({
    items: [],
    loading: true,
    error: null,
  });

  const {
    queue: learnQueue,
    currentCard: learnCard,
    loading: learnLoading,
    error: learnError,
    stats: learnStats,
    lastResult: learnLastResult,
    isSessionComplete: isLearnSessionComplete,
    refresh: refreshLearn,
    gradeCard: gradeLearnCard,
    skipCard: skipLearnCard,
    sessionMeta: learnSessionMeta,
  } = useVocabularyReview({
    mode: "learn",
    autoFetch: true,
    limit: 12,
    category: activeCategorySlug,
  });

  const {
    queue: reviewQueue,
    currentCard: reviewCard,
    loading: reviewLoading,
    error: reviewError,
    stats: reviewStats,
    lastResult: reviewLastResult,
    isSessionComplete: isReviewSessionComplete,
    refresh: refreshReview,
    gradeCard,
    skipCard,
    sessionMeta: reviewSessionMeta,
  } = useVocabularyReview({
    mode: "review",
    autoFetch: activeTab === "review",
    limit: 10,
    category: activeCategorySlug,
  });

  const { categories: rawCategories, loading: categoriesLoading } =
    useVocabularyCategories();

  const categories = useMemo(() => {
    const grammarPattern = /grammar/i;
    return rawCategories.filter((category) => {
      const slug = category.slug || "";
      const name = category.name || "";
      return !grammarPattern.test(slug) && !grammarPattern.test(name);
    });
  }, [rawCategories]);

  useEffect(() => {
    if (!activeCategorySlug) return;
    const stillExists = categories.some(
      (category) => category.slug === activeCategorySlug
    );
    if (!stillExists) {
      setActiveCategorySlug(null);
    }
  }, [activeCategorySlug, categories]);

  const selectedCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    return (
      categories?.find((category) => category.slug === activeCategorySlug) ||
      null
    );
  }, [activeCategorySlug, categories]);

  const selectedCategoryTags = useMemo(
    () =>
      Array.isArray(selectedCategory?.metadata?.tags)
        ? selectedCategory.metadata.tags
        : [],
    [selectedCategory]
  );

  const selectedCategoryName = selectedCategory?.name || "";

  useEffect(() => {
    let isMounted = true;

    setQuizShelf((prev) => ({ ...prev, loading: true, error: null }));

    const fetchQuizzes = async () => {
      try {
        const params = {
          mode: "vocabulary",
          limit: activeCategorySlug ? 12 : 24,
        };

        if (activeCategorySlug) {
          params.category = activeCategorySlug;
        }

        if (selectedCategoryTags.length) {
          params.tags = selectedCategoryTags;
        }

        let response = await quizApi.list(params);
        let quizItems = Array.isArray(response)
          ? response
          : response?.items || [];

        if (!quizItems.length && params.mode) {
          const fallback = await quizApi.list({ limit: 50 });
          quizItems = Array.isArray(fallback)
            ? fallback
            : fallback?.items || [];
        }

        const normalizedQuizzes = quizItems.map((quiz) => ({
          ...quiz,
          category: quiz?.category ?? "",
          tags: Array.isArray(quiz?.tags) ? quiz.tags : [],
        }));

        const matchesVocabulary = (quiz) => {
          const categoryValue = quiz.category
            ? quiz.category.toString().toLowerCase()
            : "";
          const tags = quiz.tags.map((tag) => tag.toLowerCase());
          return (
            categoryValue.includes("vocab") ||
            categoryValue.includes("kelime") ||
            tags.some((tag) => tag.includes("vocab") || tag.includes("kelime"))
          );
        };

        const matchesCategorySlug = (quiz) => {
          if (!activeCategorySlug) return true;
          const slugLower = activeCategorySlug.toLowerCase();
          const categoryValue = quiz.category
            ? quiz.category.toString().toLowerCase()
            : "";
          const tags = quiz.tags.map((tag) => tag.toLowerCase());
          return (
            categoryValue.includes(slugLower) ||
            tags.some((tag) => tag.includes(slugLower))
          );
        };

        const matchesCategoryName = (quiz) => {
          if (!selectedCategoryName) return true;
          const nameLower = selectedCategoryName.toLowerCase();
          const categoryValue = quiz.category
            ? quiz.category.toString().toLowerCase()
            : "";
          const tags = quiz.tags.map((tag) => tag.toLowerCase());
          return (
            categoryValue.includes(nameLower) ||
            tags.some((tag) => tag.includes(nameLower))
          );
        };

        const vocabularyMatches = normalizedQuizzes.filter(matchesVocabulary);

        let filtered = vocabularyMatches.filter(
          (quiz) => matchesCategorySlug(quiz) && matchesCategoryName(quiz)
        );

        if (!filtered.length && vocabularyMatches.length) {
          filtered = vocabularyMatches;
        }

        if (!isMounted) return;

        setQuizShelf({
          items: filtered,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;
        setQuizShelf({ items: [], loading: false, error });
      }
    };

    fetchQuizzes();

    return () => {
      isMounted = false;
    };
  }, [activeCategorySlug, selectedCategoryTags, selectedCategoryName]);

  useEffect(() => {
    if (activeTab !== "review") {
      reviewStartRef.current = null;
      return;
    }
    if (reviewCard) {
      reviewStartRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    }
  }, [activeTab, reviewCard]);

  useEffect(() => {
    if (activeTab !== "learn") {
      learnStartRef.current = null;
      return;
    }
    if (learnCard) {
      learnStartRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    }
  }, [activeTab, learnCard]);

  useEffect(() => {
    if (activeTab !== "review") return;
    refreshReview({ reset: true });
  }, [activeTab, refreshReview]);

  const handleGrade = useCallback(
    async (rating) => {
      if (!reviewCard) return;
      const startedAt = reviewStartRef.current;
      const durationMs =
        startedAt != null
          ? Math.max(
              0,
              Math.round(
                (typeof performance !== "undefined"
                  ? performance.now()
                  : Date.now()) - startedAt
              )
            )
          : undefined;

      try {
        await gradeCard({ rating, durationMs });
        reviewStartRef.current =
          typeof performance !== "undefined" ? performance.now() : Date.now();
      } catch (error) {
        console.error("Grading review card failed", error);
      }
    },
    [gradeCard, reviewCard]
  );

  const handleSkipCard = useCallback(async () => {
    try {
      await skipCard({ durationMs: 0 });
      reviewStartRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    } catch (error) {
      console.error("Skipping review card failed", error);
    }
  }, [skipCard]);

  const handleLearnGrade = useCallback(
    async (rating) => {
      if (!learnCard) return;
      const startedAt = learnStartRef.current;
      const durationMs =
        startedAt != null
          ? Math.max(
              0,
              Math.round(
                (typeof performance !== "undefined"
                  ? performance.now()
                  : Date.now()) - startedAt
              )
            )
          : undefined;

      try {
        await gradeLearnCard({ rating, durationMs });
        learnStartRef.current =
          typeof performance !== "undefined" ? performance.now() : Date.now();
      } catch (error) {
        console.error("Grading learn card failed", error);
      }
    },
    [gradeLearnCard, learnCard]
  );

  const handleLearnSkip = useCallback(async () => {
    try {
      await skipLearnCard({ durationMs: 0 });
      learnStartRef.current =
        typeof performance !== "undefined" ? performance.now() : Date.now();
    } catch (error) {
      console.error("Skipping learn card failed", error);
    }
  }, [skipLearnCard]);

  const filteredQuizzes = useMemo(() => {
    if (!selectedCategory) return quizShelf.items;
    const slug = selectedCategory.slug?.toLowerCase();
    const name = selectedCategory.name?.toLowerCase();
    return quizShelf.items.filter((quiz) => {
      const quizCategory = (quiz.category || "").toString().toLowerCase();
      const quizTags = Array.isArray(quiz.tags)
        ? quiz.tags.map((tag) => tag.toLowerCase())
        : [];
      return (
        (slug &&
          (quizCategory.includes(slug) ||
            quizTags.some((tag) => tag.includes(slug)))) ||
        (name &&
          (quizCategory.includes(name) ||
            quizTags.some((tag) => tag.includes(name))))
      );
    });
  }, [quizShelf.items, selectedCategory]);

  const learnQueueCount = Array.isArray(learnQueue) ? learnQueue.length : 0;
  const learnReviewedCount = learnStats?.reviewed || 0;

  const outstandingReviews = useMemo(() => {
    const queueCount = reviewQueue?.length || 0;
    const remaining = Math.max(
      (reviewStats?.total || 0) - (reviewStats?.reviewed || 0),
      0
    );
    return Math.max(queueCount, remaining);
  }, [reviewQueue, reviewStats?.total, reviewStats?.reviewed]);

  const totalWordCount = useMemo(
    () =>
      categories?.reduce(
        (sum, category) => sum + (category.wordCount || 0),
        0
      ) || 0,
    [categories]
  );

  const categoryStats = useMemo(() => {
    const stats = [];

    if (categories?.length || selectedCategory) {
      stats.push({
        id: "focus",
        label: selectedCategory
          ? `${selectedCategory.name} kelimeleri`
          : "Toplam kelime",
        value: (selectedCategory
          ? selectedCategory.wordCount || 0
          : totalWordCount
        ).toLocaleString("tr-TR"),
        hint: selectedCategory
          ? "Seçili kategorideki aktif kelimeler"
          : "Tüm kategorilerdeki aktif kelimeler",
      });
    }

    stats.push({
      id: "learn-queue",
      label: "Yeni kartlar",
      value: learnQueueCount.toLocaleString("tr-TR"),
      hint: isLearnSessionComplete
        ? "Bugünün yeni kartlarını tamamladın"
        : learnLoading
        ? "Kartlar hazırlanıyor"
        : learnQueueCount > 0
        ? "Hazır kartlar seni bekliyor"
        : "Yeni kartlar kısa sürede aktif olacak",
    });

    if (learnReviewedCount > 0) {
      stats.push({
        id: "learn-reviewed",
        label: "Bugün öğrenilen",
        value: learnReviewedCount.toLocaleString("tr-TR"),
        hint: "Bugünkü öğrenme oturumunda tamamlanan kartlar",
      });
    }

    stats.push({
      id: "review",
      label: selectedCategory
        ? `${selectedCategory.name} tekrar kuyruğu`
        : "Tekrar kuyruğu",
      value: outstandingReviews.toLocaleString("tr-TR"),
      hint:
        outstandingReviews > 0
          ? selectedCategory
            ? "Seçili kategori için tekrar zamanı"
            : "Bugünün tekrarını tamamla"
          : "Şimdilik tekrar kartı yok",
    });

    stats.push({
      id: "word-hunt",
      label: "Kelime Avı",
      value: "Hazır",
      hint: "Bulmaca tahtasında kelimeleri avla",
    });

    stats.push({
      id: "speed-challenge",
      label: "Hız Yarışı",
      value: "30 sn",
      hint: "Süre dolmadan mümkün olduğunca çok kart çöz",
    });

    stats.push({
      id: "flashcard-battle",
      label: "Kart Dövüşü",
      value: "5 tur",
      hint: "Rakibini alt etmek için doğru çevirileri yakala",
    });

    if (reviewStats?.reviewed) {
      stats.push({
        id: "reviewed",
        label: "Bugün gözden geçirilen",
        value: (reviewStats.reviewed || 0).toLocaleString("tr-TR"),
        hint: `Toplam hedef: ${(reviewStats.total || 0).toLocaleString(
          "tr-TR"
        )}`,
      });
    }

    return stats;
  }, [
    categories,
    selectedCategory,
    totalWordCount,
    learnQueueCount,
    learnReviewedCount,
    learnLoading,
    isLearnSessionComplete,
    outstandingReviews,
    reviewStats?.reviewed,
    reviewStats?.total,
  ]);

  const tabs = useMemo(
    () => [
      {
        id: "quizzes",
        label: "Quizler",
        icon: PlayIcon,
        badge: quizShelf.items.length,
      },
      {
        id: "learn",
        label: "Yeni kelime",
        icon: MenuBookIcon,
        badge: learnQueueCount,
      },
      {
        id: "word-hunt",
        label: "Kelime Avı",
        icon: TargetIcon,
      },
      {
        id: "speed-challenge",
        label: "Hız Yarışı",
        icon: BoltIcon,
      },
      {
        id: "flashcard-battle",
        label: "Kart Dövüşü",
        icon: FireIcon,
      },
      {
        id: "review",
        label: "Tekrar",
        icon: RefreshIcon,
        badge: outstandingReviews,
      },
    ],
    [quizShelf.items.length, learnQueueCount, outstandingReviews]
  );

  const handleSelectCategory = useCallback(
    (slug) => {
      setActiveCategorySlug((prev) => (prev === slug ? null : slug));
      if (slug && activeTab !== "learn") {
        setActiveTab("learn");
      }
    },
    [activeTab]
  );

  const handleResetCategory = useCallback(() => {
    setActiveCategorySlug(null);
  }, []);

  const handleOpenCategories = useCallback(() => {
    setCategoryOverlayOpen(true);
  }, []);

  const handleCloseCategories = useCallback(() => {
    setCategoryOverlayOpen(false);
  }, []);

  useEffect(() => {
    if (isCategoryOverlayOpen && !categoriesLoading && !categories.length) {
      setCategoryOverlayOpen(false);
    }
  }, [categories, categoriesLoading, isCategoryOverlayOpen]);

  const headerActions = useMemo(() => {
    if (!user && !selectedCategory) return null;

    return (
      <div className="vocabulary-header__actions-stack">
        {selectedCategory && (
          <div className="vocabulary-focus">
            <div>
              <span className="vocabulary-focus__label">Aktif kategori</span>
              <strong className="vocabulary-focus__value">
                {selectedCategory.name}
              </strong>
            </div>
            <span className="badge">
              {(selectedCategory.wordCount || 0).toLocaleString("tr-TR")} kelime
            </span>
          </div>
        )}
        {user && (
          <div className="vocabulary-highlight">
            <span className="vocabulary-highlight__icon" aria-hidden="true">
              <TrophyIcon fontSize="inherit" />
            </span>
            <div>
              <span className="vocabulary-highlight__label">Günlük hedef</span>
              <span className="vocabulary-highlight__value">
                {(user?.stats?.dailyVocabularyTarget || 10).toLocaleString(
                  "tr-TR"
                )}
                &nbsp;kelime
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }, [selectedCategory, user]);

  return (
    <VocabularyLayout
      title="Kelime Bilgisinde Uzmanlaşın"
      description="Quizler, öğrenme ve tekrar modlarıyla kelime bilginizi günlük olarak geliştirin."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={headerActions}
      statsTitle="Kelime ilerlemeniz"
      stats={categoryStats}
      onOpenCategories={handleOpenCategories}
      overlay={
        <VocabularyCategoryPanel
          open={isCategoryOverlayOpen}
          categories={categories}
          loading={categoriesLoading}
          selectedCategorySlug={activeCategorySlug}
          onSelectCategory={handleSelectCategory}
          onResetCategory={handleResetCategory}
          onClose={handleCloseCategories}
        />
      }
    >
      <div className="vocabulary-content__stack">
        {activeTab === "quizzes" && (
          <VocabularyQuizShelf
            quizzes={filteredQuizzes}
            loading={quizShelf.loading}
            error={quizShelf.error}
          />
        )}

        {activeTab === "learn" && (
          <VocabularyLearnGame
            card={learnCard}
            queueLength={learnQueueCount}
            loading={learnLoading}
            error={learnError}
            stats={learnStats}
            lastResult={learnLastResult}
            isSessionComplete={isLearnSessionComplete}
            onGrade={handleLearnGrade}
            onSkip={handleLearnSkip}
            onRestart={() => refreshLearn({ reset: true })}
            sessionMeta={learnSessionMeta}
          />
        )}

        {activeTab === "word-hunt" && (
          <VocabularyWordHuntGame category={activeCategorySlug} />
        )}

        {activeTab === "speed-challenge" && (
          <VocabularySpeedChallengeGame category={activeCategorySlug} />
        )}

        {activeTab === "flashcard-battle" && (
          <VocabularyFlashcardBattleGame category={activeCategorySlug} />
        )}

        {activeTab === "review" && (
          <VocabularyReviewQueue
            card={reviewCard}
            queueLength={outstandingReviews}
            loading={reviewLoading}
            error={reviewError}
            stats={reviewStats}
            lastResult={reviewLastResult}
            isSessionComplete={isReviewSessionComplete}
            onGrade={handleGrade}
            onSkip={handleSkipCard}
            onRestart={() => refreshReview({ reset: true })}
            activeCategory={selectedCategory}
            sessionMeta={reviewSessionMeta}
          />
        )}
      </div>
    </VocabularyLayout>
  );
};

export default Vocabulary;
