import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { hitSlop, semantic, spacing, tabSwitcher, textPresets } from '@/theme';

export type TabSwitcherItem = {
  key: string;
  label: string;
};

type Props = {
  items: TabSwitcherItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Segmented control — navy selected pill, light inactive (analysis tabs).
 */
export function TabSwitcher({ items, selectedKey, onSelect, style, testID }: Props) {
  return (
    <View testID={testID} style={[styles.track, style]}>
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.pill,
              selected && styles.pillSelected,
              pressed && !selected && styles.pillPressed,
            ]}
          >
            <Text
              style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: tabSwitcher.gap,
    padding: spacing.xs,
    backgroundColor: semantic.surfaceMuted,
    borderRadius: tabSwitcher.pillRadius + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: semantic.border,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    minHeight: tabSwitcher.minHeight,
    paddingHorizontal: tabSwitcher.paddingH,
    paddingVertical: spacing.sm,
    borderRadius: tabSwitcher.pillRadius,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pillSelected: {
    backgroundColor: semantic.navy,
  },
  pillPressed: {
    opacity: 0.9,
  },
  label: {
    ...textPresets.tab,
    textAlign: 'center',
  },
  labelSelected: {
    color: semantic.surface,
  },
  labelIdle: {
    ...textPresets.tabInactive,
    textAlign: 'center',
  },
});
