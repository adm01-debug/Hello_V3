// @ts-nocheck
import { lazy } from 'react'

/**
 * Lazy-loaded route components for code splitting
 */

// Authentication
export const Login = lazy(() => import('@/pages/Login'))
export const Signup = lazy(() => import('@/pages/Signup'))
export const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))

// Dashboard
export const Dashboard = lazy(() => import('@/pages/Dashboard'))

// Calls
export const CallsList = lazy(() => import('@/pages/CallsList'))
export const CallDetails = lazy(() => import('@/pages/CallDetails'))
export const NewCall = lazy(() => import('@/pages/NewCall'))

// Transcriptions
export const TranscriptionsList = lazy(() => import('@/pages/TranscriptionsList'))
export const TranscriptionDetails = lazy(() => import('@/pages/TranscriptionDetails'))

// Analysis
export const AnalysisDashboard = lazy(() => import('@/pages/AnalysisDashboard'))
export const SentimentAnalysis = lazy(() => import('@/pages/SentimentAnalysis'))
export const EmotionAnalysis = lazy(() => import('@/pages/EmotionAnalysis'))

// Reports
export const Reports = lazy(() => import('@/pages/Reports'))
export const ReportsBuilder = lazy(() => import('@/pages/ReportsBuilder'))

// Settings
export const Settings = lazy(() => import('@/pages/Settings'))
export const Profile = lazy(() => import('@/pages/Profile'))
export const TeamSettings = lazy(() => import('@/pages/TeamSettings'))

// Admin
export const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
export const UserManagement = lazy(() => import('@/pages/UserManagement'))
