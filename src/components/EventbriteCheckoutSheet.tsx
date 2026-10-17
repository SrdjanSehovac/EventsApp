import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest, WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

import {
  EVENTBRITE_WIDGET_BASE,
  allowCheckoutNavigation,
  eventbriteCheckoutUrl,
  eventbriteWidgetHtml,
  isEventbriteHost,
  isOrderCompleteUrl,
  parseCheckoutMessage,
} from '../utils/eventbriteCheckout';
import { CheckoutSheetFrame } from './CheckoutSheetFrame';

type EventbriteCheckoutSheetProps = {
  visible: boolean;
  title: string;
  eventId: string;
  brandColor: string;
  onClose: () => void;
  onComplete: () => void;
};

/**
 * Full-height checkout. Tries the official widget, then Eventbrite's own
 * checkout-external page when the widget has no https certificate to stand on.
 * Apple Pay inside this WKWebView is not expected to complete; card entry is.
 */
export function EventbriteCheckoutSheet({
  visible,
  title,
  eventId,
  brandColor,
  onClose,
  onComplete,
}: EventbriteCheckoutSheetProps) {
  const [mode, setMode] = useState<'widget' | 'direct'>('widget');
  const finished = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setMode('widget');
    finished.current = false;
  }, [visible, eventId]);

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }

  function useDirectCheckout() {
    setMode((current) => (current === 'widget' ? 'direct' : current));
  }

  function onShouldStart(request: ShouldStartLoadRequest): boolean {
    if (isOrderCompleteUrl(request.url)) {
      finish();
      return false;
    }
    if (allowCheckoutNavigation(request.url, { isTopFrame: request.isTopFrame })) {
      return true;
    }
    if (mode === 'widget') {
      try {
        const host = new URL(request.url).hostname;
        if (isEventbriteHost(host)) useDirectCheckout();
      } catch {
        // Ignore unparseable bounces.
      }
    }
    return false;
  }

  function onMessage(event: WebViewMessageEvent) {
    const message = parseCheckoutMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === 'order-complete') finish();
    if (message.type === 'widget-unavailable') useDirectCheckout();
  }

  const checkoutUrl = eventbriteCheckoutUrl(eventId);
  const html = eventbriteWidgetHtml(eventId, brandColor);
  const source =
    mode === 'direct'
      ? { uri: checkoutUrl }
      : { html, baseUrl: EVENTBRITE_WIDGET_BASE };

  return (
    <CheckoutSheetFrame visible={visible} title={title} onClose={onClose}>
      {visible && html && checkoutUrl ? (
        <WebView
          key={`${mode}:${eventId}`}
          source={source}
          style={styles.web}
          originWhitelist={['https://*', 'http://*', 'about:*', 'blob:*']}
          onShouldStartLoadWithRequest={onShouldStart}
          onNavigationStateChange={(state) => {
            if (isOrderCompleteUrl(state.url)) finish();
          }}
          onMessage={onMessage}
          onError={() => {
            if (mode === 'widget') useDirectCheckout();
          }}
          onOpenWindow={() => {
            // target=_blank (event page, promos) is cancelled, not opened.
          }}
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          paymentRequestEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          )}
          setBuiltInZoomControls={false}
          showsVerticalScrollIndicator
        />
      ) : null}
    </CheckoutSheetFrame>
  );
}

const styles = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
