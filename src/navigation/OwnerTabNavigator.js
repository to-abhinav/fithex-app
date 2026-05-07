import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Svg, { Path, Line, Circle, Rect } from 'react-native-svg';

import BottomNavBar from '../components/ui/BottomNavBar';
import MyGymScreen     from '../screens/owner/MyGymScreen';
import MembersScreen   from '../screens/owner/MembersScreen';
import AnalyticsScreen from '../screens/owner/AnalyticsScreen';
import MoreScreen      from '../screens/owner/MoreScreen';

import MembershipRequestsScreen from '../screens/owner/MembershipRequestsScreen';
import ManagePlansScreen        from '../screens/owner/ManagePlansScreen';
import AnnouncementsScreen      from '../screens/owner/AnnouncementsScreen';
import GymClosuresScreen        from '../screens/owner/GymClosuresScreen';
import ReviewsScreen            from '../screens/owner/ReviewsScreen';
import EntryLogScreen           from '../screens/owner/EntryLogScreen';
import PaymentHistoryScreen     from '../screens/owner/PaymentHistoryScreen';

const TabStack = createNativeStackNavigator();


const BuildingIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Path d="M9 22V12h6v10" />
    <Line x1="3" y1="9" x2="21" y2="9" />
  </Svg>
);

const UsersIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

const BarChartIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6"  y1="20" x2="6"  y2="14" />
    <Line x1="2"  y1="20" x2="22" y2="20" />
  </Svg>
);

const MoreIcon = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {/* 3×3 dot grid icon */}
    <Circle cx="5"  cy="5"  r="1.5" fill={color} stroke="none" />
    <Circle cx="12" cy="5"  r="1.5" fill={color} stroke="none" />
    <Circle cx="19" cy="5"  r="1.5" fill={color} stroke="none" />
    <Circle cx="5"  cy="12" r="1.5" fill={color} stroke="none" />
    <Circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
    <Circle cx="19" cy="12" r="1.5" fill={color} stroke="none" />
    <Circle cx="5"  cy="19" r="1.5" fill={color} stroke="none" />
    <Circle cx="12" cy="19" r="1.5" fill={color} stroke="none" />
    <Circle cx="19" cy="19" r="1.5" fill={color} stroke="none" />
  </Svg>
);


const OWNER_TABS = [
  { id: 'MyGym',     label: 'My Gym',    Icon: BuildingIcon,  accent: '#6366F1' },
  { id: 'Members',   label: 'Members',   Icon: UsersIcon,     accent: '#8B5CF6' },
  { id: 'Analytics', label: 'Analytics', Icon: BarChartIcon,  accent: '#06B6D4' },
  { id: 'More',      label: 'More',      Icon: MoreIcon,      accent: '#8B5CF6' },
];


const withTabBar = (ScreenComponent, tabsConfig) => {
  const Wrapped = ({ navigation, route }) => (
    <View style={styles.root}>
      <ScreenComponent navigation={navigation} route={route} />
      <BottomNavBar
        activeRoute={route.name}
        tabs={tabsConfig}
        onTabPress={(routeName) => navigation.navigate(routeName)}
      />
    </View>
  );
  Wrapped.displayName = `WithTabBar(${ScreenComponent.displayName ?? ScreenComponent.name})`;
  return Wrapped;
};

const MyGymTab      = withTabBar(MyGymScreen,     OWNER_TABS);
const MembersTab    = withTabBar(MembersScreen,   OWNER_TABS);
const AnalyticsTab  = withTabBar(AnalyticsScreen, OWNER_TABS);
const MoreTab       = withTabBar(MoreScreen,      OWNER_TABS);


const OwnerTabNavigator = () => (
  <TabStack.Navigator
    initialRouteName="MyGym"
    screenOptions={{ headerShown: false, animation: 'fade' }}
  >
    {/* ── Main Tabs (with bottom nav bar) ──────────────────────────────── */}
    <TabStack.Screen name="MyGym"     component={MyGymTab}     />
    <TabStack.Screen name="Members"   component={MembersTab}   />
    <TabStack.Screen name="Analytics" component={AnalyticsTab} />
    <TabStack.Screen name="More"      component={MoreTab}      />

    {/* ── Sub-screens (navigated from More, no tab bar) ────────────── */}
    <TabStack.Screen name="MembershipRequests" component={MembershipRequestsScreen} options={{ animation: 'slide_from_right' }} />
    <TabStack.Screen name="ManagePlans"        component={ManagePlansScreen}        options={{ animation: 'slide_from_right' }} />
    <TabStack.Screen name="Announcements"      component={AnnouncementsScreen}      options={{ animation: 'slide_from_right' }} />
    <TabStack.Screen name="GymClosures"        component={GymClosuresScreen}        options={{ animation: 'slide_from_right' }} />
    <TabStack.Screen name="Reviews"            component={ReviewsScreen}            options={{ animation: 'slide_from_right' }} />
    <TabStack.Screen name="EntryLog"           component={EntryLogScreen}           options={{ animation: 'slide_from_right' }} />
    <TabStack.Screen name="PaymentHistory"     component={PaymentHistoryScreen}     options={{ animation: 'slide_from_right' }} />
  </TabStack.Navigator>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default OwnerTabNavigator;
