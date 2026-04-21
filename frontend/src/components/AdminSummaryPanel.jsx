import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardAPI } from '../api';

const REFRESH_INTERVAL_MS = 15000;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const NOTIFICATION_COUNT_KEY = 'admin_unread_notifications';
const NOTIFICATION_LIST_KEY = 'admin_notifications';

function getStoredNotificationCount() {
  const raw = localStorage.getItem(NOTIFICATION_COUNT_KEY);
  const parsed = Number.parseInt(raw || '0', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LIST_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(notification => ({
        id: notification.id,
        created_at: notification.created_at || new Date().toISOString(),
        message: notification.message || 'Nuevo informe registrado',
        report: notification.report || null,
        read: Boolean(notification.read)
      }))
      .filter(notification => notification.id);
  } catch (_err) {
    return [];
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATION_LIST_KEY, JSON.stringify(notifications));
}

function makeNotificationId(report, createdAt) {
  if (report?.id) {
    return `report-${report.id}`;
  }
  return `report-${createdAt || new Date().toISOString()}`;
}

function publishNotificationCount(count) {
  localStorage.setItem(NOTIFICATION_COUNT_KEY, String(count));
  window.dispatchEvent(
    new CustomEvent('admin-notification-count-changed', {
      detail: { count }
    })
  );
}

