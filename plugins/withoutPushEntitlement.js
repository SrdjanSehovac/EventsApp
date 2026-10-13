// Reminders are local notifications only. expo-notifications adds the push
// (aps-environment) entitlement, which the App Store profile does not include
// and which local notifications do not need, so drop it.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
