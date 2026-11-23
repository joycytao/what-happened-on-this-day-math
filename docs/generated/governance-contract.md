<!-- GENERATED FILE: run `node scripts/generate-governance-contracts.mjs`; edit governance/governance-schema.json instead. -->

# Generated governance contract (schema v1)

- Owners: `agent: pm-triage`, `agent: product-manager`, `agent: architect`, `agent: social-expert`, `agent: developer`, `agent: quality-engineer`
- Statuses: `status: pending review`, `status: blocked`, `status: ready to pickup`, `status: qa`, `status: paused`, `status: ready to dispatch`, `status: done`
- Handoff statuses: `requested`, `accepted`, `completed`, `blocked`, `rejected`
- Human gate: `ready-for-human` with subtypes `human-decision`, `final-merge`
- Verification scopes: `focused`, `repository-wide`

## Role contracts

| Role | Output kind | Legal targets | Return paths |
|---|---|---|---|
| `pm-triage` | `triage-decision` | `pm-triage`, `product-manager`, `architect`, `social-expert`, `developer` | `pm-triage` |
| `product-manager` | `product-decision` | `pm-triage` | `pm-triage` |
| `architect` | `architecture-decision` | `pm-triage` | `pm-triage` |
| `social-expert` | `social-decision` | `pm-triage` | `pm-triage` |
| `developer` | `implementation` | `quality-engineer`, `pm-triage` | `pm-triage` |
| `quality-engineer` | `qa-result` | `ready-for-human`, `developer`, `pm-triage` | `developer`, `pm-triage` |

## Repository-wide verification

- Workflow: `.github/workflows/repository-verification.yml`
- Required command: `npm ci`
- Required command: `npm test`
- Required command: `npm run verification:visual-pdf`
- Required command: `npm run governance:validate`
