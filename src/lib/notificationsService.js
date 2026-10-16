/**
 * notificationsService.js
 * Centralized helper for reading/writing notifications to localStorage.
 * Notifications are scoped per user: serviceq_notifications_<userId>
 */

const KEY = (uid) => `serviceq_notifications_${uid}`

/**
 * Push a new notification for a user.
 * @param {string} userId  — recipient user id
 * @param {{ title, message, type?, link? }} notif
 *   type: 'info' | 'success' | 'warning' | 'error'  (default 'info')
 */
export function pushNotification(userId, { title, message, type = 'info', link = null }) {
  if (!userId) return
  try {
    const existing = getNotifications(userId)
    const newNotif = {
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    }
    const updated = [newNotif, ...existing].slice(0, 50) // keep last 50
    localStorage.setItem(KEY(userId), JSON.stringify(updated))
    // Broadcast to other tabs
    window.dispatchEvent(new CustomEvent('serviceq_notifications_updated', { detail: { userId } }))
  } catch {}
}

/**
 * Get all notifications for a user.
 */
export function getNotifications(userId) {
  if (!userId) return []
  try {
    return JSON.parse(localStorage.getItem(KEY(userId))) || []
  } catch { return [] }
}

/**
 * Mark all notifications as read.
 */
export function markAllRead(userId) {
  if (!userId) return
  try {
    const notifs = getNotifications(userId).map(n => ({ ...n, read: true }))
    localStorage.setItem(KEY(userId), JSON.stringify(notifs))
    window.dispatchEvent(new CustomEvent('serviceq_notifications_updated', { detail: { userId } }))
  } catch {}
}

/**
 * Mark a single notification as read.
 */
export function markRead(userId, notifId) {
  if (!userId) return
  try {
    const notifs = getNotifications(userId).map(n =>
      n.id === notifId ? { ...n, read: true } : n
    )
    localStorage.setItem(KEY(userId), JSON.stringify(notifs))
    window.dispatchEvent(new CustomEvent('serviceq_notifications_updated', { detail: { userId } }))
  } catch {}
}

/**
 * Delete a notification.
 */
export function deleteNotification(userId, notifId) {
  if (!userId) return
  try {
    const notifs = getNotifications(userId).filter(n => n.id !== notifId)
    localStorage.setItem(KEY(userId), JSON.stringify(notifs))
    window.dispatchEvent(new CustomEvent('serviceq_notifications_updated', { detail: { userId } }))
  } catch {}
}

/**
 * Clear all notifications for a user.
 */
export function clearAllNotifications(userId) {
  if (!userId) return
  try {
    localStorage.removeItem(KEY(userId))
    window.dispatchEvent(new CustomEvent('serviceq_notifications_updated', { detail: { userId } }))
  } catch {}
}

export function unreadCount(userId) {
  return getNotifications(userId).filter(n => !n.read).length
}
