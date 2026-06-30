import { useState } from "react";
import { loginPageText } from "../pageText/login";
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
};

export function AuthenticationPage({ onGuestMode }: AuthenticationPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const text = loginPageText.ptBR;
  const isSignUp = authMode === "signUp";

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-heading">
          <h1 id="auth-title">
            {isSignUp ? text.signUpTitle : text.loginTitle}
          </h1>
          <p>{isSignUp ? text.signUpDescription : text.loginDescription}</p>
        </div>

        <form className="auth-form">
          {isSignUp && (
            <label>
              <span>{text.nameLabel}</span>
              <input
                type="text"
                name="name"
                placeholder={text.namePlaceholder}
              />
            </label>
          )}

          <label>
            <span>{text.emailLabel}</span>
            <input
              type="email"
              name="email"
              placeholder={text.emailPlaceholder}
            />
          </label>

          <label>
            <span>{text.passwordLabel}</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={text.passwordPlaceholder}
              />
              <button
                type="button"
                aria-label={
                  showPassword ? text.hidePassword : text.showPassword
                }
                title={showPassword ? text.hidePassword : text.showPassword}
                onClick={() => setShowPassword((current) => !current)}
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
                  placeholder={text.confirmPasswordPlaceholder}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword ? text.hidePassword : text.showPassword
                  }
                  title={showPassword ? text.hidePassword : text.showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
            </label>
          )}

          <div className="auth-actions">
            <button type="button" className="primary-action">
              {isSignUp ? text.signUpButton : text.loginButton}
            </button>
            <button type="button" className="secondary-action">
              {text.logoutButton}
            </button>
          </div>
        </form>

        <button
          type="button"
          className="guest-action"
          onClick={onGuestMode}
        >
          Guest mode
        </button>

        <button
          type="button"
          className="mode-link"
          onClick={() => setAuthMode(isSignUp ? "login" : "signUp")}
        >
          {isSignUp ? text.switchToLogin : text.switchToSignUp}
        </button>
      </section>
    </main>
  );
}
