import { contentCategories, type ContentCategory } from "../content/contentApi";
import { useAuth } from "../authentication/authContextValue";
import "./ProfilePage.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { getOtherUsers, getUserProfileByName, updateName } from "./pfpApi";
import {
  getContentTypeFromCategory,
  getFavorites,
  removeFavorite,
  updateFavorite,
  type Favorite,
  type FavoriteStatus,
  type UpdateFavoriteInput,
} from "../features/favorites";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../navbar";
import { useLanguage } from "../pageText";

type AppText = ReturnType<typeof useLanguage>["text"];

type ProfilePageProps = {
  onLogout: () => void;
  onCategoryClick: (category: ContentCategory) => void;
  onProfileClick: () => void;
  onPublicProfileClick: (name: string) => void;
};

const favoriteCategories = contentCategories.filter(
  (category) => !["Para Voce", "NULL"].includes(category),
);

function getStatusLabels(
  contentType: string,
  text: AppText,
): Record<FavoriteStatus, string> {
  if (contentType === "game") {
    return {
      watch: text.profile.status.gameWatch,
      watching: text.profile.status.gameWatching,
      watched: text.profile.status.gameWatched,
    };
  }

  if (contentType === "book" || contentType === "manga") {
    return {
      watch: text.profile.status.readWatch,
      watching: text.profile.status.readWatching,
      watched: text.profile.status.readWatched,
    };
  }

  return {
    watch: text.profile.status.watch,
    watching: text.profile.status.watching,
    watched: text.profile.status.watched,
  };
}

function getStatusFilterOptions(
  contentType: string,
  text: AppText,
): Array<{
  value: FavoriteStatus;
  label: string;
}> {
  const labels = getStatusLabels(contentType, text);

  return [
    { value: "watched", label: labels.watched },
    { value: "watching", label: labels.watching },
    { value: "watch", label: labels.watch },
  ];
}

function getCategoryContentType(category: ContentCategory) {
  return getContentTypeFromCategory(category) ?? "";
}

function getContentTypeLabel(contentType: string, text: AppText) {
  const labels = text.profile.contentTypes as Record<string, string>;

  return labels[contentType] ?? (contentType || "-");
}

function getProfileMomentLabel(contentType: string, text: AppText) {
  if (contentType === "anime" || contentType === "series") {
    return text.profile.moment.episode;
  }

  if (contentType === "manga" || contentType === "book") {
    return text.profile.moment.chapter;
  }

  return null;
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

function formatPeriod(
  startDate: string | undefined,
  endDate: string | undefined,
  text: AppText,
) {
  const start = formatDateForInput(startDate);
  const end = formatDateForInput(endDate);

  if (!start && !end) {
    return text.profile.noDates;
  }

  return `${start || text.profile.noStart} - ${end || text.profile.noEnd}`;
}

function FavoriteCard({
  favorite,
  onClick,
  text,
}: {
  favorite: Favorite;
  onClick: (favorite: Favorite) => void;
  text: AppText;
}) {
  const momentLabel = getProfileMomentLabel(favorite.contentType, text);
  const statusLabels = getStatusLabels(favorite.contentType, text);

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
          <span>{text.profile.noImage}</span>
        )}
      </div>

      <div className="favorite-card-info">
        <h4>{favorite.name}</h4>
        <dl>
          <div>
            <dt>{text.profile.typeLabel}</dt>
            <dd>{getContentTypeLabel(favorite.contentType, text)}</dd>
          </div>
          <div>
            <dt>{text.profile.statusLabel}</dt>
            <dd>{statusLabels[favorite.status]}</dd>
          </div>
          <div>
            <dt>{text.profile.ratingLabel}</dt>
            <dd>{favorite.userRating ?? "-"}</dd>
          </div>
          <div>
            <dt>{text.profile.periodLabel}</dt>
            <dd>{formatPeriod(favorite.startDate, favorite.endDate, text)}</dd>
          </div>
          {momentLabel && (
            <div>
              <dt>{momentLabel}</dt>
              <dd>{favorite.moment ?? "-"}</dd>
            </div>
          )}
        </dl>
        <p>{truncateText(favorite.comment || text.profile.noComment)}</p>
      </div>
    </button>
  );
}

