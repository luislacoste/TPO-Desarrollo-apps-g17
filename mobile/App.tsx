import React from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppData } from "./src/context/AppContext";
import BottomNav, { NavItem } from "./src/components/BottomNav";

import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CatalogScreen from "./src/screens/CatalogScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PaymentsScreen from "./src/screens/PaymentsScreen";
import AuctionLiveScreen from "./src/screens/AuctionLiveScreen";
import ItemDetailScreen from "./src/screens/ItemDetailScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Payments: undefined;
  AuctionLive: { auctionId: string };
  ItemDetail: { itemId: string };
  Settings: undefined;
};

const TAB_TO_NAV_ITEM: Record<string, NavItem> = {
  Home: "home",
  Catalog: "catalog",
  Notifications: "notifications",
  Profile: "profile",
};

const NAV_ITEM_TO_SCREEN: Record<NavItem, string> = {
  home: "Home",
  catalog: "Catalog",
  notifications: "Notifications",
  profile: "Profile",
};

function TabBarWrapper({ state, navigation }: any) {
  const { notifications } = useAppData();
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  const currentTab = state.routes[state.index].name as string;
  return (
    <BottomNav
      active={TAB_TO_NAV_ITEM[currentTab] ?? "home"}
      onNavigate={(item) => navigation.navigate(NAV_ITEM_TO_SCREEN[item])}
      notificationCount={unreadCount}
    />
  );
}

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBarWrapper {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Catalog" component={CatalogScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
              initialRouteName="Splash"
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Payments" component={PaymentsScreen} />
              <Stack.Screen name="AuctionLive" component={AuctionLiveScreen} />
              <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </View>
  );
}
