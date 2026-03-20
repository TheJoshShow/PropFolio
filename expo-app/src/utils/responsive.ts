/**
 * Responsive layout helpers for web (desktop) vs native.
 */

import { Platform, type DimensionValue } from 'react-native';

export const MAX_CONTENT_WIDTH = 560;

/** Use as contentContainerStyle (or merge) on ScrollView so content doesn't stretch on wide screens. */
export const responsiveContentContainer = Platform.select({
  web: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%' as DimensionValue,
    alignSelf: 'center' as const,
  },
  default: {},
});
