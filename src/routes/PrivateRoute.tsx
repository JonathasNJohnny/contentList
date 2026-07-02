import { useEffect, type ReactNode } from "react";
import { useAuth } from "../authentication/authContextValue";

type PrivateRouteProps = {
  children: ReactNode;
  onBlocked: () => void;
};

export function PrivateRoute({ children, onBlocked }: PrivateRouteProps) {
  const { initialLoading, isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!initialLoading && (!token || !isAuthenticated)) {
      onBlocked();
    }
  }, [initialLoading, isAuthenticated, onBlocked, token]);

  if (initialLoading) {
    return (
      <main className="route-loading" aria-busy="true">
        Carregando sessao...
      </main>
    );
  }

  if (!token || !isAuthenticated) {
    return null;
  }

  return children;
}
