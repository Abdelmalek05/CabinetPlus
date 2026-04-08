<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Fast repo map
- Single Next.js app (App Router) at repo root; no monorepo/workspaces.
- Route groups: `app/(auth)` (login) and `app/(dashboard)` (main app pages).
- Shared UI primitives live in `app/components/ui/primitives.tsx`; prefer extending these over one-off controls.
- Mock domain data is centralized in `app/constants.ts` and typed in `app/types.ts`.

## Auth and routing gotchas
- Auth is cookie-based only: `app/(auth)/login/actions.ts` sets `cabinetplus_auth`; there is no real credential verification yet.
- Route protection is enforced in `middleware.ts`.
- When adding/changing protected routes, update both `protectedPaths` and `config.matcher` in `middleware.ts` (they are separate lists).

## Commands you actually need
- `npm run dev` - local dev server.
- `npm run lint` - only configured quality gate script.
- `npm run build` - production build (also catches many type/runtime integration issues).
- No test runner is configured; for focused type checks use `npx tsc --noEmit`.

## Styling/tooling specifics
- Tailwind CSS v4 is configured via `@import "tailwindcss"` and `@theme` in `app/globals.css` (no `tailwind.config.*`).
- Use `@/*` import alias from `tsconfig.json`.
