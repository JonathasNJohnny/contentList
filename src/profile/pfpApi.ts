import { getAuthorizationHeader } from "../authentication/tokenStorage";
import type { AuthUser } from "../authentication";
import type { Favorite } from "../features/favorites";

export type UpdateNameInput = {
  name: string;
};

export type PublicProfileUser = {
  id?: string;
  _id?: string;
  name: string;
  favorites: Favorite[];
};

type ProfileApiResponse = {
  user?: AuthUser | PublicProfileUser;
  users?: PublicProfileUser[];
  favorites?: Favorite[];
  items?: Favorite[];
  data?:
    | AuthUser
    | PublicProfileUser
    | PublicProfileUser[]
    | {
        user?: AuthUser | PublicProfileUser;
        users?: PublicProfileUser[];
        profile?: PublicProfileUser;
        favorites?: Favorite[];
        items?: Favorite[];
      };
  message?: string;
  error?: string;
};

type PublicProfilePayload = {
  id?: string;
  _id?: string;
  name?: string;
  favorites?: Favorite[];
  items?: Favorite[];
};

const apiUrl = import.meta.env.API_URL as string | undefined;

function getApiBaseUrl() {
  if (!apiUrl) {
    throw new Error("Configure API_URL para atualizar o perfil.");
  }

  return apiUrl.replace(/\/$/, "");
}

async function readResponse(response: Response): Promise<ProfileApiResponse> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return {};
  }

  return (await response.json()) as ProfileApiResponse;
}

function getFriendlyProfileError(status: number, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  if (status === 404) {
    return "Usuario nao encontrado.";
  }

  if (status === 400) {
    return "Informe um nome valido.";
  }

  if (status === 401 || status === 419 || status === 440) {
    return "Sessao expirada. Faca login novamente.";
  }

  return "Nao foi possivel atualizar o perfil agora.";
}

async function requestProfile(
  path: string,
  init: RequestInit,
): Promise<ProfileApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const result = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getFriendlyProfileError(response.status, result.error ?? result.message),
    );
  }

  return result;
}

function normalizeProfileUser(result: ProfileApiResponse) {
  const data = result.data;
  const dataUser = data && "user" in data ? (data.user ?? null) : null;

  return result.user ?? dataUser ?? (data && "email" in data ? data : null);
}

function normalizePublicProfileUser(
  result: ProfileApiResponse,
): PublicProfileUser | null {
  const data = result.data;
  const dataUser = data && "user" in data ? (data.user ?? null) : null;
  const dataProfile = data && "profile" in data ? (data.profile ?? null) : null;
  const rawUser = (result.user ??
    dataUser ??
    dataProfile ??
    data ??
    null) as PublicProfilePayload | null;

  if (!rawUser?.name) {
    return null;
  }

  const favorites =
    result.favorites ??
    result.items ??
    ("favorites" in rawUser ? rawUser.favorites : undefined) ??
    ("items" in rawUser ? rawUser.items : undefined) ??
    (data && "favorites" in data ? data.favorites : undefined) ??
    (data && "items" in data ? data.items : undefined) ??
    [];

  return {
    id: rawUser.id,
    _id: rawUser._id,
    name: rawUser.name,
    favorites,
  };
}

function normalizePublicUsers(result: ProfileApiResponse): PublicProfileUser[] {
  const data = result.data;
  const users =
    result.users ??
    (Array.isArray(data) ? data : undefined) ??
    (data && "users" in data ? data.users : undefined) ??
    [];

  return users
    .filter((user): user is PublicProfileUser => Boolean(user?.name))
    .map((user) => ({
      name: user.name,
      favorites: [],
    }));
}

export async function updateName(token: string, input: UpdateNameInput) {
  const result = await requestProfile("/auth/me/name", {
    method: "PUT",
    headers: getAuthorizationHeader(token),
    body: JSON.stringify(input),
  });
  const user = normalizeProfileUser(result);

  if (!user) {
    throw new Error("Nome atualizado, mas o usuario nao foi retornado.");
  }

  return user;
}

export async function getUserProfileByName(name: string) {
  const result = await requestProfile(
    `/auth/other/user/${encodeURIComponent(name)}`,
    {
      method: "GET",
    },
  );
  const user = normalizePublicProfileUser(result);

  if (!user) {
    throw new Error("Usuario nao encontrado.");
  }

  return user;
}

export async function getOtherUsers() {
  const result = await requestProfile("/auth/other/user", {
    method: "GET",
  });

  return normalizePublicUsers(result);
}
