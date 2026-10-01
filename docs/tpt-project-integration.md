# TPT GitHub Project integration

The TPT workstream emits a deterministic Project sync plan after it creates or
updates the monthly TPT Issue. The plan is keyed by the released package
idempotency key, so reruns find the existing Project item and update fields
instead of adding another item.

## Repository configuration

Configure these repository variables before enabling Project synchronization:

- TPT_PROJECT_OWNER: GitHub user login that owns the Project.
- TPT_PROJECT_NUMBER: numeric Project v2 number.

The workflow also accepts project_owner and project_number as explicit manual
or reusable-workflow inputs. Explicit inputs take precedence over repository
variables.

The current repository owner has no discoverable Project configured through the
GitHub App, so the integration fails closed until these values are supplied.
It never treats a missing Project as successful synchronization.

## Fields

The default field names are:

- Workstream: TPT
- Content Type: Monthly Package
- Month: released month
- Source Release: release source commit
- Target Date: explicit result target date when supplied
- QA Status: QA for generated output or Blocked for failed generation
- Artifact URL: workflow artifact run URL
- Workflow Run: GitHub Actions run URL
- Manifest: repository-relative release manifest path

The workflow updates existing matching fields and single-select options. Missing
fields or options fail the synchronization step and cannot produce a
publish-ready result. Human QA remains required; the integration never sets a
publication-ready state.

## Local contract

Build a plan without GitHub mutation:

~~~sh
npm run tpt:project:plan -- \
  --result output/tpt/<package>/workstream.json \
  --issue-number 123 \
  --issue-node-id I_kwDO... \
  --project-owner joycytao \
  --project-number 7 \
  --run-url https://github.com/.../actions/runs/123 \
  --manifest releases/month.manifest.json \
  --artifact-url https://github.com/.../actions/runs/123/artifacts \
  --output output/tpt/<package>/project-sync.json
~~~

Missing owner, number, Issue identity, package identity, or idempotency key
returns a blocked plan and a non-zero exit code.
