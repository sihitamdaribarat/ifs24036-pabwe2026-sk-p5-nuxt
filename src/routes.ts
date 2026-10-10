import type { RouteRecordRaw } from "vue-router";
import AuthLayout from "~/features/auth/layouts/AuthLayout.vue";
import CashFlowLayout from "~/features/cashflows/layouts/CashFlowLayout.vue";

export const routes: RouteRecordRaw[] = [
  // Halaman publik: /auth/login dan /auth/register dibungkus AuthLayout.
  // /login dan /register adalah alias sehingga keduanya terbuka tanpa redirect.
  {
    path: "/auth",
    component: AuthLayout,
    redirect: "/auth/login",
    children: [
      {
        path: "/auth/login",
        alias: "/login",
        name: "login",
        component: () => import("~/features/auth/pages/LoginPage.vue"),
      },
      {
        path: "/auth/register",
        alias: "/register",
        name: "register",
        component: () => import("~/features/auth/pages/RegisterPage.vue"),
      },
    ],
  },

  // Halaman terproteksi: dibungkus CashFlowLayout yang memeriksa sesi login.
  {
    path: "/",
    component: CashFlowLayout,
    children: [
      {
        path: "",
        name: "home",
        component: () => import("~/features/cashflows/pages/HomePage.vue"),
      },
      {
        path: "cash-flows/:cashFlowId",
        name: "cash-flow-detail",
        component: () => import("~/features/cashflows/pages/DetailPage.vue"),
      },
      {
        path: "users",
        name: "users",
        component: () => import("~/features/users/pages/UsersPage.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("~/features/users/pages/ProfilePage.vue"),
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("~/features/common/pages/NotFoundPage.vue"),
  },
];

export default routes;
