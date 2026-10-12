import React from "react";
import {
  Text, TextInput, TouchableOpacity, View, ActivityIndicator,
  StyleSheet, TextInputProps, TextProps, ViewStyle,
} from "react-native";
import { colors, radius, spacing, type } from "../theme/theme";

export function Button({
  title, onPress, loading, disabled, variant = "primary", style,
}: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: "primary" | "ghost" | "danger"; style?: ViewStyle;
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
      style={[
        styles.btn,
        isPrimary && { backgroundColor: colors.accent },
        isDanger && { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.danger },
        variant === "ghost" && styles.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onAccent : colors.text} />
      ) : (
        <Text style={[
          styles.btnText,
          isPrimary && { color: colors.onAccent },
          isDanger && { color: colors.danger },
          variant === "ghost" && { color: colors.accent },
        ]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// export function Input(props: TextInputProps) {
//   return (
//     <TextInput placeholderTextColor={colors.textFaint} style={styles.input} autoCapitalize="none" {...props} />
//   );
// }

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      autoCapitalize="none"
      {...props}
      style={[styles.input, { color: colors.text }, props.style]}
    />
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}
export function Display({ children, style }: TextProps & { children: React.ReactNode }) {
  return <Text style={[styles.display, style]}>{children}</Text>;
}
export function Title({ children, style }: TextProps & { children: React.ReactNode }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}
export function Heading({ children, style }: TextProps & { children: React.ReactNode }) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}
export function Body({ children, style }: TextProps & { children: React.ReactNode }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}
export function Dim({ children, style }: TextProps & { children: React.ReactNode }) {
  return <Text style={[styles.dim, style]}>{children}</Text>;
}

export function Rating({ value, size = 15 }: { value: number | null; size?: number }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} style={{ fontSize: size, color: n <= value ? colors.star : colors.borderLight, marginRight: 1 }}>★</Text>
      ))}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  display: { ...type.display, color: colors.text },
  title: { ...type.title, color: colors.text },
  heading: { ...type.heading, color: colors.text },
  body: { ...type.body, color: colors.text },
  dim: { ...type.small, color: colors.textDim },
  input: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md,
    paddingVertical: 14, fontSize: 16, marginBottom: spacing.sm + 4,
  },
  btn: { borderRadius: radius.md, paddingVertical: 15, alignItems: "center", justifyContent: "center" },
  btnGhost: { backgroundColor: "transparent" },
  btnText: { ...type.bodyStrong, color: colors.text },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md,
  },
});
