import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { vocabularyApi } from "../utils/endpoints";

export default function useVocabularyAdmin() {
  const token = useSelector((state) => state.auth?.token);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const createWord = useCallback(
    async (payload) => {
      setSaving(true);
      setError(null);
      try {
        const response = await vocabularyApi.create({ token, payload });
        return response.item;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const updateWord = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError(null);
      try {
        const response = await vocabularyApi.update({ token, id, payload });
        return response.item;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const deleteWord = useCallback(
    async (id) => {
      setSaving(true);
      setError(null);
      try {
        await vocabularyApi.remove({ token, id });
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const upsertCategory = useCallback(
    async (payload) => {
      setSaving(true);
      setError(null);
      try {
        const response = await vocabularyApi.upsertCategory({ token, payload });
        return response.item;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const deleteCategory = useCallback(
    async (id) => {
      setSaving(true);
      setError(null);
      try {
        await vocabularyApi.deleteCategory({ token, id });
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  return {
    saving,
    error,
    createWord,
    updateWord,
    deleteWord,
    upsertCategory,
    deleteCategory,
  };
}
