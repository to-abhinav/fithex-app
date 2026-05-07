import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BottomNavBar from '../components/ui/BottomNavBar';

import ExploreGymsScreen from '../screens/dashboard/ExploreGymsScreen';
import GymLogScreen from '../screens/dashboard/GymLogScreen';
import WeightScreen from '../screens/dashboard/WeightScreen';
import ProfileScreen from '../screens/dashboard/ProfileScreen';

const TabStack = createNativeStackNavigator();

const withTabBar = (ScreenComponent) => {
  const Wrapped = ({ navigation, route }) => (
    <View style={styles.root}>
      <ScreenComponent navigation={navigation} route={route} />
      <BottomNavBar
        activeRoute={route.name}
        onTabPress={(routeName) => {
          navigation.navigate(routeName);
        }}
      />
    </View>
  );
  Wrapped.displayName = `WithTabBar(${ScreenComponent.displayName ?? ScreenComponent.name})`;
  return Wrapped;
};

const ExploreGymsTab = withTabBar(ExploreGymsScreen);
const GymLogTab      = withTabBar(GymLogScreen);
const WeightTab      = withTabBar(WeightScreen);
const ProfileTab     = withTabBar(ProfileScreen);


const MemberTabNavigator = () => (
  <TabStack.Navigator
    initialRouteName="ExploreGyms"
    screenOptions={{ headerShown: false, animation: 'fade' }}
  >
    <TabStack.Screen name="ExploreGyms" component={ExploreGymsTab} />
    <TabStack.Screen name="GymLog"      component={GymLogTab}      />
    <TabStack.Screen name="Weight"      component={WeightTab}      />
    <TabStack.Screen name="Profile"     component={ProfileTab}     />
  </TabStack.Navigator>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default MemberTabNavigator;
