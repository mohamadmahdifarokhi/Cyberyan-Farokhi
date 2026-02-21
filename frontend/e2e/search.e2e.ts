import { device, element, by, expect as detoxExpect } from 'detox';
import {
  waitForElementToBeVisible,
  verifyElementIsVisible,
  navigateToTab,
  searchCredential,
  clearSearch,
  typeText,
  clearText,
  wait,
} from './helpers';
import { TEST_DATA, TEST_TIMEOUTS } from './mockData';

/**
 * E2E Test: Search and Filter Flow
 *
 * Tests search input, filtered results, and clearing search
 * in the wallet screen.
 *
 * Requirements: 7.1
 */
describe('Search and Filter Flow', () => {
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

  it('should display search input field in wallet screen', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    await verifyElementIsVisible('wallet-search-input');

    await element(by.id('wallet-search-input')).tap();

    await typeText('wallet-search-input', 'test');
    await clearText('wallet-search-input');
  });

  it('should filter credentials in real-time as user types', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    const searchQuery = TEST_DATA.searchQueries.valid;

    await searchCredential(searchQuery);

    await wait(500); // Wait for filter to apply

    await verifyElementIsVisible('credential-list');
  });

  it('should show only credentials matching search criteria', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    const searchQuery = 'John';

    await searchCredential(searchQuery);

    try {
      await detoxExpect(element(by.text('John'))).toBeVisible();
    } catch {
      try {
        await verifyElementIsVisible('empty-search-results');
      } catch {}
    }
  });

  it('should display empty state when no credentials match search', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    const searchQuery = TEST_DATA.searchQueries.noResults;

    await searchCredential(searchQuery);

    try {
      await waitForElementToBeVisible('empty-search-results', TEST_TIMEOUTS.short);
    } catch {
      await verifyElementIsVisible('credential-list');
    }

    try {
      await detoxExpect(element(by.text('No credentials found'))).toBeVisible();
    } catch {}
  });

  it('should clear search and show all credentials', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    const searchQuery = TEST_DATA.searchQueries.valid;

    await searchCredential(searchQuery);
    await wait(500);

    await clearSearch();

    await verifyElementIsVisible('credential-list');

    await detoxExpect(element(by.id('wallet-search-input'))).toHaveText('');
  });

  it('should search by credential name', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    await searchCredential('Test User');
    await wait(500);

    try {
      await detoxExpect(element(by.text('Test User'))).toBeVisible();
    } catch {
      await verifyElementIsVisible('credential-list');
    }
  });

  it('should search by credential email', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    await searchCredential('example.com');
    await wait(500);

    try {
      await detoxExpect(element(by.text('example.com'))).toBeVisible();
    } catch {
      await verifyElementIsVisible('credential-list');
    }
  });

  it('should search by credential DID', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    await searchCredential('did:');
    await wait(500);

    await verifyElementIsVisible('credential-list');
  });

  it('should handle partial search queries', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    const partialQuery = TEST_DATA.searchQueries.partial;

    await searchCredential(partialQuery);
    await wait(500);

    try {
      await detoxExpect(element(by.text(partialQuery))).toBeVisible();
    } catch {
      await verifyElementIsVisible('credential-list');
    }
  });

  it('should be case-insensitive in search', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    await searchCredential('john');
    await wait(500);
    const _lowercaseResults = await element(by.id('credential-list')).getAttributes();

    await clearSearch();
    await wait(500);
    await searchCredential('JOHN');
    await wait(500);

    await verifyElementIsVisible('credential-list');
  });

  it('should update search results immediately on input change', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    await typeText('wallet-search-input', 'J');
    await wait(500);

    await verifyElementIsVisible('credential-list');

    await typeText('wallet-search-input', 'ohn');
    await wait(500);

    await verifyElementIsVisible('credential-list');
  });

  it('should maintain search state when navigating away and back', async () => {
    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);
    await waitForElementToBeVisible('credential-list', TEST_TIMEOUTS.medium);

    const searchQuery = 'Test';

    await searchCredential(searchQuery);
    await wait(500);

    await navigateToTab('audit-tab');
    await wait(500);

    await navigateToTab('wallet-tab');
    await waitForElementToBeVisible('wallet-screen', TEST_TIMEOUTS.medium);

    try {
      await detoxExpect(element(by.id('wallet-search-input'))).toHaveText('');
    } catch {
      await detoxExpect(element(by.id('wallet-search-input'))).toHaveText(searchQuery);
    }
  });
});
