import { element, by, expect as detoxExpect, waitFor } from 'detox';

/**
 * E2E Test Helpers
 * Provides reusable helper functions for E2E tests
 */

/**
 * Wait for element to be visible with timeout
 */
export async function waitForElementToBeVisible(testID: string, timeout: number = 10000): Promise<void> {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .withTimeout(timeout);
}

/**
 * Wait for element to not be visible
 */
export async function waitForElementToNotBeVisible(testID: string, timeout: number = 10000): Promise<void> {
  await waitFor(element(by.id(testID)))
    .not.toBeVisible()
    .withTimeout(timeout);
}

/**
 * Type text into input field
 */
export async function typeText(testID: string, text: string): Promise<void> {
  await element(by.id(testID)).typeText(text);
}

/**
 * Clear text from input field
 */
export async function clearText(testID: string): Promise<void> {
  await element(by.id(testID)).clearText();
}

/**
 * Tap on element
 */
export async function tapElement(testID: string): Promise<void> {
  await element(by.id(testID)).tap();
}

/**
 * Scroll to element
 */
export async function scrollToElement(
  scrollViewTestID: string,
  elementTestID: string,
  direction: 'up' | 'down' | 'left' | 'right' = 'down',
): Promise<void> {
  await waitFor(element(by.id(elementTestID)))
    .toBeVisible()
    .whileElement(by.id(scrollViewTestID))
    .scroll(100, direction);
}

/**
 * Swipe element
 */
export async function swipeElement(
  testID: string,
  direction: 'up' | 'down' | 'left' | 'right',
  speed: 'fast' | 'slow' = 'fast',
): Promise<void> {
  await element(by.id(testID)).swipe(direction, speed);
}

/**
 * Verify element has text
 */
export async function verifyElementHasText(testID: string, text: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveText(text);
}

/**
 * Verify element contains text
 */
export async function verifyElementContainsText(testID: string, text: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).toHaveText(expect.stringContaining(text));
}

/**
 * Verify element is visible
 */
export async function verifyElementIsVisible(testID: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).toBeVisible();
}

/**
 * Verify element is not visible
 */
export async function verifyElementIsNotVisible(testID: string): Promise<void> {
  await detoxExpect(element(by.id(testID))).not.toBeVisible();
}

/**
 * Wait for a specific time (use sparingly)
 */
export async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Navigate to tab
 */
export async function navigateToTab(tabTestID: string): Promise<void> {
  await tapElement(tabTestID);
  await wait(500); // Wait for navigation animation
}

/**
 * Fill registration form
 */
export async function fillRegistrationForm(data: { name: string; email: string }): Promise<void> {
  await typeText('registration-name-input', data.name);
  await typeText('registration-email-input', data.email);
}

/**
 * Submit registration form
 */
export async function submitRegistrationForm(): Promise<void> {
  await tapElement('registration-submit-button');
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingToComplete(
  loadingTestID: string = 'loading-indicator',
  timeout: number = 30000,
): Promise<void> {
  await waitForElementToNotBeVisible(loadingTestID, timeout);
}

/**
 * Verify credential card exists
 */
export async function verifyCredentialCardExists(did: string): Promise<void> {
  await verifyElementIsVisible(`credential-card-${did}`);
}

/**
 * Search for credential
 */
export async function searchCredential(query: string): Promise<void> {
  await typeText('wallet-search-input', query);
  await wait(500); // Wait for search debounce
}

/**
 * Clear search
 */
export async function clearSearch(): Promise<void> {
  await clearText('wallet-search-input');
  await wait(500); // Wait for search debounce
}

/**
 * Export credential
 */
export async function exportCredential(did: string): Promise<void> {
  await tapElement(`credential-card-${did}`);
  await waitForElementToBeVisible('export-button');
  await tapElement('export-button');
}

/**
 * Verify system health status
 */
export async function verifySystemHealthStatus(
  service: 'mongodb' | 'rabbitmq' | 'api',
  status: 'healthy' | 'degraded' | 'down',
): Promise<void> {
  await verifyElementIsVisible(`health-${service}-${status}`);
}

/**
 * Pull to refresh
 */
export async function pullToRefresh(scrollViewTestID: string): Promise<void> {
  await swipeElement(scrollViewTestID, 'down', 'slow');
  await wait(1000); // Wait for refresh to complete
}
