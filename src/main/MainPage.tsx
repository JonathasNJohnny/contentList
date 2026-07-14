import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../authentication";
import {
  fetchContentByCategory,
  searchContentByCategory,
  type ContentCategory,
} from "../content/contentApi";
import {
  addFavorite,
  getContentTypeFromCategory,
  getFavorites,
  type FavoriteStatus,
} from "../features/favorites";
import { Navbar } from "../navbar";
import { useLanguage } from "../pageText";
import "./MainPage.css";

const forYouCategory: ContentCategory = "Para Voce";
type FavoriteDraft = {
  contentId: string;
  name: string;
  contentType: string;
  photoUrl?: string;
  status: FavoriteStatus;
  userRating: string;
  startDate: string;
  endDate: string;
  moment: string;
  comment: string;
};

function getFavoriteStatusOptions(
  category: ContentCategory,
  text: ReturnType<typeof useLanguage>["text"],
): Array<{
  value: FavoriteStatus;
  label: string;
}> {
  if (category === "Jogos") {
    return [
      { value: "watch", label: text.profile.status.gameWatch },
      { value: "watching", label: text.profile.status.gameWatching },
      { value: "watched", label: text.profile.status.gameWatched },
    ];
  }

  if (category === "Livros" || category === "Mangas") {
    return [
      { value: "watch", label: text.profile.status.readWatch },
      { value: "watching", label: text.profile.status.readWatching },
      { value: "watched", label: text.profile.status.readWatched },
    ];
  }

  return [
    { value: "watch", label: text.profile.status.watch },
    { value: "watching", label: text.profile.status.watching },
    { value: "watched", label: text.profile.status.watched },
  ];
}

function getFavoriteMomentLabel(
  contentType: string,
  text: ReturnType<typeof useLanguage>["text"],
) {
  if (contentType === "anime" || contentType === "series") {
    return text.profile.moment.episode;
  }

  if (contentType === "manga" || contentType === "book") {
    return text.profile.moment.chapter;
  }

  return null;
}

type MainPageProps = {
  onProfileClick: () => void;
  initialCategory?: ContentCategory;
};

