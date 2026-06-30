import "./Navbar.css";

export type ContentCategory =
  | "Todos"
  | "Animes"
  | "Mangas"
  | "Filmes"
  | "Séries"
  | "Livros"
  | "Jogos"
  | "Podcast"
  | "Músicas";

const categories: ContentCategory[] = [
  "Todos",
  "Animes",
  "Mangas",
  "Filmes",
  "Séries",
  "Livros",
  "Jogos",
  "Podcast",
  "Músicas",
];

type NavbarProps = {
  activeCategory: ContentCategory;
  onCategoryChange: (category: ContentCategory) => void;
};

export function Navbar({ activeCategory, onCategoryChange }: NavbarProps) {
  return (
    <header className="main-navbar">
      <nav aria-label="Categorias">
        {categories.map((category) => (
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
