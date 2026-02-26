import { useEffect, useState, useMemo } from 'react';
import { authAPI } from '../api';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function EquiposSection({ user: _user, onNavigate }) {
  const [supervisores, setSupervisores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    loadSupervisores();
  }, []);

  const loadSupervisores = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.getSupervisors();
      setSupervisores(data.users || []);
    } catch (err) {
      console.error('Error loading supervisors:', err);
      setSupervisores([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments from supervisores
  const departments = useMemo(() => {
    const depts = new Set();
    supervisores.forEach(sup => {
      if (sup.department) {
        depts.add(sup.department);
      }
    });
    return Array.from(depts).sort();
  }, [supervisores]);

  // Filter supervisores
  const filteredSupervisores = useMemo(() => {
    return supervisores.filter(sup => {
      const matchSearch =
        sup.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === 'all' || sup.department === selectedDepartment;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && sup.is_active) ||
        (selectedStatus === 'inactive' && !sup.is_active);

      return matchSearch && matchDept && matchStatus;
    });
  }, [supervisores, searchTerm, selectedDepartment, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredSupervisores.length / itemsPerPage);
  const paginatedSupervisores = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSupervisores.slice(start, start + itemsPerPage);
  }, [filteredSupervisores, currentPage]);

  const handleDeactivate = async () => {
    if (!selectedSupervisor) {
      return;
    }

    setActionLoading(true);
    try {
      await authAPI.deactivateUser(selectedSupervisor.id, !selectedSupervisor.is_active);
      setSupervisores(
        supervisores.map(s =>
          s.id === selectedSupervisor.id ? { ...s, is_active: !s.is_active } : s
        )
      );
      setShowDetailsModal(false);
      setSelectedSupervisor(null);
    } catch (err) {
      console.error('Error updating supervisor status:', err);
      alert('Error al actualizar el estado del supervisor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupervisor) {
      return;
    }

    setActionLoading(true);
    try {
      await authAPI.deleteUser(selectedSupervisor.id);
      setSupervisores(supervisores.filter(s => s.id !== selectedSupervisor.id));
      setShowDeleteModal(false);
      setShowDetailsModal(false);
      setSelectedSupervisor(null);
    } catch (err) {
      console.error('Error deleting supervisor:', err);
      alert('Error al eliminar el supervisor');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = fullName => {
    const parts = fullName?.trim().split(' ').filter(Boolean) || [];
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.[0] || 'S').toUpperCase();
  };

  const getStatusBadge = isActive => {
    return isActive
      ? { bg: 'bg-green-100', text: 'text-green-800', label: 'DISPONIBLE' }
      : { bg: 'bg-red-100', text: 'text-red-800', label: 'VACACIONES' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Cargando supervisores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Supervisores</h2>
          <p className="text-gray-500 mt-1">
            Control y seguimiento del personal de obra asignado a proyectos activos.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/register')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
        >
          👤 Añadir Supervisor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad (ej. Estructuras, Intereses)..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={e => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Especialidad: Todas</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Estado: Todos</option>
            <option value="active">Disponible</option>
            <option value="inactive">Vacaciones</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {supervisores.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No hay supervisores registrados</p>
          <button
            onClick={() => onNavigate('/register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Crear Primer Supervisor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    NOMBRE
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    ESPECIALIDAD
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    PROYECTOS ACTIVOS
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    UBICACIÓN ACTUAL
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    ACCIÓN
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSupervisores.map(supervisor => {
                  const status = getStatusBadge(supervisor.is_active);
                  return (
                    <tr key={supervisor.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                            {supervisor.profile_image ? (
                              <img
                                src={supervisor.profile_image}
                                alt={supervisor.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(supervisor.full_name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{supervisor.full_name}</p>
                            <p className="text-xs text-gray-500">{supervisor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {supervisor.department ? (
                          <div className="space-y-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded">
                              {supervisor.department.toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">0 Proyectos</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">No disponible</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-semibold px-3 py-1 rounded ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedSupervisor(supervisor);
                            setShowDetailsModal(true);
                          }}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-semibold transition"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              MOSTRANDO{' '}
              {filteredSupervisores.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} DE{' '}
              {filteredSupervisores.length} SUPERVISORES
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Details Modal */}
      {showDetailsModal && selectedSupervisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {selectedSupervisor.profile_image ? (
                    <img
                      src={selectedSupervisor.profile_image}
                      alt={selectedSupervisor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(selectedSupervisor.full_name)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedSupervisor.full_name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedSupervisor.department || 'Sin departamento'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSupervisor(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Info */}
            <div className="space-y-2 pb-4 border-b">
              {selectedSupervisor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📧</span>
                  <span className="text-gray-700">{selectedSupervisor.email}</span>
                </div>
              )}
              {selectedSupervisor.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500"></span>
                  <span className="text-gray-700">{selectedSupervisor.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500"></span>
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                    selectedSupervisor.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedSupervisor.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleDeactivate}
                disabled={actionLoading}
                className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  selectedSupervisor.is_active
                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:bg-yellow-50'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 disabled:bg-green-50'
                }`}
              >
                {selectedSupervisor.is_active ? '✓ Desactivar Acceso' : '✓ Activar Acceso'}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-semibold transition disabled:bg-red-50"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSupervisor && (
        <ConfirmDeleteModal
          userName={selectedSupervisor.full_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
