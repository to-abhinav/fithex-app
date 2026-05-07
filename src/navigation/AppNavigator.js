import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthLoadingScreen from "../screens/auth/AuthLoadingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegistrationScreen";
import ChooseRoleScreen from "../screens/auth/ChooseRoleScreen";
import ProfileSetupScreen from "../screens/auth/ProfileSetupScreen";
import OtpVerificationScreen from "../screens/auth/OtpVerificationScreen";
import GymInfoScreen from "../screens/dashboard/GymInfoScreen";
import WeightScreen from "../screens/dashboard/WeightScreen";
import GymLogScreen from "../screens/dashboard/GymLogScreen";
import GymPlansScreen from "../screens/dashboard/GymPlansScreen";
import PaymentScreen from "../screens/payment/PaymentScreen";
import PaymentSuccess from "../screens/payment/PaymentSuccess";
import MemberTabNavigator from "./MemberTabNavigator";
import OwnerTabNavigator  from "./OwnerTabNavigator";

const Stack = createNativeStackNavigator();

// 🧪 TESTING FLAG — set to false to restore normal auth flow
const TESTING = false;

const AppNavigator = () => {
  const { isLoading, isSignedIn, userRole } = useAuth();

  if (TESTING) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MemberTabNavigator} />
        <Stack.Screen name="GymLog" component={GymLogScreen} />
        <Stack.Screen name="Weight" component={WeightScreen} />
        <Stack.Screen name="GymInfo" component={GymInfoScreen} />
        <Stack.Screen name="GymPlans" component={GymPlansScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccess}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    );
  }

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <>
          <Stack.Screen
            name="Main"
            component={userRole === 'owner' ? OwnerTabNavigator : MemberTabNavigator}
          />
          <Stack.Screen name="GymInfo"  component={GymInfoScreen}  />
          <Stack.Screen name="GymPlans" component={GymPlansScreen} />
          <Stack.Screen name="Payment"  component={PaymentScreen}  />
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccess}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="GymLog" component={GymLogScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registration" component={RegisterScreen} />
          <Stack.Screen name="ChooseRole" component={ChooseRoleScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
