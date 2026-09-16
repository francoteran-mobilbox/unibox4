# Unibox4 Agent System

This repository uses specialized Copilot agents to speed up delivery with Angular 20 + ng-zorro.

## How to use

- Ask naturally in chat; Copilot can route by agent description.
- Or invoke by intent, for example:
  - "Use the Angular architecture agent to add a guarded route"
  - "Use the UI ng-zorro agent to redesign this screen"
  - "Use the QA agent to add tests for this service"

## Agent catalog

1. Angular Architecture Agent
- File: `.github/agents/angular-architecture.agent.md`
- Focus: routing, guards, app config, standalone patterns, folder boundaries.

2. UI and ng-zorro Agent
- File: `.github/agents/ui-ngzorro.agent.md`
- Focus: component UX, SCSS design system, responsive behavior, accessibility.

3. Data and Integration Agent
- File: `.github/agents/data-integration.agent.md`
- Focus: HttpClient, interceptors, API mapping, model contracts, error handling.

4. QA and Testing Agent
- File: `.github/agents/qa-testing.agent.md`
- Focus: unit tests with Jasmine/Karma, testability improvements, regression checks.

5. Performance and Refactor Agent
- File: `.github/agents/perf-refactor.agent.md`
- Focus: change detection strategy, signals/computed usage, lazy loading, bundle budgets.

## Prompt catalog

1. Feature Delivery Prompt
- File: `.github/prompts/feature-delivery.prompt.md`
- Use when implementing a complete feature from route to tests.

2. Service With Tests Prompt
- File: `.github/prompts/service-with-tests.prompt.md`
- Use when implementing or refactoring data services with full test coverage.

3. Pre-PR Hardening Prompt
- File: `.github/prompts/prepr-hardening.prompt.md`
- Use before merge to run architecture, security, quality, and performance checks.

## Skill catalog

1. Delivery Workflow Skill
- File: `.github/skills/unibox4-delivery/SKILL.md`
- Use for a guided sequence that chains architecture, integration, UI, QA, and hardening.

## Recommended workflow

1. Start with Angular Architecture Agent for route/module/domain design.
2. Continue with Data and Integration Agent for service and API work.
3. Use UI and ng-zorro Agent for page and component implementation.
4. Run QA and Testing Agent before merge.
5. Run Performance and Refactor Agent for hardening.
6. Run Pre-PR Hardening Prompt before opening PR.

## Notes

- Agents are optimized for `src/app/core`, `src/app/features`, `src/app/layout`, and `src/app/shared`.
- Keep these files updated when the stack changes (Angular major versions, test runner changes, UI library changes).
