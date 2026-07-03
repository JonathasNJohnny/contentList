export type ContentCategory =
  | "NULL"
  | "Para Voce"
  | "Animes"
  | "Mangas"
  | "Filmes"
  | "Series"
  | "Livros"
  | "Jogos";

export type ContentItem = {
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

export type ContentResponse = {
  items: ContentItem[];
  lastPage: number;
  hasNextPage: boolean;
};

type ApiContentResponse =
  | ContentItem[]
  | {
      items?: ContentItem[];
      data?: ContentItem[];
      lastPage?: number;
      totalPages?: number;
      hasNextPage?: boolean;
      pagination?: {
        lastPage?: number;
        totalPages?: number;
        hasNextPage?: boolean;
      };
    };

export const contentCategories: ContentCategory[] = [
  "NULL",
  "Para Voce",
  "Animes",
  "Mangas",
  "Filmes",
  "Series",
  "Livros",
  "Jogos",
];

export const contentCategoryLabels: Record<ContentCategory, string> = {
  NULL: "NULL",
  "Para Voce": "Para Você",
  Animes: "Animes",
  Mangas: "Mangas",
  Filmes: "Filmes",
  Series: "Series",
  Livros: "Livros",
  Jogos: "Jogos",
};

const categorySlugs: Record<ContentCategory, string> = {
  NULL: "NULL",
  "Para Voce": "todos",
  Animes: "animes",
  Mangas: "mangas",
  Filmes: "filmes",
  Series: "series",
  Livros: "livros",
  Jogos: "jogos",
};

const apiUrl = import.meta.env.API_URL as string | undefined;

function getApiBaseUrl() {
  if (!apiUrl) {
    throw new Error("Configure API_URL para carregar os conteudos.");
  }

  return apiUrl.replace(/\/$/, "");
}

function normalizeContentResponse(result: ApiContentResponse): ContentResponse {
  if (Array.isArray(result)) {
    return {
      items: result,
      lastPage: 1,
      hasNextPage: false,
    };
  }

  const items = result.items ?? result.data ?? [];
  const lastPage =
    result.lastPage ??
    result.totalPages ??
    result.pagination?.lastPage ??
    result.pagination?.totalPages ??
    1;
  const hasNextPage =
    result.hasNextPage ?? result.pagination?.hasNextPage ?? false;

  return {
    items,
    lastPage,
    hasNextPage,
  };
}

export async function fetchContentByCategory(
  category: ContentCategory,
  page: number,
  signal?: AbortSignal,
): Promise<ContentResponse> {
  const slug = categorySlugs[category];
  const url = new URL(`${getApiBaseUrl()}/api/content/${slug}/${page}`);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os conteudos agora.");
  }

  const result = (await response.json()) as ApiContentResponse;

  return normalizeContentResponse(result);
}

export async function searchContentByCategory(
  category: ContentCategory,
  query: string,
  page: number,
  signal?: AbortSignal,
): Promise<ContentResponse> {
  const slug = categorySlugs[category];
  const url = new URL(`${getApiBaseUrl()}/api/content/${slug}/search/${page}`);
  url.searchParams.set("query", query);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("Nao foi possivel pesquisar os conteudos agora.");
  }

  const result = (await response.json()) as ApiContentResponse;

  return normalizeContentResponse(result);
}
