import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminQuizzes,
  createAdminQuiz,
  updateAdminQuiz,
  deleteAdminQuiz,
  fetchAdminQuizById,
  selectQuiz,
  importAdminQuizJSON,
  clearImportState,
} from "../../store/adminQuizSlice";
import QuizForm from "./QuizForm";
import QuizImportDrawer from "./QuizImportDrawer";

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("tr-TR") : "—";

const difficultyLabels = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const QuizManager = () => {
  const dispatch = useDispatch();
  const {
    items,
    loading,
    error,
    pagination,
    filters,
    saving,
    deletingIds,
    detailLoading,
    selectedQuiz,
    importing,
    importResult,
    importError,
  } = useSelector((state) => state.adminQuizzes);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [mode, setMode] = useState("create");
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminQuizzes());
  }, [dispatch]);

  useEffect(() => {
    setSearchTerm(filters?.search || "");
  }, [filters?.search]);

  const deletingSet = useMemo(() => new Set(deletingIds), [deletingIds]);

  const handleSearch = (event) => {
    event.preventDefault();
    dispatch(fetchAdminQuizzes({ search: searchTerm.trim() || undefined }));
  };

  const openCreateForm = () => {
    setMode("create");
    setActiveQuizId(null);
    setShowForm(true);
    setShowImport(false);
    setStatus(null);
    dispatch(clearImportState());
    dispatch(selectQuiz(null));
  };

  const openEditForm = async (quizId) => {
    setMode("edit");
    setActiveQuizId(quizId);
    setShowForm(true);
    setShowImport(false);
    setStatus(null);
    dispatch(clearImportState());
    try {
      await dispatch(fetchAdminQuizById(quizId)).unwrap();
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Quiz detayları getirilirken bir sorun oluştu",
      });
    }
  };

  const handleDelete = async (quizId) => {
    setStatus(null);
    try {
      await dispatch(deleteAdminQuiz(quizId)).unwrap();
      setStatus({ type: "success", message: "Quiz silindi" });
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.message || "Quiz silinemedi",
      });
    }
  };

  const handleFormSubmit = async (payload) => {
    setStatus(null);
    try {
      if (mode === "edit" && activeQuizId) {
        await dispatch(
          updateAdminQuiz({ id: activeQuizId, quiz: payload })
        ).unwrap();
        setStatus({ type: "success", message: "Quiz güncellendi" });
      } else {
        await dispatch(createAdminQuiz(payload)).unwrap();
        setStatus({ type: "success", message: "Quiz oluşturuldu" });
      }
      setShowForm(false);
      await dispatch(
        fetchAdminQuizzes({
          ...(filters || {}),
          page: 1,
        })
      );
    } catch (err) {
      const message = err?.message || "İşlem tamamlanamadı";
      setStatus({ type: "error", message });
      throw err;
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setActiveQuizId(null);
    dispatch(selectQuiz(null));
  };

  const openImportDrawer = () => {
    setShowImport(true);
    setShowForm(false);
    setStatus(null);
    dispatch(clearImportState());
  };

  const closeImportDrawer = () => {
    setShowImport(false);
    dispatch(clearImportState());
  };

  const handleImportSubmit = async (payload) => {
    setStatus(null);
    try {
      const result = await dispatch(importAdminQuizJSON(payload)).unwrap();
      setStatus({
        type: "success",
        message:
          result?.message ||
          "Quiz içe aktarma tamamlandı. Liste yenileniyor...",
      });
      await dispatch(
        fetchAdminQuizzes({
          ...(filters || {}),
          page: 1,
        })
      );
    } catch (err) {
      const message = err?.message || "Quiz içe aktarımı tamamlanamadı";
      setStatus({ type: "error", message });
      throw err;
    }
  };

  return (
    <div className="admin-quiz-manager">
      <section className="surface-card admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Quiz listesi</h2>
            <p className="text-secondary">
              Tüm quizleri görüntüleyin, filtreleyin ve hızlıca aksiyon alın.
            </p>
          </div>
          <div className="admin-card__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={openImportDrawer}
            >
              JSON’dan içe aktar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={openCreateForm}
            >
              Yeni quiz oluştur
            </button>
          </div>
        </div>
        <form className="admin-toolbar" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Quiz ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="secondary-button" disabled={loading}>
            Ara
          </button>
        </form>
        {status && (
          <div
            className={`admin-alert admin-alert--${status.type}`}
            role="status"
          >
            {status.message}
          </div>
        )}
        {error && !status && (
          <div className="admin-alert admin-alert--error">{error}</div>
        )}
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Kategori</th>
                <th>Seviye</th>
                <th>Zorluk</th>
                <th>Yayın</th>
                <th>Soru</th>
                <th>Güncellendi</th>
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="admin-table__empty">
                    Listeler yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-table__empty">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((quiz) => {
                  const id = quiz.id || quiz._id;
                  return (
                    <tr key={id}>
                      <td>
                        <div className="admin-table__title">
                          <strong>{quiz.title}</strong>
                          <span>{quiz.slug}</span>
                        </div>
                      </td>
                      <td>{quiz.category || "—"}</td>
                      <td>{quiz.level || "—"}</td>
                      <td>
                        {difficultyLabels[quiz.difficulty] ||
                          quiz.difficulty ||
                          "—"}
                      </td>
                      <td>
                        <span
                          className={`admin-status admin-status--${
                            quiz.isPublished ? "success" : "muted"
                          }`}
                        >
                          {quiz.isPublished ? "Yayında" : "Taslak"}
                        </span>
                      </td>
                      <td>
                        {quiz.questionCount ?? quiz.questions?.length ?? 0}
                      </td>
                      <td>{formatDate(quiz.updatedAt)}</td>
                      <td className="admin-table__actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openEditForm(id)}
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className="secondary-button admin-button--danger"
                          onClick={() => handleDelete(id)}
                          disabled={deletingSet.has(id)}
                        >
                          {deletingSet.has(id) ? "Siliniyor..." : "Sil"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <footer className="admin-pagination">
          <span>
            Sayfa {pagination.page} / {pagination.totalPages}
          </span>
          <div className="admin-pagination__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                dispatch(
                  fetchAdminQuizzes({
                    ...filters,
                    page: Math.max(1, pagination.page - 1),
                  })
                )
              }
              disabled={loading || pagination.page <= 1}
            >
              Önceki
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                dispatch(
                  fetchAdminQuizzes({
                    ...filters,
                    page: Math.min(pagination.totalPages, pagination.page + 1),
                  })
                )
              }
              disabled={
                loading ||
                pagination.page >= pagination.totalPages ||
                pagination.totalPages === 0
              }
            >
              Sonraki
            </button>
          </div>
        </footer>
      </section>

      {showForm && (
        <div className="admin-drawer">
          <button
            type="button"
            className="admin-drawer__backdrop"
            onClick={closeForm}
            aria-label="Formu kapat"
          />
          <div className="admin-drawer__content">
            <QuizForm
              mode={mode}
              initialValues={mode === "edit" ? selectedQuiz : undefined}
              saving={saving}
              detailLoading={
                detailLoading && mode === "edit" && activeQuizId != null
              }
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {showImport && (
        <div className="admin-drawer">
          <button
            type="button"
            className="admin-drawer__backdrop"
            onClick={closeImportDrawer}
            aria-label="İçe aktarma panelini kapat"
          />
          <div className="admin-drawer__content admin-drawer__content--wide">
            <QuizImportDrawer
              importing={importing}
              result={importResult}
              error={importError}
              onImport={handleImportSubmit}
              onClose={closeImportDrawer}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;
