import React from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { MapScreen } from "../screens/MapScreen";
import { DiaryScreen } from "../screens/DiaryScreen";
import { AddVisitScreen } from "../screens/AddVisitScreen";
import { WishlistScreen } from "../screens/WishlistScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { VisitDetailScreen } from "../screens/VisitDetailScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { colors } from "../theme/theme";

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.accent },
};

function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (<Text style={{ fontSize: 18, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>);
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, height: 62, paddingBottom: 8, paddingTop: 8 },
      tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.textDim,
      tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    }}>
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: tabIcon("🗺️") }} />
      <Tab.Screen name="Diary" component={DiaryScreen} options={{ tabBarIcon: tabIcon("📖") }} />
      <Tab.Screen name="Add" component={AddVisitScreen} options={{ tabBarIcon: tabIcon("➕") }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ tabBarIcon: tabIcon("☆") }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon("👤") }} />
    </Tab.Navigator>
  );
}

const stackHeader = {
  headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text }, headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function AppStack() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="VisitDetail" component={VisitDetailScreen} options={{ ...stackHeader, title: "" }} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ ...stackHeader, title: "Edit profile" }} />
    </RootStack.Navigator>
  );
}

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (<View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.accent} size="large" /></View>);
  }
  return (<NavigationContainer theme={navTheme}>{user ? <AppStack /> : <AuthStack />}</NavigationContainer>);
}
