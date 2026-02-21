import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const useNativeDriver = !isWeb;

export const suppressWebWarnings = () => {
  if (isWeb) {
    const originalWarn = console.warn;

    console.warn = (...args: unknown[]) => {
      const message = args[0];

      if (
        typeof message === 'string' &&
        (message.includes('useNativeDriver') || message.includes('props.pointerEvents is deprecated'))
      ) {
        return;
      }
      originalWarn(...args);
    };
  }
};
