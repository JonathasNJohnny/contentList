import { getAuthorizationHeader } from "../authentication/tokenStorage";
import type { AuthUser } from "../authentication";

export type UpdateNameInput = {
  name: string;
};

type ProfileApiResponse = {
  user?: AuthUser;
  data?: AuthUser | { user?: AuthUser };
  message?: string;
  error?: string;
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
