import type { RouteHandlerContext } from "../routing/mod.ts";

type RequiredContext = RouteHandlerContext<unknown, {
  readonly authentication: {
    readonly mode: "required";
    readonly provider: "project-auth";
    readonly requirementId: "AC-APP-014";
  };
}>;

declare const required: RequiredContext;
const principalId: string = required.principal.id;
const principalType: string = required.principal.type;
const requestId: string = required.requestId;

type NoneContext = RouteHandlerContext<unknown, {
  readonly authentication: { readonly mode: "none" };
}>;

declare const anonymous: NoneContext;
const noPrincipal: null = anonymous.principal;
// @ts-expect-error An explicit none route cannot access an identity.
const invalidIdentity: string = anonymous.principal.id;

const assertions = {
  principalId,
  principalType,
  requestId,
  noPrincipal,
  invalidIdentity,
};

assertions satisfies object;
