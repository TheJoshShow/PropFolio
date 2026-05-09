import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import JSZip from 'jszip';

import webZip from '../../assets/web-app.zip';

const BINARY_EXT = new Set([
  'br',
  'bz2',
  'gif',
  'gz',
  'ico',
  'jpeg',
  'jpg',
  'mp3',
  'mp4',
  'otf',
  'pdf',
  'png',
  'ttf',
  'wasm',
  'webp',
  'woff',
  'woff2',
  'zip',
]);

function extensionOf(relPath: string): string {
  const base = relPath.includes('/') ? relPath.split('/').pop()! : relPath;
  const parts = base.split('.');
  if (parts.length < 2) return '';
  return parts.pop()!.toLowerCase();
}

function getFileUri(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return path.startsWith('file://') ? path : `file://${path}`;
}

function bundleVersionStamp(): string {
  return Constants.expoConfig?.version ?? '0';
}

export function EmbeddedPropfoliosApp() {
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iosReadAccess, setIosReadAccess] = useState<string | undefined>();

  const devUrl = process.env.EXPO_PUBLIC_WEB_APP_URL;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (__DEV__ && devUrl) {
          if (!cancelled) {
            setIosReadAccess(undefined);
            setUri(devUrl);
          }
          return;
        }

        const doc = FileSystem.documentDirectory;
        if (!doc) {
          if (!cancelled) setError('App storage is unavailable on this device.');
          return;
        }

        const webRoot = `${doc}embedded-propfolios`;
        const stampPath = `${webRoot}/.unzipped-version`;

        const expectedVersion = bundleVersionStamp();
        await FileSystem.makeDirectoryAsync(webRoot, { intermediates: true }).catch(() => undefined);

        let stampContents: string | null = null;
        try {
          stampContents = await FileSystem.readAsStringAsync(stampPath);
        } catch {
          stampContents = null;
        }

        if (stampContents === expectedVersion) {
          const indexPath = `${webRoot}/index.html`;
          const info = await FileSystem.getInfoAsync(indexPath);
          if (info.exists) {
            if (!cancelled) {
              setIosReadAccess(Platform.OS === 'ios' ? webRoot : undefined);
              setUri(getFileUri(indexPath));
            }
            return;
          }
        }

        await FileSystem.deleteAsync(webRoot, { idempotent: true });
        await FileSystem.makeDirectoryAsync(webRoot, { intermediates: true });

        const asset = Asset.fromModule(webZip);
        await asset.downloadAsync();
        const zipUri = asset.localUri ?? asset.uri;
        const buf = await fetch(zipUri).then((r) => r.arrayBuffer());
        const zip = await JSZip.loadAsync(buf);

        const names = Object.keys(zip.files).filter((k) => !zip.files[k].dir);
        for (const relPath of names) {
          const zf = zip.files[relPath];
          const dest = `${webRoot}/${relPath}`;
          const slash = dest.lastIndexOf('/');
          if (slash > 0) {
            const parent = dest.slice(0, slash);
            await FileSystem.makeDirectoryAsync(parent, { intermediates: true }).catch(() => undefined);
          }
          const ext = extensionOf(relPath);
          if (BINARY_EXT.has(ext)) {
            const b64 = await zf.async('base64');
            await FileSystem.writeAsStringAsync(dest, b64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } else {
            const text = await zf.async('string');
            await FileSystem.writeAsStringAsync(dest, text, {
              encoding: FileSystem.EncodingType.UTF8,
            });
          }
        }

        await FileSystem.writeAsStringAsync(stampPath, expectedVersion, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (!cancelled) {
          setIosReadAccess(Platform.OS === 'ios' ? webRoot : undefined);
          setUri(getFileUri(`${webRoot}/index.html`));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [devUrl]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load embedded app</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  if (!uri) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      style={styles.webview}
      source={{ uri }}
      originWhitelist={['*']}
      allowingReadAccessToURL={iosReadAccess}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs={Platform.OS === 'android'}
      mixedContentMode="always"
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, textAlign: 'center', color: '#444' },
  webview: { flex: 1 },
});
