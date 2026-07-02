import { createContext, useContext } from "react";
import type {
  AuthUser,
  LoginUserInput,
  RegisterUserInput,
  VerifyEmailInput,
} from "./authApi";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  initialLoading: boolean;
  login: (input: LoginUserInput) => Promise<void>;
  logout: () => void;
  register: (input: RegisterUserInput) => Promise<void>;
  verifyEmail: (input: VerifyEmailInput) => Promise<void>;
  loadUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
