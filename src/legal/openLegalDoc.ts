import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { legalUrl, type LegalDoc } from './versions';

/** Opens a legal document inside the app (Safari view on iOS, Custom Tab on Android). */
export async function openLegalDoc(doc: LegalDoc): Promise<void> {
  const url = legalUrl(doc);
  if (Platform.OS === 'web') {
    globalThis.open?.(url, '_blank', 'noopener');
    return;
  }
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'done',
  });
}
