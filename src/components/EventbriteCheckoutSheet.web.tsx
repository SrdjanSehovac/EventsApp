import { createElement, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import {
  eventbriteCheckoutUrl,
  eventbriteWidgetHtml,
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
 * Web preview of the same sheet. Orders still need a real https origin;
 * localhost will not complete a charge. The native sheet is the iOS path.
 */
export function EventbriteCheckoutSheet({
  visible,
  title,
  eventId,
  brandColor,
  onClose,
  onComplete,
}: EventbriteCheckoutSheetProps) {
  const [direct, setDirect] = useState(false);
  const finished = useRef(false);
  const html = eventbriteWidgetHtml(eventId, brandColor);
  const checkoutUrl = eventbriteCheckoutUrl(eventId);

  useEffect(() => {
    if (!visible) return;
    setDirect(false);
    finished.current = false;
  }, [visible, eventId]);

  useEffect(() => {
    if (!visible) return;
    function onMessage(event: MessageEvent) {
      const data = typeof event.data === 'string' ? event.data : '';
      const message = parseCheckoutMessage(data);
      if (!message) return;
      if (message.type === 'order-complete') {
        if (finished.current) return;
        finished.current = true;
        onComplete();
      }
      if (message.type === 'widget-unavailable') setDirect(true);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [visible, onComplete]);

  const frame = direct
    ? createElement('iframe', {
        title,
        src: checkoutUrl,
        style: { border: '0', width: '100%', height: '100%', flex: 1 },
      })
    : createElement('iframe', {
        title,
        srcDoc: html,
        sandbox: 'allow-scripts allow-forms allow-same-origin allow-popups',
        style: { border: '0', width: '100%', height: '100%', flex: 1 },
      });

  return (
    <CheckoutSheetFrame visible={visible} title={title} onClose={onClose}>
      <View style={{ flex: 1 }}>{visible ? frame : null}</View>
    </CheckoutSheetFrame>
  );
}