function formatDateTime(dateString) {
  if (!dateString) {
    return 'Sin datos';
  }

  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function percentage(part, total) {
  if (!total) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

function getSummarySignature(summaryPayload) {
  return JSON.stringify({
    metrics: summaryPayload?.metrics || {},
    recent_reports: summaryPayload?.recent_reports || []
  });
}

export default function AdminSummaryPanel({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [lastChangeAt, setLastChangeAt] = useState('');
  const [lastUnchangedCheckAt, setLastUnchangedCheckAt] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState(() => getStoredNotifications());
  const legacyUnreadCountRef = useRef(getStoredNotificationCount());
  const seededFromSummaryRef = useRef(false);
  const lastSummarySignatureRef = useRef('');
  const unreadNotifications = notifications.filter(notification => !notification.read).length;
  const readNotifications = notifications.filter(notification => notification.read);

  useEffect(() => {
    saveNotifications(notifications);
    publishNotificationCount(unreadNotifications);
  }, [notifications, unreadNotifications]);

  const addNotification = useCallback(notification => {
    setNotifications(prev => {
      if (prev.some(item => item.id === notification.id)) {
        return prev;
      }

      return [notification, ...prev].slice(0, 8);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  }, []);

  const seedNotificationsFromSummary = useCallback(
    payload => {
      const fallbackUnreadCount = legacyUnreadCountRef.current;
      if (seededFromSummaryRef.current || notifications.length > 0 || fallbackUnreadCount <= 0) {
        return;
      }

      const recentReports = Array.isArray(payload?.recent_reports) ? payload.recent_reports : [];
      if (recentReports.length === 0) {
        return;
      }

      const seededNotifications = recentReports
        .slice(0, fallbackUnreadCount)
        .map((report, index) => ({
          id: makeNotificationId(report, report.created_at || String(index)),
          created_at: report.created_at || new Date().toISOString(),
          message: 'Nuevo informe registrado',
          report,
          read: false
        }));

      if (seededNotifications.length > 0) {
        seededFromSummaryRef.current = true;
        setNotifications(seededNotifications);
      }
    },
    [notifications.length]
  );

  const mergeRecentReportsAsNotifications = useCallback(payload => {
    const recentReports = Array.isArray(payload?.recent_reports) ? payload.recent_reports : [];
    if (recentReports.length === 0) {
      return;
    }

    setNotifications(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const incoming = recentReports
        .map(report => ({
          id: makeNotificationId(report, report.created_at),
          created_at: report.created_at || new Date().toISOString(),
          message: 'Nuevo informe registrado',
          report,
          read: false
        }))
        .filter(item => !existingIds.has(item.id));

      if (incoming.length === 0) {
        return prev;
      }

      return [...incoming, ...prev].slice(0, 8);
    });
  }, []);

  const applySummaryPayload = useCallback(
    payload => {
      const signature = getSummarySignature(payload);
      const nowIso = new Date().toISOString();

      if (signature !== lastSummarySignatureRef.current) {
        lastSummarySignatureRef.current = signature;
        setSummary(payload);
        seedNotificationsFromSummary(payload);
        mergeRecentReportsAsNotifications(payload);
        setLastChangeAt(nowIso);
        setLastUnchangedCheckAt('');
        return;
      }

      // Polling fallback can return same data repeatedly; keep current summary and mark no-change check.
      setLastUnchangedCheckAt(nowIso);
    },
    [mergeRecentReportsAsNotifications, seedNotificationsFromSummary]
  );

  const fetchSummary = useCallback(
    async (silent = false) => {
      try {
        setError('');
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const { data } = await dashboardAPI.getSummary();
        applySummaryPayload(data);
      } catch (err) {
        setError(err?.response?.data?.error || 'No se pudo cargar el panel de resumen');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applySummaryPayload]
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setStreamConnected(false);
      return undefined;
    }

    const streamUrl = `${API_BASE}/dashboard/stream`;
    const controller = new AbortController();
    const decoder = new TextDecoder();

    const processSseBlock = block => {
      const lines = block.split('\n').map(line => line.trim());
      let eventName = 'message';
      const dataLines = [];

      lines.forEach(line => {
        if (!line || line.startsWith(':')) {
          return;
        }
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
          return;
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      });

      if (eventName === 'notification' && dataLines.length > 0) {
        try {
          const notificationPayload = JSON.parse(dataLines.join('\n'));
          if (notificationPayload?.type === 'report.created' && notificationPayload?.report) {
            const report = notificationPayload.report;
            const notificationId = makeNotificationId(
              report,
              notificationPayload.created_at || new Date().toISOString()
            );

            addNotification({
              id: notificationId,
              created_at: notificationPayload.created_at || new Date().toISOString(),
              message: 'Nuevo informe registrado',
              report,
              read: false
            });

            setLastChangeAt(new Date().toISOString());
          }
        } catch (_err) {
          // Ignore malformed notification payload.
        }
        return;
      }

      if (eventName !== 'summary' || dataLines.length === 0) {
        if (eventName === 'unchanged' && dataLines.length > 0) {
          try {
            const unchangedPayload = JSON.parse(dataLines.join('\n'));
            setLastUnchangedCheckAt(unchangedPayload?.checked_at || new Date().toISOString());
          } catch (_err) {
            setLastUnchangedCheckAt(new Date().toISOString());
          }
        }
        return;
      }

      try {
        const payload = JSON.parse(dataLines.join('\n'));
        applySummaryPayload(payload);
        setError('');
        setLoading(false);
        setStreamConnected(true);
      } catch (_err) {
        setStreamConnected(false);
      }
    };

    const connectStream = async () => {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(streamUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream'
            },
            signal: controller.signal
          });

          if (!response.ok || !response.body) {
            throw new Error('Could not connect stream');
          }

          setStreamConnected(true);
          let buffer = '';
          const reader = response.body.getReader();

          while (!controller.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';
            blocks.forEach(processSseBlock);
          }
        } catch (_err) {
          setStreamConnected(false);
        }

        if (!controller.signal.aborted) {
          await new Promise(resolve => {
            window.setTimeout(resolve, 4000);
          });
        }
      }
    };

    connectStream();

    return () => {
      controller.abort();
    };
  }, [applySummaryPayload, addNotification]);

  useEffect(() => {
    if (streamConnected) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchSummary(true);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [streamConnected, fetchSummary]);

  const metrics = summary?.metrics || {};
  const recentReports = summary?.recent_reports || [];

  const cards = [
    {
      title: 'Proyectos Totales',
      value: metrics.total_projects ?? 0,
      helper: `${metrics.projects_without_supervisor ?? 0} sin supervisor asignado`,
      action: () => onNavigate('proyectos')
    },
    {
      title: 'Proyectos En Progreso',
      value: metrics.in_progress_projects ?? 0,
      helper: `${percentage(metrics.in_progress_projects ?? 0, metrics.total_projects ?? 0)}% del total`,
      action: () => onNavigate('proyectos')
    },
    {
      title: 'Reportes (24h)',
      value: metrics.reports_last_24h ?? 0,
      helper: `${metrics.total_reports ?? 0} acumulados`,
      action: () => onNavigate('reportes')
    },
    {
      title: 'Supervisores Activos',
      value: metrics.active_supervisors ?? 0,
      helper: `${metrics.active_users ?? 0} usuarios activos`,
      action: () => onNavigate('equipos')
    }
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel de Resumen Administrativo</h2>
            <p className="text-sm text-gray-600 mt-1">
              Métricas consolidadas del proyecto con actualización automática cada 15 segundos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
              {streamConnected ? 'Tiempo real seguro conectado' : 'Modo respaldo (polling)'}
            </span>
            <button
              onClick={() => fetchSummary(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
              disabled={refreshing}
            >
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Última actualización: {formatDateTime(summary?.generated_at)}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
          <p className="text-xs text-gray-600">
            Último cambio detectado:{' '}
            {lastChangeAt ? formatDateTime(lastChangeAt) : 'Sin cambios aún'}
          </p>
          <p className="text-xs text-amber-700 font-medium">
            {lastUnchangedCheckAt
              ? `Sin cambios detectados en la última verificación (${formatDateTime(lastUnchangedCheckAt)})`
              : 'Esperando verificación de cambios...'}
          </p>
        </div>
      </section>

      {loading && (
        <section className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600">Cargando resumen...</p>
        </section>
      )}

      {!loading && error && (
        <section className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </section>
      )}

      {!loading && !error && (
        <>
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Notificaciones de Informes</h3>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                {notifications.length} recientes · {unreadNotifications} sin leer
              </span>
            </div>

            <div className="flex justify-end mb-3">
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                disabled={unreadNotifications === 0}
              >
                Marcar todas como leidas
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aun no hay notificaciones. Se mostraran aqui cuando se registre un informe.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  <h4 className="text-sm font-bold text-gray-900">
                    Sin leer ({unreadNotifications})
                  </h4>
                  {notifications.filter(item => !item.read).length === 0 ? (
                    <p className="text-xs text-gray-500">No hay notificaciones sin leer.</p>
                  ) : (
                    notifications
                      .filter(item => !item.read)
                      .map(item => (
                        <div
                          key={item.id}
                          className="border border-blue-100 bg-blue-50 rounded-lg p-4"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <p className="text-sm font-semibold text-blue-900">{item.message}</p>
                            <p className="text-xs text-blue-700">
                              {formatDateTime(item.created_at)}
                            </p>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                            <p>
                              <span className="font-semibold">Proyecto:</span>{' '}
                              {item.report?.project_name || 'Sin proyecto'}
                            </p>
                            <p>
                              <span className="font-semibold">Autor:</span>{' '}
                              {item.report?.author_name || 'Sin autor'}
                            </p>
                            <p>
                              <span className="font-semibold">Estado:</span>{' '}
                              {item.report?.status || 'pending'}
                            </p>
                            <p>
                              <span className="font-semibold">Fecha informe:</span>{' '}
                              {formatDateTime(item.report?.created_at)}
                            </p>
                          </div>
                          {item.report?.description && (
                            <p className="text-xs text-gray-700 mt-2">
                              <span className="font-semibold">Resumen:</span>{' '}
                              {item.report.description}
                            </p>
                          )}
                        </div>
                      ))
                  )}
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  <h4 className="text-sm font-bold text-gray-900">
                    Leídas ({readNotifications.length})
                  </h4>
                  {readNotifications.length === 0 ? (
                    <p className="text-xs text-gray-500">No hay notificaciones leídas todavía.</p>
                  ) : (
                    readNotifications.map(item => (
                      <div
                        key={item.id}
                        className="border border-gray-200 bg-gray-50 rounded-lg p-4 opacity-80"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800">{item.message}</p>
                          <p className="text-xs text-gray-600">{formatDateTime(item.created_at)}</p>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                          <p>
                            <span className="font-semibold">Proyecto:</span>{' '}
                            {item.report?.project_name || 'Sin proyecto'}
                          </p>
                          <p>
                            <span className="font-semibold">Autor:</span>{' '}
                            {item.report?.author_name || 'Sin autor'}
                          </p>
                          <p>
                            <span className="font-semibold">Estado:</span>{' '}
                            {item.report?.status || 'pending'}
                          </p>
                          <p>
                            <span className="font-semibold">Fecha informe:</span>{' '}
                            {formatDateTime(item.report?.created_at)}
                          </p>
                        </div>
                        {item.report?.description && (
                          <p className="text-xs text-gray-700 mt-2">
                            <span className="font-semibold">Resumen:</span>{' '}
                            {item.report.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map(card => (
              <button
                key={card.title}
                onClick={card.action}
                className="bg-white rounded-xl shadow hover:shadow-lg transition text-left p-5 border border-transparent hover:border-blue-200"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                <p className="text-xs text-blue-600 mt-2">{card.helper}</p>
              </button>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Estado de Proyectos</h3>
              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>En progreso</span>
                  <span>{metrics.in_progress_projects ?? 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${percentage(metrics.in_progress_projects ?? 0, metrics.total_projects ?? 0)}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>Planeación</span>
                  <span>{metrics.planning_projects ?? 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${percentage(metrics.planning_projects ?? 0, metrics.total_projects ?? 0)}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>Completados</span>
                  <span>{metrics.completed_projects ?? 0}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${percentage(metrics.completed_projects ?? 0, metrics.total_projects ?? 0)}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Estado de Reportes</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-semibold">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-800 mt-1">
                    {metrics.pending_reports ?? 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-700 font-semibold">Completados</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {metrics.completed_reports ?? 0}
                  </p>
                </div>
                <div className="bg-sky-50 rounded-lg p-3">
                  <p className="text-xs text-sky-700 font-semibold">Revisados</p>
                  <p className="text-2xl font-bold text-sky-800 mt-1">
                    {metrics.reviewed_reports ?? 0}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('reportes')}
                className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition"
              >
                Ir a gestión de reportes
              </button>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
              <button
                onClick={() => onNavigate('reportes')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Ver todos
              </button>
            </div>

            {recentReports.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay actividad reciente de reportes.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-2 text-xs font-semibold text-gray-500">PROYECTO</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-gray-500">AUTOR</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-gray-500">ESTADO</th>
                      <th className="py-2 text-xs font-semibold text-gray-500">FECHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map(report => (
                      <tr key={report.id} className="border-b last:border-0">
                        <td className="py-3 pr-2 text-sm text-gray-800">
                          {report.project_name || 'Sin proyecto'}
                        </td>
                        <td className="py-3 pr-2 text-sm text-gray-600">
                          {report.author_name || 'Sin autor'}
                        </td>
                        <td className="py-3 pr-2 text-sm text-gray-600">
                          {report.status || 'pending'}
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {formatDateTime(report.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
