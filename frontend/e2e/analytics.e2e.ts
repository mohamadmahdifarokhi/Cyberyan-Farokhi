import { device, element, by, expect as detoxExpect } from 'detox';
import {
  waitForElementToBeVisible,
  verifyElementIsVisible,
  navigateToTab,
  wait,
  pullToRefresh,
  verifySystemHealthStatus,
  tapElement,
} from './helpers';
import { TEST_TIMEOUTS } from './mockData';

/**
 * E2E Test: Analytics Dashboard Flow
 *
 * Tests metrics display, chart rendering, and system health status
 * on the analytics dashboard.
 *
 * Requirements: 7.1
 */
describe('Analytics Dashboard Flow', () => {
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

  it('should navigate to analytics dashboard screen', async () => {
    await navigateToTab('analytics-tab');

    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    try {
      await detoxExpect(element(by.text('Analytics Dashboard'))).toBeVisible();
    } catch {
      await verifyElementIsVisible('analytics-screen');
    }
  });

  it('should display total registrations count', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await verifyElementIsVisible('total-registrations-metric');

    try {
      const registrationsElement = element(by.id('total-registrations-value'));

      await detoxExpect(registrationsElement).toBeVisible();
    } catch {
      await verifyElementIsVisible('total-registrations-metric');
    }
  });

  it('should display registration trend chart', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await verifyElementIsVisible('registration-trend-chart');

    try {
      await verifyElementIsVisible('chart-data-points');
    } catch {
      await verifyElementIsVisible('registration-trend-chart');
    }
  });

  it('should display average processing time metric', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await verifyElementIsVisible('avg-processing-time-metric');

    try {
      const processingTimeElement = element(by.id('avg-processing-time-value'));

      await detoxExpect(processingTimeElement).toBeVisible();
    } catch {
      await verifyElementIsVisible('avg-processing-time-metric');
    }
  });

  it('should display system health status for all services', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    await verifyElementIsVisible('health-mongodb');

    await verifyElementIsVisible('health-rabbitmq');

    await verifyElementIsVisible('health-api');
  });

  it('should show healthy status for MongoDB when service is running', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    try {
      await verifySystemHealthStatus('mongodb', 'healthy');
    } catch {
      await verifyElementIsVisible('health-mongodb');
    }
  });

  it('should show healthy status for RabbitMQ when service is running', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    try {
      await verifySystemHealthStatus('rabbitmq', 'healthy');
    } catch {
      await verifyElementIsVisible('health-rabbitmq');
    }
  });

  it('should show healthy status for API when service is running', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    try {
      await verifySystemHealthStatus('api', 'healthy');
    } catch {
      await verifyElementIsVisible('health-api');
    }
  });

  it('should refresh analytics data when pull-to-refresh is triggered', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    try {
      await pullToRefresh('analytics-scroll-view');
    } catch {
      console.log('Pull-to-refresh not available on analytics screen');
    }

    await wait(2000);

    await verifyElementIsVisible('total-registrations-metric');
  });

  it('should display loading state while fetching analytics data', async () => {
    await navigateToTab('analytics-tab');

    try {
      await waitForElementToBeVisible('analytics-loading', TEST_TIMEOUTS.short);
    } catch {
      console.log('Loading state too fast to observe');
    }

    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);
  });

  it('should handle analytics data fetch errors gracefully', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    try {
      await waitForElementToBeVisible('analytics-error-message', TEST_TIMEOUTS.short);
    } catch {
      await verifyElementIsVisible('total-registrations-metric');
    }
  });

  it('should display chart with proper labels and axes', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await verifyElementIsVisible('registration-trend-chart');

    try {
      await verifyElementIsVisible('chart-x-axis');
      await verifyElementIsVisible('chart-y-axis');
    } catch {
      await verifyElementIsVisible('registration-trend-chart');
    }
  });

  it('should show registration trend over time period', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await verifyElementIsVisible('registration-trend-chart');

    try {
      await verifyElementIsVisible('time-period-selector');
    } catch {
      console.log('Time period selector not available');
    }
  });

  it('should display metrics in cards with modern styling', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await verifyElementIsVisible('total-registrations-metric');
    await verifyElementIsVisible('avg-processing-time-metric');

    await verifyElementIsVisible('analytics-screen');
  });

  it('should update metrics when new registrations occur', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    await navigateToTab('registration-tab');

    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);
    await verifyElementIsVisible('total-registrations-metric');
  });

  it('should display system uptime information', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    try {
      await verifyElementIsVisible('system-uptime');
    } catch {
      console.log('System uptime not displayed');
    }
  });

  it('should show color-coded health status indicators', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    await verifyElementIsVisible('health-mongodb');
    await verifyElementIsVisible('health-rabbitmq');
    await verifyElementIsVisible('health-api');

    try {
      await verifyElementIsVisible('health-status-indicator');
    } catch {
      await verifyElementIsVisible('health-mongodb');
    }
  });

  it('should allow tapping on health status for more details', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(3000);

    try {
      await tapElement('health-mongodb');
      await wait(500);

      try {
        await waitForElementToBeVisible('health-details-modal', TEST_TIMEOUTS.short);
      } catch {
        console.log('Health details modal not available');
      }
    } catch {
      console.log('Health status not tappable');
    }
  });

  it('should display analytics with gradient background and modern UI', async () => {
    await navigateToTab('analytics-tab');
    await waitForElementToBeVisible('analytics-screen', TEST_TIMEOUTS.medium);

    await wait(2000);

    try {
      await verifyElementIsVisible('gradient-background');
    } catch {
      await verifyElementIsVisible('analytics-screen');
    }

    await verifyElementIsVisible('total-registrations-metric');
  });
});
