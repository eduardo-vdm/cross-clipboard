import { theme as baseTheme } from '../theme';

export const dark = {
  name: 'dark',
  colors: {
    background: {
      primary: baseTheme.colors.neutral[900],
      secondary: baseTheme.colors.neutral[800],
      tertiary: baseTheme.colors.neutral[700],
    },
    text: {
      primary: baseTheme.colors.neutral[50],
      secondary: baseTheme.colors.neutral[300],
      tertiary: baseTheme.colors.neutral[500],
    },
    border: {
      primary: baseTheme.colors.neutral[700],
      secondary: baseTheme.colors.neutral[600],
    },
    ...baseTheme.colors,
  },
  spacing: baseTheme.spacing,
  borderRadius: baseTheme.borderRadius,
  fontFamily: baseTheme.fontFamily,
  fontSize: baseTheme.fontSize,
  fontWeight: baseTheme.fontWeight,
  boxShadow: {
    ...baseTheme.boxShadow,
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.4)',
  },
  transition: baseTheme.transition,
}; 