import { useState, useEffect } from 'react';
import { projectsAPI, authAPI } from '../api';

export default function ProyectosSection({ user: _user }) {
  const [projects, setProjects] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectProgress, setEditingProjectProgress] = useState(0);
  const [editingProjectReports, setEditingProjectReports] = useState(0);
  const [statusFilter, setStatusFilter] = useState('in-progress');
  const [cityFilter, setCityFilter] = useState('all');
  const [projectForm, setProjectForm] = useState({
    name: '',
    city: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    contract_value: ''
  });
  const [editProjectForm, setEditProjectForm] = useState({
    name: '',
    city: '',
    location: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    contract_value: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, supervisoresRes] = await Promise.all([
        projectsAPI.getProjects(),
        authAPI.getSupervisors()
      ]);
      setProjects(projectsRes.data.projects || []);
      setSupervisores(supervisoresRes.data.users || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = e => {
    const { name, value } = e.target;
    setProjectForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProjectChange = e => {
    const { name, value } = e.target;
    setEditProjectForm(prev => ({ ...prev, [name]: value }));
  };

  const openEditProjectModal = project => {
    setEditingProjectId(project.id);
    setEditingProjectProgress(getProjectProgress(project));
    setEditingProjectReports(Number(project.total_reports || 0));
    setEditProjectForm({
      name: project.name || '',
      city: project.city || '',
      location: project.location || '',
      description: project.description || '',
      status: project.status || 'planning',
      startDate: project.start_date ? String(project.start_date).slice(0, 10) : '',
      endDate: project.end_date ? String(project.end_date).slice(0, 10) : '',
      contract_value: project.contract_value || ''
    });
    setShowEditProject(true);
  };

  const closeEditProjectModal = () => {
    setShowEditProject(false);
    setEditingProjectId(null);
    setEditingProjectProgress(0);
    setEditingProjectReports(0);
  };

  const handleCreateProject = async e => {
    e.preventDefault();
    try {
      await projectsAPI.createProject({
        name: projectForm.name,
        city: projectForm.city,
        location: projectForm.location,
        description: projectForm.description,
        status: 'planning',
        start_date: projectForm.startDate || null,
        end_date: projectForm.endDate || null,
        contract_value: projectForm.contract_value || null
      });
      setShowCreateProject(false);
      setProjectForm({
        name: '',
        city: '',
        location: '',
        description: '',
        startDate: '',
        endDate: '',
        contract_value: ''
      });
      await loadData();
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Error al crear el proyecto');
    }
  };

  const handleAssignSupervisor = async (projectId, supervisorId) => {
    try {
      await projectsAPI.assignSupervisor(projectId, supervisorId);
      await loadData();
    } catch (err) {
      console.error('Error assigning supervisor:', err);
      alert('Error al asignar supervisor');
    }
  };

  const handleUpdateProject = async e => {
    e.preventDefault();
    if (!editingProjectId) {
      return;
    }

    try {
      await projectsAPI.updateProject(editingProjectId, {
        name: editProjectForm.name,
        city: editProjectForm.city,
        location: editProjectForm.location,
        description: editProjectForm.description,
        status: editProjectForm.status,
        start_date: editProjectForm.startDate || null,
        end_date: editProjectForm.endDate || null,
        contract_value: editProjectForm.contract_value || null
      });

      closeEditProjectModal();
      await loadData();
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Error al actualizar el proyecto');
    }
  };

  const handleRemoveSupervisor = async (projectId, supervisorId) => {
    try {
      await projectsAPI.removeSupervisor(projectId, supervisorId);
      await loadData();
    } catch (err) {
      console.error('Error removing supervisor:', err);
      alert('Error al desasignar supervisor');
    }
  };

  const getStatusBadge = status => {
    const badges = {
      planning: 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = status => {
    const labels = {
      planning: 'PLANEACIÓN',
      'in-progress': 'EN PROGRESO',
      completed: 'COMPLETADO'
    };
    return labels[status] || status;
  };

  const getCityLabel = city => (city && city.trim() ? city.trim() : 'Sin ciudad');

  const getProjectProgress = project => {
    const progress = Number(project.progress_percent);
    if (Number.isFinite(progress)) {
      return Math.max(0, Math.min(100, Math.round(progress)));
    }

    const fallback = {
      planning: 25,
      'in-progress': 65,
      completed: 100
    };

    return fallback[project.status] || 0;
  };

  const getProgressLabel = progress => {
    if (progress >= 100) {
      return 'Completado';
    }
    if (progress >= 75) {
      return 'Avanzado';
    }
    if (progress >= 40) {
      return 'En progreso';
    }
    return 'Inicial';
  };

  const getProgressBadge = progress => {
    if (progress >= 100) {
      return 'bg-green-100 text-green-800';
    }
    if (progress >= 75) {
      return 'bg-blue-100 text-blue-800';
    }
    if (progress >= 40) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const filteredProjects = projects.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCity = cityFilter === 'all' || getCityLabel(p.city) === cityFilter;
    return matchesStatus && matchesCity;
  });

  const availableCities = Array.from(new Set(projects.map(project => getCityLabel(project.city)))).sort(
    (a, b) => a.localeCompare(b, 'es')
  );

  const groupedProjects = filteredProjects.reduce((groups, project) => {
    const cityKey = getCityLabel(project.city);
    if (!groups[cityKey]) {
      groups[cityKey] = [];
    }
    groups[cityKey].push(project);
    return groups;
  }, {});

  const groupedCities = Object.keys(groupedProjects).sort((a, b) => a.localeCompare(b, 'es'));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Cargando proyectos...</p>
      </div>
    );
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
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-2 items-center">
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
        <div className="w-full flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-1">
            Ciudades
          </span>
          <button
            type="button"
            onClick={() => setCityFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition border ${
              cityFilter === 'all'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          {availableCities.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => setCityFilter(city)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition border ${
                cityFilter === city
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {city}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setCityFilter('all');
            }}
            className="ml-auto px-3 py-1.5 rounded-full text-sm font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Información del Filtro */}
      {statusFilter === 'in-progress' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-semibold">
            Mostrando proyectos activos. Total:{' '}
            <span className="font-bold">{filteredProjects.length}</span>
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
        <div className="space-y-6">
          {groupedCities.map(city => (
            <section key={city} className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-xl shadow p-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{city}</h3>
                  <p className="text-sm text-gray-500">{groupedProjects[city].length} proyectos</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  Agrupados por ciudad
                </span>
              </div>

              <div className="space-y-4">
                {groupedProjects[city].map(project => (
                  <div
                    key={project.id}
                    className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{project.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {project.city ? `${project.city} · ` : ''}
                          {project.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(project.status)}`}
                        >
                          {getStatusLabel(project.status)}
                        </span>
                        <button
                          onClick={() => openEditProjectModal(project)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition font-semibold"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-gray-600 font-semibold">PROGRESO BASADO EN INFORMES</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getProgressBadge(
                              getProjectProgress(project)
                            )}`}
                          >
                            {getProgressLabel(getProjectProgress(project))}
                          </span>
                          <p className="text-sm font-bold text-gray-800">{getProjectProgress(project)}%</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${getProjectProgress(project)}%` }}
                        />
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-gray-700 mb-4 text-sm">{project.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold">CIUDAD</p>
                        <p className="font-bold text-sm text-gray-900">{getCityLabel(project.city)}</p>
                      </div>
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

                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-3">Supervisores Asignados</h4>
                      {project.supervisors && project.supervisors.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {project.supervisors.map(sup => (
                            <div
                              key={sup.id}
                              className="flex items-center justify-between bg-blue-50 p-3 rounded-lg"
                            >
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

                    <div className="flex gap-2 items-center">
                      <select
                        onChange={e => {
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
                        {supervisores
                          .filter(sup => !project.supervisors?.some(ps => ps.id === sup.id))
                          .map(sup => (
                            <option key={sup.id} value={sup.id}>
                              {sup.full_name} ({sup.department})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
                <label className="block text-xs text-gray-500 mb-2">CIUDAD</label>
                <input
                  type="text"
                  name="city"
                  value={projectForm.city}
                  onChange={handleProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. Medellín"
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

      {/* Modal Editar Proyecto */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Editar Proyecto</h3>
                <p className="text-sm text-gray-500">Actualiza la informacion del proyecto</p>
              </div>
              <button
                onClick={closeEditProjectModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-6 space-y-5 overflow-y-auto">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Progreso basado en informes
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getProgressBadge(
                        editingProjectProgress
                      )}`}
                    >
                      {getProgressLabel(editingProjectProgress)}
                    </span>
                    <p className="text-sm font-bold text-blue-900">{editingProjectProgress}%</p>
                  </div>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${editingProjectProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {editingProjectReports} informe{editingProjectReports === 1 ? '' : 's'} asociados
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">NOMBRE DEL PROYECTO *</label>
                <input
                  type="text"
                  name="name"
                  value={editProjectForm.name}
                  onChange={handleEditProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. Edificio Centro"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">CIUDAD</label>
                <input
                  type="text"
                  name="city"
                  value={editProjectForm.city}
                  onChange={handleEditProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. Medellín"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">UBICACIÓN</label>
                <input
                  type="text"
                  name="location"
                  value={editProjectForm.location}
                  onChange={handleEditProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dirección o coordenadas"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">DESCRIPCIÓN</label>
                <textarea
                  name="description"
                  value={editProjectForm.description}
                  onChange={handleEditProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Resumen del proyecto..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">ESTADO</label>
                <select
                  name="status"
                  value={editProjectForm.status}
                  onChange={handleEditProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="planning">Planeación</option>
                  <option value="in-progress">En progreso</option>
                  <option value="completed">Completado</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">FECHA DE INICIO</label>
                  <input
                    type="date"
                    name="startDate"
                    value={editProjectForm.startDate}
                    onChange={handleEditProjectChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">FECHA FINALIZACIÓN</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editProjectForm.endDate}
                    onChange={handleEditProjectChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">VALOR DEL CONTRATO</label>
                <input
                  type="text"
                  name="contract_value"
                  value={editProjectForm.contract_value}
                  onChange={handleEditProjectChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. $1,200,000"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditProjectModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
