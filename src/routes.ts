import type { RouteRecordRaw } from "vue-router";
import AuthLayout from "~/features/auth/layouts/AuthLayout.vue";
import CashFlowLayout from "~/features/cashflows/layouts/CashFlowLayout.vue";

export const routes: RouteRecordRaw[] = [
  // Halaman publik: /login dan /register dibungkus AuthLayout.
  {
    path: "/auth",
    component: AuthLayout,
    redirect: "/login",
    children: [
      {
        path: "/login",
        name: "login",
        component: () => import("~/features/auth/pages/LoginPage.vue"),
      },
      {
        path: "/register",
        name: "register",
        component: () => import("~/features/auth/pages/RegisterPage.vue"),
      },
    ],
  },
  { path: "/auth/login", redirect: "/login" },
  { path: "/auth/register", redirect: "/register" },

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
