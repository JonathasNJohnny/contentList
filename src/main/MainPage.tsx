import { useEffect, useMemo, useState } from "react";
import { Navbar, type ContentCategory } from "../navbar";
import "./MainPage.css";

type ContentItem = {
  id: string;
  title: string;
  image?: string;
  description?: string;
  meta: {
    first: string;
    second: string;
    third: string;
  };
};

type LoadResult = {
  items: ContentItem[];
  lastPage: number;
  hasNextPage: boolean;
};

type AnimeImage = {
  image_url?: string;
  large_image_url?: string;
};

type JikanItem = {
  mal_id: number;
  title: string;
  title_english?: string;
  images?: {
    jpg?: AnimeImage;
    webp?: AnimeImage;
  };
  episodes?: number;
  chapters?: number;
  volumes?: number;
  score?: number;
  type?: string;
  synopsis?: string;
};

type JikanResponse = {
  data: JikanItem[];
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
  };
};

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
};

type TmdbResponse = {
  page: number;
  total_pages: number;
  results: TmdbItem[];
};

type RawgItem = {
  id: number;
  name: string;
  background_image?: string;
  rating?: number;
  released?: string;
  genres?: Array<{ name: string }>;
};

type RawgResponse = {
  next?: string | null;
  count: number;
  results: RawgItem[];
};

type OpenLibraryBookItem = {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
};

type OpenLibraryResponse = {
  numFound: number;
  docs: OpenLibraryBookItem[];
};

const tmdbBearerToken = import.meta.env.VITE_TMDB_ACCESS_TOKEN as string | undefined;
const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const rawgApiKey = import.meta.env.VITE_RAWG_API_KEY as string | undefined;
const jikanBaseUrl = import.meta.env.VITE_JIKAN_BASE_URL || "https://api.jikan.moe/v4";
const jikanAnimeEndpoint = import.meta.env.VITE_JIKAN_ANIME_ENDPOINT || "/anime";
const jikanMangaEndpoint = import.meta.env.VITE_JIKAN_MANGA_ENDPOINT || "/manga";
const tmdbBaseUrl = import.meta.env.VITE_TMDB_BASE_URL || "https://api.themoviedb.org/3";
const tmdbImageBaseUrl =
  import.meta.env.VITE_TMDB_IMAGE_BASE_URL || "https://image.tmdb.org/t/p/w500";
const tmdbMovieEndpoint =
  import.meta.env.VITE_TMDB_TRENDING_MOVIE_ENDPOINT || "/trending/movie/week";
const tmdbTvEndpoint = import.meta.env.VITE_TMDB_TRENDING_TV_ENDPOINT || "/trending/tv/week";
const rawgBaseUrl = import.meta.env.VITE_RAWG_BASE_URL || "https://api.rawg.io/api";
const rawgGamesEndpoint = import.meta.env.VITE_RAWG_GAMES_ENDPOINT || "/games";
const openLibrarySearchUrl =
  import.meta.env.VITE_OPEN_LIBRARY_SEARCH_URL || "https://openlibrary.org/search.json";

const implementedCategories = new Set<ContentCategory>([
  "Todos",
  "Animes",
  "Mangas",
  "Filmes",
  "Séries",
  "Livros",
  "Jogos",
]);

function getJikanImage(item: JikanItem) {
  return (
    item.images?.webp?.large_image_url ??
    item.images?.jpg?.large_image_url ??
    item.images?.jpg?.image_url
  );
}

function yearFromDate(date?: string) {
  return date ? date.slice(0, 4) : "-";
}

