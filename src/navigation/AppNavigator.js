import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegisterScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />

      {/* Main app with bottom nav */}
      <Stack.Screen name="Main" component={MainTabNavigator} />

      {/* Detail screens (no bottom nav) */}
      <Stack.Screen name="GymInfo"   component={GymInfoScreen}   />
      <Stack.Screen name="GymPlans"  component={GymPlansScreen}  />

      {/* Payment */}
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen
        name="PaymentSuccess"
        component={PaymentSuccess}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
