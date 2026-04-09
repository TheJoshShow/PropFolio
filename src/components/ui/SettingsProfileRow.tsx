import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { heights, hitSlop, iconSizes, radius, semantic, spacing, textPresets } from '@/theme';
import { shadowStyle } from '@/theme/shadows';

type Props = {
  displayName: string;
  email: string;
  onPress?: () => void;
};

/**
 * Settings header profile — avatar, name, email; optional navigation affordance.
 */
export function SettingsProfileRow({ displayName, email, onPress }: Props) {
  const initial = displayName.trim().slice(0, 1).toUpperCase() || '?';
  const content = (
    <>
      <View style={styles.avatar}>
        <Text style={styles.avatarGlyph}>{initial}</Text>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {displayName}
        </Text>
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
          {email || '—'}
        </Text>
      </View>
      {onPress ? (
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={semantic.textTertiary} />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Account details, ${displayName}, ${email}`}
        onPress={onPress}
        hitSlop={hitSlop}
        style={({ pressed }) => [styles.row, shadowStyle('sm'), pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, shadowStyle('sm')]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: heights.listRowMin + spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: semantic.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
    gap: spacing.md,
  },
  pressed: {
    backgroundColor: semantic.surfaceMuted,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: semantic.accentScoreMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.accentScore,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 22,
    fontWeight: '600',
    color: semantic.accentScore,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  name: {
    ...textPresets.bodyMedium,
    fontSize: 18,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  email: {
    ...textPresets.bodySecondary,
    color: semantic.textSecondary,
  },
  chevronWrap: {
    width: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
