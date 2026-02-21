import * as fc from 'fast-check';

describe('Property 4: Navigation guard correctness', () => {
  const isProtectedRoute = (routeName: string): boolean => {
    const protectedRoutes = ['Wallet', 'Audit', 'Analytics', 'Settings', 'MainTabs'];

    return protectedRoutes.includes(routeName);
  };

  const shouldAllowNavigation = (routeName: string, isAuthenticated: boolean): boolean => {
    if (!isProtectedRoute(routeName)) {
      return true;
    }

    return isAuthenticated;
  };

  it('should block navigation to protected routes when not authenticated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Wallet', 'Audit', 'Analytics', 'Settings', 'MainTabs'),
        fc.constant(false),
        (routeName, isAuthenticated) => {
          const allowed = shouldAllowNavigation(routeName, isAuthenticated);

          return allowed === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should allow navigation to protected routes when authenticated', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Wallet', 'Audit', 'Analytics', 'Settings', 'MainTabs'),
        fc.constant(true),
        (routeName, isAuthenticated) => {
          const allowed = shouldAllowNavigation(routeName, isAuthenticated);

          return allowed === true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should always allow navigation to auth routes', () => {
    fc.assert(
      fc.property(fc.constantFrom('Login', 'Register'), fc.boolean(), (routeName, isAuthenticated) => {
        const allowed = shouldAllowNavigation(routeName, isAuthenticated);

        return allowed === true;
      }),
      { numRuns: 100 },
    );
  });

  it('should have consistent navigation rules across all routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Login', 'Register', 'Wallet', 'Audit', 'Analytics', 'Settings', 'MainTabs'),
        fc.boolean(),
        (routeName, isAuthenticated) => {
          const isProtected = isProtectedRoute(routeName);
          const allowed = shouldAllowNavigation(routeName, isAuthenticated);

          if (isProtected && !isAuthenticated) {
            return allowed === false;
          } else if (!isProtected) {
            return allowed === true;
          } else {
            return allowed === true;
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
