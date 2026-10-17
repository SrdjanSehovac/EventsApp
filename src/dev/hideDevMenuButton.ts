import { requireOptionalNativeModule } from 'expo';

type DevMenuPreferencesModule = {
  setPreferencesAsync?: (settings: { showFloatingActionButton?: boolean }) => Promise<void>;
};

/**
 * The grey gear on dev builds is Expo's dev-menu button (a gearshape), not an
 * app control. The dev client already exposes this preference, so turning it
 * off does not need a new native build. Shake still opens the menu.
 */
export function hideDevMenuButton(): void {
  if (!__DEV__) return;
  const preferences = requireOptionalNativeModule<DevMenuPreferencesModule>('DevMenuPreferences');
  const setPreferences = preferences?.setPreferencesAsync;
  if (!setPreferences) return;
  void setPreferences({ showFloatingActionButton: false }).catch(() => {
    // Older dev clients without this preference keep the gear.
  });
}
