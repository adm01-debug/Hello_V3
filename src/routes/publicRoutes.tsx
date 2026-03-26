import { lazy } from "react";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));

export const publicRoutes = [
  { path: "/login", element: Login },
  { path: "/register", element: Register },
  { path: "/forgot-password", element: ForgotPassword },
  { path: "/reset-password", element: ResetPassword },
  { path: "/verify-email", element: VerifyEmail },
  { path: "/unauthorized", element: Unauthorized },
];
