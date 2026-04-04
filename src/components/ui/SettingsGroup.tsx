import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Card } from './Card';

type Props = {
  children: ReactNode;
};

/**
 * Grouped settings list — sheet card, no inner padding; rows supply their own separators.
 */
export function SettingsGroup({ children }: Props) {
  return (
    <Card elevation="sm" shape="sheet" style={styles.card}>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
});
