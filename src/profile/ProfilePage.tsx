import {
  contentCategories,
  contentCategoryLabels,
} from "../content/contentApi";
import { useAuth } from "../authentication/authContextValue";
import "./ProfilePage.css";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { updateName } from "./pfpApi";

type ProfilePageProps = {
  onLogout: () => void;
  onBackToContent: () => void;
};

const favoriteCategories = contentCategories.filter(
  (category) => category !== "Para Voce",
);

export function ProfilePage({ onBackToContent, onLogout }: ProfilePageProps) {
  const { user, token, logout, loadUser } = useAuth();

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(user?.name ?? "");
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const [nameFeedback, setNameFeedback] = useState("");
  const [nameFeedbackType, setNameFeedbackType] = useState<
    "success" | "error" | null
  >(null);

  function handleLogout() {
    logout();
    onLogout();
  }

  async function handleSaveName() {
    const trimmedName = nameInput.trim();

    if (trimmedName.length < 2) {
      setNameFeedback("Informe um nome com pelo menos 2 caracteres.");
      setNameFeedbackType("error");
      return;
    }

    if (!token) {
      setNameFeedback("Sessao expirada. Faca login novamente.");
      setNameFeedbackType("error");
      return;
    }

    if (trimmedName === user?.name) {
      setNameInput(trimmedName);
      setIsEditingName(false);
      setNameFeedback("");
      setNameFeedbackType(null);
      return;
    }

    try {
      setIsSavingName(true);
      setNameFeedback("");
      setNameFeedbackType(null);

      const updatedUser = await updateName(token, {
        name: trimmedName,
      });

      setNameInput(updatedUser.name);
      await loadUser();
      setIsEditingName(false);
      setNameFeedback("Nome atualizado com sucesso.");
      setNameFeedbackType("success");
    } catch (error) {
      setNameFeedback(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o nome agora.",
      );
      setNameFeedbackType("error");
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-shell" aria-labelledby="profile-title">
        <div className="profile-heading">
          <div>
            <h1 id="profile-title">Perfil</h1>
            <p>
              {user?.name ?? "Usuario"} - {user?.email ?? "email nao informado"}
            </p>
          </div>

          <div className="profile-actions">
            <button type="button" onClick={onBackToContent}>
              Conteudos
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>

        <section className="profile-panel" aria-labelledby="profile-data-title">
          <h2 id="profile-data-title">Dados da conta</h2>
          <div className="profile-fields">
            <label>
              <span>Nome</span>
              <div className="name-field">
                <input
                  value={isEditingName ? nameInput : user?.name ?? ""}
                  readOnly={!isEditingName}
                  onChange={(e) => setNameInput(e.target.value)}
                  disabled={isSavingName}
                />
                {isEditingName ? (
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    aria-label="Salvar nome"
                    title="Salvar nome"
                  >
                    <Icon
                      className={`edit-icon ${isSavingName ? "is-loading" : ""}`}
                      icon={
                        isSavingName ? "mdi:loading" : "mdi:content-save-edit"
                      }
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(user?.name ?? "");
                      setNameFeedback("");
                      setNameFeedbackType(null);
                      setIsEditingName(true);
                    }}
                    aria-label="Editar nome"
                    title="Editar nome"
                  >
                    <Icon
                      className="edit-icon"
                      icon="mdi:pencil"
                    />
                  </button>
                )}
              </div>
            </label>
            <label>
              <span>E-mail</span>
              <input value={user?.email ?? ""} readOnly />
            </label>
          </div>
          {nameFeedback && (
            <p className={`profile-feedback ${nameFeedbackType ?? ""}`}>
              {nameFeedback}
            </p>
          )}
          <p className="pending-note">
            Alteracao de nome e email ficara disponivel quando a rota do backend
            estiver pronta.
          </p>
        </section>

        <section className="profile-panel" aria-labelledby="favorites-title">
          <h2 id="favorites-title">Favoritos</h2>
          <div className="favorites-list">
            {favoriteCategories.map((category) => (
              <article className="favorite-row" key={category}>
                <div>
                  <h3>{contentCategoryLabels[category]}</h3>
                  <p>
                    Notas, datas e remocao de conteudos serao conectadas nas
                    futuras rotas protegidas.
                  </p>
                </div>
                <span>Pendente</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
