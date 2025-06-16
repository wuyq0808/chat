import type { unstable_MiddlewareFunction } from "react-router";
import basicAuth from "../lib/basic-auth";

export const authMiddleware: unstable_MiddlewareFunction = async ({ 
  request,
  context
}, next) => {
  // Basic authentication check
  const credentials = basicAuth(request);
  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASS;

  if (!credentials || credentials.name !== username || credentials.pass !== password) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // Authentication passed, continue to route
  return next();
};