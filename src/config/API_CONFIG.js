// Your ngrok URL from Colab
export const BASE_URL = 'https://kisanpushti-backend.onrender.com';

export const API_ENDPOINTS = {
  PREDICT: `${BASE_URL}/api/predict`,
  TIP_OF_DAY: `${BASE_URL}/api/tip-of-day`,
  NEWS: `${BASE_URL}/api/news`,
  ALERTS: `${BASE_URL}/api/alerts`,
  SUMMARY: `${BASE_URL}/api/summary`,
  MARKET_PRICES: `${BASE_URL}/api/market-prices`,
  GOVERNMENT_SCHEMES: `${BASE_URL}/api/government-schemes`,
  PROBLEM_SOLVER: `${BASE_URL}/api/problem-solver`,
  TRANSLATE_NAME: `${BASE_URL}/api/translate-name`,
};

export const API_TIMEOUT = 30000; // 30 seconds
