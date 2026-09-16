---
name: prepr-hardening
description: "Run a pre-PR hardening pass for unibox4: architecture checks, security checks, tests, and performance quick wins."
mode: ask
---

Run this pre-PR hardening workflow:

1. Security
- Detect hardcoded tokens, credentials, and unsafe storage patterns.
- Verify interceptors and auth flows.

2. Architecture
- Check routing/guard consistency and feature boundaries.
- Verify imports use aliases.

3. Quality
- Run tests and report failures.
- Add missing targeted tests for changed logic.

4. Performance
- Review obvious OnPush, signal, and lazy-loading opportunities.

Deliver:
- Findings ordered by severity.
- Exact files to change.
- Optional quick patch plan.
