import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../api/client";
import { getWishlist } from "../api/wishlist";
import { useAuth } from "../auth/AuthContext";
import type { MapPin, WishlistItem } from "../api/types";
import { colors, radius, spacing, type } from "../theme/theme";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1b1e27" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b93a3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#12141a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#12141a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#232734" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2b3040" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#171a22" }] },
];

function regionToBbox(r: Region): string {
  const minLon = r.longitude - r.longitudeDelta / 2;
  const maxLon = r.longitude + r.longitudeDelta / 2;
  const minLat = r.latitude - r.latitudeDelta / 2;
  const maxLat = r.latitude + r.latitudeDelta / 2;
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

export function MapScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const lastRegion = useRef<Region | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPins = useCallback(async (region: Region) => {
    if (!user) return;
    setLoading(true);
    try { const res = await api.get(`/users/${user.username}/map`, { params: { bbox: regionToBbox(region) } }); setPins(res.data.pins); }
    catch { /* silent */ } finally { setLoading(false); setFetched(true); }
  }, [user]);

  const loadWishlist = useCallback(async () => {
    if (!user) return;
    try { setWishlist(await getWishlist(user.username)); } catch { /* ignore */ }
  }, [user]);

  useFocusEffect(useCallback(() => {
    loadWishlist();
    if (lastRegion.current) fetchPins(lastRegion.current);
  }, [loadWishlist, fetchPins]));

  const onRegionChangeComplete = useCallback((region: Region) => {
    lastRegion.current = region;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPins(region), 400);
  }, [fetchPins]);

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} customMapStyle={darkMapStyle}
        initialRegion={{ latitude: 20, longitude: 0, latitudeDelta: 100, longitudeDelta: 100 }}
        onRegionChangeComplete={onRegionChangeComplete}>
        {pins.map((pin) => (
          <Marker key={`v-${pin.placeId}`} coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.name} description={pin.visitCount > 1 ? `${pin.visitCount} visits` : pin.country ?? undefined}
            pinColor={colors.accent}
            onCalloutPress={() => navigation.navigate("VisitDetail", { visitId: pin.lastVisitId })} />
        ))}
        {wishlist.map((w) => (
          <Marker key={`w-${w.id}`} coordinate={{ latitude: w.place.latitude, longitude: w.place.longitude }}
            title={w.place.name} description={`Wishlist${w.place.country ? " · " + w.place.country : ""}`}
            pinColor={colors.cool} />
        ))}
      </MapView>
      <View style={styles.legend}>
        <View style={styles.legendRow}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><Text style={styles.legendText}>Been</Text></View>
        <View style={styles.legendRow}><View style={[styles.dot, { backgroundColor: colors.cool }]} /><Text style={styles.legendText}>Wishlist</Text></View>
      </View>
      {loading && (<View style={styles.badge}><ActivityIndicator color={colors.accent} size="small" /></View>)}
      {fetched && pins.length === 0 && wishlist.length === 0 && !loading && (
        <View style={styles.empty} pointerEvents="none"><Text style={styles.emptyText}>Log a place or add to your wishlist to fill your map.</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  legend: { position: "absolute", top: 14, left: 16, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 7 },
  legendText: { ...type.caption, color: colors.text },
  badge: { position: "absolute", top: 14, right: 16, backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: spacing.sm + 2 },
  empty: { position: "absolute", bottom: 32, alignSelf: "center", backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, marginHorizontal: spacing.lg },
  emptyText: { ...type.caption, color: colors.textDim, textAlign: "center" },
});
