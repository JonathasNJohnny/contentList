import {
  contentCategories,
  contentCategoryLabels,
  type ContentCategory,
} from "../content/contentApi";
import { useState } from "react";
import "./Navbar.css";

type NavbarProps = {
  activeCategory: ContentCategory;
  onCategoryChange: (category: ContentCategory) => void;
  onProfileClick: () => void;
};

export function Navbar({
  activeCategory,
  onCategoryChange,
  onProfileClick,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleCategoryClick(category: ContentCategory) {
    onCategoryChange(category);
    setIsMenuOpen(false);
  }

  return (
    <header className="main-navbar">
      <nav
        className={isMenuOpen ? "is-open" : undefined}
        aria-label="Categorias"
      >
        <div className="navbar-top">
          <img
            className="profile-picture"
            src="https://www.transparentpng.com/thumb/circle/PbI15B-circle-transparent-background.png"
            alt="Foto de perfil"
            onClick={onProfileClick}
          />

          <button
            type="button"
            className="menu-toggle"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="category-menu">
          {contentCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeCategory ? "active" : undefined}
              onClick={() => handleCategoryClick(category)}
            >
              {contentCategoryLabels[category]}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
