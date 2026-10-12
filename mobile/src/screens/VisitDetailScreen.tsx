import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Alert, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getVisit, updateVisit, deleteVisit } from "../api/visits";
import { Input, Button, Rating } from "../components/UI";
import type { Visit } from "../api/types";
import { colors, radius, spacing, type } from "../theme/theme";

const { width } = Dimensions.get("window");
function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }); } catch { return ""; }
}

export function VisitDetailScreen({ route, navigation }: any) {
  const { visitId } = route.params;
  const [visit, setVisit] = useState<Visit | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const v = await getVisit(visitId); setVisit(v); setNote(v.note ?? ""); setRating(v.rating ?? null); }
    catch { Alert.alert("Couldn't load", "This visit may have been removed."); navigation.goBack(); }
  }, [visitId, navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onSaveEdit() {
    setSaving(true);
    try { const updated = await updateVisit(visitId, { note: note || null, rating }); setVisit(updated); setEditing(false); }
    catch (e: any) { Alert.alert("Couldn't save", e?.response?.data?.error ?? "Try again."); }
    finally { setSaving(false); }
  }

  function onDelete() {
    Alert.alert("Delete visit", "This removes it from your diary and map.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteVisit(visitId); navigation.goBack(); } catch { Alert.alert("Couldn't delete", "Try again."); }
      } },
    ]);
  }

  if (!visit) return <View style={styles.container} />;
  const photos = visit.photos ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      {photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {photos.map((p) => (<Image key={p.id} source={{ uri: p.url }} style={{ width, height: width }} />))}
        </ScrollView>
      ) : (<View style={styles.noPhoto}><Text style={styles.noPhotoMark}>◆</Text></View>)}
      <View style={styles.body}>
        <Text style={styles.place}>{visit.place?.name}</Text>
        {visit.place?.country ? (<Text style={styles.country}>{visit.place.locality ? `${visit.place.locality} · ` : ""}{visit.place.country}</Text>) : null}
        {!editing ? (
          <>
            <View style={{ marginTop: spacing.sm }}><Rating value={visit.rating} size={20} /></View>
            {visit.note ? <Text style={styles.note}>{visit.note}</Text> : null}
            <Text style={styles.date}>Logged {formatDate(visit.createdAt)}</Text>
            <View style={styles.actions}>
              <Button title="Edit" variant="ghost" onPress={() => setEditing(true)} style={{ flex: 1 }} />
              <View style={{ width: spacing.sm }} />
              <Button title="Delete" variant="danger" onPress={onDelete} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (<Text key={n} onPress={() => setRating(n === rating ? null : n)} style={[styles.star, { color: rating && n <= rating ? colors.star : colors.borderLight }]}>★</Text>))}
            </View>
            <Text style={styles.label}>Notes</Text>
            <Input value={note} onChangeText={setNote} multiline placeholder="Your notes…" style={styles.noteInput as any} />
            <Button title="Save changes" onPress={onSaveEdit} loading={saving} />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} style={{ marginTop: spacing.xs }} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  noPhoto: { width, height: width * 0.5, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  noPhotoMark: { color: colors.accentDim, fontSize: 44 },
  body: { padding: spacing.md },
  place: { ...type.display, color: colors.text },
  country: { ...type.body, color: colors.textDim, marginTop: 2 },
  note: { ...type.body, color: colors.text, marginTop: spacing.md, lineHeight: 23 },
  date: { ...type.caption, color: colors.textFaint, marginTop: spacing.md },
  actions: { flexDirection: "row", marginTop: spacing.lg },
  label: { ...type.small, color: colors.textDim, marginBottom: spacing.sm, marginTop: spacing.xs },
  stars: { flexDirection: "row", marginBottom: spacing.md },
  star: { fontSize: 36, marginRight: 8 },
  noteInput: { height: 110, textAlignVertical: "top", paddingTop: 14 },
});
