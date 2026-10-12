import React, { useState } from "react";
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Text } from "react-native";
import { Screen, Display, Dim, Input, Button } from "../components/UI";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing, type } from "../theme/theme";

export function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    if (!email || !username || !password) { Alert.alert("Almost there", "Fill in all fields to create your account."); return; }
    if (password.length < 8) { Alert.alert("Stronger password", "Use at least 8 characters."); return; }
    setLoading(true);
    try { await register(email.trim(), username.trim(), password); }
    catch (e: any) { Alert.alert("Couldn't sign up", e?.response?.data?.error ?? "Try a different email or username."); }
    finally { setLoading(false); }
  }

  return (
    <Screen style={{ padding: spacing.lg }}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "center" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brand}>
          <Text style={styles.mark}>◆</Text>
          <Text style={styles.wordmark}>Travel_X</Text>
        </View>
        <Display>Start your map</Display>
        <Dim style={{ marginBottom: spacing.lg, marginTop: spacing.xs }}>Log the places you've been. Plan the ones you haven't.</Dim>
        <Input placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Username" value={username} onChangeText={setUsername} />
        <Input placeholder="Password (8+ characters)" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Create account" onPress={onRegister} loading={loading} style={{ marginTop: spacing.xs }} />
        <View style={styles.row}>
          <Dim>Already have an account? </Dim>
          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>Sign in</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xl },
  mark: { color: colors.accent, fontSize: 20, marginRight: 8 },
  wordmark: { color: colors.text, fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  link: { color: colors.accent, ...type.small, fontWeight: "700" },
});
