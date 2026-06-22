import "./global.css";
import { useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import ErrorBoundary from "./src/components/ErrorBoundary";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const navigationRef = useRef(null);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer ref={navigationRef}>
            <NotificationProvider navigationRef={navigationRef}>
              <StatusBar style="light" />
              <ErrorBoundary>
                <AppNavigator />
              </ErrorBoundary>
            </NotificationProvider>
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

