import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import StatsLayout from "../components/stats/StatsLayout";
import StatsHero from "../components/stats/StatsHero";
import StatsHighlights from "../components/stats/StatsHighlights";
import StatsTrendChart from "../components/stats/StatsTrendChart";
import StatsCategoryChart from "../components/stats/StatsCategoryChart";
import StatsPeerComparison from "../components/stats/StatsPeerComparison";
import StatsRecentSessions from "../components/stats/StatsRecentSessions";
import StatsPeerDistribution from "../components/stats/StatsPeerDistribution";
import StatsSessionHeatmap from "../components/stats/StatsSessionHeatmap";
import StatsQuickInsights from "../components/stats/StatsQuickInsights";
import StatsSuggestions from "../components/stats/StatsSuggestions";
import {
  buildAggregatedProgress,
  buildQuickInsights,
  buildXpLevelInfo,
  buildRecentAccuracyTrend,
  buildCategoryRadarData,
  buildPeerComparison,
  buildImprovementSuggestions,
  buildSuggestions,
  buildPeerDistribution,
  buildSessionHeatmap,
  buildSessionHeatmapData,
} from "../utils/statsHelpers";
import { fetchProgress, fetchAttempts } from "../store/userSlice";
import { fetchLeaderboard } from "../store/leaderboardSlice";

const Stats = () => {
  const dispatch = useDispatch();
  const { stats, progress, attempts } = useSelector((state) => state.user);
  const { user, token } = useSelector((state) => state.auth);
  const leaderboard = useSelector((state) => state.leaderboard);
  const userId = user?._id || user?.id || user?.userId;
  const leaderboardItems = useMemo(
    () => (Array.isArray(leaderboard?.items) ? leaderboard.items : []),
    [leaderboard?.items]
  );
  const [progressRequested, setProgressRequested] = useState(false);
  const [attemptsRequested, setAttemptsRequested] = useState(false);

  useEffect(() => {
    setProgressRequested(false);
  }, [userId]);

  useEffect(() => {
    setAttemptsRequested(false);
  }, [token]);

  const aggregatedProgress = useMemo(
    () => buildAggregatedProgress({ progress, stats, attempts }),
    [progress, stats, attempts]
  );

  const quickInsights = useMemo(
    () => buildQuickInsights(aggregatedProgress),
    [aggregatedProgress]
  );

  const xpInfo = useMemo(
    () => buildXpLevelInfo(aggregatedProgress.xp),
    [aggregatedProgress.xp]
  );

  const sessions = useMemo(
    () =>
      Array.isArray(aggregatedProgress.recentSessions)
        ? aggregatedProgress.recentSessions
        : [],
    [aggregatedProgress.recentSessions]
  );

  const userIdentifier =
    aggregatedProgress.userId || user?._id || user?.id || user?.userId;

  const analyticsData = useMemo(() => {
    const categoryStats = aggregatedProgress.categoryStats || {};

    const trend = buildRecentAccuracyTrend(sessions).slice(-12);
    const category = buildCategoryRadarData(categoryStats).slice(0, 8);
    const peerRowsData = buildPeerComparison(
      leaderboardItems.slice(0, 10),
      userIdentifier
    );

    const advancedSuggestions = buildImprovementSuggestions(
      aggregatedProgress,
      {
        xpInfo,
        leaderboardItems,
        currentUserId: userIdentifier,
      }
    );

    const quickSuggestionMap = new Map();
    buildSuggestions(aggregatedProgress, peerRowsData).forEach((item) => {
      if (!item) return;
      const key = item.id || item.title;
      if (!key || quickSuggestionMap.has(key)) return;
      quickSuggestionMap.set(key, item);
    });

    const quickSuggestions = Array.from(quickSuggestionMap.values()).slice(
      0,
      3
    );

    const suggestionMap = new Map();
    advancedSuggestions.forEach((item) => {
      if (!item) return;
      const key = item.id || item.title;
      if (!key || suggestionMap.has(key)) return;
      suggestionMap.set(key, item);
    });

    let suggestions = Array.from(suggestionMap.values()).slice(0, 4);

    if (!suggestions.length && quickSuggestions.length) {
      suggestions = quickSuggestions;
    }

    const peerDistributionData = buildPeerDistribution(
      leaderboardItems,
      userIdentifier
    );

    const activityHeatmap = buildSessionHeatmap(sessions);
    const activityMatrix = buildSessionHeatmapData(sessions);

    return {
      trend,
      category,
      peerRows: peerRowsData,
      suggestions,
      quickSuggestions,
      peerDistribution: peerDistributionData,
      activityHeatmap,
      activityMatrix,
    };
  }, [aggregatedProgress, sessions, leaderboardItems, userIdentifier, xpInfo]);

  const {
    trend: accuracyTrend,
    category: categoryData,
    peerRows,
    suggestions,
    quickSuggestions,
    peerDistribution,
    activityMatrix,
  } = analyticsData;

  const sidebarLoading =
    (attempts.loading && !sessions.length) ||
    (leaderboard.loading && !leaderboardItems.length);

  useEffect(() => {
    if (!userId || progressRequested) return;
    dispatch(fetchProgress({ userId }));
    setProgressRequested(true);
  }, [dispatch, progressRequested, userId]);

  useEffect(() => {
    const effectiveToken = token || localStorage.getItem("token");
    if (!effectiveToken || attemptsRequested) return;
    dispatch(fetchAttempts({ token: effectiveToken, limit: 20 }));
    setAttemptsRequested(true);
  }, [dispatch, token, attemptsRequested]);

  useEffect(() => {
    if (!leaderboardItems.length && !leaderboard.loading) {
      dispatch(fetchLeaderboard({ limit: 10, sort: "points" }));
    }
  }, [dispatch, leaderboardItems.length, leaderboard.loading]);

  return (
    <StatsLayout
      hero={
        <StatsHero xpInfo={xpInfo} aggregatedProgress={aggregatedProgress} />
      }
    >
      <div className="stats-grid__item stats-grid__item--personal">
        <div className="stats-stack stats-stack--personal">
          <StatsSuggestions items={suggestions} loading={sidebarLoading} />
          <StatsQuickInsights
            items={quickSuggestions}
            loading={sidebarLoading}
          />
        </div>
      </div>

      <div className="stats-grid__item stats-grid__item--highlights">
        <StatsHighlights items={quickInsights} />
      </div>

      <div className="stats-grid__item stats-grid__item--peer-table">
        <StatsPeerComparison rows={peerRows} loading={leaderboard.loading} />
      </div>

      <div className="stats-grid__item stats-grid__item--charts">
        <div className="stats-stack stats-stack--charts">
          <StatsTrendChart data={accuracyTrend} loading={attempts.loading} />
          <StatsPeerDistribution
            data={peerDistribution}
            loading={leaderboard.loading}
          />
          <StatsCategoryChart data={categoryData} />
        </div>
      </div>

      <div className="stats-grid__item stats-grid__item--heatmap">
        <StatsSessionHeatmap data={activityMatrix} />
      </div>

      <div className="stats-grid__item stats-grid__item--sessions">
        <StatsRecentSessions
          sessions={aggregatedProgress.recentSessions || []}
        />
      </div>
    </StatsLayout>
  );
};

export default Stats;
