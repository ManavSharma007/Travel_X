import React, { useState } from "react";
import { Alert } from "react-native";
import { Screen, Title, Dim, Input, Button } from "../components/UI";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { spacing } from "../theme/theme";

export function EditProfileScreen({ navigation }: any) {
  const { user, refresh } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await api.patch("/users/me", { displayName: displayName || null, bio: bio || null });
      await refresh();
      navigation.goBack();
    } catch (e: any) { Alert.alert("Couldn't save", e?.response?.data?.error ?? "Try again."); }
    finally { setSaving(false); }
  }

  return (
    <Screen>
      <Title>Edit profile</Title>
      <Dim style={{ marginBottom: spacing.lg }}>How others see you.</Dim>
      <Input placeholder="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
      <Input placeholder="Bio" value={bio} onChangeText={setBio} multiline style={{ height: 100, textAlignVertical: "top", paddingTop: 14 } as any} />
      <Button title="Save changes" onPress={onSave} loading={saving} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}
