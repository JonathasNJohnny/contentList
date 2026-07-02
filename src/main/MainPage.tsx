import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  fetchContentByCategory,
  type ContentCategory,
} from "../content/contentApi";
import { Navbar } from "../navbar";
import "./MainPage.css";

export function MainPage() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("Animes");
  const [contentPage, setContentPage] = useState(1);

  const { data, error, isError, isFetching, isPending } = useQuery({
    queryKey: ["content", activeCategory, contentPage],
    queryFn: ({ signal }) => fetchContentByCategory(activeCategory, contentPage, signal),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const lastPage = data?.lastPage ?? 1;
  const hasNextPage = data?.hasNextPage ?? false;

  const pageDescription = useMemo(() => {
    if (activeCategory === "Todos") {
      return "Conteudos de todas as categorias";
    }

    return "Catalogo paginado";
  }, [activeCategory]);

  function handleCategoryChange(category: ContentCategory) {
    setActiveCategory(category);
    setContentPage(1);
  }

  const errorMessage =
    error instanceof Error ? error.message : "Nao foi possivel carregar esta categoria agora.";

  return (
    <main className="main-page">
      <Navbar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <section className="content-shell" aria-labelledby="content-title">
        <div className="content-heading">
          <div>
            <h1 id="content-title">{activeCategory}</h1>
            <p>{pageDescription}</p>
          </div>

          <div className="pagination-status" aria-label="Pagina atual">
            Pagina {contentPage}
          </div>
        </div>

        {isError && <p className="content-message error-message">{errorMessage}</p>}
        {isPending && <p className="content-message">Carregando conteudos...</p>}
        {isFetching && !isPending && (
          <p className="content-message">Atualizando conteudos...</p>
        )}

        {!isPending && !isError && (
          <div className="content-grid">
            {items.map((item) => (
              <article className="content-card" key={item.id}>
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

        {activeCategory !== "Todos" && (
          <div className="pagination-actions">
            <button
              type="button"
              onClick={() => setContentPage((currentPage) => Math.max(1, currentPage - 1))}
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
