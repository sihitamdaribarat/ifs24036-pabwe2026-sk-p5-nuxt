import { describe, expect, it } from "vitest";
import type { RouteRecordRaw } from "vue-router";
import routerOptions from "./router.options";
import { routes } from "./routes";

const flatten = (records: readonly RouteRecordRaw[], parent = ""): string[] =>
  records.flatMap((record) => {
    const path = record.path.startsWith("/")
      ? record.path
      : `${parent.replace(/\/$/, "")}/${record.path}`.replace(/\/$/, "") || "/";
    return [path, ...flatten(record.children ?? [], path)];
  });

describe("router.options", () => {
  it("memakai deklarasi rute dari src/routes.ts", () => {
    expect(routerOptions.routes()).toBe(routes);
  });

  it("mendefinisikan 2 rute publik, 4 rute terproteksi, dan wildcard 404", () => {
    const authLayout = routes.find((route) => route.path === "/auth")!;
    const dashboardLayout = routes.find((route) => route.path === "/")!;

    expect(authLayout.children?.map((route) => route.path)).toEqual(["/auth/login", "/auth/register"]);
    expect(flatten(dashboardLayout.children ?? [], "/")).toEqual([
      "/",
      "/cash-flows/:cashFlowId",
      "/users",
      "/profile",
    ]);
    expect(flatten(routes)).toContain("/:pathMatch(.*)*");
  });
});
