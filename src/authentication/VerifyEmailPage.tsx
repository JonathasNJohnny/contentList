import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "./authContextValue";
import "./AuthenticationPage.css";

type VerifyEmailPageProps = {
  initialEmail?: string;
  onVerified: () => void;
  onBackToLogin: () => void;
};

export function VerifyEmailPage({
  initialEmail = "",
  onVerified,
  onBackToLogin,
}: VerifyEmailPageProps) {
  const { verifyEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(
    () => email.trim().length > 0 && code.trim().length > 0,
    [code, email],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setStatus("error");
      setMessage("Informe o email e o codigo de verificacao.");
      return;
    }

    setStatus("loading");
    setMessage("Verificando codigo...");

    try {
      await verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });
      setStatus("success");
      setMessage("Email verificado com sucesso. Voce ja pode fazer login.");
      window.setTimeout(onVerified, 900);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel verificar o email agora.",
      );
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="verify-email-title">
        <div className="auth-heading">
          <h1 id="verify-email-title">Verificar email</h1>
          <p>Digite o codigo enviado para seu email.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              disabled={status === "loading"}
            />
          </label>

          <label>
            <span>Codigo de verificacao</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o codigo"
              autoComplete="one-time-code"
              disabled={status === "loading"}
            />
          </label>

          {message && (
            <p className={`auth-feedback ${status}`} role="status">
              {message}
            </p>
          )}

          <div className="auth-actions single-action">
            <button
              type="submit"
              className="primary-action"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </form>

        <button type="button" className="mode-link" onClick={onBackToLogin}>
          Voltar para login
        </button>
      </section>
    </main>
  );
}
