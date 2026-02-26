import { useEffect, useState, useMemo } from 'react';

export default function RolesSection() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${API_BASE}/roles/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/roles/permissions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData.roles || []);
      }

      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setPermissions(permsData.permissions || []);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(
      role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert('El nombre del rol es requerido');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/roles/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDesc || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRoles([...roles, data.role]);
        setNewRoleName('');
        setNewRoleDesc('');
        setShowCreateModal(false);
      } else {
        alert('Error al crear el rol');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al crear el rol');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole || !selectedRole.is_custom) {
      alert('No se pueden eliminar roles predeterminados');
      return;
    }

    if (!confirm(`¿Eliminar rol "${selectedRole.name}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/roles/roles/${selectedRole.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setRoles(roles.filter(r => r.id !== selectedRole.id));
        setShowDetailsModal(false);
        setSelectedRole(null);
      } else {
        alert('Error al eliminar el rol');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al eliminar el rol');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Cargando roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Roles</h2>
          <p className="text-gray-500 mt-1">
            Define roles y permisos para controlar el acceso a funcionalidades.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Crear Rol
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-6">
        <input
          type="text"
          placeholder="Buscar roles..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map(role => (
          <div key={role.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{role.name}</h3>
                {role.description && (
                  <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                )}
              </div>
              {role.is_custom && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Personalizado
                </span>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Permisos: <span className="font-bold">{role.permission_count || 0}</span>
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedRole(role);
                setShowDetailsModal(true);
              }}
              className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-semibold transition"
            >
              Gestionar Permisos
            </button>

            {role.is_custom && (
              <button
                onClick={() => {
                  setSelectedRole(role);
                  handleDeleteRole();
                }}
                disabled={actionLoading}
                className="w-full mt-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-semibold transition disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Crear Nuevo Rol</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleName('');
                  setNewRoleDesc('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre del rol *
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="ej. Editor de Proyectos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Descripción del rol..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <button
                onClick={handleCreateRole}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Creando...' : 'Crear Rol'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleName('');
                  setNewRoleDesc('');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Details Modal */}
      {showDetailsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 border-b">
              <h3 className="text-lg font-bold">Permisos: {selectedRole.name}</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRole(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Permissions by Resource */}
            <div className="space-y-4">
              {['projects', 'users', 'reports', 'supervisors', 'dashboard'].map(resource => {
                const resourcePerms = permissions.filter(p => p.resource === resource);
                if (resourcePerms.length === 0) {
                  return null;
                }

                return (
                  <div key={resource} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 capitalize">{resource}</h4>
                    <div className="space-y-2">
                      {resourcePerms.map(perm => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            disabled={actionLoading}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                            {perm.description && (
                              <p className="text-xs text-gray-500">{perm.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRole(null);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
