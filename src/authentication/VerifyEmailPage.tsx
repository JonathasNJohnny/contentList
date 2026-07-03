import { useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "../pageText";
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
  const { text } = useLanguage();
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
      setMessage(text.verifyEmail.required);
      return;
    }

    setStatus("loading");
    setMessage(text.verifyEmail.checking);

    try {
      await verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });
      setStatus("success");
      setMessage(text.verifyEmail.success);
      window.setTimeout(onVerified, 900);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : text.verifyEmail.error,
      );
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="verify-email-title">
        <div className="auth-heading">
          <h1 id="verify-email-title">{text.verifyEmail.title}</h1>
          <p>{text.verifyEmail.description}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>{text.verifyEmail.emailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={text.verifyEmail.emailPlaceholder}
              autoComplete="email"
              disabled={status === "loading"}
            />
          </label>

          <label>
            <span>{text.verifyEmail.codeLabel}</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={text.verifyEmail.codePlaceholder}
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
              {status === "loading"
                ? text.verifyEmail.checkingButton
                : text.verifyEmail.submit}
            </button>
          </div>
        </form>

        <button type="button" className="mode-link" onClick={onBackToLogin}>
          {text.verifyEmail.backToLogin}
        </button>
      </section>
    </main>
  );
}
