import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'; // <-- Add this semicolon
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { colors, spacing } from '../theme/colors';
import { MarketPriceService } from '../services/MarketPriceService';
import { useVoice } from '../contexts/voiceContext';


const ALL_INDIAN_CROPS = [
  // Cereals
  'Rice', 'Wheat', 'Maize', 'Jowar', 'Bajra', 'Ragi', 'Barley', 'Oats',

  // Pulses
  'Chickpea', 'Arhar', 'Lentil', 'Moong', 'Urad', 'Pea', 'Cowpea', 'Field Bean',

  // Oilseeds
  'Groundnut', 'Mustard', 'Sunflower', 'Soybean', 'Coconut', 'Sesame', 'Safflower', 'Castor',

  // Vegetables - Leafy
  'Spinach', 'Cabbage', 'Cauliflower', 'Broccoli', 'Coriander Leaves', 'Fenugreek Leaves',

  // Vegetables - Root
  'Potato', 'Carrot', 'Radish', 'Beetroot', 'Onion', 'Garlic', 'Ginger', 'Turmeric',

  // Vegetables - Fruit
  'Tomato', 'Brinjal', 'Chilli', 'Capsicum', 'Okra', 'Cucumber', 'Bottle Gourd', 'Bitter Gourd',
  'Ridge Gourd', 'Pumpkin', 'Zucchini', 'Cluster Bean', 'French Bean',

  // Fruits
  'Mango', 'Banana', 'Apple', 'Orange', 'Lemon', 'Pomegranate', 'Guava', 'Papaya', 'Pineapple',
  'Litchi', 'Watermelon', 'Muskmelon', 'Pear', 'Peach', 'Strawberry', 'Coconut', 'Cashew',
  'Almond', 'Walnut', 'Pistachio',

  // Spices
  'Turmeric', 'Coriander', 'Cumin', 'Chilli', 'Fenugreek', 'Cardamom', 'Clove', 'Cinnamon',
  'Pepper', 'Nutmeg', 'Saffron',

  // Cash Crops
  'Cotton', 'Sugarcane', 'Tobacco', 'Tea', 'Coffee', 'Jute',

  // Flowers
  'Marigold', 'Rose', 'Jasmine', 'Chrysanthemum', 'Sunflower', 'Hibiscus', 'Orchid', 'Dahlia',

  // Medicinal
  'Ashwagandha', 'Brahmi', 'Tulsi', 'Aloe Vera', 'Neem', 'Ginseng',

  // Forage
  'Lucerne', 'Berseem',

  // Trees
  'Teak', 'Eucalyptus', 'Bamboo', 'Date Palm', 'Arecanut',

  // Others
  'Sugarbeet', 'Hops', 'Lavender', 'Mushroom', 'Seaweed'
];





