import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useNavigate } from 'react-router-dom'
import { supervisorAPI } from '../api'

export default function SupervisorDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '')
  const [activeTab, setActiveTab] = useState('tablero')
  const [calendarStart, setCalendarStart] = useState(new Date(2026, 9, 14))
  const [calendarEnd, setCalendarEnd] = useState(new Date(2026, 9, 20))
  const [calendarView, setCalendarView] = useState('semana')
  const [calendarFilter, setCalendarFilter] = useState('todos')
  const [calendarData, setCalendarData] = useState({ events: [], tasks: [], actions: [] })
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const [projects, setProjects] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [projectSearch, setProjectSearch] = useState('')
  const [projectStatus, setProjectStatus] = useState('todos')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectDetails, setShowProjectDetails] = useState(false)
  const [reportForm, setReportForm] = useState({
    project_id: '',
    summary: '',
    details: '',
    weather: 'clear',
    workers: 0
  })
  const [reportPhotos, setReportPhotos] = useState([])
  const [reportFiles, setReportFiles] = useState([])
  const [reportFilesLoading, setReportFilesLoading] = useState(false)
  const [reportFilesError, setReportFilesError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || ''
  })
  const [profileSaving, setProfileSaving] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    onLogout()
    navigate('/login')
  }

  const loadCalendar = async () => {
    setCalendarLoading(true)
    setCalendarError('')
    try {
      const start = calendarStart.toISOString().slice(0, 10)
      const end = calendarEnd.toISOString().slice(0, 10)
      const { data } = await supervisorAPI.getCalendar(start, end)
      setCalendarData({ events: data.events || [], tasks: data.tasks || [], actions: data.actions || [] })
    } catch (err) {
      setCalendarError('No se pudo cargar el calendario')
    } finally {
      setCalendarLoading(false)
    }
  }

  useEffect(() => {
    loadProjectsAndReports()
  }, [])

  useEffect(() => {
    if (activeTab !== 'calendario') return
    loadCalendar()
  }, [activeTab, calendarStart, calendarEnd])

  const loadProjectsAndReports = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const [projectsRes, reportsRes] = await Promise.all([
        fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/reports', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      const projectsData = await projectsRes.json()
      const reportsData = await reportsRes.json()
      
      // Filter projects assigned to this supervisor
      const supervisorProjects = (projectsData.projects || []).filter(p => 
        p.supervisors && p.supervisors.some(s => s.id === user?.id)
      )
      
      // Filter reports authored by this supervisor
      const supervisorReports = (reportsData.reports || []).filter(r => r.author_id === user?.id)
      
      setProjects(supervisorProjects)
      setReports(supervisorReports)
      if (supervisorProjects.length > 0) {
        setReportForm(prev => ({ ...prev, project_id: supervisorProjects[0].id }))
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadReportFiles = async (reportId) => {
    setReportFiles([])
    setReportFilesError('')
    if (!reportId) return
    setReportFilesLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/evidence/report/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('No se pudieron cargar las fotos')
      const data = await res.json()
      setReportFiles(data.files || [])
    } catch (err) {
      setReportFilesError(err.message || 'Error al cargar las fotos')
    } finally {
      setReportFilesLoading(false)
    }
  }

  const openReportDetails = (report) => {
    setSelectedReport(report)
    setShowReportDetails(true)
    loadReportFiles(report?.id)
  }

  const filteredEvents = useMemo(() => {
    if (calendarFilter === 'todos') return calendarData.events
    return calendarData.events.filter(item => item.category === calendarFilter)
  }, [calendarData.events, calendarFilter])

  const eventsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return calendarData.events.filter(item => item.start_date <= today && item.end_date >= today)
  }, [calendarData.events])

  const projectStatusOptions = useMemo(() => {
    const values = projects.map(project => project.status).filter(Boolean)
    const unique = Array.from(new Set(values))
    return ['todos', ...unique]
  }, [projects])

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase()
    return projects.filter(project => {
      const matchesStatus = projectStatus === 'todos' || project.status === projectStatus
      if (!query) return matchesStatus
      const nameMatch = project.name?.toLowerCase().includes(query)
      const locationMatch = project.location?.toLowerCase().includes(query)
      return matchesStatus && (nameMatch || locationMatch)
    })
  }, [projects, projectSearch, projectStatus])

  const getProjectProgress = (project) => {
    if (!project?.start_date || !project?.end_date) return 0
    const start = new Date(project.start_date).getTime()
    const end = new Date(project.end_date).getTime()
    const now = Date.now()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
    const ratio = (now - start) / (end - start)
    return Math.max(0, Math.min(100, Math.round(ratio * 100)))
  }

  const getStats = () => {
    const pendingReports = reports.filter(r => r.status === 'pending').length
    const nextDeadline = projects.length > 0 && projects[0].end_date 
      ? Math.ceil((new Date(projects[0].end_date) - new Date()) / (1000 * 60 * 60 * 24))
      : 0
    
    return [
      { label: 'Dias para entrega', value: `${Math.max(0, nextDeadline)} Dias`, tone: 'bg-blue-50 text-blue-700' },
      { label: 'Trabajadores activos', value: `${reportForm.workers || 0} Personal`, tone: 'bg-green-50 text-green-700' },
      { label: 'Aprobaciones pendientes', value: `${pendingReports.toString().padStart(2, '0')} Reportes`, tone: 'bg-yellow-50 text-yellow-700' },
      { label: 'Incidentes abiertos', value: `${reports.length.toString().padStart(2, '0')} Reportes`, tone: 'bg-red-50 text-red-700' }
    ]
  }

  const tasks = [
    { id: 1, title: 'Aprobar entrega de acero reforzado', meta: 'Vence hoy - Proyecto Skyline' },
    { id: 2, title: 'Actualizar Bitacora de Seguridad Semana 42', meta: 'Vence en 2 dias - Admin General' },
    { id: 3, title: 'Revisar Esquematicos Electricos', meta: 'Vence en 5 dias - Marina Villas' }
  ]

  const activity = [
    { id: 1, title: 'Inspeccion de Acero Aprobada', meta: 'Skyline Residency - 10:30 AM', tone: 'bg-blue-50 text-blue-700' },
    { id: 2, title: 'Entrega de Concreto Confirmada', meta: 'Marina Villas - 09:15 AM', tone: 'bg-green-50 text-green-700' },
    { id: 3, title: 'Parada de Equipo', meta: 'Calle 21 - Ayer', tone: 'bg-red-50 text-red-700' }
  ]

  const calendarRows = filteredEvents.map(event => ({
    name: event.title,
    tag: event.project || 'Proyecto',
    color: event.category === 'entregas' ? 'bg-yellow-400' : event.category === 'personal' ? 'bg-green-500' : 'bg-blue-500',
    bars: [event.start_date, event.end_date]
  }))

  const inventoryRows = [
    { name: 'Cemento Portland Gris', qty: '450 unidades', status: 'Stock suficiente', statusTone: 'bg-green-50 text-green-700', updated: 'Hoy, 09:15 AM' },
    { name: 'Barras de Acero Corrugado 1/2"', qty: '12 unidades', status: 'Stock critico', statusTone: 'bg-red-50 text-red-700', updated: 'Ayer, 17:30 PM' },
    { name: 'Taladro Percutor Industrial', qty: '04 unidades', status: 'En uso', statusTone: 'bg-blue-50 text-blue-700', updated: '12 Oct, 2026' },
    { name: 'Cable Cobre THHN 12', qty: '22 unidades', status: 'Reservado', statusTone: 'bg-yellow-50 text-yellow-700', updated: 'Hoy, 08:00 AM' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/images/Mesa de trabajo 1 (3).png" alt="Logo" className="h-10 object-contain" />
            <nav className="flex items-center gap-4 text-sm">
              {['tablero', 'proyectos', 'calendario', 'inventario', 'perfil'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-lg ${
                    activeTab === tab ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500">
              <span>Buscar planos o tareas...</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">🔔</button>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user?.full_name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-gray-900 font-semibold">{user?.full_name || 'Supervisor'}</p>
                <p className="text-xs text-gray-500">Supervisor de Obra</p>
              </div>
            </div>
            <button onClick={() => setShowProfileEditor(true)} className="text-sm text-blue-600 hover:text-blue-700">Perfil</button>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Salir</button>
          </div>
        </div>
      </div>

      {activeTab === 'tablero' && (
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tablero del Supervisor</h1>
              <p className="text-sm text-gray-500">Activo en 3 obras</p>
            </div>
            <div className="text-xs text-gray-500">Lunes, 14 Oct, 2026</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getStats().map(item => (
              <div key={item.label} className="bg-white rounded-xl shadow p-4">
                <p className="text-xs text-gray-500 mb-2">{item.label}</p>
                <p className={`text-lg font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('reporte')}
              className="bg-blue-600 text-white rounded-xl p-4 text-left"
            >
              <p className="text-sm font-semibold">Subir Reporte Diario</p>
              <p className="text-xs text-blue-100">Registra el progreso y fotos de hoy</p>
            </button>
            <button
              onClick={() => setActiveTab('calendario')}
              className="bg-white rounded-xl shadow p-4 text-left hover:border-blue-200 border border-transparent"
            >
              <p className="text-sm font-semibold">Ver Calendario</p>
              <p className="text-xs text-gray-500">Vista de gantt y cronograma</p>
            </button>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm font-semibold">Reportar Incidente</p>
              <p className="text-xs text-gray-500">Problemas de seguridad o retrasos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Mis Proyectos Asignados</h2>
                <button className="text-xs text-blue-600">Ver todos los proyectos</button>
              </div>
              <div className="space-y-4">
                {projects.length > 0 ? projects.map(project => (
                  <div key={project.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.location}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">{project.status}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No hay proyectos asignados</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold mb-4">Actividad en Obra</h2>
              <div className="space-y-3">
                {activity.map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.tone} flex items-center justify-center text-xs`}>!</div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold mb-3">Tareas Prioritarias ({reports.filter(r => r.status === 'pending').length})</h2>
              <div className="space-y-3">
                {reports.filter(r => r.status === 'pending').length > 0 ? reports.filter(r => r.status === 'pending').slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:bg-blue-50">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{task.project_name}</p>
                      <p className="text-xs text-gray-500">Reporte pendiente de revisar - {new Date(task.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => openReportDetails(task)} className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap ml-2">Ver</button>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No hay tareas pendientes</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold mb-3">Documentos Rapidos</h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="border border-gray-100 rounded-lg p-3 text-center">Planos</div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">Permisos</div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">Lista Personal</div>
                <div className="border border-gray-100 rounded-lg p-3 text-center">Inventario</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reporte' && (
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow p-6 space-y-5">
            <div>
              <p className="text-xs text-gray-500 mb-1">Panel › Reporte Diario</p>
              <h2 className="text-xl font-bold">Envio de Reporte Diario</h2>
              <p className="text-sm text-gray-500">Complete los detalles de la jornada actual.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold">PROYECTO</label>
                <select 
                  value={reportForm.project_id}
                  onChange={(e) => setReportForm(prev => ({ ...prev, project_id: parseInt(e.target.value) }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Selecciona un proyecto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold">FECHA</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold">CLIMA</label>
                <select 
                  value={reportForm.weather}
                  onChange={(e) => setReportForm(prev => ({ ...prev, weather: e.target.value }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="clear">Despejado</option>
                  <option value="rain">Lluvia</option>
                  <option value="cloudy">Nublado</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold">PERSONAL EN OBRA</label>
                <input 
                  type="number" 
                  value={reportForm.workers}
                  onChange={(e) => setReportForm(prev => ({ ...prev, workers: parseInt(e.target.value) || 0 }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold">DESCRIPCION GENERAL</label>
              <textarea 
                value={reportForm.summary}
                onChange={(e) => setReportForm(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg" rows={2} placeholder="Resumen del día..."></textarea>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold">NOTAS DE PROGRESO</label>
              <textarea 
                value={reportForm.details}
                onChange={(e) => setReportForm(prev => ({ ...prev, details: e.target.value }))}
                className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg" rows={4} placeholder="Describe las actividades principales..."></textarea>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold">FOTOS</label>
              <input 
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setReportPhotos(e.target.files)}
                className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg"
              />
              {reportPhotos.length > 0 && (
                <p className="text-xs text-green-600 mt-2">{reportPhotos.length} foto(s) seleccionadas</p>
              )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  if (!reportForm.project_id || !reportForm.summary) {
                    alert('Completa los campos requeridos')
                    return
                  }
                  const token = localStorage.getItem('auth_token')
                  const formData = new FormData()
                  formData.append('project_id', reportForm.project_id)
                  formData.append('summary', reportForm.summary)
                  formData.append('details', reportForm.details)
                  
                  for (let i = 0; i < reportPhotos.length; i++) {
                    formData.append('photos', reportPhotos[i])
                  }
                  
                  try {
                    const res = await fetch('/api/reports', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` },
                      body: formData
                    })
                    if (!res.ok) throw new Error('Error al enviar')
                    
                    setReportForm({
                      project_id: reportForm.project_id,
                      summary: '',
                      details: '',
                      weather: 'clear',
                      workers: 0
                    })
                    setReportPhotos([])
                    await loadProjectsAndReports()
                    setActiveTab('tablero')
                    alert('Reporte enviado exitosamente')
                  } catch (err) {
                    alert('Error al enviar el reporte: ' + err.message)
                  }
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Enviar Reporte</button>
              <button className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Guardar Borrador</button>
              <button onClick={() => setActiveTab('tablero')} className="ml-auto text-gray-600 hover:text-gray-900">Volver</button>
            </div>
          </div>
          
          {reports.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold mb-4">Tus Reportes Recientes</h3>
              <div className="space-y-3">
                {reports.slice(0, 5).map(report => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50" 
                    onClick={() => openReportDetails(report)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{report.project_name}</p>
                        <p className="text-xs text-gray-500">{report.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">{report.status}</span>
                        <p className="text-xs text-gray-500 mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Detalles del Reporte</h3>
                  <p className="text-sm text-gray-600">{new Date(selectedReport.created_at).toLocaleDateString('es-ES')}</p>
                </div>
                <button 
                  onClick={() => setShowReportDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">PROYECTO</p>
                  <p className="text-sm font-medium">{selectedReport.project_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">ESTADO</p>
                  <p className={`text-xs font-semibold px-3 py-1 rounded w-fit ${selectedReport.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {selectedReport.status}
                  </p>
                </div>
              </div>
              
              {selectedReport.description && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">DESCRIPCION</p>
                  <p className="text-sm text-gray-700">{selectedReport.description}</p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">FOTOS</p>
                <p className="text-sm font-medium mb-2">{selectedReport.photo_count} foto(s) subida(s)</p>
                {reportFilesLoading && (
                  <p className="text-xs text-gray-500">Cargando fotos...</p>
                )}
                {!reportFilesLoading && reportFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {reportFiles.map(file => {
                      const src = file.url
                        ? (file.url.startsWith('/') ? `${backendBase}${file.url}` : file.url)
                        : ''
                      return (
                        <div key={file.id} className="border border-gray-100 rounded-lg p-2">
                          {src ? (
                            <a href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt={file.filename} className="w-full h-28 object-cover rounded" />
                            </a>
                          ) : (
                            <p className="text-xs text-gray-600 break-words">{file.filename}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {!reportFilesLoading && reportFiles.length === 0 && !reportFilesError && (
                  <p className="text-xs text-gray-500">No hay fotos disponibles</p>
                )}
                {reportFilesError && (
                  <p className="text-xs text-red-600">{reportFilesError}</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">FECHA</p>
                <p className="text-sm text-gray-700">{new Date(selectedReport.created_at).toLocaleString('es-ES')}</p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <button 
                onClick={() => setShowReportDetails(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold">Cerrar</button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'perfil' && (
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Mi Perfil</h2>
              <p className="text-sm text-gray-500 mt-1">Edita tu información personal</p>
            </div>
            
            <div className="border-b pb-6">
              <h3 className="font-semibold mb-4">Foto de Perfil</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0).toUpperCase() || 'S'
                  )}
                </div>
                <div>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer text-sm font-semibold hover:bg-blue-700">
                    Cambiar Foto
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 font-semibold">NOMBRE COMPLETO</label>
                <input 
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 font-semibold">CORREO ELECTRONICO</label>
                <input 
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 font-semibold">TELEFONO</label>
                <input 
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 font-semibold">ESPECIALIDAD/DEPARTAMENTO</label>
                <input 
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  setProfileSaving(true)
                  try {
                    const token = localStorage.getItem('auth_token')
                    const res = await fetch(`/api/users/${user.id}`, {
                      method: 'PATCH',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(profileForm)
                    })
                    if (!res.ok) throw new Error('Error al actualizar')
                    alert('Perfil actualizado exitosamente')
                    setActiveTab('tablero')
                  } catch (err) {
                    alert('Error al guardar: ' + err.message)
                  } finally {
                    setProfileSaving(false)
                  }
                }}
                disabled={profileSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">
                {profileSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button onClick={() => setActiveTab('tablero')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendario' && (
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Calendario de Obra</h2>
            <p className="text-sm text-gray-500">Cronograma semanal - Octubre 2026</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-3 py-1 rounded-full border text-xs">Filtrar Proyectos</button>
            <button
              onClick={() => setCalendarFilter('todos')}
              className={`px-3 py-1 rounded-full text-xs ${calendarFilter === 'todos' ? 'bg-blue-50 text-blue-700' : 'border'}`}
            >
              Todos los Proyectos
            </button>
            <button
              onClick={() => setCalendarFilter('entregas')}
              className={`px-3 py-1 rounded-full text-xs ${calendarFilter === 'entregas' ? 'bg-yellow-50 text-yellow-700' : 'border'}`}
            >
              Entregas de Material
            </button>
            <button
              onClick={() => setCalendarFilter('personal')}
              className={`px-3 py-1 rounded-full text-xs ${calendarFilter === 'personal' ? 'bg-green-50 text-green-700' : 'border'}`}
            >
              Personal
            </button>
            <div className="ml-auto flex gap-2">
              {['hoy', 'semana', 'mes'].map(view => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={`px-3 py-1 rounded-full text-xs ${calendarView === view ? 'bg-blue-600 text-white' : 'border text-gray-600'}`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Inicio</label>
                <DatePicker
                  selected={calendarStart}
                  onChange={(date) => setCalendarStart(date)}
                  dateFormat="dd MMM, yyyy"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Fin</label>
                <DatePicker
                  selected={calendarEnd}
                  onChange={(date) => setCalendarEnd(date)}
                  dateFormat="dd MMM, yyyy"
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {calendarLoading && (
              <div className="text-sm text-gray-500 mb-4">Cargando calendario...</div>
            )}
            {calendarError && (
              <div className="text-sm text-red-600 mb-4">{calendarError}</div>
            )}
            <div className="grid grid-cols-6 text-xs text-gray-500">
              <div>Proyecto / Tarea</div>
              <div>LU 12</div>
              <div>MA 13</div>
              <div>MI 14</div>
              <div>JU 15</div>
              <div>VI 16</div>
            </div>
            <div className="space-y-3 mt-3">
              {calendarRows.length > 0 ? calendarRows.map(row => (
                <div key={row.name} className="grid grid-cols-6 items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.tag}</p>
                  </div>
                  <div className="col-span-5">
                    <div className="h-8 bg-gray-100 rounded-lg relative">
                      <div className={`absolute left-2 top-1 h-6 ${row.color} rounded-lg`} style={{ width: `${row.bars.length * 18}%` }}></div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500">No hay eventos para este rango.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-4">Eventos para Hoy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsToday.length > 0 ? eventsToday.map(event => (
                  <div key={event.id} className="border border-gray-100 rounded-lg p-4">
                    <p className="text-xs text-gray-500">{event.category || 'Evento'}</p>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.project || 'Proyecto RMM'}</p>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">Sin eventos para hoy.</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-4">Acciones Rapidas</h3>
              <div className="space-y-3">
                {(calendarData.actions.length > 0 ? calendarData.actions : [
                  { id: 1, label: 'Agendar Tarea', action_type: 'schedule' },
                  { id: 2, label: 'Exportar Horarios', action_type: 'export' }
                ]).map(action => (
                  <button
                    key={action.id}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-semibold ${
                      action.action_type === 'schedule' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <p className="text-xs text-gray-500">Estado del personal</p>
                <div className="mt-2 text-xs text-gray-600 flex justify-between">
                  <span>Presentes hoy</span>
                  <span>42/45</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-2">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: '93%' }}></div>
                </div>
                <div className="mt-3 text-xs text-gray-600 flex justify-between">
                  <span>Subcontratistas</span>
                  <span>08 Empresas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventario' && (
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestion de Inventario</h2>
              <p className="text-sm text-gray-500">Obra actual: Colombia, Antioquia</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Exportar PDF</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Solicitar Material</button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Lista de Materiales y Herramientas</h3>
              <div className="flex gap-2 text-xs">
                <button className="px-3 py-1 bg-gray-100 rounded">Todos</button>
                <button className="px-3 py-1 rounded">Materiales</button>
                <button className="px-3 py-1 rounded">Herramientas</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">MATERIAL / HERRAMIENTA</th>
                    <th className="px-4 py-3 text-left">CANTIDAD EN STOCK</th>
                    <th className="px-4 py-3 text-left">ESTADO</th>
                    <th className="px-4 py-3 text-left">ULTIMA ACTUALIZACION</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {inventoryRows.map(item => (
                    <tr key={item.name} className="border-b">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 font-semibold">{item.qty}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${item.statusTone}`}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proyectos' && (
        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mis Proyectos</h2>
              <p className="text-sm text-gray-500">Gestion de obras asignadas - 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar proyecto por nombre..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <select
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {projectStatusOptions.map(status => (
                  <option key={status} value={status}>{status === 'todos' ? 'Todos' : status}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-gray-300 to-gray-200"></div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{project.name}</h3>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{project.status || 'activo'}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{project.location}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getProjectProgress(project)}%` }}></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Progreso: {getProjectProgress(project)}%</p>
                    <button onClick={() => { setSelectedProject(project); setShowProjectDetails(true); }} className="text-xs text-blue-600">Ver detalles</button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full text-sm text-gray-500">No hay proyectos que coincidan con los filtros.</div>
            )}
          </div>
        </div>
      )}

      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Detalles del Proyecto</h3>
                  <p className="text-sm text-gray-600">{selectedProject.name}</p>
                </div>
                <button
                  onClick={() => setShowProjectDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">ESTADO</p>
                  <p className="text-sm font-medium">{selectedProject.status || 'activo'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">UBICACION</p>
                  <p className="text-sm font-medium">{selectedProject.location || 'Sin ubicacion'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">INICIO</p>
                  <p className="text-sm font-medium">
                    {selectedProject.start_date ? new Date(selectedProject.start_date).toLocaleDateString('es-ES') : 'No definido'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-1">ENTREGA</p>
                  <p className="text-sm font-medium">
                    {selectedProject.end_date ? new Date(selectedProject.end_date).toLocaleDateString('es-ES') : 'No definido'}
                  </p>
                </div>
              </div>

              {selectedProject.description && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">DESCRIPCION</p>
                  <p className="text-sm text-gray-700">{selectedProject.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">SUPERVISORES</p>
                {selectedProject.supervisors && selectedProject.supervisors.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProject.supervisors.map(person => (
                      <div key={person.id} className="flex items-center justify-between text-sm">
                        <span>{person.name}</span>
                        <span className="text-xs text-gray-500">{person.email || 'Sin email'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin supervisores asignados</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">PROGRESO</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${getProjectProgress(selectedProject)}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{getProjectProgress(selectedProject)}% completado</p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowProjectDetails(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
