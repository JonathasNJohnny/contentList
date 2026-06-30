# Repository Rules

## Project Structure

This is a React frontend built with Vite. Application code lives in `src/`.

- `src/pages/`: route-level screens grouped by business domain.
- `src/components/`: reusable UI components, including `GenericTable` and form controls.
- `src/services/`: service and query wrappers, including `stackQueries`.
- `src/utils/`: formatting helpers, API routes, constants, and shared utilities.
- `src/contexts/` and `src/hooks/`: React contexts and shared hooks.
- `src/assets/`, `public/`, and `src/styles/`: static assets and styling.
- `src/test-utils/`: shared test mocks and helpers.

Tests are usually colocated as `*.test.jsx`.

## Commands

- `npm.cmd run dev`: start the Vite development server.
- `npm.cmd run build`: create a production build in `dist/`.
- `npm.cmd run preview`: serve the built app locally.
- `npm.cmd test`: run the Vitest suite once.
- `npm.cmd run test:watch`: run Vitest in watch mode.
- `npm.cmd run lint`: run ESLint over `src/**/*.{js,jsx}`.
- `npm.cmd run lint:fix`: apply automatic ESLint fixes.

On Windows PowerShell, prefer `npm.cmd` and `npx.cmd` when script execution policy blocks `npm` or `npx`.

## Coding Style

Use React function components and hooks. Follow the existing style: two-space indentation, semicolons, double quotes, and readable multiline JSX props.

Naming conventions:

- Components: `PascalCase`.
- Hooks: `useSomething`.
- Constants: `UPPER_SNAKE_CASE`.
- Variables and functions: `camelCase`.

Prefer existing helpers from `src/utils`, shared components from `src/components`, and hooks from `stackQueries` before adding new abstractions. Keep changes scoped to the requested feature area.

## Testing

Tests use Vitest, Testing Library, and `jsdom`; setup is in `src/setupTests.js`. Name tests `ComponentName.test.jsx` and colocate them near the code under test when practical.

Focused test example:

```bash
npx.cmd vitest run path/to/file.test.jsx
```

## Commits and Pull Requests

Recent commits use short Portuguese messages, often with a conventional prefix such as `feat:`. Example:

```text
feat: adiciona paginacao sagres em pagamentos
```

Pull requests should include a brief description, affected pages/components, test or build commands run, and screenshots or GIFs for visible UI changes. Link related issues or task IDs when available.

## Security and Generated Files

Do not commit secrets, tokens, or environment-specific credentials. Avoid committing generated output such as `dist/` unless release packaging explicitly requires it. Use existing API utilities in `src/utils/api`; do not hardcode backend URLs in components.
