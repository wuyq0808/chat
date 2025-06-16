import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("stock/:symbol", "routes/stock.$symbol.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;