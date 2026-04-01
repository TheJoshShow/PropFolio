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
      source={require('../../assets/c__Users_JoshS_AppData_Roaming_Cursor_User_workspaceStorage_2b591141666040880b64cfc0f502aad5_images_Renderings-0727e195-9010-4d59-86af-e33b57b2e28e.png')}
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

