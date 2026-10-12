import React, { useState } from "react";
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Text } from "react-native";
import { Screen, Display, Dim, Input, Button } from "../components/UI";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing, type } from "../theme/theme";

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    if (!email || !password) { Alert.alert("Almost there", "Enter your email and password to continue."); return; }
    setLoading(true);
    try { await login(email.trim(), password); }
    catch (e: any) { Alert.alert("Couldn't sign in", e?.response?.data?.error ?? "Check your details and try again."); }
    finally { setLoading(false); }
  }

  return (
    <Screen style={{ padding: spacing.lg }}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: "center" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brand}>
          <Text style={styles.mark}>◆</Text>
          <Text style={styles.wordmark}>Travel_X</Text>
        </View>
        <Display>Welcome back</Display>
        <Dim style={{ marginBottom: spacing.lg, marginTop: spacing.xs }}>Your map is where you left it.</Dim>
        <Input placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title="Sign in" onPress={onLogin} loading={loading} style={{ marginTop: spacing.xs }} />
        <View style={styles.row}>
          <Dim>New to Travel_X? </Dim>
          <Text style={styles.link} onPress={() => navigation.navigate("Register")}>Create an account</Text>
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
