export const colors = {
  primary: '#2E7D32',       // Deep green (crop/agriculture)
  secondary: '#FFB74D',     // Warm orange (harvest)
  danger: '#D32F2F',        // Red (alerts)
  warning: '#FBC02D',       // Yellow (caution)
  success: '#4CAF50',       // Green (success)
  background: '#F5F5F5',    // Light gray
  surface: '#FFFFFF',       // White
  text: '#212121',          // Dark gray
  textSecondary: '#757575', // Medium gray
  border: '#E0E0E0',        // Light border
  darkMode: '#121212' ,      // Dark background
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const typography = {
  h1: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  h2: { fontSize: 24, fontWeight: '600', color: colors.text },
  h3: { fontSize: 20, fontWeight: '600', color: colors.text },
  body: { fontSize: 16, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary }
};
