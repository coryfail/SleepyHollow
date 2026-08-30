# SGAD engineering quality

Human-authored, agent-authored, and mixed-author implementation follow the same
SGAD engineering standard. Passing behavioral tests does not excuse source that
violates the quality policy selected by the project.

## Project-owned policy

Each adopting project must declare a repository-visible engineering standard.
The policy identifies its governed scope, applicability rules, and deterministic
controls. A repository may use different standards for different components when
ownership and applicability remain unambiguous.

Project policy owns and defines exact formatting, naming, organization,
documentation, coverage, complexity, architecture, and dependency rules. SGAD
does not require documentation for every function. It requires useful
documentation of contracts and reasoning while allowing a project to adopt a
stricter function-by-function rule.

SGAD does not select the project's technology or quality tools. Existing tools
remain valid when they enforce the declared policy reproducibly.

## Core authored-source baseline

Authored source must be readable and maintainable:

- Use ordinary source layout rather than compressed or minified presentation.
- Choose names that communicate intent.
- Give modules and functions cohesive responsibilities.
- Reduce duplication and excessive complexity, or enforce explicit project
  thresholds for them.
- Document public contracts and non-obvious decisions, invariants, and
  tradeoffs. Comments should explain why or preserve a contract rather than
  mechanically repeat syntax.
- Use explicit error handling. Do not hide or silently discard failures unless the
  approved contract requires that behavior.
- At each applicable trust boundary, validate inputs before relying on them.

Delivery-ready authored source must not contain exposed secrets, accidental
debugging residue, dead code, or unresolved implementation placeholders.

## Generated and vendored source

Generated and vendored source must be distinguishable from authored source.
When applicable, it identifies its canonical origin or deterministic
regeneration path. Generated output is changed through its canonical definition
instead of being edited as an independent source of truth.

The project may apply different formatting or documentation controls to these
artifacts, but its policy must state the distinction and the checks that prevent
drift or accidental manual edits.

## Verification

Independent verification records the engineering policy revision, applicable
commands or controls, and their results or outcomes. Applicability is an explicit
policy decision, not a convenient omission by the producer.

Depending on project policy and change risk, controls may cover formatting,
static analysis, type analysis, compilation, tests, security, dependencies,
documentation, generated artifacts, or other deterministic checks. A missing,
stale, bypassed, malformed, or failing required control must prevent a verified
result.

Quality evidence supplements behavioral evidence. It does not prove that intent
is complete, that acceptance criteria are correct, or that every defect is
absent.

## Exceptions

Every quality exception records the unmet rule, bounded scope, approving
authority, rationale, duration or review condition, residual risk, compensating
controls, and removal condition. An active exception requires a qualified
conformance claim and cannot silently redefine the project standard.
