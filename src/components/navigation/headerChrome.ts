import type { ViewStyle } from 'react-native';

import { navigationChrome } from '@/theme';

/** Width of header corner balance slot — matches `HeaderIconButton` touch target. */
export const HEADER_NAV_BALANCE_WIDTH = navigationChrome.headerActionSlotWidth;

/** Fixed width for symmetric native header corners (icon back + text trailing). */
const HEADER_SYMMETRIC_CORNER_SLOT_WIDTH = 80;

export type HeaderSymmetricCornerSide = 'leading' | 'trailing';

/** Shared layout for native stack corners when using symmetric title balance (icon back + text trailing). */
export function headerSymmetricCornerSlot(side: HeaderSymmetricCornerSide): ViewStyle {
  return {
    width: HEADER_SYMMETRIC_CORNER_SLOT_WIDTH,
    minHeight: navigationChrome.headerActionMinHeight,
    justifyContent: 'center',
    alignItems: side === 'leading' ? 'flex-start' : 'flex-end',
  };
}

/**
 * Leading / trailing padding inside the native header so controls clear edges + safe area.
 */
export function headerLeadingInset(safeLeft: number): ViewStyle {
  return {
    paddingLeft: Math.max(safeLeft, navigationChrome.headerBarEdgePadding),
  };
}

export function headerTrailingInset(safeRight: number): ViewStyle {
  return {
    paddingRight: Math.max(safeRight, navigationChrome.headerBarEdgePadding),
  };
}
