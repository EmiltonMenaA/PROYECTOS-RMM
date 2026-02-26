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
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFiles, setReportFiles] = useState([]);
  const [reportFilesLoading, setReportFilesLoading] = useState(false);
  const [reportFilesError, setReportFilesError] = useState('');

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
        throw new Error('No se pudieron cargar las fotos');
      }
      const data = await res.json();
      setReportFiles(data.files || []);
    } catch (err) {
      setReportFilesError(err.message || 'Error al cargar las fotos');
    } finally {
      setReportFilesLoading(false);
    }
  };

  const openReportDetails = report => {
    setSelectedReport(report);
    setShowDetails(true);
    loadReportFiles(report?.id);
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
      return matchDate && matchSearch && matchProject;
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

  const getStatusBadge = status => {
    const badges = {
      completado: 'bg-green-100 text-green-800',
      revisión: 'bg-yellow-100 text-yellow-800',
      pendiente: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = status => {
    const labels = {
      completado: 'Completado',
      revisión: 'En Revisión',
      pendiente: 'Pendiente'
    };
    return labels[status] || status;
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
            <h3 className="font-semibold mb-4">Filtros de Búsqueda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded ${getStatusBadge(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">Total de Reportes</p>
                <p className="text-2xl font-bold text-gray-900">{filteredReports.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">Fotos Subidas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredReports.reduce((sum, r) => sum + (r.photo_count || 0), 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-600 text-sm">Promedio por Reporte</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredReports.length > 0
                    ? Math.round(
                        filteredReports.reduce((sum, r) => sum + (r.photo_count || 0), 0) /
                          filteredReports.length
                      )
                    : 0}
                </p>
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
                      <p
                        className={`text-xs font-semibold px-3 py-1 rounded w-fit ${getStatusBadge(selectedReport.status)}`}
                      >
                        {getStatusLabel(selectedReport.status)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-1">FOTOS SUBIDAS</p>
                      <p className="text-sm font-medium">{selectedReport.photo_count || 0}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2">FOTOS</p>
                    {reportFilesLoading && (
                      <p className="text-xs text-gray-500">Cargando fotos...</p>
                    )}
                    {!reportFilesLoading && reportFiles.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {reportFiles.map(file => {
                          const src = file.url
                            ? file.url.startsWith('/')
                              ? `${backendBase}${file.url}`
                              : file.url
                            : '';
                          return (
                            <div key={file.id} className="border border-gray-100 rounded-lg p-2">
                              {src ? (
                                <a href={src} target="_blank" rel="noreferrer">
                                  <img
                                    src={src}
                                    alt={file.filename}
                                    className="w-full h-28 object-cover rounded"
                                  />
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
                      <p className="text-xs text-gray-500">No hay fotos disponibles</p>
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
