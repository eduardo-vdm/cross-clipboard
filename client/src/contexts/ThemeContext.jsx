import { createContext, useContext, useState, useEffect } from 'react';
import { base, dark, THEME_TYPES } from '../themes';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to dark
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && Object.values(THEME_TYPES).includes(savedTheme)) {
        return savedTheme;
      }
    }
    return THEME_TYPES.DARK;
  };

  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const [theme, setTheme] = useState(currentTheme === THEME_TYPES.BASE ? base : dark);

  // Function to toggle between themes
  const toggleTheme = () => {
    setCurrentTheme(prev => 
      prev === THEME_TYPES.BASE ? THEME_TYPES.DARK : THEME_TYPES.BASE
    );
  };

  // Update theme when currentTheme changes
  useEffect(() => {
    setTheme(currentTheme === THEME_TYPES.BASE ? base : dark);
    
    // Update dark mode class
    if (currentTheme === THEME_TYPES.DARK) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Store theme preference in localStorage
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const value = {
    theme,
    currentTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 