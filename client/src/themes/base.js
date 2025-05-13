import { theme as baseTheme } from '../theme';

export const base = {
  name: 'base',
  colors: {
    background: {
      primary: baseTheme.colors.neutral[50],
      secondary: baseTheme.colors.neutral[100],
      tertiary: baseTheme.colors.neutral[200],
    },
    text: {
      primary: baseTheme.colors.neutral[900],
      secondary: baseTheme.colors.neutral[700],
      tertiary: baseTheme.colors.neutral[500],
    },
    border: {
      primary: baseTheme.colors.neutral[200],
      secondary: baseTheme.colors.neutral[300],
    },
    ...baseTheme.colors,
  },
  spacing: baseTheme.spacing,
  borderRadius: baseTheme.borderRadius,
  fontFamily: baseTheme.fontFamily,
  fontSize: baseTheme.fontSize,
  fontWeight: baseTheme.fontWeight,
  boxShadow: baseTheme.boxShadow,
  transition: baseTheme.transition,
}; 