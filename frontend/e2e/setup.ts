import { device } from 'detox';

/**
 * E2E Test Setup
 * Provides common setup and teardown for all E2E tests
 */

/**
 * Setup before all tests
 */
export async function setupE2E(): Promise<void> {
  await device.launchApp({
    newInstance: true,
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  });
}

/**
 * Teardown after all tests
 */
export async function teardownE2E(): Promise<void> {}

/**
 * Reset app state between tests
 */
export async function resetApp(): Promise<void> {
  await device.reloadReactNative();
}

/**
 * Clear app data and restart
 */
export async function clearAppData(): Promise<void> {
  await device.launchApp({
    newInstance: true,
    delete: true,
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
    },
  });
}
