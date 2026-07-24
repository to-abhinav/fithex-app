import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { getUnreadCount, savePushToken } from "../api/notificationService";
import { useAuth } from "./AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children, navigationRef }) => {
  const { isSignedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);
  const responseListener = useRef(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {}
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;

    const register = async () => {
      if (!Device.isDevice) return; // push only works on real devices

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      await savePushToken(token).catch(() => {});
    };

    register();
  }, [isSignedIn]);

  // Poll unread count
  useEffect(() => {
    if (!isSignedIn) return;

    refresh();
    intervalRef.current = setInterval(refresh, 30000);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      clearInterval(intervalRef.current);
      sub?.remove();
    };
  }, [isSignedIn, refresh]);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen && navigationRef?.current) {
        navigationRef.current.navigate(screen);
      } else if (navigationRef?.current) {
        navigationRef.current.navigate("Notifications");
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [navigationRef]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};
