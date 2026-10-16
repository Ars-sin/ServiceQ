import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  getNotifications,
  markAllRead,
  markRead,
  deleteNotification,
  clearAllNotifications,
  unreadCount,
} from '@/lib/notificationsService'

const TYPE_ICON = {
  info:    <Info size={14} className="text-blue-500 flex-shrink-0" />,
  success: <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />,
  warning: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />,
  error:   <XCircle size={14} className="text-red-500 flex-shrink-0" />,
}

const TYPE_BG = {
  info:    'bg-blue-50 border-blue-100',
  success: 'bg-emerald-50 border-emerald-100',
  warning: 'bg-amber-50 border-amber-100',
  error:   'bg-red-50 border-red-100',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/**
 * NotificationBell
 * Props:
 *   userId   – current user id (for scoped storage)
 *   dotColor – Tailwind color class for the unread dot (default 'bg-emerald-500')
 */
export default function NotificationBell({ userId, dotColor = 'bg-emerald-500' }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const panelRef = useRef(null)
  const btnRef   = useRef(null)
  const navigate = useNavigate()

  const reload = () => setNotifs(getNotifications(userId))

  useEffect(() => {
    reload()
    const handler = (e) => {
      if (!e.detail?.userId || e.detail.userId === userId) reload()
    }
    window.addEventListener('serviceq_notifications_updated', handler)
    window.addEventListener('storage', reload)
    return () => {
      window.removeEventListener('serviceq_notifications_updated', handler)
      window.removeEventListener('storage', reload)
    }
  }, [userId])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifs.filter(n => !n.read).length

  const handleClick = (notif) => {
    markRead(userId, notif.id)
    reload()
    if (notif.link) {
      setOpen(false)
      navigate(notif.link)
    }
  }

  const handleMarkAll = () => { markAllRead(userId); reload() }
  const handleDelete  = (e, id) => { e.stopPropagation(); deleteNotification(userId, id); reload() }
  const handleClear   = () => { clearAllNotifications(userId); reload() }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-500" />
        {unread > 0 && (
          <span className={`absolute top-1 right-1 min-w-[16px] h-4 ${dotColor} rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-600" />
              <span className="text-sm font-bold text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dotColor} text-white`}>
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all read"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={handleClear}
                  title="Clear all"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-gray-50/60' : ''}`}
                >
                  <div className="mt-0.5">{TYPE_ICON[n.type] || TYPE_ICON.info}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-gray-900 truncate ${!n.read ? 'font-bold' : ''}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0 mt-1.5`} />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    className="p-1 rounded hover:bg-gray-200 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