export function MainPage({ onProfileClick, initialCategory }: MainPageProps) {
  const { token } = useAuth();
  const { text } = useLanguage();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<ContentCategory>(
    initialCategory ?? "Animes",
  );
  const [contentPage, setContentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteFeedback, setFavoriteFeedback] = useState("");
  const [favoriteFeedbackType, setFavoriteFeedbackType] = useState<
    "success" | "error" | null
  >(null);
  const [favoriteDraft, setFavoriteDraft] = useState<FavoriteDraft | null>(
    null,
  );
  const isForYouPage = activeCategory === forYouCategory;
  const activeCategoryLabel = text.categories[activeCategory];
  const favoriteStatusOptions = getFavoriteStatusOptions(activeCategory, text);
  const favoriteDraftMomentLabel = favoriteDraft
    ? getFavoriteMomentLabel(favoriteDraft.contentType, text)
    : null;
  const trimmedSearchQuery = searchQuery.trim();
  const isSearching = trimmedSearchQuery.length > 0;

  const { data, error, isError, isFetching, isPending } = useQuery({
    queryKey: ["content", activeCategory, contentPage, trimmedSearchQuery],
    queryFn: ({ signal }) => {
      if (isSearching) {
        return searchContentByCategory(
          activeCategory,
          trimmedSearchQuery,
          contentPage,
          signal,
        );
      }

      return fetchContentByCategory(activeCategory, contentPage, signal);
    },
    enabled: !isForYouPage,
    refetchOnWindowFocus: false,
  });
  const {
    data: favorites = [],
    isFetching: isFetchingFavorites,
    isError: isFavoritesError,
  } = useQuery({
    queryKey: ["favorites", token],
    queryFn: () => getFavorites(token ?? ""),
    enabled: Boolean(token),
    refetchOnWindowFocus: false,
  });
  const addFavoriteMutation = useMutation({
    mutationFn: (input: FavoriteDraft) => {
      if (!token) {
        throw new Error(text.main.addFavoriteLogin);
      }

      return addFavorite(token, {
        contentId: input.contentId,
        name: input.name,
        contentType: input.contentType,
        photoUrl: input.photoUrl,
        status: input.status,
        userRating:
          input.userRating.trim() === "" ? undefined : Number(input.userRating),
        startDate: input.startDate || undefined,
        endDate: input.endDate || undefined,
        moment: input.moment.trim() === "" ? undefined : Number(input.moment),
        comment: input.comment,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites", token] });
      setFavoriteDraft(null);
      setFavoriteFeedback(text.main.favoriteAdded);
      setFavoriteFeedbackType("success");
    },
    onError: (error) => {
      setFavoriteFeedback(
        error instanceof Error ? error.message : text.main.favoriteAddError,
      );
      setFavoriteFeedbackType("error");
    },
  });

  const items = isForYouPage ? [] : (data?.items ?? []);
  const favoriteContentIds = new Set(
    favorites.map((favorite) => favorite.contentId),
  );
  const lastPage = data?.lastPage ?? 1;
  const hasNextPage = data?.hasNextPage ?? false;
  const contentListKey = `${activeCategory}:${contentPage}:${trimmedSearchQuery || "all"}`;
  const shouldShowSkeleton = !isForYouPage && isPending;
  const skeletonCardCount = 10;
  const hasNoResults =
    !isForYouPage && !shouldShowSkeleton && !isError && items.length === 0;

  function handleCategoryChange(category: ContentCategory) {
    setActiveCategory(category);
    setContentPage(1);
    setSearchInput("");
    setSearchQuery("");
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    setContentPage(1);
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearchQuery("");
    setContentPage(1);
  }

  function handleOpenFavoriteDraft(
    contentId: string,
    name: string,
    photoUrl?: string,
  ) {
    const contentType = getContentTypeFromCategory(activeCategory);

    if (!token) {
      setFavoriteFeedback(text.main.addFavoriteLogin);
      setFavoriteFeedbackType("error");
      return;
    }

    if (!contentType) {
      setFavoriteFeedback(text.main.invalidFavoriteCategory);
      setFavoriteFeedbackType("error");
      return;
    }

    setFavoriteFeedback("");
    setFavoriteFeedbackType(null);
    setFavoriteDraft({
      contentId,
      name,
      contentType,
      photoUrl,
      status: "watch",
      userRating: "",
      startDate: "",
      endDate: "",
      moment: "",
      comment: "",
    });
  }

  function handleFavoriteDraftChange<Value extends keyof FavoriteDraft>(
    field: Value,
    value: FavoriteDraft[Value],
  ) {
    setFavoriteDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  function handleFavoriteDraftSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (favoriteDraft) {
      addFavoriteMutation.mutate(favoriteDraft);
    }
  }

  const errorMessage =
    error instanceof Error ? error.message : text.main.categoryLoadError;

  return (
    <main className="main-page">
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onProfileClick={onProfileClick}
      />

      <section className="content-shell" aria-labelledby="content-title">
        <div className="content-heading">
          <div>
            <h1 id="content-title">{activeCategoryLabel}</h1>
            {/* <p>{pageDescription}</p> */}
          </div>

          {!isForYouPage && (
            <div
              className="pagination-status"
              aria-label={text.main.currentPage}
            >
              {text.main.page} {contentPage}
            </div>
          )}
        </div>

        {!isForYouPage && (
          <form className="content-search" onSubmit={handleSearchSubmit}>
            {/* <label htmlFor="content-search-input">Pesquisar</label> */}
            <div className="content-search-controls">
              <input
                id="content-search-input"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={text.main.searchPlaceholder.replace(
                  "{category}",
                  activeCategoryLabel,
                )}
                autoComplete="off"
              />
              <button type="submit" disabled={isFetching}>
                {text.main.searchButton}
              </button>
              {isSearching && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleClearSearch}
                  disabled={isFetching}
                >
                  {text.main.clearButton}
                </button>
              )}
            </div>
          </form>
        )}

        {isError && !shouldShowSkeleton && (
          <p className="content-message error-message">{errorMessage}</p>
        )}

        {hasNoResults && (
          <p className="content-message">{text.main.emptyResults}</p>
        )}

        {favoriteFeedback && (
          <p className={`content-feedback ${favoriteFeedbackType ?? ""}`}>
            {favoriteFeedback}
          </p>
        )}

        {isFavoritesError && token && (
          <p className="content-feedback error">
            {text.main.favoritesLoadError}
          </p>
        )}

        {!isForYouPage && !isError && !hasNoResults && (
          <div
            className="content-grid"
            key={contentListKey}
            aria-busy={shouldShowSkeleton}
          >
            {shouldShowSkeleton
              ? Array.from({ length: skeletonCardCount }).map((_, index) => (
                  <article
                    className="content-card content-card-skeleton"
                    key={`content-skeleton-${index}`}
                    aria-hidden="true"
                  >
                    <div className="content-poster skeleton-block" />

                    <div className="content-info">
                      <div className="skeleton-line skeleton-title" />
                      <div className="skeleton-meta">
                        <span className="skeleton-line" />
                        <span className="skeleton-line" />
                        <span className="skeleton-line" />
                      </div>
                      <div className="skeleton-copy">
                        <span className="skeleton-line" />
                        <span className="skeleton-line" />
                        <span className="skeleton-line" />
                      </div>
                    </div>
                  </article>
                ))
              : items.map((item, index) => {
                  const isFavorited = favoriteContentIds.has(item.id);
                  const canClickFavorite =
                    Boolean(item.id) &&
                    !isFavorited &&
                    !addFavoriteMutation.isPending &&
                    !isFetchingFavorites;

                  return (
                    <article
                      className={`content-card ${isFavorited ? "is-favorited" : ""}`}
                      key={`${contentListKey}:${item.id || item.title}:${index}`}
                    >
                      <div className="content-poster">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                          />
                        ) : (
                          <span>{text.main.noImage}</span>
                        )}
                      </div>

                      <div className="content-info">
                        <h2>{item.title}</h2>
                        <dl>
                          <div>
                            <dt>{text.main.typeLabel}</dt>
                            <dd>{item.meta.first}</dd>
                          </div>
                          <div>
                            <dt>{text.main.ratingLabel}</dt>
                            <dd>{item.meta.second}</dd>
                          </div>
                          <div>
                            <dt>{text.main.yearLabel}</dt>
                            <dd>{item.meta.third}</dd>
                          </div>
                        </dl>
                        <p>{item.description ?? text.main.noDescription}</p>
                        <button
                          type="button"
                          className="favorite-button"
                          onClick={() =>
                            handleOpenFavoriteDraft(
                              item.id,
                              item.title,
                              item.image,
                            )
                          }
                          disabled={!canClickFavorite}
                        >
                          {isFavorited
                            ? text.main.favorited
                            : text.main.addFavorite}
                        </button>
                      </div>
                    </article>
                  );
                })}
          </div>
        )}

        {!isForYouPage && !hasNoResults && (
          <div>
            <div className="pagination-actions">
              {/* Botão Voltar (Seta para Esquerda) */}
              <button
                type="button"
                onClick={() =>
                  setContentPage((currentPage) => Math.max(currentPage - 1, 1))
                }
                disabled={contentPage === 1 || isFetching}
              >
                ←
              </button>

              {/* Botão Restart (Seta Girando no Meio) */}
              <button
                type="button"
                onClick={() => setContentPage(1)}
                disabled={isFetching}
              >
                ↻
              </button>

              {/* Botão Avançar (Seta para Direita) */}
              <button
                type="button"
                onClick={() => setContentPage((currentPage) => currentPage + 1)}
                disabled={!hasNextPage || isFetching}
              >
                →
              </button>
            </div>
            <div className="pagination-number">
              <span>{contentPage /*} / {lastPage*/}</span>
            </div>
          </div>
        )}
      </section>

      {favoriteDraft && (
        <div
          className="favorite-modal-backdrop"
          role="presentation"
          onClick={() => setFavoriteDraft(null)}
        >
          <section
            className="favorite-modal"
            aria-labelledby="favorite-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="favorite-modal-heading">
              <div>
                <h2 id="favorite-modal-title">{text.main.addFavoriteTitle}</h2>
                <p>{favoriteDraft.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setFavoriteDraft(null)}
                disabled={addFavoriteMutation.isPending}
              >
                {text.main.close}
              </button>
            </div>

            <form
              className="favorite-modal-form"
              onSubmit={handleFavoriteDraftSubmit}
            >
              <div className="favorite-modal-grid">
                <label>
                  <span>{text.main.statusLabel}</span>
                  <select
                    value={favoriteDraft.status}
                    onChange={(event) =>
                      handleFavoriteDraftChange(
                        "status",
                        event.target.value as FavoriteStatus,
                      )
                    }
                    disabled={addFavoriteMutation.isPending}
                  >
                    {favoriteStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>{text.main.ratingLabel}</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={favoriteDraft.userRating}
                    onChange={(event) =>
                      handleFavoriteDraftChange(
                        "userRating",
                        event.target.value,
                      )
                    }
                    disabled={addFavoriteMutation.isPending}
                  />
                </label>

                <label>
                  <span>{text.main.startLabel}</span>
                  <input
                    type="date"
                    value={favoriteDraft.startDate}
                    onChange={(event) =>
                      handleFavoriteDraftChange("startDate", event.target.value)
                    }
                    disabled={addFavoriteMutation.isPending}
                  />
                </label>

                <label>
                  <span>{text.main.endLabel}</span>
                  <input
                    type="date"
                    value={favoriteDraft.endDate}
                    onChange={(event) =>
                      handleFavoriteDraftChange("endDate", event.target.value)
                    }
                    disabled={addFavoriteMutation.isPending}
                  />
                </label>

                {favoriteDraftMomentLabel && (
                  <label>
                    <span>{favoriteDraftMomentLabel}</span>
                    <input
                      type="number"
                      min="0"
                      value={favoriteDraft.moment}
                      onChange={(event) =>
                        handleFavoriteDraftChange("moment", event.target.value)
                      }
                      disabled={addFavoriteMutation.isPending}
                    />
                  </label>
                )}
              </div>

              <label className="favorite-modal-comment">
                <span>{text.main.commentLabel}</span>
                <textarea
                  value={favoriteDraft.comment}
                  onChange={(event) =>
                    handleFavoriteDraftChange("comment", event.target.value)
                  }
                  disabled={addFavoriteMutation.isPending}
                />
              </label>

              <div className="favorite-modal-actions">
                <button
                  type="button"
                  onClick={() => setFavoriteDraft(null)}
                  disabled={addFavoriteMutation.isPending}
                >
                  {text.main.cancel}
                </button>
                <button
                  type="submit"
                  className="primary-favorite-action"
                  disabled={addFavoriteMutation.isPending}
                >
                  {addFavoriteMutation.isPending
                    ? text.main.adding
                    : text.main.add}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
