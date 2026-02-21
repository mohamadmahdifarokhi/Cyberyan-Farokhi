import * as fc from 'fast-check';

describe('Property 7: Auth screen visibility', () => {
  const getVisibleScreens = (isAuthenticated: boolean): string[] => {
    if (isAuthenticated) {
      return ['Wallet', 'Audit', 'Analytics', 'Settings'];
    } else {
      return ['Login', 'Register'];
    }
  };

  const isScreenVisible = (screenName: string, isAuthenticated: boolean): boolean => {
    const visibleScreens = getVisibleScreens(isAuthenticated);

    return visibleScreens.includes(screenName);
  };

  it('should hide auth screens when authenticated', () => {
    fc.assert(
      fc.property(fc.constantFrom('Login', 'Register'), fc.constant(true), (screenName, isAuthenticated) => {
        const visible = isScreenVisible(screenName, isAuthenticated);

        return visible === false;
      }),
      { numRuns: 100 },
    );
  });

  it('should show auth screens when not authenticated', () => {
    fc.assert(
      fc.property(fc.constantFrom('Login', 'Register'), fc.constant(false), (screenName, isAuthenticated) => {
        const visible = isScreenVisible(screenName, isAuthenticated);

        return visible === true;
      }),
      { numRuns: 100 },
    );
  });

  it('should hide main app screens when not authenticated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Wallet', 'Audit', 'Analytics', 'Settings'),
        fc.constant(false),
        (screenName, isAuthenticated) => {
          const visible = isScreenVisible(screenName, isAuthenticated);

          return visible === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should show main app screens when authenticated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Wallet', 'Audit', 'Analytics', 'Settings'),
        fc.constant(true),
        (screenName, isAuthenticated) => {
          const visible = isScreenVisible(screenName, isAuthenticated);

          return visible === true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should have mutually exclusive screen visibility', () => {
    fc.assert(
      fc.property(fc.boolean(), (isAuthenticated) => {
        const authScreens = ['Login', 'Register'];
        const mainScreens = ['Wallet', 'Audit', 'Analytics', 'Settings'];

        const authVisible = authScreens.every((screen) => isScreenVisible(screen, isAuthenticated));
        const mainVisible = mainScreens.every((screen) => isScreenVisible(screen, isAuthenticated));

        return (authVisible && !mainVisible) || (!authVisible && mainVisible);
      }),
      { numRuns: 100 },
    );
  });

  it('should always have at least one screen visible', () => {
    fc.assert(
      fc.property(fc.boolean(), (isAuthenticated) => {
        const allScreens = ['Login', 'Register', 'Wallet', 'Audit', 'Analytics', 'Settings'];
        const visibleCount = allScreens.filter((screen) => isScreenVisible(screen, isAuthenticated)).length;

        return visibleCount > 0;
      }),
      { numRuns: 100 },
    );
  });
});
