import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Button } from "../components/UI";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { colors, radius, spacing, type } from "../theme/theme";

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [countries, setCountries] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => {
      if (!user) return;
      try {
        const [profile, visits] = await Promise.all([api.get(`/users/${user.username}`), api.get(`/users/${user.username}/visits`)]);
        setVisitCount(profile.data.user.visitCount);
        const uniqueCountries = new Set((visits.data.visits ?? []).map((v: any) => v.place?.country).filter(Boolean));
        setCountries(uniqueCountries.size);
      } catch { /* ignore */ }
    })();
  }, [user]));

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.head}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user.displayName ?? user.username).charAt(0).toUpperCase()}</Text></View>
        <Text style={styles.name}>{user.displayName ?? user.username}</Text>
        <Text style={styles.handle}>@{user.username}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statNum}>{visitCount ?? "—"}</Text><Text style={styles.statLabel}>places</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.stat}><Text style={styles.statNum}>{countries ?? "—"}</Text><Text style={styles.statLabel}>countries</Text></View>
      </View>
      <View style={{ height: spacing.xl }} />
      <Button title="Edit profile" variant="ghost" onPress={() => navigation.navigate("EditProfile")} />
      <View style={{ height: spacing.sm }} />
      <Button title="Log out" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  head: { alignItems: "center", marginTop: spacing.lg },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: colors.accent, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.accent, fontSize: 38, fontWeight: "800" },
  name: { ...type.title, color: colors.text, marginTop: spacing.md },
  handle: { ...type.small, color: colors.textDim, marginTop: 2 },
  bio: { ...type.small, color: colors.textDim, textAlign: "center", marginTop: spacing.sm, lineHeight: 20 },
  stats: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl, paddingVertical: spacing.lg },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: colors.border },
  statNum: { fontSize: 30, fontWeight: "800", color: colors.accent },
  statLabel: { ...type.caption, color: colors.textDim, marginTop: 4 },
});
