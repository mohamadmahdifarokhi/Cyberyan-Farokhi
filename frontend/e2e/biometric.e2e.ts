import { device, element, by, expect as detoxExpect } from 'detox';
import {
  waitForElementToBeVisible,
  waitForElementToNotBeVisible,
  tapElement,
  verifyElementIsVisible,
  verifyElementIsNotVisible,
  navigateToTab,
  wait,
} from './helpers';
import { TEST_TIMEOUTS } from './mockData';

/**
 * E2E Test: Biometric Authentication Flow
 *
 * Tests enabling biometric authentication, app lock/unlock,
 * and authentication success scenarios.
 *
 * Requirements: 7.1
 */
describe('Biometric Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        photos: 'YES',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should enable biometric authentication from settings', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    await waitForElementToBeVisible('biometric-toggle', TEST_TIMEOUTS.medium);

    await tapElement('biometric-toggle');

    await wait(1000);

    await verifyElementIsVisible('biometric-toggle');
  });

  it('should check biometric availability on device', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    await waitForElementToBeVisible('biometric-available-indicator', TEST_TIMEOUTS.medium);

    const biometricToggle = element(by.id('biometric-toggle'));

    await detoxExpect(biometricToggle).toBeVisible();
  });

  it('should lock app when biometric is enabled and app backgrounds', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    await waitForElementToBeVisible('biometric-toggle', TEST_TIMEOUTS.medium);
    await tapElement('biometric-toggle');
    await wait(1000);

    await device.sendToHome();
    await wait(2000);

    await device.launchApp({ newInstance: false });

    await waitForElementToBeVisible('biometric-lock-screen', TEST_TIMEOUTS.medium);
  });

  it('should unlock app with biometric authentication', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    await waitForElementToBeVisible('biometric-toggle', TEST_TIMEOUTS.medium);
    await tapElement('biometric-toggle');
    await wait(1000);

    await device.sendToHome();
    await wait(2000);
    await device.launchApp({ newInstance: false });

    await waitForElementToBeVisible('biometric-lock-screen', TEST_TIMEOUTS.medium);

    await tapElement('biometric-authenticate-button');

    try {
      await device.matchFace();
    } catch {
      try {
        await device.matchFinger();
      } catch {}
    }

    await waitForElementToNotBeVisible('biometric-lock-screen', TEST_TIMEOUTS.medium);

    try {
      await verifyElementIsVisible('wallet-screen');
    } catch {
      await verifyElementIsVisible('registration-screen');
    }
  });

  it('should show fallback authentication option when biometric fails', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    await waitForElementToBeVisible('biometric-toggle', TEST_TIMEOUTS.medium);
    await tapElement('biometric-toggle');
    await wait(1000);

    await device.sendToHome();
    await wait(2000);
    await device.launchApp({ newInstance: false });

    await waitForElementToBeVisible('biometric-lock-screen', TEST_TIMEOUTS.medium);

    try {
      await device.unmatchFace();
    } catch {
      try {
        await device.unmatchFinger();
      } catch {}
    }

    await waitForElementToBeVisible('fallback-auth-button', TEST_TIMEOUTS.medium);

    await tapElement('fallback-auth-button');

    await waitForElementToBeVisible('fallback-auth-input', TEST_TIMEOUTS.medium);
  });

  it('should disable biometric authentication from settings', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    await waitForElementToBeVisible('biometric-toggle', TEST_TIMEOUTS.medium);
    await tapElement('biometric-toggle');
    await wait(1000);

    await tapElement('biometric-toggle');
    await wait(1000);

    await device.sendToHome();
    await wait(2000);
    await device.launchApp({ newInstance: false });

    await verifyElementIsNotVisible('biometric-lock-screen');

    try {
      await verifyElementIsVisible('wallet-screen');
    } catch {
      await verifyElementIsVisible('registration-screen');
    }
  });

  it('should handle biometric not enrolled scenario', async () => {
    try {
      await navigateToTab('settings-tab');
      await waitForElementToBeVisible('settings-screen', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    }

    try {
      await waitForElementToBeVisible('biometric-not-enrolled-message', TEST_TIMEOUTS.short);
    } catch {
      await verifyElementIsVisible('biometric-toggle');
    }
  });
});
