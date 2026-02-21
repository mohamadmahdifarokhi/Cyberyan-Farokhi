import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react-native';
import { withLogging } from '../withLogging';
import Logger from '../logger';

describe('withLogging HOC Property-Based Tests', () => {
  let capturedLogs: Array<{ level: string; message: string }> = [];
  let originalDebug: any;

  beforeEach(() => {
    capturedLogs = [];

    originalDebug = Logger.prototype.debug;
    Logger.prototype.debug = jest.fn((message: string) => {
      capturedLogs.push({ level: 'DEBUG', message });
    });

    process.env.LOG_COMPONENT_LIFECYCLE = 'true';
  });

  afterEach(() => {
    Logger.prototype.debug = originalDebug;
    jest.clearAllMocks();
  });

  describe('Property 14: Component mount logging', () => {
    it('should log component name when any component mounts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[A-Za-z][A-Za-z0-9]*$/.test(s)),
          (componentName) => {
            capturedLogs = [];

            const TestComponent: React.FC = () => <></>;

            TestComponent.displayName = componentName;

            const WrappedComponent = withLogging(TestComponent);

            const { unmount: unmountComponent } = render(<WrappedComponent />);

            const mountLogs = capturedLogs.filter(
              (log) => log.message.includes('[Component]') && log.message.includes('mounted'),
            );

            expect(mountLogs.length).toBeGreaterThan(0);

            const mountLog = mountLogs[0];

            expect(mountLog.message).toContain(componentName);
            expect(mountLog.level).toBe('DEBUG');

            unmountComponent();
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should log component unmount when any component unmounts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[A-Za-z][A-Za-z0-9]*$/.test(s)),
          (componentName) => {
            capturedLogs = [];

            const TestComponent: React.FC = () => <></>;

            TestComponent.displayName = componentName;

            const WrappedComponent = withLogging(TestComponent);

            const { unmount: unmountComponent } = render(<WrappedComponent />);

            capturedLogs = [];

            unmountComponent();

            const unmountLogs = capturedLogs.filter(
              (log) => log.message.includes('[Component]') && log.message.includes('unmounted'),
            );

            expect(unmountLogs.length).toBeGreaterThan(0);

            const unmountLog = unmountLogs[0];

            expect(unmountLog.message).toContain(componentName);
            expect(unmountLog.level).toBe('DEBUG');
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should not log when LOG_COMPONENT_LIFECYCLE is disabled', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => /^[A-Za-z][A-Za-z0-9]*$/.test(s)),
          (componentName) => {
            process.env.LOG_COMPONENT_LIFECYCLE = 'false';

            capturedLogs = [];

            const TestComponent: React.FC = () => <></>;

            TestComponent.displayName = componentName;

            const WrappedComponent = withLogging(TestComponent);

            const { unmount: unmountComponent } = render(<WrappedComponent />);

            unmountComponent();

            const componentLogs = capturedLogs.filter((log) => log.message.includes('[Component]'));

            expect(componentLogs.length).toBe(0);

            process.env.LOG_COMPONENT_LIFECYCLE = 'true';
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
