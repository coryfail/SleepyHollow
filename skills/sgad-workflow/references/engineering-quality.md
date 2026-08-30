# Engineering quality

Human-authored, agent-authored, and mixed-author changes follow the same declared
engineering standard. Treat quality policy as governed input, not as optional
advice that an implementation producer may ignore.

## Discover the project standard

Locate the repository-visible engineering standard and determine:

- Its governed scope and the components to which it applies.
- The policy revision and authority.
- Required deterministic controls and their stable entry points.
- Rules for authored, generated, and vendored source.
- Approved exceptions and their expiration or review conditions.

If no standard exists, propose the smallest technology-neutral policy needed for
the change and obtain the authority required by repository governance. Do not
invent detailed local conventions merely to continue.

## Enforce the SGAD baseline

Authored source must be readable and maintainable. Use ordinary source layout,
intentional names, and modules and functions with cohesive responsibilities.
Reduce duplication and excessive complexity or apply the project's explicit
thresholds.

Document public contracts and non-obvious decisions, invariants, and tradeoffs.
Use explicit error handling. At each applicable trust boundary, validate inputs
before relying on them. Delivery-ready source must not contain exposed secrets,
accidental debugging residue, dead code, or unresolved implementation
placeholders.

Generated and vendored source must be distinguishable from authored source and
retain a canonical origin or regeneration path when applicable. Change canonical
definitions instead of treating derived output as an independent truth.

Project policy owns and defines formatting, naming, organization,
documentation, coverage, complexity, architecture, and dependency rules. SGAD
does not require documentation for every function; follow a stricter local rule
when the project has adopted one.

## Verify and report

Run every declared applicable control through the repository's independent
verifier. Record the policy revision, commands or controls, applicability
decisions, results or outcomes, and residual exceptions. A missing, stale,
bypassed, malformed, or failing required check must fail verification or return
nonzero.

For each exception, record the unmet rule, bounded scope, authority, rationale,
duration or review condition, residual risk, compensating controls, and removal
condition. Do not report unqualified conformance while an applicable exception
remains active.
