import { useEffect, useState, useMemo } from 'react'
import { authAPI } from '../api'

export default function PermissionsSection() {
  const [supervisors, setSupervisors] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedSupervisor, setSelectedSupervisor] = useState(null)
  const [userPermissions, setUserPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedPermissions, setSelectedPermissions] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const supervisorsRes = await authAPI.getSupervisors()
      setSupervisors(supervisorsRes.data.users || [])

      const token = localStorage.getItem('auth_token')
      const permissionsRes = await fetch('/api/roles/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const permData = await permissionsRes.json()
      setPermissions(permData.permissions || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPermissions = async (userId) => {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/users/${userId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      setUserPermissions(data.permissions || [])
    } catch (err) {
      console.error('Error loading user permissions:', err)
    }
  }

  const handleSupervisorSelect = (supervisor) => {
    setSelectedSupervisor(supervisor)
    setSelectedRole(supervisor.role)
    loadUserPermissions(supervisor.id)
  }

  const handleRoleChange = async (newRole) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/users/${selectedSupervisor.id}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      if (res.ok) {
        setSelectedRole(newRole)
        setSelectedSupervisor({ ...selectedSupervisor, role: newRole })
        setSupervisors(supervisors.map(s => 
          s.id === selectedSupervisor.id ? { ...s, role: newRole } : s
        ))
        setShowRoleModal(false)
      }
    } catch (err) {
      console.error('Error updating role:', err)
    } finally {
      setSaving(false)
    }
  }

  const openPermissionsModal = () => {
    setSelectedPermissions([...userPermissions])
    setShowPermissionsModal(true)
  }

  const handleSavePermissions = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const toGrant = selectedPermissions.filter(p => !userPermissions.includes(p))
      const toRevoke = userPermissions.filter(p => !selectedPermissions.includes(p))

      for (const permId of toGrant) {
        await fetch(`/api/users/${selectedSupervisor.id}/permissions/${permId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }

      for (const permId of toRevoke) {
        await fetch(`/api/users/${selectedSupervisor.id}/permissions/${permId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }

      setUserPermissions([...selectedPermissions])
      setShowPermissionsModal(false)
    } catch (err) {
      console.error('Error updating permissions:', err)
    } finally {
      setSaving(false)
    }
  }

  const togglePermissionInModal = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId))
    } else {
      setSelectedPermissions([...selectedPermissions, permId])
    }
  }

  const handlePermissionToggle = async (permissionId, isGranted) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const method = isGranted ? 'DELETE' : 'POST'
      const endpoint = `/api/users/${selectedSupervisor.id}/permissions/${permissionId}`
      
      const res = await fetch(endpoint, { 
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        if (isGranted) {
          setUserPermissions(userPermissions.filter(p => p !== permissionId))
        } else {
          setUserPermissions([...userPermissions, permissionId])
        }
      }
    } catch (err) {
      console.error('Error updating permission:', err)
    } finally {
      setSaving(false)
    }
  }

  const filteredSupervisors = useMemo(() => {
    return supervisors.filter(sup => {
      const search = searchTerm.toLowerCase()
      return sup.full_name?.toLowerCase().includes(search) ||
             sup.email?.toLowerCase().includes(search) ||
             sup.department?.toLowerCase().includes(search)
    })
  }, [supervisors, searchTerm])

  const permissionsByResource = useMemo(() => {
    const grouped = {}
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) grouped[perm.resource] = []
      grouped[perm.resource].push(perm)
    })
    return grouped
  }, [permissions])

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Cargando...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Supervisores List */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Supervisores</h3>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Buscar supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filteredSupervisors.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay supervisores</div>
          ) : (
            filteredSupervisors.map(sup => (
              <button
                key={sup.id}
                onClick={() => handleSupervisorSelect(sup)}
                className={`w-full text-left px-4 py-3 border-b transition ${
                  selectedSupervisor?.id === sup.id
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-sm text-gray-900">{sup.full_name}</p>
                <p className="text-xs text-gray-500">{sup.email || sup.department}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Permissions Panel */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow">
        {selectedSupervisor ? (
          <>
            <div className="p-6 border-b space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedSupervisor.full_name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{selectedSupervisor.email}</p>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Rol: {selectedRole}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRoleModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Asignar Rol
                </button>
                <button
                  onClick={openPermissionsModal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  Asignar Permisos
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8 max-h-96 overflow-y-auto">
              {Object.entries(permissionsByResource).length === 0 ? (
                <div className="text-center text-gray-500">No hay permisos disponibles</div>
              ) : (
                Object.entries(permissionsByResource).map(([resource, perms]) => (
                  <div key={resource}>
                    <h4 className="font-semibold text-gray-900 mb-4 capitalize">
                      {resource === 'dashboard' ? 'Panel de Control' :
                       resource === 'projects' ? 'Proyectos' :
                       resource === 'users' ? 'Usuarios' :
                       resource === 'reports' ? 'Reportes' :
                       resource === 'supervisors' ? 'Supervisores' :
                       resource}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map(perm => {
                        const isGranted = userPermissions.includes(perm.id)
                        return (
                          <label
                            key={perm.id}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handlePermissionToggle(perm.id, isGranted)}
                              disabled={saving}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {perm.name}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Selecciona un supervisor para ver sus permisos
          </div>
        )}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Asignar Rol</h3>
            <p className="text-gray-600 mb-4">Selecciona el rol para {selectedSupervisor?.full_name}</p>

            <div className="space-y-2 mb-6">
              {['admin', 'supervisor'].map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={saving}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                    selectedRole === role
                      ? 'bg-blue-50 border-blue-600'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <p className="font-semibold text-gray-900 capitalize">{role}</p>
                  <p className="text-sm text-gray-600">
                    {role === 'admin' ? 'Acceso completo al sistema' : 'Acceso limitado a proyectos y reportes'}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Asignar Permisos</h3>
            <p className="text-gray-600 mb-4">Selecciona los permisos para {selectedSupervisor?.full_name}</p>

            <div className="space-y-4 mb-6">
              {permissions && permissions.length > 0 ? (
                <>
                  {/* Group permissions by resource */}
                  {Object.entries(
                    permissions.reduce((acc, perm) => {
                      if (!acc[perm.resource]) acc[perm.resource] = [];
                      acc[perm.resource].push(perm);
                      return acc;
                    }, {})
                  ).map(([resource, perms]) => (
                    <div key={resource} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 capitalize flex items-center">
                        <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
                        {resource === 'dashboard' ? 'Panel de Control' :
                         resource === 'projects' ? 'Proyectos' :
                         resource === 'users' ? 'Usuarios' :
                         resource === 'reports' ? 'Reportes' :
                         resource === 'supervisors' ? 'Supervisores' :
                         resource}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map(perm => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => togglePermissionInModal(perm.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                  No hay permisos disponibles
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
              >
                {saving ? 'Guardando...' : 'Guardar Permisos'}
              </button>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
