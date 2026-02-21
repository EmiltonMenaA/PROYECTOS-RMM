import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersAPI } from '../api'

export default function UserProfile({ user, onLogout }) {
  const navigate = useNavigate()
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profile_image') || '')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    desktop: true,
    weekly: false
  })
  const [formData, setFormData] = useState({
    fullName: user?.full_name || 'Administrador',
    email: user?.email || 'admin@proyectormm.com',
    phone: user?.phone || '+1 (555) 123-4567',
    department: user?.department || 'Administración',
    role: user?.role || 'admin'
  })

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const { data } = await usersAPI.getProfile()
        if (!isMounted) return

        const profile = data.user
        setFormData({
          fullName: profile.full_name || 'Administrador',
          email: profile.email || 'admin@proyectormm.com',
          phone: profile.phone || '+1 (555) 123-4567',
          department: profile.department || 'Administración',
          role: profile.role || 'admin'
        })
        setProfileImage(profile.profile_image || '')

        const cachedUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({
          ...cachedUser,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          department: profile.department,
          profile_image: profile.profile_image
        }))
        localStorage.setItem('profile_image', profile.profile_image || '')
      } catch (err) {
        if (!isMounted) return
        setError('No se pudo cargar el perfil')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target.result
        setProfileImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const getInitials = () => {
    const name = formData.fullName || 'A'
    const parts = name.trim().split(' ').filter(Boolean)
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        profile_image: profileImage
      }
      const { data } = await usersAPI.updateProfile(payload)
      const profile = data.user

      setFormData({
        fullName: profile.full_name || 'Administrador',
        email: profile.email || 'admin@proyectormm.com',
        phone: profile.phone || '+1 (555) 123-4567',
        department: profile.department || 'Administración',
        role: profile.role || 'admin'
      })
      setProfileImage(profile.profile_image || '')

      const cachedUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({
        ...cachedUser,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        department: profile.department,
        profile_image: profile.profile_image
      }))
      localStorage.setItem('profile_image', profile.profile_image || '')

    } catch (err) {
      setError('No se pudo guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemovePhoto = () => {
    setProfileImage('')
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    onLogout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg overflow-y-auto" style={{ height: '100vh' }}>
        <div className="p-6 flex items-center justify-center border-b">
          <img src="/images/Mesa de trabajo 1 (3).png" alt="Logo" className="h-20 object-contain" />
        </div>

        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'equipos', label: 'Equipos', icon: '👥' },
            { id: 'reportes', label: 'Reportes', icon: '📋' },
            { id: 'proyectos', label: 'Proyectos', icon: '🏗️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-700 hover:bg-gray-50"
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* CONFIGURACIÓN */}
        <div className="px-4 py-6 border-t mt-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Configuración</p>
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              <span>⚙️</span> Preferencias
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              <span>💬</span> Soporte
            </button>
          </nav>
        </div>

        <div className="p-4 border-t bg-white mt-auto">
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80" onClick={() => navigate('/profile')}>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Administrador</p>
              <p className="text-xs text-gray-500">Admin del Sitio</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm p-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Administración  ›  Configuración de Perfil</p>
            <h2 className="text-2xl font-bold">Mi Perfil</h2>
            <p className="text-sm text-gray-500">Administra tu información personal y preferencias de seguridad.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 text-2xl">←</button>
        </div>

        <div className="p-8">
          {isLoading && (
            <div className="bg-white rounded-xl shadow p-6 text-gray-600 mb-6">Cargando perfil...</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>
          )}

          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer shadow hover:bg-blue-700">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  ✎
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Foto de Perfil</p>
                <p className="text-xs text-gray-500">Sube una imagen de alta resolución para tu perfil corporativo. Formatos aceptados: JPG, PNG o GIF.</p>
              </div>
              <div className="flex gap-2">
                <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  Actualizar Foto
                </label>
                <button
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-blue-600">👤</span>
                <h3 className="text-lg font-semibold">Información Personal</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">CARGO / ROL</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">TELÉFONO</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">DEPARTAMENTO</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Seguridad de la Cuenta</h3>
                  <p className="text-sm text-gray-500">Actualiza tu contraseña regularmente para mayor seguridad.</p>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cambiar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-blue-600">🔔</span>
                <h3 className="text-lg font-semibold">Preferencias de Notificaciones</h3>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.email}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  Notificaciones por correo electrónico
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.desktop}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, desktop: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  Alertas de escritorio (Push)
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.weekly}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, weekly: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  Resumen semanal de proyectos
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
