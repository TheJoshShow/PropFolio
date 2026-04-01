import React from 'react';
import { ImageBackground, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from './useThemeColors';

/**
 * Shared screen container: applies the Chicago-at-dusk background treatment and a
 * soft overlay, then lets children render frosted cards on top.
 *
 * Use this instead of repeating ImageBackground logic per screen.
 */
export interface ScreenContainerProps extends ViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({ edges = ['top', 'bottom'], style, children, ...rest }: ScreenContainerProps) {
  const colors = useThemeColors();

  return (
    <ImageBackground
      // NOTE: Place your Chicago-at-dusk background asset at expo-app/assets/propfolio-bg.png
      // and this require will bundle it for native builds.
      source={require('../../assets/propfolio-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: colors.background }]} />
      <SafeAreaView style={styles.safeArea} edges={edges}>
        <View style={[styles.content, style]} {...rest}>
          {children}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

