import type { ViewStyle } from 'react-native';

import type { HeaderIconVisual } from './HeaderIconButton';
import { HeaderIconButton } from './HeaderIconButton';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  /** `ghost` = icon only (default, no disk/halo). `emphasis` = gold disk for rare primary emphasis. */
  visual?: HeaderIconVisual;
};

export function AppCloseButton({
  accessibilityLabel = 'Close',
  visual = 'ghost',
  ...props
}: Props) {
  return (
    <HeaderIconButton name="close" visual={visual} accessibilityLabel={accessibilityLabel} {...props} />
  );
}
