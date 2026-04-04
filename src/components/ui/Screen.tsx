import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { layout, semantic } from '@/theme';

type BackgroundVariant = 'primary' | 'secondary';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  safeAreaEdges?: Edge[];
  backgroundVariant?: BackgroundVariant;
  /** Wraps content for forms; pairs well with `scroll`. */
  keyboardAvoiding?: boolean;
  keyboardVerticalOffset?: number;
  testID?: string;
};

export function Screen({
  children,
  scroll,
  style,
  contentContainerStyle,
  safeAreaEdges = ['top', 'left', 'right'],
  backgroundVariant = 'primary',
  keyboardAvoiding,
  keyboardVerticalOffset = 0,
  testID,
}: Props) {
  const bg =
    backgroundVariant === 'secondary'
      ? semantic.backgroundSecondary
      : semantic.background;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentContainerStyle]}>{children}</View>
  );

  const wrapped =
    keyboardAvoiding ? (
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {body}
      </KeyboardAvoidingView>
    ) : (
      body
    );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bg }, style]}
      edges={safeAreaEdges}
      testID={testID}
    >
      {wrapped}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  fill: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: layout.screenPaddingVertical,
    paddingBottom: layout.listContentBottom,
  },
});
