# Project coding instructions for Copilot

This project is an Angular 20 standalone application using signals and ng-zorro.

## Stack and architecture

- Angular standalone APIs with `bootstrapApplication`.
- Routing via lazy loaded route files per feature.
- Core logic in `src/app/core`.
- Feature slices in `src/app/features`.
- Shared reusable UI in `src/app/shared`.
- Shell/layout in `src/app/layout`.
- SCSS design system under `src/styles` with `@use`.

## Development conventions

- Prefer standalone components and route-level lazy loading.
- Keep `ChangeDetectionStrategy.OnPush` unless there is a proven reason not to.
- Prefer signals/computed for local reactive state.
- Keep domain models typed and immutable (`readonly`).
- Put API calls in feature services; keep components thin.
- Handle loading, empty, and error states explicitly.
- Use path aliases (`@core`, `@features`, `@layout`, `@shared`) over deep relative imports.
- Preserve Spanish user-facing copy already present in the app.

## Quality conventions

- For new logic, add or update unit tests (`*.spec.ts`) when practical.
- Avoid introducing hardcoded secrets/tokens.
- Keep accessibility in mind: labels, semantic structure, keyboard support.
- Avoid broad refactors unrelated to the request.

## Agent workflow

- For cross-layer tasks, follow this order: architecture -> data integration -> UI -> testing -> hardening.
- Prefer prompt-driven execution for repeatable tasks:
	- `feature-delivery`
	- `service-with-tests`
	- `prepr-hardening`

## Definition of done

- Behavior works for desktop and mobile layout breakpoints.
- New service logic has success/failure test coverage when practical.
- No hardcoded secrets, credentials, or permanent tokens are added.
- Routing and guards remain consistent with auth/guest expectations.
