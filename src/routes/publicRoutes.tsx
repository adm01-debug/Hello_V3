import { lazy } from "react";

const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/VerifyEmail"));
const Unauthorized = lazy(() => import("@/pages/Unauthorized"));

// Marketing (públicas, sem auth)
const Landing = lazy(() => import("@/pages/marketing/Landing"));
const Pricing = lazy(() => import("@/pages/marketing/Pricing"));
const VsThreeCPlus = lazy(() => import("@/pages/marketing/VsThreeCPlus"));
const Status = lazy(() => import("@/pages/Status"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));

export const publicRoutes = [
  { path: "/login", element: Login },
  { path: "/register", element: Register },
  { path: "/forgot-password", element: ForgotPassword },
  { path: "/reset-password", element: ResetPassword },
  { path: "/verify-email", element: VerifyEmail },
  { path: "/unauthorized", element: Unauthorized },
  { path: "/landing", element: Landing },
  { path: "/pricing", element: Pricing },
  { path: "/vs/3cplus", element: VsThreeCPlus },
  { path: "/status", element: Status },
  { path: "/marketplace", element: Marketplace },
];

