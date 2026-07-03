import {
  contentCategories,
  contentCategoryLabels,
  type ContentCategory,
} from "../content/contentApi";
import { useAuth } from "../authentication/authContextValue";
import "./ProfilePage.css";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { updateName } from "./pfpApi";
import {
  getContentTypeFromCategory,
  getFavorites,
  getMomentLabel,
  removeFavorite,
  updateFavorite,
  type Favorite,
  type FavoriteStatus,
  type UpdateFavoriteInput,
} from "../features/favorites";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../navbar";

type ProfilePageProps = {
  onLogout: () => void;
  onCategoryClick: (category: ContentCategory) => void;
  onProfileClick: () => void;
};

const favoriteCategories = contentCategories.filter(
  (category) => !["Para Voce", "NULL"].includes(category),
);

function getStatusLabels(contentType: string): Record<FavoriteStatus, string> {
  if (contentType === "game") {
    return {
      watch: "Quero jogar",
      watching: "Jogando",
      watched: "Jogados",
    };
  }

  if (contentType === "book" || contentType === "manga") {
    return {
      watch: "Quero ler",
      watching: "Lendo",
      watched: "Lidos",
    };
  }

  return {
    watch: "Quero assistir",
    watching: "Assistindo",
    watched: "Assistidos",
  };
}

function getStatusFilterOptions(contentType: string): Array<{
  value: FavoriteStatus;
  label: string;
}> {
  const labels = getStatusLabels(contentType);

  return [
    { value: "watched", label: labels.watched },
    { value: "watching", label: labels.watching },
    { value: "watch", label: labels.watch },
  ];
}

function getCategoryContentType(category: ContentCategory) {
  return getContentTypeFromCategory(category) ?? "";
}

function formatDateForInput(date?: string) {
  return date ? date.slice(0, 10) : "";
}

function truncateText(value = "", maxLength = 20) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function formatPeriod(startDate?: string, endDate?: string) {
  const start = formatDateForInput(startDate);
  const end = formatDateForInput(endDate);

  if (!start && !end) {
    return "Sem datas";
  }

  return `${start || "Sem inicio"} - ${end || "Sem termino"}`;
}

function FavoriteCard({
  favorite,
  onClick,
}: {
  favorite: Favorite;
  onClick: (favorite: Favorite) => void;
}) {
  const momentLabel = getMomentLabel(favorite.contentType);
  const statusLabels = getStatusLabels(favorite.contentType);

  return (
    <button
      type="button"
      className="favorite-card"
      onClick={() => onClick(favorite)}
    >
      <div className="favorite-card-poster">
        {favorite.photoUrl ? (
          <img src={favorite.photoUrl} alt={favorite.name} loading="lazy" />
        ) : (
          <span>Sem imagem</span>
        )}
      </div>

      <div className="favorite-card-info">
        <h4>{favorite.name}</h4>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{statusLabels[favorite.status]}</dd>
          </div>
          <div>
            <dt>Nota</dt>
            <dd>{favorite.userRating ?? "-"}</dd>
          </div>
          <div>
            <dt>Periodo</dt>
            <dd>{formatPeriod(favorite.startDate, favorite.endDate)}</dd>
          </div>
          {momentLabel && (
            <div>
              <dt>{momentLabel}</dt>
              <dd>{favorite.moment ?? "-"}</dd>
            </div>
          )}
        </dl>
        <p>{truncateText(favorite.comment || "Sem comentario")}</p>
      </div>
    </button>
  );
}

function FavoriteDetailsModal({
  favorite,
  isSaving,
  onClose,
  onRemove,
  onUpdate,
}: {
  favorite: Favorite;
  isSaving: boolean;
  onClose: () => void;
  onRemove: (contentId: string) => void;
  onUpdate: (contentId: string, input: UpdateFavoriteInput) => void;
}) {
  const [status, setStatus] = useState<FavoriteStatus>(favorite.status);
  const [userRating, setUserRating] = useState(
    favorite.userRating?.toString() ?? "",
  );
  const [comment, setComment] = useState(favorite.comment ?? "");
  const [startDate, setStartDate] = useState(
    formatDateForInput(favorite.startDate),
  );
  const [endDate, setEndDate] = useState(formatDateForInput(favorite.endDate));
  const [moment, setMoment] = useState(favorite.moment?.toString() ?? "");
  const momentLabel = getMomentLabel(favorite.contentType);
  const statusLabels = getStatusLabels(favorite.contentType);

  function handleSave() {
    onUpdate(favorite.contentId, {
      status,
      userRating: userRating === "" ? undefined : Number(userRating),
      comment,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      moment: moment === "" ? undefined : Number(moment),
    });
  }

  return (
    <div className="favorite-details-backdrop" role="presentation">
      <section
        className="favorite-details-modal"
        aria-labelledby="favorite-details-title"
      >
        <div className="favorite-details-heading">
          <div>
            <h3 id="favorite-details-title">{favorite.name}</h3>
            <p>{statusLabels[favorite.status]}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving}>
            Fechar
          </button>
        </div>

        <div className="favorite-details-media">
          <div className="favorite-details-poster">
            {favorite.photoUrl ? (
              <img src={favorite.photoUrl} alt={favorite.name} />
            ) : (
              <span>Sem imagem</span>
            )}
          </div>
        </div>

        <div className="favorite-controls">
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as FavoriteStatus)
              }
              disabled={isSaving}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Nota</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={userRating}
              onChange={(event) => setUserRating(event.target.value)}
              disabled={isSaving}
            />
          </label>

          <label>
            <span>Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={isSaving}
            />
          </label>

          <label>
            <span>Termino</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={isSaving}
            />
          </label>

          {momentLabel && (
            <label>
              <span>{momentLabel}</span>
              <input
                type="number"
                min="0"
                value={moment}
                onChange={(event) => setMoment(event.target.value)}
                disabled={isSaving}
              />
            </label>
          )}
        </div>

        <label className="favorite-comment">
          <span>Comentario</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={isSaving}
          />
        </label>

        <div className="favorite-actions">
          <button type="button" onClick={handleSave} disabled={isSaving}>
            Salvar
          </button>
          <button
            type="button"
            className="danger-action"
            onClick={() => onRemove(favorite.contentId)}
            disabled={isSaving}
          >
            Remover
          </button>
        </div>
      </section>
    </div>
  );
}

