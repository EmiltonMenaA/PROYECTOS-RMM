import { useMemo } from 'react';

export default function ProjectOverviewCard({ project }) {
  const calculateProgress = useMemo(() => {
    const reportedProgress = Number(project.progress_percent);
    if (Number.isFinite(reportedProgress)) {
      return Math.max(0, Math.min(100, Math.round(reportedProgress)));
    }

    // Fallback si todavía no llegan informes.
    const statusProgress = {
      planning: 25,
      'in-progress': 65,
      completed: 100
    };
    return statusProgress[project.status] || 0;
  }, [project.progress_percent, project.status]);

  const getStatusColor = status => {
    switch (status) {
      case 'planning':
        return 'bg-blue-50 text-blue-700';
      case 'in-progress':
        return 'bg-orange-50 text-orange-700';
      case 'completed':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusLabel = status => {
    switch (status) {
      case 'planning':
        return 'Planeación';
      case 'in-progress':
        return 'En Progreso';
      case 'completed':
        return 'Completado';
      default:
        return 'Desconocido';
    }
  };

  const getProgressColor = progress => {
    if (progress < 33) {
      return 'bg-red-500';
    }
    if (progress < 66) {
      return 'bg-yellow-500';
    }
    return 'bg-green-500';
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
      return 'bg-green-50 text-green-700';
    }
    if (progress >= 75) {
      return 'bg-blue-50 text-blue-700';
    }
    if (progress >= 40) {
      return 'bg-yellow-50 text-yellow-700';
    }
    return 'bg-red-50 text-red-700';
  };

  const getSupervisorInitials = supervisors => {
    if (!supervisors || supervisors.length === 0) {
      return [];
    }
    return supervisors.slice(0, 3).map(sup => {
      const parts = sup.full_name?.trim().split(' ').filter(Boolean) || [];
      return {
        initials:
          parts.length > 1
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : (parts[0]?.[0] || 'S').toUpperCase(),
        name: sup.full_name
      };
    });
  };

  const supervisors = getSupervisorInitials(project.supervisors || []);

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
      {/* Project Image */}
      <div className="relative h-32 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
        {project.image ? (
          <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-white opacity-30">
            🏗️
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title and Status */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg flex-1 line-clamp-2">{project.name}</h3>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-2 ${getStatusColor(project.status)}`}
          >
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Supervisor Info */}
        {project.supervisors && project.supervisors.length > 0 && (
          <div className="mb-4 pb-4 border-b">
            <p className="text-xs text-gray-500 mb-2">
              Supervisor{project.supervisors.length > 1 ? 'es' : ''}
            </p>
            <p className="text-sm font-medium">{project.supervisors[0].full_name}</p>
            {project.supervisors.length > 1 && (
              <p className="text-xs text-gray-500">+ {project.supervisors.length - 1} más</p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-600">Progreso basado en informes</p>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getProgressBadge(calculateProgress)}`}
              >
                {getProgressLabel(calculateProgress)}
              </span>
              <p className="text-sm font-bold text-gray-800">{calculateProgress}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(calculateProgress)}`}
              style={{ width: `${calculateProgress}%` }}
            />
          </div>
        </div>

        {/* Team Members Avatars */}
        {supervisors.length > 0 && (
          <div className="flex items-center gap-2">
            {supervisors.map((sup, idx) => (
              <div
                key={idx}
                title={sup.name}
                className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
              >
                {sup.initials}
              </div>
            ))}
            {project.supervisors && project.supervisors.length > 3 && (
              <div
                title={`+${project.supervisors.length - 3} más`}
                className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold"
              >
                +{project.supervisors.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Project Details */}
        <div className="mt-4 pt-4 border-t space-y-2 text-sm">
          {project.city && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">🏙️</span>
              <span className="text-gray-700">{project.city}</span>
            </div>
          )}
          {project.location && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">📍</span>
              <span className="text-gray-700">{project.location}</span>
            </div>
          )}
          {project.contract_value && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">💰</span>
              <span className="text-gray-700 font-semibold">
                ${project.contract_value.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
