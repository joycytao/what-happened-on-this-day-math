# Agent Governance

This glossary defines the review and workflow terms used by the repository's agent harness.

## Review policy

**Routine work**:
An implementation or content operation whose inputs, acceptance criteria, dependencies, deterministic checks, and QA evidence are complete, and which has no explicit human-decision gate.
_Avoid_: human review required, manual approval by default

**Human decision gate**:
A named decision that cannot be inferred from repository evidence and therefore requires an accountable human choice.
_Avoid_: general review, approval for every task

**Final copy**:
The exact user-facing wording that will be adopted into a final public or distributable product artifact.
_Avoid_: draft copy, internal notes

**Final product**:
The approved user-facing artifact or product direction at the point of adoption or external release.
_Avoid_: intermediate build, QA artifact