function FavoriteDetailsModal({
  favorite,
  isSaving,
  isReadOnly = false,
  onClose,
  onRemove,
  onUpdate,
  text,
}: {
  favorite: Favorite;
  isSaving: boolean;
  isReadOnly?: boolean;
  onClose: () => void;
  onRemove?: (contentId: string) => void;
  onUpdate?: (contentId: string, input: UpdateFavoriteInput) => void;
  text: AppText;
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
  const momentLabel = getProfileMomentLabel(favorite.contentType, text);
  const statusLabels = getStatusLabels(favorite.contentType, text);

  function handleSave() {
    if (!onUpdate || isReadOnly) {
      return;
    }

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
            {text.profile.close}
          </button>
        </div>

        <div className="favorite-details-media">
          <div className="favorite-details-poster">
            {favorite.photoUrl ? (
              <img src={favorite.photoUrl} alt={favorite.name} />
            ) : (
              <span>{text.profile.noImage}</span>
            )}
          </div>
        </div>

        <div className="favorite-controls">
          <label>
            <span>{text.profile.statusLabel}</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as FavoriteStatus)
              }
              disabled={isSaving || isReadOnly}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{text.profile.ratingLabel}</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={userRating}
              onChange={(event) => setUserRating(event.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </label>

          <label>
            <span>{text.profile.startLabel}</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={isSaving || isReadOnly}
            />
          </label>

          <label>
            <span>{text.profile.endLabel}</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={isSaving || isReadOnly}
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
                disabled={isSaving || isReadOnly}
              />
            </label>
          )}
        </div>

        <label className="favorite-comment">
          <span>{text.profile.commentLabel}</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={isSaving || isReadOnly}
          />
        </label>

        {!isReadOnly && (
          <div className="favorite-actions">
            <button type="button" onClick={handleSave} disabled={isSaving}>
              {text.profile.save}
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => onRemove?.(favorite.contentId)}
              disabled={isSaving}
            >
              {text.profile.remove}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function useParams() {
  const match = window.location.pathname.match(/^\/profile\/([^/]+)\/?$/);

  return {
    name: match?.[1] ? decodeURIComponent(match[1]) : undefined,
  };
}

type FavoriteSectionsProps = {
  favorites: Favorite[];
  selectedFavoriteId: string | null;
  statusFilters: Partial<Record<ContentCategory, FavoriteStatus>>;
  text: AppText;
  onFavoriteClick: (favorite: Favorite) => void;
  onStatusFilterChange: (
    category: ContentCategory,
    status: FavoriteStatus,
  ) => void;
};

function FavoriteSections({
  favorites,
  selectedFavoriteId,
  statusFilters,
  text,
  onFavoriteClick,
  onStatusFilterChange,
}: FavoriteSectionsProps) {
  return (
    <div
      className="favorites-list"
      data-selected-favorite={selectedFavoriteId ?? ""}
    >
      {favoriteCategories.map((category) => {
        const activeStatus = statusFilters[category] ?? "watching";
        const categoryContentType = getCategoryContentType(category);
        const categoryStatusLabels = getStatusLabels(categoryContentType, text);
        const categoryStatusOptions = getStatusFilterOptions(
          categoryContentType,
          text,
        );
        const categoryFavorites = favorites.filter(
          (favorite) => favorite.contentType === categoryContentType,
        );
        const filteredFavorites = categoryFavorites.filter(
          (favorite) => favorite.status === activeStatus,
        );

        return (
          <section className="favorite-category" key={category}>
            <div className="favorite-category-heading">
              <h3>{text.categories[category]}</h3>
              <div className="favorite-status-tabs">
                {categoryStatusOptions.map((option) => (
                  <button
                    type="button"
                    className={
                      activeStatus === option.value ? "active" : undefined
                    }
                    key={option.value}
                    onClick={() => onStatusFilterChange(category, option.value)}
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
                    onClick={onFavoriteClick}
                    text={text}
                  />
                ))}
              </div>
            ) : (
              <p className="profile-empty">
                {text.profile.noFavoritesInStatus.replace(
                  "{status}",
                  categoryStatusLabels[activeStatus].toLowerCase(),
                )}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

type UserSearchProps = {
  currentUserName?: string;
  onUserClick: (name: string) => void;
  text: AppText;
};

function UserSearch({ currentUserName, onUserClick, text }: UserSearchProps) {
  const userSearchRef = useRef<HTMLDivElement | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const {
    data: otherUsers = [],
    isPending: isLoadingUsers,
    isError: isUsersError,
  } = useQuery({
    queryKey: ["other-users"],
    queryFn: getOtherUsers,
    refetchOnWindowFocus: false,
  });
  const trimmedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      otherUsers.filter((otherUser) => {
        const isCurrentUser = otherUser.name === currentUserName;

        return (
          !isCurrentUser &&
          trimmedUserSearch.length > 0 &&
          otherUser.name.toLowerCase().includes(trimmedUserSearch)
        );
      }),
    [currentUserName, otherUsers, trimmedUserSearch],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target as Node)
      ) {
        setIsUserSearchOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function handleUserClick(name: string) {
    setUserSearch("");
    setIsUserSearchOpen(false);
    onUserClick(name);
  }

  return (
    <div className="user-search" ref={userSearchRef}>
      <input
        aria-label={text.profile.searchUsersLabel}
        type="search"
        value={userSearch}
        onChange={(event) => {
          setUserSearch(event.target.value);
          setIsUserSearchOpen(true);
        }}
        onFocus={() => setIsUserSearchOpen(true)}
        placeholder={text.profile.searchUsersPlaceholder}
        autoComplete="off"
      />
      {isUserSearchOpen && (
        <div className="user-search-dropdown" role="listbox">
          {userSearch.trim().length === 0 && (
            <p>{text.profile.emptyUserSearch}</p>
          )}
          {userSearch.trim().length > 0 && isLoadingUsers && (
            <p>{text.profile.usersLoading}</p>
          )}
          {userSearch.trim().length > 0 && isUsersError && (
            <p>{text.profile.usersError}</p>
          )}
          {userSearch.trim().length > 0 &&
            !isLoadingUsers &&
            !isUsersError &&
            filteredUsers.length === 0 && <p>{text.profile.noUsersFound}</p>}
          {filteredUsers.map((otherUser) => (
            <button
              type="button"
              role="option"
              key={otherUser.name}
              onClick={() => handleUserClick(otherUser.name)}
            >
              {otherUser.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfilePage({
  onCategoryClick,
  onLogout,
  onPublicProfileClick,
  onProfileClick,
}: ProfilePageProps) {
  const { user, token, logout, loadUser } = useAuth();
  const { text } = useLanguage();
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
        throw new Error(text.profile.sessionExpired);
      }

      return updateFavorite(token, contentId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      setSelectedFavoriteId(null);
      setFavoritesFeedback(text.profile.favoriteUpdated);
      setFavoritesFeedbackType("success");
    },
    onError: (error) => {
      setFavoritesFeedback(
        error instanceof Error
          ? error.message
          : text.profile.updateFavoriteError,
      );
      setFavoritesFeedbackType("error");
    },
  });
  const removeFavoriteMutation = useMutation({
    mutationFn: (contentId: string) => {
      if (!token) {
        throw new Error(text.profile.sessionExpired);
      }

      return removeFavorite(token, contentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      setSelectedFavoriteId(null);
      setFavoritesFeedback(text.profile.favoriteRemoved);
      setFavoritesFeedbackType("success");
    },
    onError: (error) => {
      setFavoritesFeedback(
        error instanceof Error
          ? error.message
          : text.profile.removeFavoriteError,
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
      setNameFeedback(text.profile.nameTooShort);
      setNameFeedbackType("error");
      return;
    }

    if (!token) {
      setNameFeedback(text.profile.sessionExpired);
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
      setNameFeedback(text.profile.nameUpdated);
      setNameFeedbackType("success");
    } catch (error) {
      setNameFeedback(
        error instanceof Error ? error.message : text.profile.nameUpdateError,
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
            <h1 id="profile-title">{text.profile.title}</h1>
            <p>{user?.name ?? text.profile.userFallback}</p>
          </div>

          <div className="profile-actions">
            <UserSearch
              currentUserName={user?.name}
              onUserClick={onPublicProfileClick}
              text={text}
            />
          </div>
        </div>

        <section className="profile-panel" aria-labelledby="profile-data-title">
          <h2 id="profile-data-title">{text.profile.accountData}</h2>
          <div className="profile-fields">
            <label>
              <span>{text.profile.nameLabel}</span>
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
                    aria-label={text.profile.saveName}
                    title={text.profile.saveName}
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
                    aria-label={text.profile.editName}
                    title={text.profile.editName}
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
        </section>

        <section className="profile-panel" aria-labelledby="favorites-title">
          <h2 id="favorites-title">{text.profile.favorites}</h2>
          {favoritesFeedback && (
            <p className={`profile-feedback ${favoritesFeedbackType ?? ""}`}>
              {favoritesFeedback}
            </p>
          )}
          {isLoadingFavorites && (
            <p className="profile-empty">{text.profile.loadingFavorites}</p>
          )}
          {isFavoritesError && (
            <p className="profile-feedback error">
              {favoritesError instanceof Error
                ? favoritesError.message
                : text.profile.favoritesError}
            </p>
          )}
          {!isLoadingFavorites &&
            !isFavoritesError &&
            favorites.length === 0 && (
              <p className="profile-empty">{text.profile.noFavorites}</p>
            )}
          <FavoriteSections
            favorites={favorites}
            selectedFavoriteId={selectedFavoriteId}
            statusFilters={statusFilters}
            text={text}
            onFavoriteClick={(currentFavorite) =>
              setSelectedFavoriteId(currentFavorite.contentId)
            }
            onStatusFilterChange={handleStatusFilterChange}
          />
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
          text={text}
        />
      )}
      <button type="button" className="danger-action" onClick={handleLogout}>
        {text.profile.logout}
      </button>
    </main>
  );
}

type PublicProfilePageProps = {
  onBackToMain: () => void;
  onCategoryClick: (category: ContentCategory) => void;
  onPublicProfileClick: (name: string) => void;
  onProfileClick: () => void;
};

export function PublicProfilePage({
  onBackToMain,
  onCategoryClick,
  onPublicProfileClick,
  onProfileClick,
}: PublicProfilePageProps) {
  const { name } = useParams();
  const { user } = useAuth();
  const { text } = useLanguage();
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(
    null,
  );
  const [statusFilters, setStatusFilters] = useState<
    Partial<Record<ContentCategory, FavoriteStatus>>
  >({});
  const trimmedName = name?.trim() ?? "";

  const {
    data: profile,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-profile", trimmedName],
    queryFn: () => getUserProfileByName(trimmedName),
    enabled: trimmedName.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const favorites = profile?.favorites ?? [];
  const selectedFavorite =
    favorites.find((favorite) => favorite.contentId === selectedFavoriteId) ??
    null;
  const isLoadingProfile = trimmedName.length > 0 && isPending;
  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : "";
  const isNotFound =
    trimmedName.length === 0 ||
    (isError &&
      (errorMessage.includes("nao encontrado") ||
        errorMessage.includes("não encontrado") ||
        errorMessage.includes("not found")));

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

      <section className="profile-shell" aria-labelledby="public-profile-title">
        <div className="profile-heading">
          <div>
            <h1 id="public-profile-title">{text.profile.publicTitle}</h1>
            <p>{profile?.name ?? (trimmedName || text.profile.userFallback)}</p>
          </div>

          <div className="profile-actions">
            <UserSearch
              currentUserName={user?.name}
              onUserClick={onPublicProfileClick}
              text={text}
            />
            <button type="button" onClick={onBackToMain}>
              {text.profile.back}
            </button>
          </div>
        </div>

        <section className="profile-panel" aria-labelledby="public-data-title">
          <h2 id="public-data-title">{text.profile.publicData}</h2>
          {isLoadingProfile && (
            <p className="profile-empty">{text.profile.loadingProfile}</p>
          )}
          {isNotFound && (
            <p className="profile-feedback error">
              {text.profile.userNotFound}
            </p>
          )}
          {isError && !isNotFound && (
            <p className="profile-feedback error">
              {error instanceof Error
                ? error.message
                : text.profile.fetchProfileError}
            </p>
          )}
          {!isLoadingProfile && !isError && profile && (
            <div className="profile-fields public-profile-fields">
              <label>
                <span>{text.profile.nameLabel}</span>
                <input value={profile.name} readOnly disabled />
              </label>
            </div>
          )}
        </section>

        {!isLoadingProfile && !isError && profile && (
          <section
            className="profile-panel"
            aria-labelledby="public-favorites-title"
          >
            <h2 id="public-favorites-title">{text.profile.favorites}</h2>
            {favorites.length === 0 ? (
              <p className="profile-empty">{text.profile.publicNoFavorites}</p>
            ) : (
              <FavoriteSections
                favorites={favorites}
                selectedFavoriteId={selectedFavoriteId}
                statusFilters={statusFilters}
                text={text}
                onFavoriteClick={(favorite) =>
                  setSelectedFavoriteId(favorite.contentId)
                }
                onStatusFilterChange={handleStatusFilterChange}
              />
            )}
          </section>
        )}
      </section>

      {selectedFavorite && (
        <FavoriteDetailsModal
          favorite={selectedFavorite}
          isReadOnly
          isSaving={false}
          key={`${selectedFavorite.contentId}:${selectedFavorite.status}:${selectedFavorite.userRating ?? ""}:${selectedFavorite.moment ?? ""}`}
          onClose={() => setSelectedFavoriteId(null)}
          text={text}
        />
      )}
    </main>
  );
}
