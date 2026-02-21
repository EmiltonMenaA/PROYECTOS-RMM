import { useState, useEffect } from 'react'
import { projectsAPI, authAPI } from '../api'

export default function ProyectosSection({ user }) {
  const [projects, setProjects] = useState([])
  const [supervisores, setSupervisores] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [statusFilter, setStatusFilter] = useState('in-progress')
  const [projectForm, setProjectForm] = useState({
    name: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    contract_value: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsRes, supervisoresRes] = await Promise.all([
        projectsAPI.getProjects(),
        authAPI.getSupervisors()
      ])
      setProjects(projectsRes.data.projects || [])
      setSupervisores(supervisoresRes.data.users || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (e) => {
    const { name, value } = e.target
    setProjectForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      await projectsAPI.createProject({
        name: projectForm.name,
        location: projectForm.location,
        description: projectForm.description,
        status: 'planning',
        start_date: projectForm.startDate || null,
        end_date: projectForm.endDate || null,
        contract_value: projectForm.contract_value || null
      })
      setShowCreateProject(false)
      setProjectForm({
        name: '',
        location: '',
        description: '',
        startDate: '',
        endDate: '',
        contract_value: ''
      })
      await loadData()
    } catch (err) {
      console.error('Error creating project:', err)
      alert('Error al crear el proyecto')
    }
  }

  const handleAssignSupervisor = async (projectId, supervisorId) => {
    try {
      await projectsAPI.assignSupervisor(projectId, supervisorId)
      await loadData()
    } catch (err) {
      console.error('Error assigning supervisor:', err)
      alert('Error al asignar supervisor')
    }
  }

  const handleRemoveSupervisor = async (projectId, supervisorId) => {
    try {
      await projectsAPI.removeSupervisor(projectId, supervisorId)
      await loadData()
    } catch (err) {
      console.error('Error removing supervisor:', err)
      alert('Error al desasignar supervisor')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'planning': 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'planning': 'PLANEACIÓN',
      'in-progress': 'EN PROGRESO',
      'completed': 'COMPLETADO'
    }
    return labels[status] || status
  }

  const filteredProjects = projects.filter(p => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Cargando proyectos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Proyectos</h2>
          <p className="text-sm text-gray-600 mt-1">Gestiona y monitorea todos los proyectos</p>
        </div>
        <button
          onClick={() => setShowCreateProject(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-2">
        <span className="text-sm font-semibold text-gray-700 flex items-center">Filtrar por:</span>
        <button
          onClick={() => setStatusFilter('in-progress')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            statusFilter === 'in-progress'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Proyectos Activos
        </button>
        <button
          onClick={() => setStatusFilter('planning')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            statusFilter === 'planning'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En Planeación
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            statusFilter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completados
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            statusFilter === 'all'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
      </div>

      {/* Información del Filtro */}
      {statusFilter === 'in-progress' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-semibold">
            Mostrando proyectos activos. Total: <span className="font-bold">{filteredProjects.length}</span>
          </p>
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          {projects.length === 0 ? (
            <>
              <p className="text-gray-500 mb-4">No hay proyectos creados</p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Crear Primer Proyecto
              </button>
            </>
          ) : (
            <p className="text-gray-500">No hay proyectos con el estado seleccionado</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
              {/* Header del Proyecto */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{project.name}</h3>
                  <p className="text-gray-600 text-sm">{project.location}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>

              {/* Descripción */}
              {project.description && (
                <p className="text-gray-700 mb-4 text-sm">{project.description}</p>
              )}

              {/* Detalles del Proyecto */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b">
                {project.contract_value && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">VALOR CONTRATO</p>
                    <p className="font-bold text-sm text-gray-900">{project.contract_value}</p>
                  </div>
                )}
                {project.start_date && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">INICIO</p>
                    <p className="font-bold text-sm text-gray-900">
                      {new Date(project.start_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">FINALIZACIÓN</p>
                    <p className="font-bold text-sm text-gray-900">
                      {new Date(project.end_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 font-semibold">SUPERVISORES</p>
                  <p className="font-bold text-sm text-gray-900">{project.supervisors?.length || 0}</p>
                </div>
              </div>

              {/* Supervisores Asignados */}
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-3">Supervisores Asignados</h4>
                {project.supervisors && project.supervisors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {project.supervisors.map(sup => (
                      <div key={sup.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <div>
                          <p className="font-semibold text-sm">{sup.name}</p>
                          <p className="text-xs text-gray-600">{sup.specialty}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveSupervisor(project.id, sup.id)}
                          className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition font-semibold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Sin supervisores asignados</p>
                )}
              </div>

              {/* Asignar Supervisor */}
              <div className="flex gap-2 items-center">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const supervisorId = parseInt(e.target.value);
                      if (project.supervisors?.some(s => s.id === supervisorId)) {
                        alert('Este supervisor ya está asignado');
                      } else {
                        handleAssignSupervisor(project.id, supervisorId);
                      }
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Asignar supervisor...</option>
                  {supervisores.filter(sup => 
                    !project.supervisors?.some(ps => ps.id === sup.id)
                  ).map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.full_name} ({sup.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Proyecto */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Crear Nuevo Proyecto</h3>
                <p className="text-sm text-gray-500">Complete los detalles del proyecto</p>
              </div>
              <button
                onClick={() => setShowCreateProject(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs text-gray-500 mb-2">NOMBRE DEL PROYECTO *</label>
                <input
                  type="text"
                  name="name"
                  value={projectForm.name}
                  onChange={handleProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. Edificio Centro"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">UBICACIÓN</label>
                <input
                  type="text"
                  name="location"
                  value={projectForm.location}
                  onChange={handleProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dirección o coordenadas"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">DESCRIPCIÓN</label>
                <textarea
                  name="description"
                  value={projectForm.description}
                  onChange={handleProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Resumen del proyecto..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">FECHA DE INICIO</label>
                  <input
                    type="date"
                    name="startDate"
                    value={projectForm.startDate}
                    onChange={handleProjectChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">FECHA FINALIZACIÓN</label>
                  <input
                    type="date"
                    name="endDate"
                    value={projectForm.endDate}
                    onChange={handleProjectChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">VALOR DEL CONTRATO</label>
                <input
                  type="text"
                  name="contract_value"
                  value={projectForm.contract_value}
                  onChange={handleProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. $1,200,000"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
