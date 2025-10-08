import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { vocabularyApi } from "../utils/endpoints";

const normalizeCategories = (items = []) =>
  items.map((item) => ({
    id: item._id || item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    level: item.level,
    color: item.color,
    icon: item.icon,
    order: item.order ?? 0,
    isActive: item.isActive !== false,
    wordCount: item.wordCount ?? 0,
    xp: item.xp ?? 0,
    streak: item.streak ?? 0,
    reviewDueCount: item.reviewDueCount ?? 0,
    cooldownUntil: item.cooldownUntil || null,
    unlocked: item.unlocked !== false,
    difficulty: item.difficulty || null,
    progress: item.progress || null,
  }));

export default function useVocabularyCategories({
  includeInactive = false,
} = {}) {
  const token = useSelector((state) => state.auth?.token);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({});

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await vocabularyApi.categories({
        token,
        includeInactive,
      });
      setCategories(normalizeCategories(payload.items || []));
      setMeta(payload.meta || {});
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, includeInactive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const groupedByLevel = useMemo(() => {
    return categories.reduce((acc, category) => {
      const levelKey = category.level || "unknown";
      if (!acc[levelKey]) acc[levelKey] = [];
      acc[levelKey].push(category);
      return acc;
    }, {});
  }, [categories]);

  return {
    categories,
    groupedByLevel,
    loading,
    error,
    meta,
    refetch: fetchCategories,
  };
}
