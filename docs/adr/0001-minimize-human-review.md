---
status: accepted
---

# Minimize Human Review

Trigger: the user explicitly requested a harness review and confirmed that routine work should not require human review.

Routine work proceeds through deterministic validation and quality engineering without a human content review. Human decisions are reserved for UI/UX adoption, final copy, final product adoption, credential or permission changes, and public or downstream dispatch. Final merge is represented separately as an operational human action because the current automation contract forbids auto-merge.

Acceptance criterion: a routine Issue validates as having no human decision gate, while each named human gate fails validation unless it is explicitly declared and routed to `ready-for-human`.
