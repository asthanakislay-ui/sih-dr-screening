# Implementation Plan: Notifications Feature

## Overview
Add a complete notification system to the RETINA application to alert clinicians of new screenings (especially referable ones) and technicians of successful processing.

## 1. Backend Implementation

### 1.1 Data Model
**File**: `backend/src/models/Notification.js`
**Schema**:
- `recipient`: ObjectId (ref User), required, indexed.
- `type`: String (enum: 'NEW_SCREENING', 'REFERABLE_RESULT'), required.
- `title`: String, required.
- `message`: String, required.
- `isRead`: Boolean, default false.
- `screeningId`: ObjectId (ref Screening), optional.
- `createdAt`: Timestamp.

### 1.2 Notification Controller
**File**: `backend/src/controllers/notification.controller.js`
- `getNotifications`: Fetch notifications for `req.userId` sorted by `createdAt` DESC.
- `getUnreadCount`: Return count of notifications where `recipient === req.userId` and `isRead === false`.
- `markAsRead`: Set `isRead: true` for notification `req.params.id`.
- `markAllAsRead`: Set `isRead: true` for all notifications of `req.userId`.

### 1.3 Notification Routes
**File**: `backend/src/routes/notification.routes.js`
- `GET /` -> `getNotifications`
- `GET /unread-count` -> `getUnreadCount`
- `PATCH /:id/read` -> `markAsRead`
- `PATCH /read-all` -> `markAllAsRead`
- All endpoints protected by `protect` middleware.

### 1.4 App Integration
**File**: `backend/src/app.js`
- Import `notificationRoutes` and use `app.use('/api/notifications', notificationRoutes)`.

### 1.5 Notification Triggers
**File**: `backend/src/controllers/screening.controller.js`
- Implement `createNotification` helper.
- In `createScreening`, after `Screening.create`:
    - **Technician**: Notify `req.userId` that screening was saved.
    - **Clinicians**: Find all users with role `clinician`.
        - If `referable === true`, send `REFERABLE_RESULT` notification.
        - Else, send `NEW_SCREENING` notification.

## 2. Frontend Implementation

### 2.1 Notification Service
**File**: `frontend/src/services/notificationService.js`
- `fetchNotifications(token)`
- `fetchUnreadCount(token)`
- `markNotificationAsRead(id, token)`
- `markAllNotificationsAsRead(token)`

### 2.2 Header Integration
**File**: `frontend/src/components/Header.jsx`
- **State**: `notifications`, `unreadCount`.
- **Lifecycle**: Fetch on mount/session update.
- **UI**:
    - Use real `notifications` instead of `demoNotifications`.
    - Update bell dot based on `unreadCount`.
    - Show `unreadCount` in popover.
- **Interactions**:
    - Click item: `markNotificationAsRead` -> Navigate to `/analysis-result/:id` (if applicable).
    - Mark all as read: `markAllNotificationsAsRead` -> Update state.

## 3. Critical Files for Implementation
- `backend/src/models/Notification.js`
- `backend/src/controllers/notification.controller.js`
- `backend/src/routes/notification.routes.js`
- `backend/src/controllers/screening.controller.js`
- `frontend/src/services/notificationService.js`
- `frontend/src/components/Header.jsx`
