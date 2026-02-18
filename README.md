# A11y Logger

A free, open-source, offline-first accessibility auditing tool. Log issues, generate reports, and create VPATs — no accounts or cloud services required.

## What It Does

A11y Logger helps accessibility consultants and teams conduct audits with a structured workflow:

**Log Issues** — Document accessibility findings with WCAG codes, severity levels, environment details, and screenshot evidence.

**Organize Assessments** — Group issues into assessments within projects for structured auditing.

**Generate Reports** — Create executive and detailed reports with structured templates and optional AI assistance.

**Create VPATs** — Build Voluntary Product Accessibility Templates with standard criteria formats.

**Export Everything** — Export projects as zip bundles, issues as CSV, and reports/VPATs as HTML or PDF.

## Key Features

- **Offline-first** — Everything runs locally. No cloud accounts, no internet required.
- **Zero setup** — `npm install && npm start` and you're auditing.
- **Local storage** — SQLite database and local filesystem for media. Your data stays on your machine.
- **AI-optional** — Bring your own OpenAI or Anthropic API key for AI-assisted reports and VPATs, or work fully manually.
- **Import/Export** — Portable zip bundles with full project data and media.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router), React, TypeScript
- [SQLite](https://sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

```bash
npm install    # Install dependencies
npm run dev    # Start development server
```

The app runs at [http://localhost:3000](http://localhost:3000). Data is stored in `./data/`.

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter
npm run type-check   # TypeScript type checking
npm test             # Run tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
```

## Project Structure

```
src/
  app/           # Next.js App Router pages and API routes
  components/    # React components organized by domain
  lib/           # Database, utilities, types, validation
data/
  a11y-logger.db # SQLite database (auto-created)
  media/         # Local media storage
migrations/      # SQL migration files (auto-run at startup)
```

## License

[AGPL-3.0](LICENSE)
