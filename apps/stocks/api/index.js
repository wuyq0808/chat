// Vercel serverless function wrapper for React Router 7 SSR
import { createRequestHandler } from "@react-router/node";
import * as build from "../build/server/index.js";

export default createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});