// ============================================================
// MarkleTravelBooking — Zustand Store: Notifications
// ============================================================
import { create } from "zustand";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isPanelOpen: boolean;
}

interface NotificationActions {
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (ns: Notification[]) => void;
  openPanel: () => void;
  closePanel: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    isPanelOpen: false,

    addNotification: (n) =>
      set((s) => {
        const notifications = [n, ...s.notifications];
        return {
          notifications,
          unreadCount: notifications.filter((x) => !x.read).length,
        };
      }),

    markRead: (id) =>
      set((s) => {
        const notifications = s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        );
        return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
      }),

    markAllRead: () =>
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      })),

    setNotifications: (notifications) =>
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),

    openPanel: () => set({ isPanelOpen: true }),
    closePanel: () => set({ isPanelOpen: false }),

    removeNotification: (id) =>
      set((s) => {
        const notifications = s.notifications.filter((n) => n.id !== id);
        return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
      }),
  }),
);
