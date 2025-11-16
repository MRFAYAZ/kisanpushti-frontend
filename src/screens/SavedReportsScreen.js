import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme/colors';

export const SavedReportsScreen = ({ navigation, route }) => {
  const { backendUrl, district, state, language } = route.params;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      setLoading(true);
      const savedReportsJson = await AsyncStorage.getItem('savedReports');
      if (savedReportsJson) {
        const parsedReports = JSON.parse(savedReportsJson);
        setReports(parsedReports.reverse()); // Show newest first
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId) => {
    Alert.alert('Delete Report', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const savedReportsJson = await AsyncStorage.getItem('savedReports');
            let savedReports = savedReportsJson ? JSON.parse(savedReportsJson) : [];
            savedReports = savedReports.filter((r) => r.id !== reportId);
            await AsyncStorage.setItem('savedReports', JSON.stringify(savedReports));
            setReports(savedReports.reverse());
          } catch (error) {
            console.error('Error deleting report:', error);
          }
        },
      },
    ]);
  };

  const viewReport = (report) => {
    navigation.navigate('ReportDetail', { report, backendUrl });
  };

  const renderReportCard = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => viewReport(item)}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{item.disease_class}</Text>
        <Text style={styles.reportConfidence}>{Math.round(item.confidence * 100)}%</Text>
      </View>

      <View style={styles.reportInfo}>
        <View>
          <Text style={styles.reportLabel}>🌾 Crop</Text>
          <Text style={styles.reportValue}>{item.crop || 'Unknown'}</Text>
        </View>
        <View>
          <Text style={styles.reportLabel}>📍 Location</Text>
          <Text style={styles.reportValue}>{item.district}</Text>
        </View>
      </View>

      <Text style={styles.reportDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>

      <View style={styles.reportActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => viewReport(item)}
        >
          <Text style={styles.actionText}>👁️ View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF5252' }]}
          onPress={() => deleteReport(item.id)}
        >
          <Text style={styles.actionText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📁 Saved Reports</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No saved reports yet</Text>
          <Text style={styles.emptySubtext}>Detect a disease to save a report!</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportCard}
          keyExtractor={(item) => item.id}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  emptySubtext: { fontSize: 12, color: colors.textSecondary },
  listContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  reportCard: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1 },
  reportConfidence: { fontSize: 14, fontWeight: 'bold', color: colors.primary, backgroundColor: '#E3F2FD', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 4 },
  reportInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  reportLabel: { fontSize: 10, color: colors.textSecondary, marginBottom: spacing.xs },
  reportValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  reportDate: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.md },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: 6, alignItems: 'center', marginHorizontal: spacing.xs },
  actionText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
});

export default SavedReportsScreen;