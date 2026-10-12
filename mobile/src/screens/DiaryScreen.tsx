import React, { useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Image, RefreshControl, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { DiaryVisit } from "../api/types";
import { colors, radius, spacing, type } from "../theme/theme";
import { Rating } from "../components/UI";

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); } catch { return ""; }
}

export function DiaryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [visits, setVisits] = useState<DiaryVisit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try { const res = await api.get(`/users/${user.username}/visits`); setVisits(res.data.visits); }
    catch { /* ignore */ } finally { setRefreshing(false); setLoaded(true); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <FlatList
        data={visits} keyExtractor={(v) => v.id} contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.h1}>Your diary</Text>
            <Text style={styles.sub}>{visits.length > 0 ? `${visits.length} ${visits.length === 1 ? "place" : "places"} logged` : "Every place you log lives here"}</Text>
          </View>
        }
        ListEmptyComponent={loaded ? (
          <View style={styles.empty}>
            <Text style={styles.emptyMark}>✎</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyText}>Head to Add to log your first place. It'll appear here and on your map.</Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate("VisitDetail", { visitId: item.id })}>
            {item.coverPhoto ? (<Image source={{ uri: item.coverPhoto }} style={styles.thumb} />) : (<View style={[styles.thumb, styles.thumbEmpty]}><Text style={styles.thumbMark}>◆</Text></View>)}
            <View style={styles.cardBody}>
              <Text style={styles.place} numberOfLines={1}>{item.place.name}</Text>
              {item.place.country ? (<Text style={styles.country} numberOfLines={1}>{item.place.locality ? `${item.place.locality} · ` : ""}{item.place.country}</Text>) : null}
              <View style={{ marginTop: 4 }}><Rating value={item.rating} size={14} /></View>
              {item.note ? <Text style={styles.note} numberOfLines={2}>{item.note}</Text> : null}
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.md, marginTop: spacing.xs },
  h1: { ...type.display, color: colors.text },
  sub: { ...type.small, color: colors.textDim, marginTop: 2 },
  card: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm + 2, marginBottom: spacing.sm + 4 },
  thumb: { width: 76, height: 76, borderRadius: radius.sm },
  thumbEmpty: { backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  thumbMark: { color: colors.accentDim, fontSize: 22 },
  cardBody: { flex: 1, marginLeft: spacing.md },
  place: { ...type.heading, color: colors.text },
  country: { ...type.small, color: colors.textDim, marginTop: 1 },
  note: { ...type.small, color: colors.textDim, marginTop: 6, lineHeight: 19 },
  date: { ...type.caption, color: colors.textFaint, marginTop: 8 },
  empty: { alignItems: "center", paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyMark: { fontSize: 40, color: colors.accentDim, marginBottom: spacing.md },
  emptyTitle: { ...type.heading, color: colors.text, marginBottom: spacing.xs },
  emptyText: { ...type.small, color: colors.textDim, textAlign: "center", lineHeight: 20 },
});
