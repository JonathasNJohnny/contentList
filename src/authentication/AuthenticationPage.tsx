import { useState, type FormEvent } from "react";
import { loginPageText } from "../pageText/login";
import { useAuth } from "./authContextValue";
import "./AuthenticationPage.css";

type AuthMode = "login" | "signUp";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="eye-icon">
      <path d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {hidden && <path d="M4 4l16 16" />}
    </svg>
  );
}

type AuthenticationPageProps = {
  onGuestMode: () => void;
  onAuthenticated: () => void;
  onVerifyEmailRequested: (email: string) => void;
};

const minimumPasswordLength = 6;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthenticationPage({
  onAuthenticated,
  onGuestMode,
  onVerifyEmailRequested,
}: AuthenticationPageProps) {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const text = loginPageText.ptBR;
  const isSignUp = authMode === "signUp";
  const isLoading = status === "loading";

  function validateForm() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if ((isSignUp && !trimmedName) || !trimmedEmail || !password || (isSignUp && !confirmPassword)) {
      return "Preencha todos os campos.";
    }

    if (!emailPattern.test(trimmedEmail)) {
      return "Informe um email valido.";
    }

    if (password.length < minimumPasswordLength) {
      return `A senha deve ter no minimo ${minimumPasswordLength} caracteres.`;
    }

    if (isSignUp && password !== confirmPassword) {
      return "Senha e confirmar senha precisam ser iguais.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      return;
    }

    setStatus("loading");
    setMessage(isSignUp ? "Criando cadastro..." : "Entrando...");

    try {
      if (isSignUp) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        setStatus("success");
        setMessage("Cadastro criado. O codigo foi enviado para seu email.");
        window.setTimeout(() => onVerifyEmailRequested(email.trim()), 900);
        return;
      }

      await login({
        email: email.trim(),
        password,
      });
      setStatus("success");
      setMessage("Login realizado com sucesso.");
      window.setTimeout(onAuthenticated, 500);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel autenticar agora.",
      );
    }
  }

  function handleModeChange() {
    setAuthMode(isSignUp ? "login" : "signUp");
    setStatus("idle");
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-heading">
          <h1 id="auth-title">
            {isSignUp ? text.signUpTitle : text.loginTitle}
          </h1>
          <p>{isSignUp ? text.signUpDescription : text.loginDescription}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              <span>{text.nameLabel}</span>
              <input
                type="text"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={text.namePlaceholder}
                autoComplete="name"
                disabled={isLoading}
              />
            </label>
          )}

          <label>
            <span>{text.emailLabel}</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={text.emailPlaceholder}
              autoComplete="email"
              disabled={isLoading}
            />
          </label>

          <label>
            <span>{text.passwordLabel}</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={text.passwordPlaceholder}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={isLoading}
              />
              <button
                type="button"
                aria-label={
                  showPassword ? text.hidePassword : text.showPassword
                }
                title={showPassword ? text.hidePassword : text.showPassword}
                onClick={() => setShowPassword((current) => !current)}
                disabled={isLoading}
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>
          </label>

          {isSignUp && (
            <label>
              <span>{text.confirmPasswordLabel}</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={text.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? text.hidePassword : text.showPassword
                  }
                  title={showPassword ? text.hidePassword : text.showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isLoading}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
            </label>
          )}

          {message && (
            <p className={`auth-feedback ${status}`} role="status">
              {message}
            </p>
          )}

          <div className="auth-actions">
            <button type="submit" className="primary-action" disabled={isLoading}>
              {isLoading
                ? isSignUp
                  ? "Cadastrando..."
                  : "Entrando..."
                : isSignUp
                  ? text.signUpButton
                  : text.loginButton}
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={handleModeChange}
              disabled={isLoading}
            >
              {isSignUp ? "Entrar" : "Cadastrar"}
            </button>
          </div>
        </form>

        <button
          type="button"
          className="guest-action"
          onClick={onGuestMode}
          disabled={isLoading}
        >
          Guest mode
        </button>

        <button
          type="button"
          className="mode-link"
          onClick={handleModeChange}
          disabled={isLoading}
        >
          {isSignUp ? text.switchToLogin : text.switchToSignUp}
        </button>
      </section>
    </main>
  );
}
