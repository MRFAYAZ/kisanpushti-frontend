import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { colors, spacing } from '../theme/colors';
import { useVoice } from '../contexts/voiceContext';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation, route }) => {
  const { i18n, t } = useTranslation();
  const { isVoiceEnabled, speak } = useVoice();

  // State
  const [menuOpen, setMenuOpen] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [translatedName, setTranslatedName] = useState('');
  const [translatingName, setTranslatingName] = useState(false);
  const [userState, setUserState] = useState('');
  const [userDistrict, setUserDistrict] = useState('');
  const [userLanguage, setUserLanguage] = useState('en');
  const [backendUrl, setBackendUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New state for 4 sections
  const [tip, setTip] = useState(null);
  const [news, setNews] = useState({ daily_news: [], national_news: [], state_news: [] });
  const [activeNewsTab, setActiveNewsTab] = useState('daily_news');
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [problemSolverVisible, setProblemSolverVisible] = useState(false);
  const [problemInput, setProblemInput] = useState('');
  const [problemSolving, setProblemSolving] = useState(false);
  const [problemSolution, setProblemSolution] = useState(null);

  // Load all data on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllData();
    });
    return unsubscribe;
  }, [navigation]);

  // Translate name effect
  useEffect(() => {
    if (farmerName && userLanguage && backendUrl && !translatingName) {
      translateNameViaBackend(farmerName, userLanguage, backendUrl);
    }
  }, [userLanguage, backendUrl, farmerName]);

  // MAIN LOAD DATA FUNCTION
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      // Load context data, including userLanguage
      const [url, name, state, district, storedLang] = await Promise.all([
        AsyncStorage.getItem('backendUrl'),
        AsyncStorage.getItem('farmerName'),
        AsyncStorage.getItem('userState'),
        AsyncStorage.getItem('userDistrict'),
        AsyncStorage.getItem('userLanguage')
      ]);

      // Defensive fallback
      const language = storedLang || i18n.language || 'en';

     if (storedLang && i18n && typeof i18n.changeLanguage === 'function' && i18n.language !== storedLang) {
        i18n.changeLanguage(storedLang);
      }


      setBackendUrl(url || '');
      setFarmerName(name || t('farmer'));
      setUserState(state || 'Unknown');
      setUserDistrict(district || 'Unknown');
      setUserLanguage(language);
      setTranslatedName(name || t('farmer'));

      if (
        storedLang &&
        i18n &&
        typeof i18n.changeLanguage === 'function' &&
        i18n.language !== storedLang
      ) {
        try {
          i18n.changeLanguage(storedLang);
        } catch (err) {
          // Don't crash the UI - fallback
        }
      }
      // Parallel loads only if backendUrl, state, and district are present
      if (url && state && district) {
        loadTipOfDay(url, name || 'Farmer', state, district, language);
        loadNews(url, state, district, language);
        loadAlerts(url, name || 'Farmer', state, district, language);
        loadSummary(url, name || 'Farmer', state, district, language);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setFarmerName(t('farmer'));
      setUserState('Unknown');
      setUserDistrict('Unknown');
      setUserLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load Tip of the Day
  const loadTipOfDay = async (url, name, state, district, language) => {
    try {
      setLoadingTip(true);
      console.log('📥 Loading tip of the day...');

      const response = await axios.post(
        `${url}/api/tip-of-day`,
        {
          farmer_name: name,
          district: district,
          state: state,
          language: language,
        },
        { timeout: 15000 }
      );

      if (response.data?.tip) {
        setTip(response.data.tip);
        console.log('✅ Tip loaded');
        
        if (isVoiceEnabled) {
          await speak(`Today's tip: ${response.data.tip.tip_local}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading tip:', error);
    } finally {
      setLoadingTip(false);
    }
  };

  // ✅ Load News
  const loadNews = async (url, state, district, language) => {
    try {
      setLoadingNews(true);
      console.log('📥 Loading news...');

      const response = await axios.post(
        `${url}/api/news`,
        {
          district: district,
          state: state,
          language: language,
        },
        { timeout: 15000 }
      );

      if (response.data?.news) {
        setNews(response.data.news);
        console.log('✅ News loaded');
      }
    } catch (error) {
      console.error('❌ Error loading news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  // ✅ Load Alerts
  const loadAlerts = async (url, name, state, district, language) => {
    try {
      setLoadingAlerts(true);
      console.log('📥 Loading alerts...');

      const response = await axios.post(
        `${url}/api/alerts`,
        {
          farmer_name: name,
          district: district,
          state: state,
          language: language,
        },
        { timeout: 15000 }
      );

      if (response.data?.alerts) {
        if (response.data.alerts.no_critical_alerts) {
          setAlerts([]);
        } else {
          setAlerts(response.data.alerts.alerts || []);
          if (isVoiceEnabled && response.data.alerts.alerts.length > 0) {
            await speak(`Alert: ${response.data.alerts.alerts[0].disease_name_local}`);
          }
        }
        console.log('✅ Alerts loaded');
      }
    } catch (error) {
      console.error('❌ Error loading alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // ✅ Load Summary
  const loadSummary = async (url, name, state, district, language) => {
    try {
      setLoadingSummary(true);
      console.log('📥 Loading summary...');

      const response = await axios.post(
        `${url}/api/summary`,
        {
          farmer_name: name,
          district: district,
          state: state,
          language: language,
        },
        { timeout: 15000 }
      );

      if (response.data?.summary) {
        setSummary(response.data.summary);
        console.log('✅ Summary loaded');
      }
    } catch (error) {
      console.error('❌ Error loading summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  // ✅ Translate name
  const translateNameViaBackend = async (name, language, url) => {
    if (language === 'en' || !url || !name) {
      setTranslatedName(name);
      return;
    }

    setTranslatingName(true);
    try {
      const response = await axios.post(
        `${url}/api/translate-name`,
        { name, language },
        { timeout: 15000 }
      );

      if (response.data?.success && response.data?.data?.translated_name) {
        setTranslatedName(response.data.data.translated_name);
      } else {
        setTranslatedName(name);
      }
    } catch (error) {
      console.error('❌ Translation error:', error);
      setTranslatedName(name);
    } finally {
      setTranslatingName(false);
    }
  };

  // ✅ Share news
  const shareNews = async (newsItem) => {
    try {
      await Share.share({
        message: `📰 ${newsItem.share_headline_local}\\n\\n${newsItem.summary_local}\\n\\nSource: ${newsItem.source}`,
        title: 'Agricultural News',
        url: 'https://kisanpushti.app',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // ✅ Solve problem
  const solveProblem = async () => {
    if (!problemInput.trim()) {
      Alert.alert('Error', 'Please describe your problem');
      return;
    }

    try {
      setProblemSolving(true);
      console.log('🤔 Solving problem...');

      const response = await axios.post(
        '${backendUrl}/api/problem-solver',
        {
          farmer_problem: problemInput,
          district: userDistrict,
          state: userState,
          language: userLanguage,
        },
        { timeout: 30000 }
      );

      if (response.data?.problem_solve) {
        setProblemSolution(response.data.problem_solve);
        console.log('✅ Solution found');
        
        if (isVoiceEnabled) {
          await speak(
            `I found ${response.data.problem_solve.solutions.length} solutions for your problem.`
          );
        }
      }
    } catch (error) {
      console.error('❌ Error solving problem:', error);
      Alert.alert('Error', 'Failed to solve problem');
    } finally {
      setProblemSolving(false);
    }
  };

  const displayState = userState || 'Unknown';
  const displayDistrict = userDistrict || 'Unknown';
  const displayName = translatedName || farmerName || t('farmer');


  const handleVoiceToggle = (enabled) => {
    if (enabled) {
const greeting = `${t('welcome')}, ${translatedName || farmerName}! ${t('location')}: ${displayState}, ${displayDistrict}`;
      speak(greeting);
    }
  };

  const handleDetectDisease = () => {
    if (isVoiceEnabled) {
      speak(t('detect_disease'));
    }
    navigation.navigate('DiseaseDetection', {
      district: userDistrict,
      state: userState,
      language: userLanguage,
      farmerName: farmerName,
      backendUrl: backendUrl
    });
  };

  const handleMarketPrices = () => {
    if (isVoiceEnabled) {
      speak(t('market_prices'));
    }
    navigation.navigate('MarketPrices', {
      district: userDistrict,
      state: userState,
      language: userLanguage,
      farmerName: farmerName,
      backendUrl: backendUrl
    });
  };

  const handleGovernmentSchemes = () => {
    if (isVoiceEnabled) {
      speak(t('government_schemes'));
    }
    navigation.navigate('GovernmentSchemes', {
      district: userDistrict,
      state: userState,
      language: userLanguage,
      crop: 'All',
      backendUrl: backendUrl
    });
  };

  // ✅ UPDATED MENU - Changes Made
  const menuItems = [
    { label: t('home'), icon: '🏠', action: () => setMenuOpen(false) },
    { label: t('government_schemes'), icon: '🏛️', action: () => { setMenuOpen(false); handleGovernmentSchemes(); } },
    { label: 'Saved Reports', icon: '📁', action: () => { 
      setMenuOpen(false); 
      if (isVoiceEnabled) speak('Opening saved reports');
      navigation.navigate('SavedReports', {
        backendUrl: backendUrl,
        district: userDistrict,
        state: userState,
        language: userLanguage,
      });
    }},
    { label: t('Ask Anything'), icon: '💡', action: () => { setMenuOpen(false); setProblemSolverVisible(true); } },
    { label: t('help'), icon: '❓', action: () => { setMenuOpen(false); if (isVoiceEnabled) speak(t('help')); Alert.alert('Help', 'Contact KVK: 1800-180-1551 or visit www.agritech.gov.in'); } }
  ];

  // ✅ Render Tip Card
  const renderTipCard = () => {
    if (loadingTip) {
      return (
        <View style={styles.tipsCardContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (!tip) {
      return (
        <View style={styles.tipsCardContainer}>
          <Text style={styles.tipsTitle}>💡 {t('tips') || 'Tip'}</Text>
          <Text style={styles.noDataText}>No tip available</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.tipsCardContainer}
        onPress={() => {
          if (isVoiceEnabled) speak(tip.tip_local);
        }}
      >
        <View style={styles.tipsHeader}>
          <Text style={styles.tipsIcon}>{tip.icon || '💡'}</Text>
          <View style={styles.tipsHeaderText}>
            <Text style={styles.tipsTitle}>{tip.title_local}</Text>
            <Text style={styles.tipsCategory}>{tip.category}</Text>
          </View>
          <View
            style={[
              styles.urgencyBadge,
              {
                backgroundColor:
                  tip.urgency === 'HIGH'
                    ? '#FF5252'
                    : tip.urgency === 'MEDIUM'
                    ? '#FFA726'
                    : '#66BB6A',
              },
            ]}
          >
            <Text style={styles.urgencyText}>{tip.urgency}</Text>
          </View>
        </View>
        <Text style={styles.tipsText}>{tip.tip_local}</Text>
        <Text style={styles.tipsWhy}>{tip.why_local}</Text>
      </TouchableOpacity>
    );
  };

  // ✅ Render Alert Card
  const renderAlertCard = () => {
    if (loadingAlerts) {
      return (
        <View style={styles.alertCard}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (alerts.length === 0) {
      return (
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>✅</Text>
          <Text style={styles.alertTitle}>No Active Alerts</Text>
          <Text style={styles.alertText}>All systems normal. Keep monitoring.</Text>
        </View>
      );
    }

    const alert = alerts[0];
    return (
      <View style={styles.alertCard}>
        <Text style={styles.alertIcon}>⚠️</Text>
        <Text style={styles.alertTitle}>{alert.disease_name_local}</Text>
        <Text style={styles.alertText}>{alert.why_alert_today_local}</Text>
        <Text
          style={[
            styles.riskLevel,
            {
              color:
                alert.risk_level === 'CRITICAL'
                  ? '#D32F2F'
                  : alert.risk_level === 'HIGH'
                  ? '#FF6F00'
                  : '#F57C00',
            },
          ]}
        >
          Risk: {alert.risk_level}
        </Text>
      </View>
    );
  };

  // ✅ Render Problem Solver Modal
  const renderProblemSolverModal = () => {
    return (
      <Modal
        visible={problemSolverVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProblemSolverVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setProblemSolverVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>🤔 Problem Solver</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {!problemSolution ? (
              <>
                <Text style={styles.modalSubtitle}>Describe your farming problem</Text>
                <TextInput
                  style={styles.problemInput}
                  placeholder="E.g., My tomato plants are turning yellow..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  value={problemInput}
                  onChangeText={setProblemInput}
                />

                <TouchableOpacity
                  style={styles.solveButton}
                  onPress={solveProblem}
                  disabled={problemSolving}
                >
                  {problemSolving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.solveButtonText}>Get Solutions</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.problemUnderstanding}>
                  {problemSolution.problem_understood}
                </Text>

                <Text style={styles.solutionsTitle}>Top Solutions</Text>
                {problemSolution.solutions.map((sol, idx) => (
                  <View key={idx} style={styles.solutionCard}>
                    <Text style={styles.solutionRank}>Solution {sol.rank}</Text>
                    <Text style={styles.solutionName}>{sol.solution_name_local}</Text>
                    <Text style={styles.solutionWhy}>{sol.why_this_works_local}</Text>

                    <Text style={styles.stepsLabel}>Steps:</Text>
                    {sol.steps_local.map((step, stepIdx) => (
                      <Text key={stepIdx} style={styles.step}>
                        {stepIdx + 1}. {step}
                      </Text>
                    ))}

                    <View style={styles.solutionDetails}>
                      <Text style={styles.detail}>💰 {t('Cost')}: ₹{sol.cost_rupees}</Text>
                      <Text style={styles.detail}>⏱️ {t('Time')}: {sol.time_to_implement_days} {t('days')}</Text>
                      <Text style={styles.detail}>📈 {t('Expected')}: {sol.expected_results_local}</Text>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.newProblemButton}
                  onPress={() => {
                    setProblemSolution(null);
                    setProblemInput('');
                  }}
                >
                  <Text style={styles.newProblemText}>{t('Ask Another Question')}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.lg, color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {menuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuOpen(false)} />
      )}

      <View style={[styles.sidebar, menuOpen && styles.sidebarOpen]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{t('menu')}</Text>
          <TouchableOpacity onPress={() => setMenuOpen(false)}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(!menuOpen)}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🌾 {t('app_name')}</Text>
          <View style={styles.headerButtonsContainer}>
            {/* News Button */}
            <TouchableOpacity style={styles.headerButton} onPress={() => {
              if (isVoiceEnabled) speak('Opening news');
              navigation.navigate('NewsScreen', {
                backendUrl: backendUrl,
                district: userDistrict,
                state: userState,
                language: userLanguage,
                news: news,
              });
            }}>
              <Text style={styles.headerButtonText}>📰</Text>
            </TouchableOpacity>

            {/* Summary Button */}
            <TouchableOpacity style={styles.headerButton} onPress={() => {
              if (isVoiceEnabled) speak('Opening summary');
              navigation.navigate('SummaryScreen', {
                backendUrl: backendUrl,
                district: userDistrict,
                state: userState,
                language: userLanguage,
                summary: summary,
                loading: loadingSummary,
              });
            }}>
              <Text style={styles.headerButtonText}>📊</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.voiceFab}>
          <TouchableOpacity onPress={() => handleVoiceToggle(!isVoiceEnabled)}>
            <Text style={styles.voiceIcon}>{isVoiceEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topSection}>
            <View style={styles.welcomeCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.welcomeTitle}>
                  {t('welcome')}, <Text style={styles.farmerNameHighlight}>{translatedName || farmerName}</Text>! 👋
                </Text>
                {translatingName && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
              {displayState && displayDistrict && (
                <Text style={styles.locationText}>
                  📍 {displayState}, {displayDistrict}
                </Text>
              )}
            </View>
          </View>

          {/* Tip of the Day */}
          {renderTipCard()}

          {/* Alert Card */}
          {renderAlertCard()}

          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
            <TouchableOpacity style={styles.actionButtonFull} onPress={handleDetectDisease}>
              <Text style={styles.actionIcon}>📷</Text>
              <Text style={styles.actionButtonText}>{t('detect_disease')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonFull} onPress={handleMarketPrices}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionButtonText}>{t('market_prices')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButtonFull, { backgroundColor: '#4CAF50' }]} onPress={handleGovernmentSchemes}>
              <Text style={styles.actionIcon}>🏛️</Text>
              <Text style={styles.actionButtonText}>{t('government_schemes')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {renderProblemSolverModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, flexDirection: 'row' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10 },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 250, backgroundColor: colors.surface, zIndex: 15, transform: [{ translateX: -300 }], paddingTop: spacing.lg },
  sidebarOpen: { transform: [{ translateX: 0 }] },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  sidebarTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  closeIcon: { fontSize: 24, color: colors.text },
  menuList: { marginTop: spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { fontSize: 20, marginRight: spacing.md },
  menuLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  mainContent: { flex: 1, width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuButton: { padding: spacing.md },
  menuButtonText: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'center' },
  headerButtonsContainer: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerButtonText: { fontSize: 20 },
  voiceFab: { position: 'absolute', right: 20, bottom: 24, zIndex: 1000, elevation: 20, backgroundColor: colors.primary, borderRadius: 50, padding: spacing.md },
  voiceIcon: { fontSize: 24 },
  scrollContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  topSection: { marginBottom: spacing.lg },
  welcomeCard: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.primary },
  welcomeTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  farmerNameHighlight: { color: colors.primary, fontWeight: '700', fontSize: 19 },
  locationText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, fontWeight: '500' },

  // Tips Card
  tipsCardContainer: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#2E7D32', marginBottom: spacing.lg },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  tipsIcon: { fontSize: 28, marginRight: spacing.md },
  tipsHeaderText: { flex: 1 },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  tipsCategory: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 4 },
  urgencyText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  tipsText: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: spacing.sm },
  tipsWhy: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },

  // Alert Card
  alertCard: { backgroundColor: '#FFF3CD', borderRadius: 8, padding: spacing.md, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#FFC107' },
  alertIcon: { fontSize: 28, marginBottom: spacing.sm },
  alertTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  alertText: { fontSize: 13, color: '#666', marginTop: spacing.xs, marginBottom: spacing.sm },
  riskLevel: { fontSize: 12, fontWeight: 'bold' },

  // Actions
  actionsContainer: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  actionButtonFull: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  actionIcon: { fontSize: 24, marginRight: spacing.md },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: colors.surface, flex: 1 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeButton: { fontSize: 20, color: colors.text, fontWeight: 'bold' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  modalContent: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  modalSubtitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  problemInput: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.border, color: colors.text, minHeight: 120, textAlignVertical: 'top', marginBottom: spacing.lg },
  solveButton: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 8, alignItems: 'center', marginBottom: spacing.xl },
  solveButtonText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  problemUnderstanding: { fontSize: 13, color: colors.text, marginBottom: spacing.lg, backgroundColor: '#E3F2FD', padding: spacing.md, borderRadius: 8 },
  solutionsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  solutionCard: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  solutionRank: { fontSize: 10, color: colors.primary, fontWeight: 'bold', marginBottom: spacing.xs },
  solutionName: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  solutionWhy: { fontSize: 12, color: colors.text, marginBottom: spacing.md },
  stepsLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  step: { fontSize: 11, color: colors.text, marginLeft: spacing.md, marginBottom: spacing.xs },
  solutionDetails: { backgroundColor: '#E8F5E9', borderRadius: 6, padding: spacing.md, marginTop: spacing.md },
  detail: { fontSize: 11, color: colors.text, marginBottom: spacing.xs },
  newProblemButton: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 8, alignItems: 'center', marginBottom: spacing.xl },
  newProblemText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  noDataText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
});

export default HomeScreen;