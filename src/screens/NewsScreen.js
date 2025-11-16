import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

export const NewsScreen = ({ navigation, route }) => {
  const { news = {}, backendUrl, district, state, language } = route.params;
  const [activeTab, setActiveTab] = useState('daily_news');

  const currentNews = news[activeTab] || [];

  const shareNews = async (newsItem) => {
    try {
      await Share.share({
        message: `📰 ${newsItem.share_headline_local}\n\n${newsItem.summary_local}\n\nSource: ${newsItem.source}`,
        title: 'Agricultural News',
        url: 'https://kisanpushti.app',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderNewsCard = ({ item }) => (
    <View style={styles.newsCard}>
      <Text style={styles.newsTitle}>{item.title_local}</Text>
      <Text style={styles.newsSummary}>{item.summary_local}</Text>
      <View style={styles.newsFooter}>
        <View>
          <Text style={styles.newsSource}>{item.source}</Text>
          <Text style={styles.newsDate}>{item.published_date}</Text>
        </View>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => shareNews(item)}
        >
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📰 Agricultural News</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabs}>
        {['daily_news', 'national_news', 'state_news'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'daily_news' ? 'Daily' : tab === 'national_news' ? 'National' : 'State'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentNews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No news available</Text>
        </View>
      ) : (
        <FlatList
          data={currentNews}
          renderItem={renderNewsCard}
          keyExtractor={(item, idx) => `${activeTab}-${idx}`}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 14, color: colors.primary, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  newsCard: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  newsTitle: { fontSize: 13, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  newsSummary: { fontSize: 12, color: colors.text, lineHeight: 18, marginBottom: spacing.sm },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsSource: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  newsDate: { fontSize: 9, color: colors.textSecondary, marginTop: spacing.xs },
  shareButton: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: 6 },
  shareIcon: { fontSize: 14 },
});

export default NewsScreen;