import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { hitSlop, navigationChrome, semantic } from '@/theme';

export type HeaderIconVisual = 'ghost' | 'emphasis';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type HeaderIconButtonProps = {
  name: IoniconName;
  onPress: () => void;
  accessibilityLabel: string;
  /** Ghost: navy icon, no fill (default stack style). Emphasis: gold disk for primary modal dismiss. */
  visual?: HeaderIconVisual;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

const W = navigationChrome.headerActionSlotWidth;
const H = navigationChrome.headerActionMinHeight;
const GHOST_SZ = navigationChrome.headerIconSize;
const EMPH_SZ = navigationChrome.headerIconEmphasisSize;
const { circularButtonDiameter: EMPH_D, circularButtonBorderWidth: EMPH_BW } = navigationChrome;

const iosEmphasisShadow = {
  shadowColor: semantic.navy,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
} as const;

/**
 * 44×44 tap target; icon optically centered. No spurious backgrounds in `ghost` mode.
 */
export function HeaderIconButton({
  name,
  onPress,
  accessibilityLabel,
  visual = 'ghost',
  disabled,
  style,
  testID,
}: HeaderIconButtonProps) {
  const iconColor = visual === 'emphasis' ? semantic.accentGoldText : semantic.navy;
  const size = visual === 'emphasis' ? EMPH_SZ : GHOST_SZ;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      android_ripple={
        Platform.OS === 'android'
          ? { color: 'rgba(26, 43, 74, 0.08)', foreground: true, borderless: true }
          : undefined
      }
      style={({ pressed }) => [
        styles.hit,
        visual === 'ghost' && pressed && !disabled && styles.hitPressedGhost,
        style,
      ]}
    >
      {visual === 'emphasis' ? (
        <View style={styles.emphasisCircle}>
          <Ionicons
            name={name}
            size={size}
            color={iconColor}
            style={name === 'chevron-back' ? styles.iconOpticalBack : styles.iconOpticalClose}
          />
        </View>
      ) : (
        <Ionicons
          name={name}
          size={size}
          color={iconColor}
          style={
            name === 'chevron-back'
              ? styles.iconOpticalBack
              : name === 'close'
                ? styles.iconOpticalClose
                : undefined
          }
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: W,
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  hitPressedGhost: {
    opacity: 0.55,
  },
  emphasisCircle: {
    width: EMPH_D,
    height: EMPH_D,
    borderRadius: EMPH_D / 2,
    backgroundColor: semantic.accentGold,
    borderWidth: EMPH_BW,
    borderColor: semantic.accentGoldNavRim,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios' ? iosEmphasisShadow : {}),
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  iconOpticalBack: { marginLeft: -2 },
  iconOpticalClose: { marginTop: Platform.OS === 'ios' ? 1 : 0 },
});