export function ProfilePage({
  onCategoryClick,
  onLogout,
  onProfileClick,
}: ProfilePageProps) {
  const { user, token, logout, loadUser } = useAuth();
  const queryClient = useQueryClient();

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(user?.name ?? "");
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameFeedback, setNameFeedback] = useState("");
  const [nameFeedbackType, setNameFeedbackType] = useState<
    "success" | "error" | null
  >(null);
  const [favoritesFeedback, setFavoritesFeedback] = useState("");
  const [favoritesFeedbackType, setFavoritesFeedbackType] = useState<
    "success" | "error" | null
  >(null);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(
    null,
  );
  const [statusFilters, setStatusFilters] = useState<
    Partial<Record<ContentCategory, FavoriteStatus>>
  >({});
  const favoritesQueryKey = ["favorites", token];
  const {
    data: favorites = [],
    isPending: isLoadingFavorites,
    isError: isFavoritesError,
    error: favoritesError,
  } = useQuery({
    queryKey: favoritesQueryKey,
    queryFn: () => getFavorites(token ?? ""),
    enabled: Boolean(token),
    refetchOnWindowFocus: false,
  });
  const updateFavoriteMutation = useMutation({
    mutationFn: ({
      contentId,
      input,
    }: {
      contentId: string;
      input: UpdateFavoriteInput;
    }) => {
      if (!token) {
        throw new Error("Sessao expirada. Faca login novamente.");
      }

      return updateFavorite(token, contentId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      setSelectedFavoriteId(null);
      setFavoritesFeedback("Favorito atualizado.");
      setFavoritesFeedbackType("success");
    },
    onError: (error) => {
      setFavoritesFeedback(
        error instanceof Error ? error.message : "Erro ao atualizar favorito.",
      );
      setFavoritesFeedbackType("error");
    },
  });
  const removeFavoriteMutation = useMutation({
    mutationFn: (contentId: string) => {
      if (!token) {
        throw new Error("Sessao expirada. Faca login novamente.");
      }

      return removeFavorite(token, contentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      setSelectedFavoriteId(null);
      setFavoritesFeedback("Favorito removido.");
      setFavoritesFeedbackType("success");
    },
    onError: (error) => {
      setFavoritesFeedback(
        error instanceof Error ? error.message : "Erro ao remover favorito.",
      );
      setFavoritesFeedbackType("error");
    },
  });
  const isSavingFavorite =
    updateFavoriteMutation.isPending || removeFavoriteMutation.isPending;
  const selectedFavorite =
    favorites.find((favorite) => favorite.contentId === selectedFavoriteId) ??
    null;

  function handleLogout() {
    logout();
    onLogout();
  }

  async function handleSaveName() {
    const trimmedName = nameInput.trim();

    if (trimmedName.length < 2) {
      setNameFeedback("Informe um nome com pelo menos 2 caracteres.");
      setNameFeedbackType("error");
      return;
    }

    if (!token) {
      setNameFeedback("Sessao expirada. Faca login novamente.");
      setNameFeedbackType("error");
      return;
    }

    if (trimmedName === user?.name) {
      setNameInput(trimmedName);
      setIsEditingName(false);
      setNameFeedback("");
      setNameFeedbackType(null);
      return;
    }

    try {
      setIsSavingName(true);
      setNameFeedback("");
      setNameFeedbackType(null);

      const updatedUser = await updateName(token, {
        name: trimmedName,
      });

      setNameInput(updatedUser.name);
      await loadUser();
      setIsEditingName(false);
      setNameFeedback("Nome atualizado com sucesso.");
      setNameFeedbackType("success");
    } catch (error) {
      setNameFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o nome agora.",
      );
      setNameFeedbackType("error");
    } finally {
      setIsSavingName(false);
    }
  }

  function handleRemoveFavorite(contentId: string) {
    setFavoritesFeedback("");
    setFavoritesFeedbackType(null);
    removeFavoriteMutation.mutate(contentId);
  }

  function handleUpdateFavorite(contentId: string, input: UpdateFavoriteInput) {
    setFavoritesFeedback("");
    setFavoritesFeedbackType(null);
    updateFavoriteMutation.mutate({ contentId, input });
  }

  function handleStatusFilterChange(
    category: ContentCategory,
    status: FavoriteStatus,
  ) {
    setStatusFilters((current) => ({
      ...current,
      [category]: status,
    }));
  }

  return (
    <main className="profile-page">
      <Navbar
        activeCategory="NULL"
        onCategoryChange={onCategoryClick}
        onProfileClick={onProfileClick}
      />

      <section className="profile-shell" aria-labelledby="profile-title">
        <div className="profile-heading">
          <div>
            <h1 id="profile-title">Perfil</h1>
            <p>{user?.name ?? "Usuario"}</p>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="danger-action"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>

        <section className="profile-panel" aria-labelledby="profile-data-title">
          <h2 id="profile-data-title">Dados da conta</h2>
          <div className="profile-fields">
            <label>
              <span>Nome</span>
              <div className="name-field">
                <input
                  value={isEditingName ? nameInput : (user?.name ?? "")}
                  readOnly={!isEditingName}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={isSavingName}
                />
                {isEditingName ? (
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    aria-label="Salvar nome"
                    title="Salvar nome"
                  >
                    <Icon
                      className={`edit-icon ${isSavingName ? "is-loading" : ""}`}
                      icon={
                        isSavingName ? "mdi:loading" : "mdi:content-save-edit"
                      }
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user?.name ?? "");
                      setNameFeedback("");
                      setNameFeedbackType(null);
                      setIsEditingName(true);
                    }}
                    aria-label="Editar nome"
                    title="Editar nome"
                  >
                    <Icon className="edit-icon" icon="mdi:pencil" />
                  </button>
                )}
              </div>
            </label>
            {/* <label>
              <span>E-mail</span>
              <input value={user?.email ?? ""} readOnly />
            </label> */}
          </div>
          {nameFeedback && (
            <p className={`profile-feedback ${nameFeedbackType ?? ""}`}>
              {nameFeedback}
            </p>
          )}
          <p className="pending-note">
            Alteracao de nome e email ficara disponivel quando a rota do backend
            estiver pronta.
          </p>
        </section>

        <section className="profile-panel" aria-labelledby="favorites-title">
          <h2 id="favorites-title">Favoritos</h2>
          {favoritesFeedback && (
            <p className={`profile-feedback ${favoritesFeedbackType ?? ""}`}>
              {favoritesFeedback}
            </p>
          )}
          {isLoadingFavorites && (
            <p className="profile-empty">Carregando favoritos...</p>
          )}
          {isFavoritesError && (
            <p className="profile-feedback error">
              {favoritesError instanceof Error
                ? favoritesError.message
                : "Erro ao carregar favoritos."}
            </p>
          )}
          {!isLoadingFavorites &&
            !isFavoritesError &&
            favorites.length === 0 && (
              <p className="profile-empty">Nenhum favorito adicionado ainda.</p>
            )}
          <div className="favorites-list">
            {favoriteCategories.map((category) => {
              const activeStatus = statusFilters[category] ?? "watched";
              const categoryContentType = getCategoryContentType(category);
              const categoryStatusLabels = getStatusLabels(categoryContentType);
              const categoryStatusOptions =
                getStatusFilterOptions(categoryContentType);
              const categoryFavorites = favorites.filter(
                (favorite) => favorite.contentType === categoryContentType,
              );
              const filteredFavorites = categoryFavorites.filter(
                (favorite) => favorite.status === activeStatus,
              );

              return (
                <section className="favorite-category" key={category}>
                  <div className="favorite-category-heading">
                    <h3>{contentCategoryLabels[category]}</h3>
                    <div className="favorite-status-tabs">
                      {categoryStatusOptions.map((option) => (
                        <button
                          type="button"
                          className={
                            activeStatus === option.value ? "active" : undefined
                          }
                          key={option.value}
                          onClick={() =>
                            handleStatusFilterChange(category, option.value)
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredFavorites.length > 0 ? (
                    <div className="favorite-card-grid">
                      {filteredFavorites.map((favorite) => (
                        <FavoriteCard
                          favorite={favorite}
                          key={favorite.contentId}
                          onClick={(currentFavorite) =>
                            setSelectedFavoriteId(currentFavorite.contentId)
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="profile-empty">
                      Sem favoritos em{" "}
                      {categoryStatusLabels[activeStatus].toLowerCase()}.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </section>

      {selectedFavorite && (
        <FavoriteDetailsModal
          favorite={selectedFavorite}
          isSaving={isSavingFavorite}
          key={`${selectedFavorite.contentId}:${selectedFavorite.status}:${selectedFavorite.userRating ?? ""}:${selectedFavorite.moment ?? ""}`}
          onClose={() => setSelectedFavoriteId(null)}
          onRemove={handleRemoveFavorite}
          onUpdate={handleUpdateFavorite}
        />
      )}
    </main>
  );
}
