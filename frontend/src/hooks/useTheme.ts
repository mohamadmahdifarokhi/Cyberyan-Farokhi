import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { createTheme } from '../theme';

export const useTheme = () => {
  const { isDarkMode, setDarkMode } = useAppContext();
  const theme = useMemo(() => createTheme(isDarkMode), [isDarkMode]);

  const toggleTheme = () => {
    setDarkMode(!isDarkMode);
  };

  return {
    ...theme,
    toggleTheme,
  };
};
