---
name: feature-delivery
description: "Build a full Angular feature in unibox4 with routing, UI, service, and tests using project conventions."
mode: ask
---

Build a full feature for unibox4 following this flow:

1. Architecture
- Define feature route file and lazy route integration.
- Keep boundaries between core, features, layout, and shared.

2. Data
- Add typed service and models.
- Implement loading, success, empty, and error states.

3. UI
- Build standalone components with ng-zorro and SCSS conventions.
- Ensure responsive behavior and keyboard accessibility.

4. Quality
- Add or update unit tests for risky logic.
- Summarize risks and manual QA checks.

Context to ask the user first:
- Feature name and route.
- API endpoints and contracts.
- Done criteria.
