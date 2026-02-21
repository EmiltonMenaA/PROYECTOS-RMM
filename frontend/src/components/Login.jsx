import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, usersAPI } from '../api'

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await authAPI.login(username, password)
      const { token, user } = response.data
      localStorage.setItem('auth_token', token)
      
      // Obtener perfil completo para cargar foto de perfil
      try {
        const profileResponse = await usersAPI.getProfile()
        const completeUser = {
          ...user,
          ...profileResponse.data.user
        }
        localStorage.setItem('user', JSON.stringify(completeUser))
        localStorage.setItem('profile_image', completeUser.profile_image || '')
        onLoginSuccess(completeUser)
      } catch (profileErr) {
        // Si no se puede cargar el perfil, usar la información del login
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('profile_image', user.profile_image || '')
        onLoginSuccess(user)
      }
      
      // Redirigir según rol
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login fallido'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{
      backgroundImage: 'url(/images/Fondo2.png)'
    }}>
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-white bg-black/40 hover:bg-black/60 px-4 py-2 rounded-lg transition"
      >
        <span className="text-xl">←</span>
        Atrás
      </button>
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/Mesa de trabajo 1 (3).png" alt="Proyectos RMM" className="h-32 mx-auto mb-6 object-contain" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="•••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
