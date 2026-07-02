import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import {
  getMe,
  loginUser,
  registerUser,
  verifyEmail as verifyEmailRequest,
  type AuthUser,
  type LoginUserInput,
  type RegisterUserInput,
  type VerifyEmailInput,
} from "./authApi";
import { AuthContext, type AuthContextValue } from "./authContextValue";
import { getToken, removeToken, saveToken } from "./tokenStorage";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getToken());
  const [initialLoading, setInitialLoading] = useState(true);

  async function loadUser() {
    const storedToken = getToken();

    if (!storedToken) {
      setUser(null);
      setToken(null);
      return;
    }

    try {
      const currentUser = await getMe(storedToken);
      setUser(currentUser);
      setToken(storedToken);
    } catch {
      removeToken();
      setUser(null);
      setToken(null);
      throw new Error("Sessao expirada. Faca login novamente.");
    }
  }

  async function login(input: LoginUserInput) {
    const result = await loginUser(input);

    if (!result.token) {
      throw new Error("Login realizado, mas o token nao foi retornado.");
    }

    saveToken(result.token);
    setToken(result.token);

    if (result.user) {
      setUser(result.user);
      return;
    }

    const currentUser = await getMe(result.token);
    setUser(currentUser);
  }

  function logout() {
    removeToken();
    setUser(null);
    setToken(null);
  }

  async function register(input: RegisterUserInput) {
    await registerUser(input);
  }

  async function verifyEmail(input: VerifyEmailInput) {
    await verifyEmailRequest(input);
  }

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      try {
        await loadUser();
      } catch {
        if (active) {
          removeToken();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      initialLoading,
      login,
      logout,
      register,
      verifyEmail,
      loadUser,
    }),
    [initialLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
