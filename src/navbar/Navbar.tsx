import { contentCategories, type ContentCategory } from "../content/contentApi";
import "./Navbar.css";

type NavbarProps = {
  activeCategory: ContentCategory;
  onCategoryChange: (category: ContentCategory) => void;
};

export function Navbar({ activeCategory, onCategoryChange }: NavbarProps) {
  return (
    <header className="main-navbar">
      <nav aria-label="Categorias">
        {contentCategories.map((category) => (
          <button
            key={category}
            type="button"
            className={category === activeCategory ? "active" : undefined}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </nav>
    </header>
  );
}
