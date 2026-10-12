import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Input, Button } from "../components/UI";
import { api } from "../api/client";
import { uploadVisitPhoto, LocalAsset } from "../api/photos";
import type { PlaceSearchResult } from "../api/types";
import { colors, radius, spacing, type } from "../theme/theme";

export function AddVisitScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceSearchResult | null>(null);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [photos, setPhotos] = useState<LocalAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onQueryChange(text: string) {
    setQuery(text); setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { const res = await api.get("/places/search", { params: { q: text.trim() } }); setResults(res.data.results.filter((r: PlaceSearchResult) => r.latitude)); }
      catch { setResults([]); } finally { setSearching(false); }
    }, 400);
  }

  async function pickPhotos() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Photos permission needed", "Allow photo access in Settings to add pictures."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 6, quality: 0.7 });
    if (result.canceled) return;
    const assets: LocalAsset[] = result.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height, mimeType: a.mimeType }));
    setPhotos((prev) => [...prev, ...assets].slice(0, 6));
  }

  function removePhoto(uri: string) { setPhotos((prev) => prev.filter((p) => p.uri !== uri)); }

  async function onSave() {
    if (!selected || selected.latitude == null || selected.longitude == null) { Alert.alert("Pick a place", "Search and choose a place first."); return; }
    setSaving(true);
    try {
      setSaveStage("Saving visit…");
      const res = await api.post("/visits", {
        place: { osmId: selected.osmId, name: selected.name, locality: selected.locality, country: selected.country, latitude: selected.latitude, longitude: selected.longitude },
        note: note || null, rating,
      });
      const visitId = res.data.visit.id as string;
      for (let i = 0; i < photos.length; i++) {
        setSaveStage(`Uploading photo ${i + 1} of ${photos.length}…`);
        try { await uploadVisitPhoto(visitId, photos[i]); } catch { /* skip */ }
      }
      setQuery(""); setResults([]); setSelected(null); setNote(""); setRating(null); setPhotos([]);
      navigation.navigate("Diary");
    } catch (e: any) { Alert.alert("Couldn't save", e?.response?.data?.error ?? "Try again."); }
    finally { setSaving(false); setSaveStage(null); }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Log a place</Text>
      <Text style={styles.sub}>Search anywhere in the world</Text>
      <Input placeholder="e.g. Kyoto, Lisbon, Bali…" value={query} onChangeText={onQueryChange} />
      {!selected && (
        <FlatList
          data={results} keyboardShouldPersistTaps="handled" keyExtractor={(r, i) => `${r.osmId ?? r.name}-${i}`}
          ListEmptyComponent={
            searching ? (<View style={styles.hintRow}><ActivityIndicator size="small" color={colors.accent} /><Text style={styles.hint}>Searching…</Text></View>)
            : query.length >= 2 ? (<Text style={styles.hint}>No matches. Try a nearby city.</Text>)
            : (<Text style={styles.hint}>Type at least 2 letters to search.</Text>)
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.result} activeOpacity={0.7} onPress={() => { setSelected(item); setResults([]); }}>
              <Text style={styles.pin}>◆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.resultSub} numberOfLines={1}>{item.displayName ?? item.country ?? ""}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      {selected && (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.selectedCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.selectedPin}>◆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{selected.name}</Text>
                <Text style={styles.resultSub}>{selected.locality ? `${selected.locality}, ` : ""}{selected.country}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.change}>Change place</Text></TouchableOpacity>
          </View>
          <Text style={styles.label}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            {photos.map((p) => (
              <View key={p.uri} style={styles.photoWrap}>
                <Image source={{ uri: p.uri }} style={styles.photo} />
                <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(p.uri)}><Text style={styles.photoRemoveText}>✕</Text></TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={styles.addPhoto} onPress={pickPhotos}>
                <Text style={styles.addPhotoPlus}>＋</Text><Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text style={styles.label}>How was it?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Text key={n} onPress={() => setRating(n === rating ? null : n)} style={[styles.star, { color: rating && n <= rating ? colors.star : colors.borderLight }]}>★</Text>
            ))}
          </View>
          <Text style={styles.label}>Notes</Text>
          <Input placeholder="What made this place worth remembering?" value={note} onChangeText={setNote} multiline style={styles.noteInput as any} />
          <Button title={saveStage ?? "Save to my map"} onPress={onSave} loading={saving} style={{ marginTop: spacing.sm }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md, paddingTop: spacing.sm },
  h1: { ...type.title, color: colors.text, marginTop: spacing.xs },
  sub: { ...type.small, color: colors.textDim, marginBottom: spacing.md, marginTop: 2 },
  hintRow: { flexDirection: "row", alignItems: "center", padding: spacing.sm, gap: 8 },
  hint: { ...type.small, color: colors.textFaint, padding: spacing.sm },
  result: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.xs + 2, borderWidth: 1, borderColor: colors.border },
  pin: { color: colors.accentDim, fontSize: 16, marginRight: spacing.sm + 2 },
  resultName: { ...type.bodyStrong, color: colors.text },
  resultSub: { ...type.caption, color: colors.textDim, marginTop: 1 },
  selectedCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.lg },
  selectedPin: { color: colors.accent, fontSize: 20, marginRight: spacing.md },
  change: { color: colors.accent, ...type.caption, fontWeight: "700", marginTop: spacing.md },
  label: { ...type.small, color: colors.textDim, marginBottom: spacing.sm, marginTop: spacing.xs },
  photoWrap: { marginRight: spacing.sm, position: "relative" },
  photo: { width: 84, height: 84, borderRadius: radius.sm },
  photoRemove: { position: "absolute", top: -6, right: -6, backgroundColor: colors.bg, borderRadius: 12, width: 24, height: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderLight },
  photoRemoveText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  addPhoto: { width: 84, height: 84, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  addPhotoPlus: { color: colors.accent, fontSize: 24, marginBottom: 2 },
  addPhotoText: { ...type.caption, color: colors.textDim },
  stars: { flexDirection: "row", marginBottom: spacing.md },
  star: { fontSize: 38, marginRight: 8 },
  noteInput: { height: 110, textAlignVertical: "top", paddingTop: 14 },
});
