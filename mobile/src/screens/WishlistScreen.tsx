import React, { useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Input } from "../components/UI";
import { api } from "../api/client";
import { getWishlist, addToWishlist, removeFromWishlist } from "../api/wishlist";
import { useAuth } from "../auth/AuthContext";
import type { WishlistItem, PlaceSearchResult } from "../api/types";
import { colors, radius, spacing, type } from "../theme/theme";

export function WishlistScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setItems(await getWishlist(user.username)); } catch { /* ignore */ }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onQueryChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { const res = await api.get("/places/search", { params: { q: text.trim() } }); setResults(res.data.results.filter((r: PlaceSearchResult) => r.latitude)); }
      catch { setResults([]); } finally { setSearching(false); }
    }, 400);
  }

  async function onAdd(place: PlaceSearchResult) {
    setAdding(true);
    try { await addToWishlist(place); setQuery(""); setResults([]); await load(); }
    catch (e: any) { Alert.alert("Couldn't add", e?.response?.data?.error ?? "Maybe it's already saved."); }
    finally { setAdding(false); }
  }

  function onRemove(item: WishlistItem) {
    Alert.alert("Remove", `Remove ${item.place.name} from your wishlist?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await removeFromWishlist(item.id); await load(); } catch { Alert.alert("Couldn't remove", "Try again."); }
      } },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.h1}>Wishlist</Text>
        <Text style={styles.sub}>Places you want to go</Text>
      </View>
      <Input placeholder="Search a place to add…" value={query} onChangeText={onQueryChange} />
      {results.length > 0 || searching ? (
        <View style={styles.results}>
          {searching && <ActivityIndicator color={colors.accent} style={{ margin: spacing.sm }} />}
          {results.map((r, i) => (
            <TouchableOpacity key={`${r.osmId ?? r.name}-${i}`} style={styles.result} disabled={adding} onPress={() => onAdd(r)}>
              <Text style={styles.plus}>＋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.resultSub} numberOfLines={1}>{r.displayName ?? r.country ?? ""}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <FlatList
        data={items} keyExtractor={(w) => w.id} style={{ marginTop: spacing.sm }} contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyMark}>☆</Text>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyText}>Search above to add places you dream of visiting.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onLongPress={() => onRemove(item)}>
            <Text style={styles.star}>☆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.place} numberOfLines={1}>{item.place.name}</Text>
              {item.place.country ? (<Text style={styles.country} numberOfLines={1}>{item.place.locality ? `${item.place.locality} · ` : ""}{item.place.country}</Text>) : null}
            </View>
            <TouchableOpacity onPress={() => onRemove(item)} hitSlop={10}><Text style={styles.remove}>✕</Text></TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md, paddingTop: spacing.sm },
  header: { marginBottom: spacing.md, marginTop: spacing.xs },
  h1: { ...type.display, color: colors.text },
  sub: { ...type.small, color: colors.textDim, marginTop: 2 },
  results: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  result: { flexDirection: "row", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  plus: { color: colors.accent, fontSize: 20, marginRight: spacing.md },
  resultName: { ...type.bodyStrong, color: colors.text },
  resultSub: { ...type.caption, color: colors.textDim, marginTop: 1 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm + 2 },
  star: { color: colors.accent, fontSize: 22, marginRight: spacing.md },
  place: { ...type.heading, color: colors.text },
  country: { ...type.small, color: colors.textDim, marginTop: 1 },
  remove: { color: colors.textDim, fontSize: 16, paddingLeft: spacing.sm },
  empty: { alignItems: "center", paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyMark: { fontSize: 44, color: colors.accentDim, marginBottom: spacing.md },
  emptyTitle: { ...type.heading, color: colors.text, marginBottom: spacing.xs },
  emptyText: { ...type.small, color: colors.textDim, textAlign: "center", lineHeight: 20 },
});
