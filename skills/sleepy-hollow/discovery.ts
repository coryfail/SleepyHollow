import { SkillError } from "./skill_error.ts";
import type {
  AuthenticationPlan,
  DiscoveryQuestion,
  DiscoveryTopic,
  ProjectInspection,
  SkillDiagnostic,
} from "./types.ts";

const materialTopics: readonly {
  readonly topic: DiscoveryTopic;
  readonly prompt: string;
  readonly rationale: string;
}[] = [
  {
    topic: "resources",
    prompt:
      "Which resources does the application own, and what identifies one?",
    rationale: "Resource identity determines routes, keys, and contracts.",
  },
  {
    topic: "persistence",
    prompt: "Which data must outlive a single request, and for how long?",
    rationale: "Durability and retention change the storage model.",
  },
  {
    topic: "authentication",
    prompt: "Who calls this API, and how does a caller prove identity?",
    rationale: "Authentication choice changes every protected route.",
  },
  {
    topic: "authorization",
    prompt: "Which callers may act on data they do not own?",
    rationale: "Authorization rules change handler and data-access behavior.",
  },
  {
    topic: "consumers",
    prompt: "Which clients consume this API, and do they need a typed client?",
    rationale: "Consumer shape changes generated contracts and compatibility.",
  },
  {
    topic: "operations",
    prompt: "Which failures must be observable in production?",
    rationale: "Operational needs change configuration and logging behavior.",
  },
  {
    topic: "deployment",
    prompt: "Where does this run, and what must exist before the first deploy?",
    rationale: "Deployment target changes verification and delivery evidence.",
  },
  {
    topic: "service-architecture",
    prompt: "Must any part deploy independently from the rest?",
    rationale: "Independent deployment changes service and transport design.",
  },
];

function diagnostic(
  code: string,
  message: string,
  correction: string,
): SkillDiagnostic {
  return {
    code,
    path: "requirements/application.md",
    line: 1,
    column: 1,
    message,
    correction,
  };
}

export function questions(
  inspection: ProjectInspection,
  idea: string,
): readonly DiscoveryQuestion[] {
  if (idea.trim().length === 0) {
    throw new SkillError([diagnostic(
      "SH_SKILL_IDEA_REQUIRED",
      "Discovery requires a plain-language application idea.",
      "Describe the application before requesting discovery questions.",
    )]);
  }
  const resolved = new Set(inspection.resolvedTopics);
  if (inspection.declaredServices.length > 1) {
    resolved.add("service-architecture");
  }
  return materialTopics.filter((entry) => !resolved.has(entry.topic));
}

export function authenticationPlan(plan: AuthenticationPlan): void {
  const diagnostics: SkillDiagnostic[] = [];
  if (plan.actors.length === 0) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_ACTORS_MISSING",
      "Authentication planning must name every actor.",
      "Record each human or machine actor that reaches the API.",
    ));
  }
  if (plan.trustBoundaries.length === 0) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_TRUST_BOUNDARY_MISSING",
      "Authentication planning must name every trust boundary.",
      "Record the boundary each credential crosses.",
    ));
  }
  if (!plan.required) {
    if (plan.credential !== "none") {
      diagnostics.push(diagnostic(
        "SH_SKILL_AUTH_CREDENTIAL_INCONSISTENT",
        "An unauthenticated plan cannot declare a credential.",
        "Set the credential to none or mark authentication required.",
      ));
    }
    if (diagnostics.length > 0) throw new SkillError(diagnostics);
    return;
  }
  if (!plan.expiration) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_EXPIRATION_MISSING",
      "Authenticated planning must record credential expiration.",
      "Record how long a session or token remains valid.",
    ));
  }
  if (!plan.revocation) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_REVOCATION_MISSING",
      "Authenticated planning must record credential revocation.",
      "Record how an issued credential is withdrawn before expiration.",
    ));
  }
  if (!plan.transport) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_TRANSPORT_MISSING",
      "Authenticated planning must record credential transport.",
      "Record how the credential travels on each request.",
    ));
  }
  if (!plan.csrf) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_CSRF_MISSING",
      "Authenticated planning must record cross-site request implications.",
      "Record the CSRF exposure of the chosen credential, or why none exists.",
    ));
  }
  if (!plan.unauthenticatedBehavior) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_UNAUTHORIZED_BEHAVIOR_MISSING",
      "Authenticated planning must record unauthenticated request behavior.",
      "Record the 401 response shape for a missing or invalid credential.",
    ));
  }
  if (!plan.unauthorizedBehavior) {
    diagnostics.push(diagnostic(
      "SH_SKILL_AUTH_FORBIDDEN_BEHAVIOR_MISSING",
      "Authenticated planning must record forbidden request behavior.",
      "Record the 403 response shape for an authenticated but disallowed call.",
    ));
  }
  if (diagnostics.length > 0) throw new SkillError(diagnostics);
}
