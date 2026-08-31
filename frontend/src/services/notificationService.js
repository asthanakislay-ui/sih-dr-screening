// notificationService.js
import { UnauthorizedError } from './screeningService';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_BASE_URL}/api/notifications`;

/**
 * Fetch notifications for the authenticated user.
 */
export async function fetchNotifications(token) {
  const response = await fetch(API_URL, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new UnauthorizedError();
    const errBody = await response.json();
    throw new Error(errBody.message || 'Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Fetch the count of unread notifications.
 */
export async function fetchUnreadCount(token) {
  const response = await fetch(`${API_URL}/unread-count`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new UnauthorizedError();
    const errBody = await response.json();
    throw new Error(errBody.message || 'Failed to fetch unread count');
  }

  return response.json();
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationAsRead(id, token) {
  const response = await fetch(`${API_URL}/${id}/read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new UnauthorizedError();
    const errBody = await response.json();
    throw new Error(errBody.message || 'Failed to mark notification as read');
  }

  return response.json();
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(token) {
  const response = await fetch(`${API_URL}/read-all`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new UnauthorizedError();
    const errBody = await response.json();
    throw new Error(errBody.message || 'Failed to mark all as read');
  }

  return response.json();
}
