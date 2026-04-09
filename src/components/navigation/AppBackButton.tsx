import type { ViewStyle } from 'react-native';

import { HeaderIconButton } from './HeaderIconButton';

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/** Stack back — iOS-style ghost chevron (no gold disk). */
export function AppBackButton({ accessibilityLabel = 'Go back', ...props }: Props) {
  return (
    <HeaderIconButton
      name="chevron-back"
      visual="ghost"
      accessibilityLabel={accessibilityLabel}
      {...props}
    />
  );
}
