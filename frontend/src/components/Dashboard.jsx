import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../api';
import ProyectosSection from './ProyectosSection';
import EquiposSection from './EquiposSection';
import ReportesSection from './ReportesSection';
import ProjectOverviewSection from './ProjectOverviewSection';
import PermissionsSection from './PermissionsSection';
import AdminSummaryPanel from './AdminSummaryPanel';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const raw = localStorage.getItem('admin_unread_notifications');
    const parsed = Number.parseInt(raw || '0', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });
  const [profileImage, setProfileImage] = useState(
    () => localStorage.getItem('profile_image') || user?.profile_image || ''
  );
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const storedImage = localStorage.getItem('profile_image') || user?.profile_image || '';
    setProfileImage(storedImage);
    loadProjects();
  }, [user]);

  useEffect(() => {
    const handleCountChanged = event => {
      const nextCount = Number.parseInt(event?.detail?.count || 0, 10);
      setUnreadNotifications(Number.isFinite(nextCount) && nextCount > 0 ? nextCount : 0);
    };

    const handleStorage = event => {
      if (event.key !== 'admin_unread_notifications') {
        return;
      }
      const nextCount = Number.parseInt(event.newValue || '0', 10);
      setUnreadNotifications(Number.isFinite(nextCount) && nextCount > 0 ? nextCount : 0);
    };

    window.addEventListener('admin-notification-count-changed', handleCountChanged);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('admin-notification-count-changed', handleCountChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const loadProjects = async () => {
    try {
      const { data } = await projectsAPI.getProjects();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const getInitials = () => {
    const name = user?.full_name || 'Administrador';
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  const tabs = ['dashboard', 'equipos', 'reportes', 'proyectos', 'permisos'];

  const getTabLabel = tab => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'equipos':
        return 'Equipos';
      case 'reportes':
        return 'Reportes';
      case 'proyectos':
        return 'Proyectos';
      case 'permisos':
        return 'Permisos';
      default:
        return tab;
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
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === tab
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex-1 text-left">{getTabLabel(tab)}</span>
              {tab === 'dashboard' && unreadNotifications > 0 && (
                <span className="min-w-6 h-6 px-2 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t bg-white mt-auto">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 mb-4 text-left hover:opacity-80"
          >
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
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{getTabLabel(activeTab)}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                aria-label="Notificaciones"
              >
                🔔
              </button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <AdminSummaryPanel onNavigate={handleTabChange} />
              <ProjectOverviewSection projects={projects} onNavigate={handleTabChange} />
            </div>
          )}
          {activeTab === 'equipos' && <EquiposSection user={user} onNavigate={navigate} />}
          {activeTab === 'reportes' && <ReportesSection projects={projects} />}
          {activeTab === 'proyectos' && <ProyectosSection user={user} />}
          {activeTab === 'permisos' && <PermissionsSection />}
        </div>
      </main>
    </div>
  );
}
