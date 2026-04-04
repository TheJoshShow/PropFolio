import type { ComponentProps } from 'react';

import { Screen } from './Screen';

type ScreenProps = ComponentProps<typeof Screen>;

/**
 * Design-system alias for `Screen` — same behavior; use for new flows aligned with DS docs.
 */
export function AppScreen(props: ScreenProps) {
  return <Screen {...props} />;
}
