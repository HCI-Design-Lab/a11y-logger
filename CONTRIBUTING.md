# Contributing to A11y Logger

Thanks for your interest in contributing. This guide covers everything you need to get up and running.

## Prerequisites

- **Node.js 20+** (check with `node --version`)
- **npm** (comes with Node)
- No other services required — the app is fully local

## Setup

```bash
git clone https://github.com/YOUR_ORG/a11y-pm.git
cd a11y-pm
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). A SQLite database is created automatically at `./data/a11y-logger.db` on first run.

## Project Structure

```
src/
  app/            # Next.js App Router — pages at app/(app)/, API routes at app/api/
  components/     # React components organized by domain (projects/, assessments/, vpats/, etc.)
  lib/
    db/           # Data access layer — thin functions like getProjects(), createIssue()
    export/       # Export generators (HTML, Word, OpenACR YAML)
migrations/       # SQL migration files — auto-run at startup in filename order
```

API routes follow a consistent response format:

- Success: `{ success: true, data: ... }`
- Error: `{ success: false, error: "...", code: "NOT_FOUND" | "BAD_REQUEST" | ... }`

## Running Tests

```bash
npm test             # Unit tests (Vitest)
npm run test:e2e     # End-to-end tests (Playwright)
npm run lint         # ESLint
npm run type-check   # TypeScript
```

**We practice TDD.** Write a failing test before writing implementation code. Tests live alongside the code they test in `__tests__/` directories.

## Adding a Database Migration

1. Create a new file in `migrations/` — filename must sort after all existing files (e.g. `0015_add_column.sql`)
2. Write standard SQLite SQL — the migration runs automatically on next startup
3. Never modify an existing migration file

## Submitting a Pull Request

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes with tests
3. Ensure `npm test` and `npm run lint` pass
4. Open a PR against `main` — fill out the PR template
5. Link to an issue if one exists (`Closes #123`)

PRs without tests for new behavior will be asked to add them before merge.

## Code Style

ESLint and Prettier are enforced via a pre-commit hook. You don't need to run them manually — committing will fix and check automatically. If the hook fails, fix the reported issues and try again.

TypeScript strict mode is on. Avoid `any`.

## Questions

Open a [GitHub Discussion](https://github.com/YOUR_ORG/a11y-pm/discussions) for questions that aren't bug reports or feature requests.
