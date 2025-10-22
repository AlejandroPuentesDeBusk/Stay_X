import { useAppStore } from '../store/useAppStore';
import { darkTheme, lightTheme } from '../theme/theme';

export const useTheme = () => {
  const darkMode = useAppStore((state) => state.darkMode);
  return darkMode ? darkTheme : lightTheme;
};
