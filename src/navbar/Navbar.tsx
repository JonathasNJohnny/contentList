import { contentCategories, type ContentCategory } from "../content/contentApi";
import { useState } from "react";
import { useLanguage } from "../pageText";
import "./Navbar.css";
import { useActualPFP } from "../features/utils/getPFP";

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
  const { language, text, toggleLanguage } = useLanguage();

  function handleCategoryClick(category: ContentCategory) {
    onCategoryChange(category);
    setIsMenuOpen(false);
  }

  return (
    <header className="main-navbar">
      <nav
        className={isMenuOpen ? "is-open" : undefined}
        aria-label={text.navbar.ariaLabel}
      >
        <div className="navbar-top">
          <img
            className="profile-picture"
            src={useActualPFP()}
            alt={text.navbar.profileAlt}
            title={text.navbar.profileTitle}
            onClick={onProfileClick}
          />

          <button
            type="button"
            className="menu-toggle"
            aria-label={
              isMenuOpen ? text.navbar.closeMenu : text.navbar.openMenu
            }
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className="category-menu">
          {contentCategories
            .filter((category) => !["NULL"].includes(category))
            .map((category) => (
              <button
                key={category}
                type="button"
                className={category === activeCategory ? "active" : undefined}
                onClick={() => handleCategoryClick(category)}
              >
                {text.categories[category]}
              </button>
            ))}
        </div>

        <button
          type="button"
          className="language-toggle"
          aria-label={text.language.toggleLabel}
          title={text.language.toggleLabel}
          onClick={toggleLanguage}
        >
          <span aria-hidden="true">{language === "ptBR" ? "BR" : "US"}</span>
          {language === "ptBR" ? "PT" : "EN"}
        </button>
      </nav>
    </header>
  );
}
