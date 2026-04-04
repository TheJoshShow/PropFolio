import * as WebBrowser from 'expo-web-browser';

/**
 * Opens legal URLs in an in-app browser session (calm, reviewable, Done returns to PropFolio).
 */
export async function openLegalDocument(url: string): Promise<void> {
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
