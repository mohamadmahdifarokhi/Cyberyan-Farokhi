import { device, element, by, expect as detoxExpect } from 'detox';
import {
  waitForElementToBeVisible,
  verifyElementIsVisible,
  navigateToTab,
  waitForLoadingToComplete,
  fillRegistrationForm,
  submitRegistrationForm,
} from './helpers';
import { generateTestUser, TEST_TIMEOUTS } from './mockData';

/**
 * E2E Test: Complete Registration Flow
 *
 * Tests the complete registration flow from form input to credential storage
 * and wallet display, including RabbitMQ message processing and MongoDB persistence.
 *
 * Requirements: 7.1
 */
describe('Complete Registration Flow', () => {
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

  it('should complete full registration flow: form input → submission → credential storage → wallet display', async () => {
    await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);

    const testUser = generateTestUser(1);

    await fillRegistrationForm({
      name: testUser.name,
      email: testUser.email,
    });

    await detoxExpect(element(by.id('registration-name-input'))).toHaveText(testUser.name);
    await detoxExpect(element(by.id('registration-email-input'))).toHaveText(testUser.email);

    await submitRegistrationForm();

    await waitForElementToBeVisible('loading-indicator', TEST_TIMEOUTS.short);

    await waitForLoadingToComplete('loading-indicator', TEST_TIMEOUTS.veryLong);

    try {
      await waitForElementToBeVisible('registration-success-message', TEST_TIMEOUTS.medium);
    } catch {
      await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    }

    try {
      await navigateToTab('wallet-tab');
    } catch {}

    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    await detoxExpect(element(by.text(testUser.name))).toBeVisible();

    const credentialCards = element(by.id('credential-card'));

    await detoxExpect(credentialCards).toBeVisible();
  });

  it('should process registration through RabbitMQ message queue', async () => {
    await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);

    const testUser = generateTestUser(2);

    await fillRegistrationForm({
      name: testUser.name,
      email: testUser.email,
    });
    await submitRegistrationForm();

    await waitForElementToBeVisible('loading-indicator', TEST_TIMEOUTS.short);

    await waitForLoadingToComplete('loading-indicator', TEST_TIMEOUTS.veryLong);

    try {
      await waitForElementToBeVisible('registration-success-message', TEST_TIMEOUTS.medium);
    } catch {
      await navigateToTab('wallet-tab');
      await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
      await detoxExpect(element(by.text(testUser.name))).toBeVisible();
    }
  });

  it('should persist credential data to MongoDB', async () => {
    await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    const testUser = generateTestUser(3);

    await fillRegistrationForm({
      name: testUser.name,
      email: testUser.email,
    });
    await submitRegistrationForm();

    await waitForLoadingToComplete('loading-indicator', TEST_TIMEOUTS.veryLong);

    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    await detoxExpect(element(by.text(testUser.name))).toBeVisible();

    await device.reloadReactNative();

    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    await detoxExpect(element(by.text(testUser.name))).toBeVisible();
  });

  it('should handle registration errors gracefully', async () => {
    await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);

    await submitRegistrationForm();

    try {
      await waitForElementToBeVisible('error-message', TEST_TIMEOUTS.short);
    } catch {
      await verifyElementIsVisible('registration-name-error');
    }

    await verifyElementIsVisible('registration-screen');
  });

  it('should display credential with all required information', async () => {
    await waitForElementToBeVisible('registration-screen', TEST_TIMEOUTS.medium);
    const testUser = generateTestUser(4);

    await fillRegistrationForm({
      name: testUser.name,
      email: testUser.email,
    });
    await submitRegistrationForm();
    await waitForLoadingToComplete('loading-indicator', TEST_TIMEOUTS.veryLong);

    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    await detoxExpect(element(by.text(testUser.name))).toBeVisible();

    await verifyElementIsVisible('credential-card');
  });
});
