import { contentCategories, contentCategoryLabels } from "../content/contentApi";
import { useAuth } from "../authentication/authContextValue";
import "./ProfilePage.css";

type ProfilePageProps = {
  onLogout: () => void;
  onBackToContent: () => void;
};

const favoriteCategories = contentCategories.filter(
  (category) => category !== "Para Voce",
);

export function ProfilePage({ onBackToContent, onLogout }: ProfilePageProps) {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <main className="profile-page">
      <section className="profile-shell" aria-labelledby="profile-title">
        <div className="profile-heading">
          <div>
            <h1 id="profile-title">Perfil</h1>
            <p>{user?.name ?? "Usuario"} - {user?.email ?? "email nao informado"}</p>
          </div>

          <div className="profile-actions">
            <button type="button" onClick={onBackToContent}>
              Conteudos
            </button>
            <button type="button" className="danger-action" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>

        <section className="profile-panel" aria-labelledby="profile-data-title">
          <h2 id="profile-data-title">Dados da conta</h2>
          <div className="profile-fields">
            <label>
              <span>Nome</span>
              <input value={user?.name ?? ""} readOnly />
            </label>
            <label>
              <span>E-mail</span>
              <input value={user?.email ?? ""} readOnly />
            </label>
          </div>
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
                  <p>Notas, datas e remocao de conteudos serao conectadas nas futuras rotas protegidas.</p>
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