function buildApiUrl(baseUrl: string, endpoint: string) {
  return new URL(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`);
}

async function loadJikanContent(
  category: "Animes" | "Mangas",
  page: number,
  signal: AbortSignal,
): Promise<LoadResult> {
  const endpoint = category === "Animes" ? jikanAnimeEndpoint : jikanMangaEndpoint;
  const url = buildApiUrl(jikanBaseUrl, endpoint);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Nao foi possivel carregar ${category.toLowerCase()}.`);
  }

  const result = (await response.json()) as JikanResponse;

  return {
    items: result.data.map((item) => ({
      id: `${category}-${item.mal_id}`,
      title: item.title_english || item.title,
      image: getJikanImage(item),
      description: item.synopsis,
      meta:
        category === "Animes"
          ? {
              first: item.type ?? "-",
              second: item.score ? String(item.score) : "-",
              third: item.episodes ? String(item.episodes) : "-",
            }
          : {
              first: item.type ?? "-",
              second: item.score ? String(item.score) : "-",
              third: item.chapters ?? item.volumes ? String(item.chapters ?? item.volumes) : "-",
            },
    })),
    lastPage: result.pagination?.last_visible_page ?? page,
    hasNextPage: Boolean(result.pagination?.has_next_page),
  };
}

async function loadTmdbContent(
  category: "Filmes" | "Séries",
  page: number,
  signal: AbortSignal,
): Promise<LoadResult> {
  if (!tmdbBearerToken && !tmdbApiKey) {
    throw new Error("Configure VITE_TMDB_ACCESS_TOKEN ou VITE_TMDB_API_KEY para usar o TMDB.");
  }

  const url = buildApiUrl(
    tmdbBaseUrl,
    category === "Filmes" ? tmdbMovieEndpoint : tmdbTvEndpoint,
  );
  url.searchParams.set("page", String(page));

  if (tmdbApiKey && !tmdbBearerToken) {
    url.searchParams.set("api_key", tmdbApiKey);
  }

  const response = await fetch(url, {
    signal,
    headers: tmdbBearerToken
      ? {
          Authorization: `Bearer ${tmdbBearerToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    throw new Error(`Nao foi possivel carregar ${category.toLowerCase()}.`);
  }

  const result = (await response.json()) as TmdbResponse;

  return {
    items: result.results.map((item) => ({
      id: `${category}-${item.id}`,
      title: item.title || item.name || "Sem titulo",
      image: item.poster_path
        ? `${tmdbImageBaseUrl.replace(/\/$/, "")}${item.poster_path}`
        : undefined,
      description: item.overview,
      meta: {
        first: category === "Filmes" ? "Filme" : "Serie",
        second: item.vote_average ? item.vote_average.toFixed(1) : "-",
        third: yearFromDate(item.release_date ?? item.first_air_date),
      },
    })),
    lastPage: result.total_pages,
    hasNextPage: page < result.total_pages,
  };
}

async function loadGames(page: number, signal: AbortSignal): Promise<LoadResult> {
  if (!rawgApiKey) {
    throw new Error("Categoria ainda nao implementada.");
  }

  const url = buildApiUrl(rawgBaseUrl, rawgGamesEndpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("key", rawgApiKey);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar jogos.");
  }

  const result = (await response.json()) as RawgResponse;

  return {
    items: result.results.map((item) => ({
      id: `Jogos-${item.id}`,
      title: item.name,
      image: item.background_image,
      description: item.genres?.map((genre) => genre.name).join(", ") || "Sem generos informados.",
      meta: {
        first: "Jogo",
        second: item.rating ? String(item.rating) : "-",
        third: yearFromDate(item.released),
      },
    })),
    lastPage: Math.max(1, Math.ceil(result.count / 20)),
    hasNextPage: Boolean(result.next),
  };
}

async function loadBooks(page: number, signal: AbortSignal): Promise<LoadResult> {
  const maxResults = 50;
  const url = new URL(openLibrarySearchUrl);
  url.searchParams.set("q", "subject:fiction");
  url.searchParams.set("limit", String(maxResults));
  url.searchParams.set("page", String(page));

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar livros.");
  }

  const result = (await response.json()) as OpenLibraryResponse;

  return {
    items: result.docs.map((item) => ({
      id: `Livros-${item.key}`,
      title: item.title ?? "Sem titulo",
      image: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
        : undefined,
      description: item.subject?.slice(0, 6).join(", "),
      meta: {
        first: item.author_name?.[0] ?? "Livro",
        second: item.number_of_pages_median ? `${item.number_of_pages_median} p.` : "-",
        third: item.first_publish_year ? String(item.first_publish_year) : "-",
      },
    })),
    lastPage: Math.max(1, Math.ceil(result.numFound / maxResults)),
    hasNextPage: page * maxResults < result.numFound,
  };
}

async function loadCategory(
  category: ContentCategory,
  page: number,
  signal: AbortSignal,
): Promise<LoadResult> {
  if (category === "Animes" || category === "Mangas") {
    return loadJikanContent(category, page, signal);
  }

  if (category === "Filmes" || category === "Séries") {
    return loadTmdbContent(category, page, signal);
  }

  if (category === "Jogos") {
    return loadGames(page, signal);
  }

  if (category === "Livros") {
    return loadBooks(page, signal);
  }

  throw new Error("Categoria ainda nao implementada.");
}

async function loadAll(signal: AbortSignal): Promise<LoadResult> {
  const loaders: Array<Promise<LoadResult>> = [
    loadJikanContent("Animes", 1, signal),
    loadJikanContent("Mangas", 1, signal),
    loadBooks(1, signal),
  ];

  if (tmdbBearerToken || tmdbApiKey) {
    loaders.push(loadTmdbContent("Filmes", 1, signal));
    loaders.push(loadTmdbContent("Séries", 1, signal));
  }

  if (rawgApiKey) {
    loaders.push(loadGames(1, signal));
  }

  const settledResults = await Promise.allSettled(loaders);
  const results = settledResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (results.length === 0) {
    throw new Error("Nao foi possivel carregar os conteudos agora.");
  }

  return {
    items: results.flatMap((result) => result.items.slice(0, 8)),
    lastPage: 1,
    hasNextPage: false,
  };
}

export function MainPage() {
  const [activeCategory, setActiveCategory] =
    useState<ContentCategory>("Animes");
  const [contentPage, setContentPage] = useState(1);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImplemented = implementedCategories.has(activeCategory);

  useEffect(() => {
    if (!isImplemented) {
      setItems([]);
      setLastPage(1);
      setHasNextPage(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadContent() {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          activeCategory === "Todos"
            ? await loadAll(controller.signal)
            : await loadCategory(activeCategory, contentPage, controller.signal);

        setItems(result.items);
        setLastPage(result.lastPage);
        setHasNextPage(result.hasNextPage);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar esta categoria agora.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();

    return () => controller.abort();
  }, [activeCategory, contentPage, isImplemented]);

  const pageDescription = useMemo(() => {
    if (!isImplemented) {
      return "Em breve";
    }

    if (activeCategory === "Todos") {
      return "Conteudos das categorias implementadas";
    }

    return "Catalogo paginado";
  }, [activeCategory, isImplemented]);

  function handleCategoryChange(category: ContentCategory) {
    setActiveCategory(category);
    setContentPage(1);
  }

  return (
    <main className="main-page">
      <Navbar activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <section className="content-shell" aria-labelledby="content-title">
        <div className="content-heading">
          <div>
            <h1 id="content-title">{activeCategory}</h1>
            <p>{pageDescription}</p>
          </div>

          {isImplemented && (
            <div className="pagination-status" aria-label="Pagina atual">
              Pagina {contentPage}
            </div>
          )}
        </div>

        {isImplemented ? (
          <>
            {error && <p className="content-message error-message">{error}</p>}
            {isLoading && <p className="content-message">Carregando conteudos...</p>}

            {!isLoading && !error && (
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
                  disabled={contentPage === 1 || isLoading}
                >
                  Anterior
                </button>
                <span>
                  {contentPage} / {lastPage}
                </span>
                <button
                  type="button"
                  onClick={() => setContentPage((currentPage) => currentPage + 1)}
                  disabled={!hasNextPage || isLoading}
                >
                  Proxima
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="content-message">Categoria ainda nao implementada.</p>
        )}
      </section>
    </main>
  );
}
