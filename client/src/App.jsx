import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard  from './pages/Dashboard';
import Dishes     from './pages/Dishes';
import Schedule   from './pages/Schedule';
import Pricing    from './pages/Pricing';
import Settings   from './pages/Settings';
import Import     from './pages/Import';
import Waste      from './pages/Waste';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pages publiques */}
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Pages protégées */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/dishes" element={
            <ProtectedRoute>
              <Layout><Dishes /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <Layout><Schedule /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/pricing" element={
            <ProtectedRoute>
              <Layout><Pricing /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/import" element={
            <ProtectedRoute>
              <Layout><Import /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/waste" element={
            <ProtectedRoute>
              <Layout><Waste /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
