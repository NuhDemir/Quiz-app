import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { vocabularyApi } from "../utils/endpoints";

const normalizeWords = (items = []) =>
  items.map((item) => ({
    id: item._id || item.id,
    term: item.term,
    translation: item.translation,
    definition: item.definition,
    examples: item.examples || [],
    level: item.level,
    difficulty: item.difficulty,
    status: item.status,
    category: item.category,
    tags: item.tags || [],
  }));

export default function useVocabulary(options = {}) {
  const {
    deck,
    category,
    search,
    status = "published",
    level,
    pageSize = 24,
    autoFetch = true,
  } = options;

  const token = useSelector((state) => state.auth?.token);
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({});

  const buildParams = useCallback(
    (cursorOverride = 0) => ({
      category,
      deck,
      search,
      status,
      level,
      limit: pageSize,
      cursor: cursorOverride,
      token,
    }),
    [category, deck, search, status, level, pageSize, token]
  );

  const fetchItems = useCallback(
    async (cursorOverride = 0, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await vocabularyApi.list(buildParams(cursorOverride));
        const normalized = normalizeWords(payload.items || []);
        setItems((prev) => (append ? [...prev, ...normalized] : normalized));
        setCursor(payload.cursor || 0);
        setNextCursor(payload.nextCursor ?? null);
        setMeta(payload.meta || {});
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    if (!autoFetch) return;
    fetchItems(0, false);
  }, [fetchItems, autoFetch]);

  const loadMore = useCallback(() => {
    if (nextCursor == null || loading) return Promise.resolve();
    return fetchItems(nextCursor, true);
  }, [nextCursor, loading, fetchItems]);

  const hasMore = useMemo(() => nextCursor != null, [nextCursor]);

  return {
    items,
    cursor,
    nextCursor,
    hasMore,
    loading,
    error,
    refresh: () => fetchItems(cursor, false),
    loadMore,
    meta,
  };
}
