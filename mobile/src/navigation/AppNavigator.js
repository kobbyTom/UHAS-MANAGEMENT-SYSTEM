import React from 'react';
import { Platform, View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Calendar as CalendarIcon, User } from 'lucide-react-native';
import { COLORS } from '../theme';
import { MotiView } from 'moti';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AcademicsScreen from '../screens/AcademicsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import ScheduleScreen from '../screens/ScheduleScreen';
import GradesScreen from '../screens/GradesScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import FeesScreen from '../screens/FeesScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';

import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const getIcon = (color, size) => {
            if (route.name === 'Dashboard') return <Home color={color} size={size} />;
            if (route.name === 'Academics') return <BookOpen color={color} size={size} />;
            if (route.name === 'Calendar') return <CalendarIcon color={color} size={size} />;
            if (route.name === 'Profile') return <User color={color} size={size} />;
            return null;
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.85}
            >
              <MotiView
                animate={{
                  scale: isFocused ? 1.12 : 1,
                  translateY: isFocused ? -2 : 0,
                }}
                transition={{ type: 'spring', damping: 15 }}
                style={styles.iconContainer}
              >
                <MotiView
                  animate={{
                    backgroundColor: isFocused ? `${COLORS.primary}12` : 'transparent',
                  }}
                  transition={{ type: 'timing', duration: 150 }}
                  style={styles.iconBg}
                >
                  {getIcon(isFocused ? COLORS.primary : COLORS.slate[400], 20)}
                </MotiView>
              </MotiView>
              
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? COLORS.primary : COLORS.slate[450] }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Academics" component={AcademicsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="Grades" component={GradesScreen} />
          <Stack.Screen name="Assignments" component={AssignmentsScreen} />
          <Stack.Screen name="Attendance" component={AttendanceScreen} />
          <Stack.Screen name="Fees" component={FeesScreen} />
          <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: Platform.OS === 'ios' ? 90 : 76,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderBottomWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default AppNavigator;
