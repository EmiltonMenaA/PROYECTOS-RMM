import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import SupervisorDashboard from './components/SupervisorDashboard'
import UserProfile from './components/UserProfile'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cargar usuario del localStorage al montar
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (err) {
        console.error('Error parsing saved user:', err)
      }
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src="/images/Mesa de trabajo 1 (3).png" alt="Proyectos RMM" className="h-24 mx-auto object-contain" />
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Página pública home */}
        <Route path="/" element={<Home user={user} />} />
        
        {/* Rutas de autenticación (públicas) */}
        <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
        
        {/* Registro de usuarios (solo admin) */}
        <Route
          path="/register"
          element={
            <ProtectedRoute user={user} requiredRole="admin">
              <Register />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard usuario (protegido) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              {user?.role === 'supervisor' ? (
                <SupervisorDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Dashboard user={user} onLogout={handleLogout} />
              )}
            </ProtectedRoute>
          }
        />

        {/* Perfil usuario (protegido) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <UserProfile user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        
        {/* Panel admin (protegido, solo admin) - Redirige a Dashboard */}
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
