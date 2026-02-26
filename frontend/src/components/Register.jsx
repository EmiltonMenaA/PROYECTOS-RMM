import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const profileImage = localStorage.getItem('profile_image') || '';
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'supervisor',
    email: '',
    id_number: '',
    phone: ''
  });
  const [profilePhoto, setProfilePhoto] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState(['Estructuras', 'Interiores']);
  const specialtyOptions = ['Cimentación', 'Instalaciones', 'Seguridad', 'Diseño Eco'];
  const [supervisores, setSupervisores] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSupervisores, setLoadingSupervisores] = useState(true);

  // Verificar si el usuario actual es admin
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setError('Solo administradores pueden crear supervisores');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser.role !== 'admin') {
      setError('Solo administradores pueden crear supervisores');
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }
    setUser(parsedUser);
    loadSupervisores();
  }, [navigate]);

  const loadSupervisores = async () => {
    setLoadingSupervisores(true);
    try {
      const { data } = await authAPI.getSupervisors();
      const supervisoresList = data.users.map(u => ({
        id: u.id,
        nombre: u.full_name,
        especialidad: u.department || 'N/A',
        email: u.email,
        proyectos: 0,
        estado: u.is_active ? 'Disponible' : 'Inactivo'
      }));
      setSupervisores(supervisoresList);
    } catch (err) {
      console.error('Error loading supervisores:', err);
      setSupervisores([]);
    } finally {
      setLoadingSupervisores(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = e => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      setProfilePhoto(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleSpecialty = label => {
    setSelectedSpecialties(prev =>
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
  };

  const handleSubmit = async e => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const usernameValue = formData.email?.trim() || formData.username.trim();
      if (!usernameValue) {
        setError('El correo electrónico es obligatorio');
        setLoading(false);
        return;
      }
      await authAPI.register(usernameValue, formData.password, formData.full_name, formData.role, {
        email: formData.email,
        phone: formData.phone,
        department: selectedSpecialties.join(', '),
        profile_image: profilePhoto
      });
      setSuccess('Supervisor creado exitosamente');
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        role: 'supervisor',
        email: '',
        id_number: '',
        phone: ''
      });
      setProfilePhoto('');
      setSelectedSpecialties(['Estructuras', 'Interiores']);
      await loadSupervisores();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear supervisor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg overflow-y-auto" style={{ height: '100vh' }}>
        <div className="p-6 flex items-center justify-center border-b">
          <img src="/images/Mesa de trabajo 1 (3).png" alt="Logo" className="h-20 object-contain" />
        </div>

        <nav className="p-4 space-y-2">
          {['dashboard', 'equipos', 'reportes', 'proyectos'].map(tab => (
            <button
              key={tab}
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'equipos'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>
                {tab === 'dashboard'
                  ? '📊'
                  : tab === 'equipos'
                    ? '👥'
                    : tab === 'reportes'
                      ? '📋'
                      : '🏗️'}
              </span>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                'A'
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.full_name || 'Administrador'}</p>
              <p className="text-xs text-gray-500">Admin del Sitio</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm p-6 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Admin › Supervisores › Añadir Nuevo</p>
            <h2 className="text-2xl font-bold">Añadir Nuevo Supervisor</h2>
            <p className="text-sm text-gray-500">
              Complete la información para registrar un nuevo profesional en la plataforma.
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">🔔</button>
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
                {success}
              </div>
            )}

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-4">FOTOGRAFÍA DE PERFIL</h3>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 overflow-hidden">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    '📷'
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Subir una imagen</p>
                  <p className="text-xs text-gray-500">
                    Formatos admitidos: JPG, PNG. Tamaño máximo 2MB. Se recomienda una imagen
                    cuadrada para mejor visualización.
                  </p>
                  <label className="inline-flex mt-2 text-xs font-semibold text-blue-600 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    SELECCIONAR ARCHIVO
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-4">INFORMACIÓN PERSONAL</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej. Juan Pérez García"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="juan.perez@rmm.pro"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    NÚMERO DE IDENTIFICACIÓN
                  </label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ID-000000"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">TELÉFONO DE CONTACTO</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+34 000 000 000"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-4">CREDENCIALES</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">CONTRASEÑA TEMPORAL</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min. 6 caracteres"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">CONFIRMAR CONTRASEÑA</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Repetir contraseña"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-4">ESPECIALIDAD</h3>
              <p className="text-xs text-gray-500 mb-4">
                Seleccione una o más especialidades para este supervisor.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSpecialties.map(item => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleSpecialty(item)}
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                  >
                    {item} ×
                  </button>
                ))}
                <button
                  type="button"
                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold"
                >
                  + Añadir especialidad
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {specialtyOptions.map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.includes(option)}
                      onChange={() => toggleSpecialty(option)}
                      className="w-4 h-4 text-blue-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Supervisores Registrados */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-4">SUPERVISORES REGISTRADOS</h3>
              {loadingSupervisores ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500">Cargando supervisores...</p>
                </div>
              ) : supervisores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay supervisores registrados aún
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Nombre</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Especialidad
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Proyectos
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisores.map(sup => (
                        <tr key={sup.id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-900">{sup.nombre}</td>
                          <td className="px-4 py-3 text-gray-700">{sup.especialidad}</td>
                          <td className="px-4 py-3 text-gray-700">{sup.email}</td>
                          <td className="px-4 py-3 text-gray-700">{sup.proyectos}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                sup.estado === 'Disponible'
                                  ? 'bg-green-100 text-green-800'
                                  : sup.estado === 'Inactivo'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {sup.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {loading ? 'Creando...' : 'Guardar Supervisor'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
