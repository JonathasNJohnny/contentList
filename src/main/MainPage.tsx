import { useQuery } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  contentCategoryLabels,
  fetchContentByCategory,
  searchContentByCategory,
  type ContentCategory,
} from "../content/contentApi";
import { Navbar } from "../navbar";
import "./MainPage.css";

const forYouCategory: ContentCategory = "Para Voce";

type MainPageProps = {
  onProfileClick: () => void;
};

export function MainPage({ onProfileClick }: MainPageProps) {
  const [activeCategory, setActiveCategory] =
    useState<ContentCategory>("Animes");
  const [contentPage, setContentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const isForYouPage = activeCategory === forYouCategory;
  const activeCategoryLabel = contentCategoryLabels[activeCategory];
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

  const items = isForYouPage ? [] : (data?.items ?? []);
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

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Nao foi possivel carregar esta categoria agora.";

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
            <div className="pagination-status" aria-label="Pagina atual">
              Pagina {contentPage}
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
                placeholder={`Buscar em ${activeCategoryLabel}`}
                autoComplete="off"
              />
              <button type="submit" disabled={isFetching}>
                Pesquisar
              </button>
              {isSearching && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleClearSearch}
                  disabled={isFetching}
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        )}

        {isError && !shouldShowSkeleton && (
          <p className="content-message error-message">{errorMessage}</p>
        )}

        {hasNoResults && (
          <p className="content-message">Nenhum conteudo encontrado.</p>
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
              : items.map((item, index) => (
                  <article
                    className="content-card"
                    key={`${contentListKey}:${item.id || item.title}:${index}`}
                  >
                    <div className="content-poster">
                      {item.image ? (
                        <img src={item.image} alt={item.title} loading="lazy" />
                      ) : (
                        <span>Sem imagem</span>
                      )}
                    </div>

                    <div className="content-info">
                      <h2>{item.title}</h2>
                      <dl>
                        <div>
                          <dt>Tipo</dt>
                          <dd>{item.meta.first}</dd>
                        </div>
                        <div>
                          <dt>Nota</dt>
                          <dd>{item.meta.second}</dd>
                        </div>
                        <div>
                          <dt>Ano</dt>
                          <dd>{item.meta.third}</dd>
                        </div>
                      </dl>
                      <p>{item.description ?? "Sem descricao disponivel."}</p>
                    </div>
                  </article>
                ))}
          </div>
        )}

        {!isForYouPage && !hasNoResults && (
          <div className="pagination-actions">
            <button
              type="button"
              onClick={() =>
                setContentPage((currentPage) => Math.max(1, currentPage - 1))
              }
              disabled={contentPage === 1 || isFetching}
            >
              Anterior
            </button>
            <span>
              {contentPage} / {lastPage}
            </span>
            <button
              type="button"
              onClick={() => setContentPage((currentPage) => currentPage + 1)}
              disabled={!hasNextPage || isFetching}
            >
              Proxima
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
