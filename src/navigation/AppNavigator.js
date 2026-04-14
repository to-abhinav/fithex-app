import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegistrationScreen";
import ProfileScreen from "../screens/dashboard/ProfileScreen";
import PaymentScreen from "../screens/payment/PaymentScreen";
import PaymentSuccess from "../screens/payment/PaymentSuccess";

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

      {/* Dashboard */}
      <Stack.Screen name="Profile" component={ProfileScreen} />

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
