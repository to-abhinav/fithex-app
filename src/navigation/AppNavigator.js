import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthLoadingScreen from "../screens/auth/AuthLoadingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegistrationScreen";
import OtpVerificationScreen from "../screens/auth/OtpVerificationScreen";
import GymInfoScreen from "../screens/dashboard/GymInfoScreen";
import GymPlansScreen from "../screens/dashboard/GymPlansScreen";
import PaymentScreen from "../screens/payment/PaymentScreen";
import PaymentSuccess from "../screens/payment/PaymentSuccess";
import MainTabNavigator from "./MainTabNavigator";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="GymInfo"  component={GymInfoScreen}  />
          <Stack.Screen name="GymPlans" component={GymPlansScreen} />
          <Stack.Screen name="Payment"  component={PaymentScreen}  />
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccess}
            options={{ gestureEnabled: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registration" component={RegisterScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
