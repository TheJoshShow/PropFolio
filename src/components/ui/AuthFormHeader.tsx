import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { hitSlop, semantic, spacing, textPresets } from '@/theme';

type Props = {
  title: string;
  onClose: () => void;
};

/**
 * Centered title + circular close control — Sign In / Create Account modals.
 */
export function AuthFormHeader({ title, onClose }: Props) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.side} />
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
        <View style={[styles.side, styles.sideRight]}>
          <Pressable
            onPress={onClose}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.closeTap}
          >
            <View style={styles.closeCircle}>
              <Ionicons name="close" size={22} color={semantic.textPrimary} />
            </View>
          </Pressable>
        </View>
      </View>
      <View style={styles.divider} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    minHeight: 52,
  },
  side: {
    width: 44,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...textPresets.pageTitle,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  closeTap: {
    padding: spacing.xxs,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
    marginBottom: spacing.lg,
  },
});
