import React, { useEffect, ComponentType } from 'react';
import { logger } from './logger';

export function withLogging<P extends object>(Component: ComponentType<P>, componentName?: string): ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  const WithLogging: React.FC<P> = (props) => {
    useEffect(() => {
      const shouldLog =
        typeof process !== 'undefined' && process.env && process.env.LOG_COMPONENT_LIFECYCLE !== 'false';

      if (shouldLog) {
        logger.debug(`[Component] ${displayName} mounted`);

        return () => {
          logger.debug(`[Component] ${displayName} unmounted`);
        };
      }
    }, []);

    return <Component {...props} />;
  };

  WithLogging.displayName = `withLogging(${displayName})`;

  return WithLogging;
}

export default withLogging;
