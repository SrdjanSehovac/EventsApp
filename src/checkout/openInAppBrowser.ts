import * as WebBrowser from 'expo-web-browser';

import { allowedOutboundUrl } from '../utils/outboundLinks';

/**
 * SFSafariViewController / Chrome Custom Tab so the user stays in EventsApp.
 * The link guard still runs: blocked and competitor hosts are not opened.
 */
export async function openInAppBrowser(
  url: string,
  controlsColor: string,
): Promise<void> {
  const next = allowedOutboundUrl(url);
  if (!next) return;
  try {
    await WebBrowser.openBrowserAsync(next, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor,
      toolbarColor: controlsColor,
      dismissButtonStyle: 'done',
      showTitle: true,
      createTask: false,
    });
  } catch {
    // A blocked popup on web, or a dismissed sheet, ends the session.
  }
}
