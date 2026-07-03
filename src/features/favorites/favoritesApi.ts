import { getAuthorizationHeader } from "../../authentication/tokenStorage";
import type { ContentCategory } from "../../content/contentApi";

export type FavoriteStatus = "watching" | "watch" | "watched";

export type Favorite = {
  contentId: string;
  name: string;
  contentType: string;
  photoUrl?: string;
  status: FavoriteStatus;
  userRating?: number;
  startDate?: string;
  endDate?: string;
  moment?: number;
  comment?: string;
};

export type AddFavoriteInput = Favorite;

export type UpdateFavoriteInput = Partial<Omit<Favorite, "contentId">>;

type FavoritesApiResponse =
  | Favorite[]
  | {
      favorites?: Favorite[];
      items?: Favorite[];
      data?: Favorite[] | { favorites?: Favorite[]; items?: Favorite[] };
      message?: string;
      error?: string;
    };

const apiUrl = import.meta.env.API_URL as string | undefined;

function getApiBaseUrl() {
  if (!apiUrl) {
    throw new Error("Configure API_URL para usar favoritos.");
  }

  return apiUrl.replace(/\/$/, "");
}

async function readResponse(response: Response): Promise<FavoritesApiResponse> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return {};
  }

  return (await response.json()) as FavoritesApiResponse;
}

function getFriendlyFavoritesError(status: number, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  if (status === 401 || status === 419 || status === 440) {
    return "Sessao expirada. Faca login novamente.";
  }

  if (status === 409) {
    return "Este conteudo ja esta nos favoritos.";
  }

  return "Nao foi possivel atualizar seus favoritos agora.";
}

async function requestFavorites(
  path: string,
  init: RequestInit,
): Promise<FavoritesApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const result = await readResponse(response);

  if (!response.ok) {
    const fallback =
      !Array.isArray(result) && "error" in result
        ? result.error ?? result.message
        : undefined;

    throw new Error(getFriendlyFavoritesError(response.status, fallback));
  }

  return result;
}

function normalizeFavorites(result: FavoritesApiResponse): Favorite[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return (
    result.favorites ??
    result.items ??
    result.data?.favorites ??
    result.data?.items ??
    []
  );
}

export function getContentTypeFromCategory(category: ContentCategory) {
  const map: Partial<Record<ContentCategory, string>> = {
    Animes: "anime",
    Filmes: "movie",
    Series: "series",
    Mangas: "manga",
    Livros: "book",
    Jogos: "game",
  };

  return map[category];
}

export function getMomentLabel(contentType: string) {
  if (contentType === "anime" || contentType === "series") {
    return "Episodio";
  }

  if (contentType === "manga" || contentType === "book") {
    return "Capitulo";
  }

  return null;
}

export async function getFavorites(token: string) {
  const result = await requestFavorites("/favorites", {
    method: "GET",
    headers: getAuthorizationHeader(token),
  });

  return normalizeFavorites(result);
}

export async function addFavorite(token: string, input: AddFavoriteInput) {
  const result = await requestFavorites("/favorites", {
    method: "POST",
    headers: getAuthorizationHeader(token),
    body: JSON.stringify(input),
  });

  return normalizeFavorites(result);
}

export async function updateFavorite(
  token: string,
  contentId: string,
  input: UpdateFavoriteInput,
) {
  const result = await requestFavorites(
    `/favorites/${encodeURIComponent(contentId)}`,
    {
      method: "PATCH",
      headers: getAuthorizationHeader(token),
      body: JSON.stringify(input),
    },
  );

  return normalizeFavorites(result);
}

export async function removeFavorite(token: string, contentId: string) {
  await requestFavorites(`/favorites/${encodeURIComponent(contentId)}`, {
    method: "DELETE",
    headers: getAuthorizationHeader(token),
  });
}