export const MarketPricesScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [priceData, setPriceData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userDistrict, setUserDistrict] = useState('Unknown');
  const [userState, setUserState] = useState('Unknown');
  const [backendUrl, setBackendUrl] = useState('https://kisanpushti-backend.onrender.com');

  useEffect(() => {
    const loadUserLocation = async () => {
      try {
        const district = await AsyncStorage.getItem('userDistrict') || 'Unknown';
        const state = await AsyncStorage.getItem('userState') || 'Unknown';

        const backendUrl = 'https://kisanpushti-backend.onrender.com';

        setUserDistrict(district);
        setUserState(state);
        // If needed, let user configure this or set ngrok public url in asyncstorage/backendUrl
        setBackendUrl(backendUrl);

      console.log('✅ Loaded - District:', district, 'Backend:', backendUrl);
      } catch (error) {
        console.error('Error loading location:', error);
      }
    };
    loadUserLocation();
  }, []);

  useEffect(() => {
    if (userDistrict !== 'Unknown' && backendUrl) {
      fetchRealPrices();
      fetchPriceHistory();
    }
  }, [selectedCrop, userDistrict, backendUrl]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userDistrict !== 'Unknown' && backendUrl) {
        fetchRealPrices();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCrop, userDistrict, backendUrl]);

  const fetchRealPrices = async () => {
    try {
      setLoading(true);
      setPriceData(null);

      console.log('🔄 Sending request to:', `${backendUrl}/api/market-prices`);
      console.log('📦 Payload:', { commodity: selectedCrop, district: userDistrict });
    
      const response = await axios.post(
        `${backendUrl}/api/market-prices`,
        {
          commodity: selectedCrop,
          district: userDistrict
        },
        { timeout: 20000 }
      );

      console.log('✅ Received response:', response.data);
      
      if (response.data && response.data.success) {
        setPriceData({
          ...response.data.data,
          market: response.data.data.marketName || `${userDistrict} Mandi`, // Fallback
          source: response.data.source
        });
      } else {
        throw new Error("No data in response");
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
      Alert.alert(
        t('error'),
        t('could_not_fetch_prices') + ' ' + (error?.response?.data?.error || error.message)
      );
      setPriceData(null);
    } finally {
      setLoading(false);
    }
  };

 const fetchPriceHistory = async () => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/market-prices-history`,
      { commodity: selectedCrop, district: userDistrict },
      { timeout: 20000 }
    );
    const data = response.data.success ? response.data.data : [];
    // Check if data.history is present (new backend)
    if (data.history && Array.isArray(data.history)) {
      setPriceHistory(data.history);
    } else if (Array.isArray(data)) {
      setPriceHistory(data);
    } else {
      setPriceHistory([]);
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    setPriceHistory([]);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRealPrices();
    await fetchPriceHistory();
    setRefreshing(false);
  };

  const trend = priceData?.trend || 'stable';
  const priceChange = priceData?.priceChange || 0;

  // Calculate average price for history
  const averagePrice = priceHistory.length > 0
    ? Math.round(priceHistory.reduce((sum, item) => sum + Number(item.modalPrice || 0), 0) / priceHistory.length)
    : priceData?.modalPrice || 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏪 {t('market_prices')}</Text>
        <Text style={styles.subtitle}>
          📍 {userDistrict}, {userState}
        </Text>
      </View>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* CROP SELECTOR */}
        <View style={styles.cropSelectorContainer}>
          <Text style={styles.cropLabel}>{t('select_crop')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCrop}
              onValueChange={setSelectedCrop}
              style={styles.picker}
            >
              {ALL_INDIAN_CROPS.map((crop) => (
                <Picker.Item key={crop} label={crop} value={crop} />
              ))}
            </Picker>
          </View>
        </View>

        {/* LOADING */}
        {loading && !priceData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('fetching_real_prices')}</Text>
            <Text style={styles.subText}>{t('connecting_to_agmarknet')}</Text>
          </View>
        ) : null}

        {/* PRICE CARD */}
        {priceData && (
          <View style={styles.latestPriceCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.cropNameLarge}>{selectedCrop}</Text>
              <View style={styles.trendBadge}>
                <Text style={[styles.trendIcon, { color: trend === 'up' ? '#D32F2F' : trend === 'down' ? '#388E3C' : '#FFA500' }]}>
                  {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
                </Text>
                <Text style={[styles.priceChange, { color: trend === 'up' ? '#D32F2F' : trend === 'down' ? '#388E3C' : '#FFA500' }]}>
                  {priceChange > 0 ? '+' : ''}{priceChange}%
                </Text>
              </View>
            </View>
            {/* PRICE BOXES */}
            <View style={styles.priceGrid}>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{t('min_price')}</Text>
                <Text style={styles.priceValue}>₹{priceData.minPrice}</Text>
              </View>
              <View style={styles.priceBoxCenter}>
                <Text style={styles.priceLabel}>{t('modal_price')}</Text>
                <Text style={[styles.priceValue, { color: colors.primary, fontSize: 24 }]}>
                  ₹{priceData.modalPrice}
                </Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>{t('max_price')}</Text>
                <Text style={styles.priceValue}>₹{priceData.maxPrice}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>📊 {t('avg_price')}</Text>
                <Text style={styles.statValue}>₹{averagePrice}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>📍 {t('market')}</Text>
                <Text style={styles.statValue}>{priceData.market}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>🔄 {t('updated')}</Text>
                <Text style={styles.statValue}>{priceData.date || 'Today'}</Text>
              </View>
            </View>
            <View style={[styles.sourceIndicator, { borderColor: priceData.dataAvailable ? '#4CAF50' : '#FFA500' }]}>
              <Text style={[styles.sourceText, { color: priceData.dataAvailable ? '#4CAF50' : '#FFA500' }]}>
                {priceData.dataAvailable ? '✅' : '⚠️'} {priceData.source}
              </Text>
            </View>
          </View>
        )}

        {/* PRICE HISTORY */}
        {priceHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>📈 {t('price_history')} (Last 7 Days)</Text>
            <FlatList
              data={priceHistory}
              keyExtractor={(item, index) => `${item.date}-${index}`}
              scrollEnabled={false}
              renderItem={({ item }) => {
                if (!item) return null;
                return (
                <View style={styles.historyItem}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <View style={styles.historyPrices}>
                    <Text style={styles.historyPrice}>₹{item.minPrice} - ₹{item.maxPrice}</Text>
                    <Text style={[styles.historyModal, { color: colors.primary }]}>₹{item.modalPrice}</Text>
                  </View>
                </View>
                );
              }}
            />
          </View>
        )}
        {!loading && !priceData && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>⚠️ {t('no_price_data')}</Text>
            <Text style={styles.noDataSubtext}>{t('try_different_crop')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRealPrices}>
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginVertical: spacing.sm },
  subtitle: { fontSize: 12, color: colors.textSecondary },
  scrollContent: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cropSelectorContainer: { marginBottom: spacing.lg },
  cropLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden'
  },
  picker: { height: 50, color: colors.text },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
  loadingText: { fontSize: 14, color: colors.text, marginTop: spacing.md, fontWeight: '600' },
  subText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
  latestPriceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  cropNameLarge: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trendIcon: { fontSize: 18 },
  priceChange: { fontSize: 14, fontWeight: 'bold' },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  priceBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.sm,
    alignItems: 'center'
  },
  priceBoxCenter: {
    flex: 1,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    padding: spacing.md,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary
  },
  priceLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.xs },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs },
  statValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  sourceIndicator: {
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
    alignItems: 'center'
  },
  sourceText: { fontSize: 11, fontWeight: '600' },
  historyContainer: { marginBottom: spacing.lg },
  historyTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary
  },
  historyDate: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  historyPrices: { alignItems: 'flex-end' },
  historyPrice: { fontSize: 12, color: colors.text },
  historyModal: { fontSize: 14, fontWeight: 'bold', marginTop: spacing.xs },
  noDataContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
  noDataText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  noDataSubtext: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md
  },
  retryButtonText: { color: colors.surface, fontWeight: '600', fontSize: 14 }
});

export default MarketPricesScreen;
