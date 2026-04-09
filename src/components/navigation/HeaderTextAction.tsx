import { Platform, Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';

import { hitSlop, navigationChrome, semantic, textPresets } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  /** Primary header actions use gold; set false for secondary/muted. */
  accent?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

/**
 * Text-only header control (e.g. “Adjust”) with proper 44pt touch target, no background disk.
 */
export function HeaderTextAction({
  label,
  onPress,
  accessibilityLabel,
  testID,
  accent = true,
  style,
  textStyle,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      android_ripple={
        Platform.OS === 'android'
          ? { color: 'rgba(26, 43, 74, 0.08)', foreground: true, borderless: true }
          : undefined
      }
      style={({ pressed }) => [styles.hit, pressed && styles.hitPressed, style]}
    >
      <Text
        style={[styles.text, accent ? styles.textAccent : styles.textMuted, textStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: navigationChrome.headerActionSlotWidth,
    minHeight: navigationChrome.headerActionMinHeight,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hitPressed: {
    opacity: 0.55,
  },
  text: {
    ...textPresets.bodyMedium,
    fontSize: 17,
    fontWeight: '600',
  },
  textAccent: {
    color: semantic.accentGold,
  },
  textMuted: {
    color: semantic.navy,
  },
});
