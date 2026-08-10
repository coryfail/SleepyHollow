import { defineSecurity } from "@sleepy-hollow/framework/security";

/**
 * DEMONSTRATION ONLY. This is not a credential system and must not be copied
 * into a real application.
 *
 * The token is a constant in source. There is no store, no issuance, no expiry,
 * no revocation, no rotation, and no defence against a stolen value. Even the
 * comparison below is a plain string equality rather than a constant-time one,
 * because pretending otherwise would make this look more finished than it is.
 *
 * What is worth copying is the shape. A provider receives the request, decides
 * whether a valid identity was established, and returns either a principal or
 * `null`. Everything above — the 401, the challenge header, the problem body,
 * and the guarantee that the handler never runs — is the framework's job.
 * Replace the body of `authenticate` and the rest keeps working.
 *
 * Return `null` to say "no valid identity". Do not throw to signal a failed
 * sign-in: an exception is treated as an internal fault, not a rejection.
 */
const DEMONSTRATION_TOKEN = "sleepy-hollow-demo-token";

export default defineSecurity({
  providers: {
    "project-auth": {
      challenge: 'Bearer realm="authentication-example"',
      authenticate: (request: Request) => {
        const presented = request.headers.get("authorization");
        if (presented !== `Bearer ${DEMONSTRATION_TOKEN}`) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ id: "demo-caller", type: "project-user" });
      },
    },
  },
});
