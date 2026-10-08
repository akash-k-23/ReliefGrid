import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Pages
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DonatePage from './pages/DonatePage'
const RequestPage = lazy(() => import('./pages/RequestPage'))
const VolunteerPage = lazy(() => import('./pages/VolunteerPage'))
const LocationsPage = lazy(() => import('./pages/LocationsPage'))
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import AdminPage from './pages/AdminPage'
import NgoPage from './pages/NgoPage'
import EmergencyContactsPage from './pages/EmergencyContactsPage'
import EmergencyRequestPage from './pages/EmergencyRequestPage'
import EmergencyAdminPanel from './components/EmergencyAdminPanel'
import AdminVerificationPanel from './components/AdminVerificationPanel'
import EligibleAlertUsersPanel from './components/EligibleAlertUsersPanel'
import PageBackground from './components/PageBackground'
import ReliefGridParticleBackground from './components/ReliefGridParticleBackground'
import DisasterArrivalEffect from './components/DisasterArrivalEffect'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useAdaptiveMode } from './hooks/useAdaptiveMode'

// Automatically scrolls window to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Lightweight, rapid page transition wrapper (0.2s) for crisp navigation
function AnimatedPage({ children }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full flex-1"
      >
        {children}
      </motion.div>
    </Suspense>
  )
}

function RouteLoading() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center text-sm text-cyan-300" role="status">
      Restoring your ReliefGrid session...
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <RouteLoading />
  }

  return user ? children : <Navigate to="/login" replace />
}

function RoleRoute({ roles, children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <RouteLoading />
  if (!user) return <Navigate to="/login" replace />
  return roles.includes(user.role) ? children : <Navigate to="/home" replace />
}

function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <RouteLoading />
  return user ? <Navigate to="/home" replace /> : children
}

function AppBackground() {
  const { pathname } = useLocation()
  const scene = pathname === '/' ? 'landing' : pathname.slice(1)
  return <><ReliefGridParticleBackground variant={pathname === '/' ? 'hero' : 'subtle'} />{['landing', 'login', 'register'].includes(scene) && <PageBackground variant={scene} />}{pathname === '/home' && <PageBackground variant="operations" />}{pathname === '/donate' && <PageBackground variant="donor" />}{pathname === '/' && <DisasterArrivalEffect />}</>
}

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <AnimatedPage>
              <LandingPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <HomePage />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute><AnimatedPage><LoginPage /></AnimatedPage></PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute><AnimatedPage><RegisterPage /></AnimatedPage></PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
        <Route path="/reset-password" element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />
        <Route path="/emergency-contacts" element={<AnimatedPage><EmergencyContactsPage /></AnimatedPage>} />
        <Route path="/requests/:id" element={<ProtectedRoute><AnimatedPage><EmergencyRequestPage /></AnimatedPage></ProtectedRoute>} />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <RequestPage />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/donate"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <DonatePage />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer"
          element={
            <RoleRoute roles={['VOLUNTEER']}>
              <AnimatedPage>
                <VolunteerPage />
              </AnimatedPage>
            </RoleRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <AnimatedPage>
                <LocationsPage />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <AnimatedPage>
              <GamePage />
            </AnimatedPage>
          }
        />
        <Route path="/profile" element={<ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>} />
        <Route path="/ngo" element={<RoleRoute roles={['NGO']}><AnimatedPage><NgoPage /></AnimatedPage></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute roles={['ADMIN']}><AnimatedPage><><AdminPage /><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><EmergencyAdminPanel /></div><AdminVerificationPanel /><EligibleAlertUsersPanel /></></AnimatedPage></RoleRoute>} />
        <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppShell() {
  const { mode } = useAdaptiveMode()
  const { pathname } = useLocation()
  const [theme, setTheme] = useState(() => window.localStorage.getItem('reliefgrid-theme') || 'dark')
  const routeName = pathname === '/' ? 'landing' : pathname.slice(1).split('/')[0] || 'operations'

  useEffect(() => {
    window.localStorage.setItem('reliefgrid-theme', theme)
  }, [theme])

  return (
    <><ScrollToTop /><div className={`reliefgrid-app reliefgrid-theme-${theme} reliefgrid-mode-${mode} reliefgrid-route-${routeName} relative flex min-h-screen flex-col bg-[#07111f] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300`}><AppBackground /><Navbar theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} /><main className={`relative z-10 flex flex-1 flex-col ${pathname === '/' ? '' : 'lg:pl-72'}`}><AppRoutes /></main><div className={`relative z-10 ${pathname === '/' ? '' : 'lg:pl-72'}`}><Footer /></div></div></>
  )
}

export default function App() {
  return <AuthProvider><Router><AppShell /></Router></AuthProvider>
}
