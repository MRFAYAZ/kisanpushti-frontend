import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

export const SummaryScreen = ({ navigation, route }) => {
  const { summary, loading, district, state } = route.params;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Today's Summary</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No summary available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Today's Summary</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Location</Text>
          <Text style={styles.cardText}>{district}, {state}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌡️ Temperature</Text>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>Min</Text>
              <Text style={styles.weatherValue}>{summary.weather.temperature_min}°C</Text>
            </View>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>Max</Text>
              <Text style={styles.weatherValue}>{summary.weather.temperature_max}°C</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💧 Humidity & Wind</Text>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>Humidity</Text>
              <Text style={styles.weatherValue}>{summary.weather.humidity}%</Text>
            </View>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>Wind Speed</Text>
              <Text style={styles.weatherValue}>{summary.weather.wind_speed} km/h</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌧️ Rainfall</Text>
          <Text style={styles.cardText}>
            Forecast: {summary.weather.rainfall_forecast} mm
          </Text>
          <Text style={styles.cardText}>
            Probability: {summary.weather.rainfall_probability}%
          </Text>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationTitle}>💡 Today's Recommendations</Text>
          
          <View style={styles.recommendation}>
            <Text style={styles.recommendationLabel}>💧 Watering:</Text>
            <Text style={styles.recommendationText}>{summary.recommendations_local.watering}</Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationLabel}>🔬 Spraying:</Text>
            <Text style={styles.recommendationText}>{summary.recommendations_local.spraying}</Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationLabel}>🌾 Harvesting:</Text>
            <Text style={styles.recommendationText}>{summary.recommendations_local.harvesting}</Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationLabel}>📝 General:</Text>
            <Text style={styles.recommendationText}>{summary.recommendations_local.general_local}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 Soil Health</Text>
          <Text style={styles.cardText}>{summary.soil_health_indicator_local}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Market Prices</Text>
          <Text style={styles.cardText}>{summary.market_price_local}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 Summary</Text>
          <Text style={styles.cardText}>{summary.summary_text_local}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 14, color: colors.primary, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.primary },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  cardText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  weatherGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  weatherItem: { flex: 1, alignItems: 'center' },
  weatherLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs },
  weatherValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  recommendationCard: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  recommendationTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  recommendation: { marginBottom: spacing.md },
  recommendationLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  recommendationText: { fontSize: 12, color: colors.text, lineHeight: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textSecondary },
});

export default SummaryScreen;