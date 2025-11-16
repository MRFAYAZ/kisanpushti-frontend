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
  Linking
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useVoice } from '../services/voiceAssistant'
import { colors, spacing } from '../theme/colors';

export const GovernmentSchemesScreen = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const [schemesData, setSchemesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('central');
  const [state, setState] = useState('Unknown');
  const [district, setDistrict] = useState('Unknown');
  const [backendUrl, setBackendUrl] = useState('');

  // Load state, district, and backendUrl when mounted or route.params change
  useEffect(() => {
    const loadData = async () => {
      try {
        const s = route.params?.state || await AsyncStorage.getItem('userState') || 'Unknown';
        const d = route.params?.district || await AsyncStorage.getItem('userDistrict') || 'Unknown';
        const url = route.params?.backendUrl || await AsyncStorage.getItem('backendUrl') || 'https://kisanpushti-backend.onrender.com';
        setState(s);
        setDistrict(d);
        setBackendUrl(url);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [route.params]);

  // Fetch schemes whenever state, district, url, or lang changes
  useEffect(() => {
    if (state && backendUrl) {
      fetchSchemes();
    }
  }, [state, district, backendUrl, i18n.language]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setSchemesData(null);
      const response = await axios.post(
        `${backendUrl}/api/government-schemes`,
        { state: state, district: district, language: i18n.language },
        { timeout: 30000 }
      );
      if (response.data && response.data.success) {
        setSchemesData(response.data.data);
      } else {
        setSchemesData(null);
        Alert.alert(t('error'), 'Empty response from backend');
      }
    } catch (error) {
      setSchemesData(null);
      Alert.alert(t('error'), `Could not fetch government schemes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchemes();
    setRefreshing(false);
  };

  const renderSchemeCard = (scheme) => (
    <View style={styles.schemeCard}>
      <View style={styles.schemeHeader}>
        <Text style={styles.schemeName}>{scheme.name_local}</Text>
        <Text style={styles.schemeId}>{scheme.scheme_id}</Text>
      </View>
      <Text style={styles.description}>{scheme.description_local}</Text>
      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>💰 {t('benefits')}:</Text>
          <Text style={styles.detailValue}>{scheme.benefits}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>✅ {t('eligibility')}:</Text>
          <Text style={styles.detailValue}>{scheme.eligibility}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📋 {t('how_to_apply')}:</Text>
          <Text style={styles.detailValue}>{scheme.application_process}</Text>
        </View>
        {scheme.deadline && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>⏰ {t('deadline')}:</Text>
            <Text style={[styles.detailValue, { color: '#D32F2F', fontWeight: 'bold' }]}>
              {scheme.deadline}
            </Text>
          </View>
        )}
        {scheme.subsidy_percentage && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>💵 {t('subsidy')}:</Text>
            <Text style={[styles.detailValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
              {scheme.subsidy_percentage}
            </Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>📞 {t('helpline')}:</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${scheme.helpline}`)}>
            <Text style={[styles.detailValue, { color: colors.primary, textDecorationLine: 'underline' }]}>
              {scheme.helpline}
            </Text>
          </TouchableOpacity>
        </View>
        {scheme.website && (
          <View style={styles.detailItem}>
            <TouchableOpacity onPress={() => Linking.openURL(scheme.website)}>
              <Text style={[styles.detailValue, { color: colors.primary, textDecorationLine: 'underline' }]}>
                🌐 {t('visit_website')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {scheme.documents_required && scheme.documents_required.length > 0 && (
        <View style={styles.docsSection}>
          <Text style={styles.docsTitle}>📄 {t('documents_required')}:</Text>
          {scheme.documents_required.map((doc, idx) => (
            <Text key={idx} style={styles.docItem}>• {doc}</Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderDeadline = (deadline) => {
    const urgencyColor = deadline.urgency === 'HIGH' ? '#D32F2F' : deadline.urgency === 'MEDIUM' ? '#FF9800' : '#4CAF50';
    return (
      <View style={[styles.deadlineCard, { borderLeftColor: urgencyColor }]}>
        <View style={styles.deadlineHeader}>
          <Text style={styles.deadlineSchemeName}>{deadline.scheme_name}</Text>
          <Text style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
            {deadline.urgency}
          </Text>
        </View>
        <Text style={styles.deadlineDate}>📅 {deadline.deadline_date}</Text>
        <Text style={[styles.daysRemaining, { color: urgencyColor }]}>
          ⏱️ {deadline.days_remaining} days remaining
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏛️ {t('government_schemes')}</Text>
        <Text style={styles.subtitle}>📍 {district}, {state}</Text>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'central' && styles.activeTab]} onPress={() => setActiveTab('central')}>
          <Text style={[styles.tabText, activeTab === 'central' && styles.activeTabText]}>
            Central
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'state' && styles.activeTab]} onPress={() => setActiveTab('state')}>
          <Text style={[styles.tabText, activeTab === 'state' && styles.activeTabText]}>
            State
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'district' && styles.activeTab]} onPress={() => setActiveTab('district')}>
          <Text style={[styles.tabText, activeTab === 'district' && styles.activeTabText]}>
            District
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'deadlines' && styles.activeTab]} onPress={() => setActiveTab('deadlines')}>
          <Text style={[styles.tabText, activeTab === 'deadlines' && styles.activeTabText]}>
            Deadlines
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('loading_schemes')}</Text>
          </View>
        ) : (
          <>
            {activeTab === 'central' && schemesData?.central_schemes && (
              <View>
                <Text style={styles.sectionTitle}>🇮🇳 Central Government Schemes</Text>
                <FlatList data={schemesData.central_schemes} keyExtractor={(item) => item.scheme_id} scrollEnabled={false} renderItem={({ item }) => renderSchemeCard(item)} />
              </View>
            )}
            {activeTab === 'state' && schemesData?.state_schemes && (
              <View>
                <Text style={styles.sectionTitle}>🏛️ {state} State Schemes</Text>
                <FlatList data={schemesData.state_schemes} keyExtractor={(item) => item.scheme_id} scrollEnabled={false} renderItem={({ item }) => renderSchemeCard(item)} />
              </View>
            )}
            {activeTab === 'district' && schemesData?.district_specific_schemes && (
              <View>
                <Text style={styles.sectionTitle}>📍 {district} District Schemes</Text>
                <FlatList data={schemesData.district_specific_schemes} keyExtractor={(item) => item.scheme_id} scrollEnabled={false} renderItem={({ item }) => renderSchemeCard(item)} />
              </View>
            )}
            {activeTab === 'deadlines' && schemesData?.important_deadlines && (
              <View>
                <Text style={styles.sectionTitle}>⏰ Important Deadlines</Text>
                <FlatList data={schemesData.important_deadlines} keyExtractor={(item, idx) => idx.toString()} scrollEnabled={false} renderItem={({ item }) => renderDeadline(item)} />
              </View>
            )}
            {schemesData?.quick_tips && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
                {schemesData.quick_tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
            {schemesData?.precautions && (
              <View style={styles.cautionSection}>
                <Text style={styles.cautionTitle}>⚠️ Important Precautions</Text>
                {schemesData.precautions.map((caution, idx) => (
                  <View key={idx} style={styles.cautionItem}>
                    <Text style={styles.cautionBullet}>⚠️</Text>
                    <Text style={styles.cautionText}>{caution}</Text>
                  </View>
                ))}
              </View>
            )}
            {schemesData?.common_documents_needed && (
              <View style={styles.documentsSection}>
                <Text style={styles.docsHeaderTitle}>📋 Commonly Required Documents</Text>
                {schemesData.common_documents_needed.map((doc, idx) => (
                  <Text key={idx} style={styles.commonDocItem}>✓ {doc}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginVertical: spacing.sm },
  subtitle: { fontSize: 12, color: colors.textSecondary },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  activeTabText: { color: colors.primary },
  scrollContent: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xl },
  loadingText: { fontSize: 14, color: colors.text, marginTop: spacing.md, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md, marginTop: spacing.lg },
  schemeCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  schemeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  schemeName: { fontSize: 16, fontWeight: 'bold', color: colors.primary, flex: 1 },
  schemeId: { fontSize: 11, backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, color: colors.textSecondary },
  description: { fontSize: 13, color: colors.text, marginBottom: spacing.md, lineHeight: 18 },
  detailsSection: { marginBottom: spacing.md },
  detailItem: { marginBottom: spacing.md },
  detailLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  detailValue: { fontSize: 13, color: colors.text, lineHeight: 18 },
  docsSection: { backgroundColor: colors.background, borderRadius: 8, padding: spacing.md, marginTop: spacing.md },
  docsTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  docItem: { fontSize: 12, color: colors.text, marginBottom: 4 },
  deadlineCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  deadlineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  deadlineSchemeName: { fontSize: 14, fontWeight: 'bold', color: colors.text, flex: 1 },
  urgencyBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, color: 'white', fontWeight: '600', fontSize: 10 },
  deadlineDate: { fontSize: 13, color: colors.text, marginBottom: spacing.sm },
  daysRemaining: { fontSize: 12, fontWeight: 'bold' },
  tipsSection: { backgroundColor: '#FFF9C4', borderRadius: 12, padding: spacing.lg, marginVertical: spacing.lg },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: '#F57F17', marginBottom: spacing.md },
  tipItem: { flexDirection: 'row', marginBottom: spacing.md },
  tipBullet: { fontSize: 16, color: '#F57F17', marginRight: spacing.md, fontWeight: 'bold' },
  tipText: { fontSize: 13, color: '#F57F17', flex: 1, lineHeight: 18 },
  cautionSection: { backgroundColor: '#FFEBEE', borderRadius: 12, padding: spacing.lg, marginVertical: spacing.lg },
  cautionTitle: { fontSize: 14, fontWeight: 'bold', color: '#C62828', marginBottom: spacing.md },
  cautionItem: { flexDirection: 'row', marginBottom: spacing.md },
  cautionBullet: { fontSize: 16, marginRight: spacing.md, fontWeight: 'bold' },
  cautionText: { fontSize: 13, color: '#D32F2F', flex: 1, lineHeight: 18 },
  documentsSection: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginVertical: spacing.lg, borderWidth: 1, borderColor: colors.border },
  docsHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  commonDocItem: { fontSize: 13, color: colors.text, marginBottom: 8, fontWeight: '500' }
});

export default GovernmentSchemesScreen;
