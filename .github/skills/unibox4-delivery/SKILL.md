---
name: unibox4-delivery
description: "Use when delivering a feature end-to-end in unibox4 using a structured multi-agent workflow across architecture, integration, UI, testing, and hardening."
---

# Unibox4 Delivery Workflow

Use this workflow for medium/large tasks that touch multiple layers.

## Inputs to ask first

- Business goal and acceptance criteria.
- Target route or feature area.
- API constraints and non-functional requirements.

## Workflow

1. Architecture pass
- Validate routing, guards, and domain boundaries.
- Confirm file placement under core/features/layout/shared.

2. Integration pass
- Define or update typed models and service APIs.
- Ensure loading/error/empty states are represented.
- Avoid hardcoded credentials or tokens.

3. UI pass
- Implement standalone components and templates.
- Reuse shared UI first, then create new components if needed.
- Ensure responsive and accessible behavior.

4. Testing pass
- Add or update specs for risky logic.
- Cover success and failure behavior for services/guards/components.

5. Hardening pass
- Run test/build checks.
- Identify quick performance wins and residual risks.

## Output format

- Summary of implemented changes.
- File list grouped by concern.
- Validation results and unresolved risks.
