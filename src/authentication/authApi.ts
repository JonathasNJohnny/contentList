import { getAuthorizationHeader } from "./tokenStorage";

export type AuthUser = {
  pfp: string;
  id?: string;
  _id?: string;
  name: string;
  email: string;
  emailVerified?: boolean;
};

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type VerifyEmailInput = {
  email: string;
  code: string;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  user: AuthUser | null;
  token: string | null;
  message?: string;
};

type AuthApiResponse = {
  user?: AuthUser;
  data?: AuthUser | { user?: AuthUser; token?: string; accessToken?: string };
  token?: string;
  accessToken?: string;
  message?: string;
  error?: string;
};

const apiUrl = import.meta.env.API_URL as string | undefined;

function getApiBaseUrl() {
  if (!apiUrl) {
    throw new Error("Configure API_URL para usar a autenticacao.");
  }

  return apiUrl.replace(/\/$/, "");
}

async function readResponse(response: Response): Promise<AuthApiResponse> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return {};
  }

  return (await response.json()) as AuthApiResponse;
}

function getFriendlyAuthError(status: number, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  if (status === 401) {
    return "Email ou senha incorretos.";
  }

  if (status === 403) {
    return "Email nao verificado. Confirme o codigo enviado antes de entrar.";
  }

  if (status === 419 || status === 440) {
    return "Sessao expirada. Faca login novamente.";
  }

  return "Nao foi possivel completar a autenticacao agora.";
}

async function requestAuth(
  path: string,
  init: RequestInit,
): Promise<AuthApiResponse> {
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
      getFriendlyAuthError(response.status, result.error ?? result.message),
    );
  }

  return result;
}

function normalizeAuthResult(result: AuthApiResponse): AuthResult {
  const data = result.data;
  const dataToken =
    data && "token" in data ? (data.token ?? data.accessToken ?? null) : null;
  const dataUser = data && "user" in data ? (data.user ?? null) : null;

  return {
    user: result.user ?? dataUser ?? (data && "email" in data ? data : null),
    token: result.token ?? result.accessToken ?? dataToken,
    message: result.message,
  };
}

export async function registerUser(input: RegisterUserInput) {
  const result = await requestAuth("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeAuthResult(result);
}

export async function verifyEmail(input: VerifyEmailInput) {
  const result = await requestAuth("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeAuthResult(result);
}

export async function loginUser(input: LoginUserInput) {
  const result = await requestAuth("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return normalizeAuthResult(result);
}

export async function getMe(token: string) {
  const result = await requestAuth("/auth/me", {
    method: "GET",
    headers: getAuthorizationHeader(token),
  });

  const authResult = normalizeAuthResult(result);

  if (!authResult.user) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  return authResult.user;
}
