import { useMemo } from 'react'
import ProjectOverviewCard from './ProjectOverviewCard'

export default function ProjectOverviewSection({ projects, onNavigate }) {
  const statistics = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        total: 0,
        active: 0,
        supervisorCount: 0
      }
    }

    const uniqueSupervisors = new Set()

    projects.forEach(p => {
      if (p.supervisors) {
        p.supervisors.forEach(sup => uniqueSupervisors.add(sup.id))
      }
    })

    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'in-progress').length,
      supervisorCount: uniqueSupervisors.size
    }
  }, [projects])

  return (
    <div className="space-y-6">
      {/* Statistics Cards - Interactive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Projects */}
        <button
          onClick={() => onNavigate('proyectos')}
          className="bg-white rounded-xl shadow hover:shadow-lg hover:scale-105 transition-all p-5 flex items-start gap-4 text-left border-2 border-transparent hover:border-blue-500"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            📋
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-sm">Total Proyectos Activos</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            <p className="text-xs text-blue-600 mt-1 font-medium">Haz clic para gestionar →</p>
          </div>
        </button>

        {/* Team Members */}
        <button
          onClick={() => onNavigate('equipos')}
          className="bg-white rounded-xl shadow hover:shadow-lg hover:scale-105 transition-all p-5 flex items-start gap-4 text-left border-2 border-transparent hover:border-orange-500"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            👥
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-sm">Total Supervisores</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.supervisorCount}</p>
            <p className="text-xs text-orange-600 mt-1 font-medium">Haz clic para gestionar →</p>
          </div>
        </button>

        {/* Active Rate */}
        <button
          onClick={() => onNavigate('reportes')}
          className="bg-white rounded-xl shadow hover:shadow-lg hover:scale-105 transition-all p-5 flex items-start gap-4 text-left border-2 border-transparent hover:border-purple-500"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            ⚡
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-sm">Proyectos en Progreso</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.active}</p>
            {statistics.total > 0 && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                +{Math.round((statistics.active / statistics.total) * 100)}% • Reportes →
              </p>
            )}
          </div>
        </button>
      </div>

      {/* Projects Overview */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Vista General de Proyectos</h2>
            <p className="text-gray-500 text-sm mt-1">Gestiona y monitorea todos tus proyectos activos</p>
          </div>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectOverviewCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No hay proyectos aún</p>
            <button 
              onClick={() => onNavigate('proyectos')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Crear Proyecto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
