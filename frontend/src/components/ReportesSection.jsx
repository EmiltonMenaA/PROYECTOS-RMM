import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function ReportesSection({ projects }) {
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(
    /\/api\/?$/,
    ''
  );
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFiles, setReportFiles] = useState([]);
  const [reportFilesLoading, setReportFilesLoading] = useState(false);
  const [reportFilesError, setReportFilesError] = useState('');

  const isImageFile = filename => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename || '');
  const isVideoFile = filename => /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(filename || '');

  const getFileUrl = file => {
    if (!file?.url) {
      return '';
    }
    return file.url.startsWith('/') ? `${backendBase}${file.url}` : file.url;
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReportFiles = async reportId => {
    setReportFiles([]);
    setReportFilesError('');
    if (!reportId) {
      return;
    }
    setReportFilesLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/evidence/report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('No se pudieron cargar los adjuntos');
      }
      const data = await res.json();
      setReportFiles(data.files || []);
    } catch (err) {
      setReportFilesError(err.message || 'Error al cargar los adjuntos');
    } finally {
      setReportFilesLoading(false);
    }
  };

  const openReportDetails = report => {
    setSelectedReport(report);
    setShowDetails(true);
    loadReportFiles(report?.id);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    setEndDate(new Date());
    setSelectedProject('todos');
    setSelectedStatus('todos');
  };

  const filteredReports = reports
    .filter(report => {
      const reportDate = new Date(report.created_at);
      const matchDate = reportDate >= startDate && reportDate <= endDate;
      const matchSearch =
        searchQuery === '' ||
        report.supervisor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProject = selectedProject === 'todos' || report.project_name === selectedProject;
      const matchStatus = selectedStatus === 'todos' || normalizeStatus(report.status) === selectedStatus;
      return matchDate && matchSearch && matchProject && matchStatus;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getProjectColor = projectName => {
    const colors = {
      'Medellin Casa': 'bg-blue-500',
      'Centro Comercial Plaza Mayor': 'bg-orange-500',
      'Residencial Campos Verdes': 'bg-green-500'
    };
    return colors[projectName] || 'bg-gray-500';
  };

  const normalizeStatus = status => (status || '').toString().trim().toLowerCase();

  const getStatusInfo = status => {
    const normalized = normalizeStatus(status);
    const map = {
      completado: {
        badge: 'bg-green-100 text-green-800',
        label: 'Completado',
        hint: 'Reporte cerrado'
      },
      revisión: {
        badge: 'bg-yellow-100 text-yellow-800',
        label: 'En revisión',
        hint: 'Requiere validación'
      },
      revision: {
        badge: 'bg-yellow-100 text-yellow-800',
        label: 'En revisión',
        hint: 'Requiere validación'
      },
      pendiente: {
        badge: 'bg-red-100 text-red-800',
        label: 'Pendiente',
        hint: 'Aún sin cierre'
      }
    };

    return map[normalized] || {
      badge: 'bg-gray-100 text-gray-800',
      label: status || 'Sin estado',
      hint: 'Estado no clasificado'
    };
  };

  const getStatusBadge = status => getStatusInfo(status).badge;

  const getStatusLabel = status => getStatusInfo(status).label;

  const getStatusHint = status => getStatusInfo(status).hint;

  const reportStatusCounts = filteredReports.reduce(
    (counts, report) => {
      const status = normalizeStatus(report.status);
      if (status === 'completado') {
        counts.completado += 1;
      } else if (status === 'revisión' || status === 'revision') {
        counts.revision += 1;
      } else if (status === 'pendiente') {
        counts.pendiente += 1;
      } else {
        counts.otro += 1;
      }
      return counts;
    },
    { completado: 0, revision: 0, pendiente: 0, otro: 0 }
  );

  const statusQuickFilters = [
    {
      key: 'completado',
      label: 'Completado',
      count: reportStatusCounts.completado,
      classes: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      key: 'revision',
      label: 'En revisión',
      count: reportStatusCounts.revision,
      classes: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
      key: 'pendiente',
      label: 'Pendiente',
      count: reportStatusCounts.pendiente,
      classes: 'bg-red-50 text-red-700 border-red-200'
    }
  ];

  const getStatusShare = count => {
    if (filteredReports.length === 0) {
      return 0;
    }
    return Math.round((count / filteredReports.length) * 100);
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Cargando reportes...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Centro de Reportes</h2>
              <p className="text-gray-600 text-sm">
                Historial cronológico de informes diarios y avances de obra
              </p>
            </div>
            <button
              onClick={() => {}}
              className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed font-semibold"
              disabled
            >
              + Nuevo Reporte
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h3 className="font-semibold">Filtros de Búsqueda</h3>
              <button
                onClick={resetFilters}
                className="self-start md:self-auto text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">BUSCAR</label>
                <input
                  type="text"
                  placeholder="Supervisor o proyecto..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">DESDE</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">HASTA</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">PROYECTO</label>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos los Proyectos</option>
                  {projects?.map(proj => (
                    <option key={proj.id} value={proj.name}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">ESTADO</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="completado">Completado</option>
                  <option value="revision">En revisión</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Filtros rápidos:</span>
              {statusQuickFilters.map(status => {
                const isActive = selectedStatus === status.key;
                return (
                  <button
                    key={status.key}
                    type="button"
                    onClick={() => setSelectedStatus(isActive ? 'todos' : status.key)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition font-semibold ${
                      isActive ? 'ring-2 ring-blue-200 border-blue-300' : status.classes
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        status.key === 'completado'
                          ? 'bg-green-500'
                          : status.key === 'revision'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    ></span>
                    {status.label}
                    <span className="opacity-70">({status.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla de Reportes */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">FECHA</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    SUPERVISOR
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    PROYECTO
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    FOTOS
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map(report => (
                    <tr key={report.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(report.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{report.supervisor_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getProjectColor(report.project_name)}`}
                          ></div>
                          <span className="text-sm font-medium text-gray-900">
                            {report.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded inline-block">
                          {report.photo_count || 0} fotos
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded ${getStatusBadge(report.status)}`}
                          >
                            {getStatusLabel(report.status)}
                          </span>
                          <span className="text-[11px] text-gray-500">{getStatusHint(report.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openReportDetails(report)}
                            className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 transition font-semibold"
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <p>No hay reportes que coincidan con los criterios de búsqueda</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Estadísticas */}
          {filteredReports.length > 0 && (
            <div className="space-y-4">
              <div className="h-3 rounded-full overflow-hidden bg-gray-100 flex">
                <div
                  className="bg-green-500"
                  style={{ width: `${getStatusShare(reportStatusCounts.completado)}%` }}
                />
                <div
                  className="bg-yellow-500"
                  style={{ width: `${getStatusShare(reportStatusCounts.revision)}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${getStatusShare(reportStatusCounts.pendiente)}%` }}
                />
                <div
                  className="bg-gray-300"
                  style={{ width: `${getStatusShare(reportStatusCounts.otro)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">Total de Reportes</p>
                <p className="text-2xl font-bold text-gray-900">{filteredReports.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">Completados</p>
                <p className="text-2xl font-bold text-green-600">{reportStatusCounts.completado}</p>
                <p className="text-xs text-gray-500 mt-1">{getStatusShare(reportStatusCounts.completado)}% del total</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">En revisión</p>
                <p className="text-2xl font-bold text-yellow-600">{reportStatusCounts.revision}</p>
                <p className="text-xs text-gray-500 mt-1">{getStatusShare(reportStatusCounts.revision)}% del total</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">Pendientes</p>
                <p className="text-2xl font-bold text-red-600">{reportStatusCounts.pendiente}</p>
                <p className="text-xs text-gray-500 mt-1">{getStatusShare(reportStatusCounts.pendiente)}% del total</p>
              </div>
            </div>
            </div>
          )}

          {/* Modal Detalles del Reporte */}
          {showDetails && selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
                <div className="p-6 border-b sticky top-0 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Detalles del Reporte</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedReport.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">SUPERVISOR</p>
                      <p className="text-sm font-medium">{selectedReport.supervisor_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">PROYECTO</p>
                      <p className="text-sm font-medium">{selectedReport.project_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">ESTADO</p>
                      <div className="space-y-2">
                        <p
                          className={`text-xs font-semibold px-3 py-1 rounded w-fit ${getStatusBadge(selectedReport.status)}`}
                        >
                          {getStatusLabel(selectedReport.status)}
                        </p>
                        <p className="text-xs text-gray-500">{getStatusHint(selectedReport.status)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">FOTOS SUBIDAS</p>
                      <p className="text-sm font-medium">{selectedReport.photo_count || 0}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2">ADJUNTOS</p>
                    {reportFilesLoading && (
                      <p className="text-xs text-gray-500">Cargando adjuntos...</p>
                    )}
                    {!reportFilesLoading && reportFiles.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {reportFiles.map(file => {
                          const src = getFileUrl(file);
                          const isImage = isImageFile(file.filename);
                          const isVideo = isVideoFile(file.filename);
                          return (
                            <div key={file.id} className="border border-gray-100 rounded-lg p-2">
                              {src && isImage ? (
                                <a href={src} target="_blank" rel="noreferrer">
                                  <img
                                    src={src}
                                    alt={file.filename}
                                    className="w-full h-28 object-cover rounded"
                                  />
                                </a>
                              ) : src && isVideo ? (
                                <video controls className="w-full h-28 object-cover rounded">
                                  <source src={src} />
                                  Tu navegador no soporta video.
                                </video>
                              ) : src ? (
                                <a
                                  href={src}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 underline break-words"
                                >
                                  {file.filename}
                                </a>
                              ) : (
                                <p className="text-xs text-gray-600 break-words">{file.filename}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!reportFilesLoading && reportFiles.length === 0 && !reportFilesError && (
                      <p className="text-xs text-gray-500">No hay adjuntos disponibles</p>
                    )}
                    {reportFilesError && <p className="text-xs text-red-600">{reportFilesError}</p>}
                  </div>

                  {selectedReport.description && (
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-2">DESCRIPCIÓN</p>
                      <p className="text-sm text-gray-700">{selectedReport.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2">CRONOLOGÍA</p>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Creado</p>
                          <p className="text-xs text-gray-600">
                            {new Date(selectedReport.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      {selectedReport.updated_at && (
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-1"></div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              Última actualización
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(selectedReport.updated_at).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
