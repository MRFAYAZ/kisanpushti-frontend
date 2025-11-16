import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme/colors';

export const ReportDetailScreen = ({ navigation, route }) => {
  const { report } = route.params;

  // ✅ TOP LEVEL extraction
  const disease = report?.disease_class || 'Unknown Disease';
  const confidence = report?.confidence || 0;
  const farmerName = report?.farmer_name || 'Farmer';
  const language = report?.language_generated || 'en';
  const timestamp = report?.generated_timestamp || new Date().toISOString();

  // ✅ HANDLE BOTH structures:
  // Case 1: report.report (normal disease detection)
  // Case 2: report.problem_solve (problem solver)
  
  let reportData = null;
  let remedies = [];
  let schemes = [];

  if (report?.report) {
    // ✅ CASE 1: Normal report structure
    reportData = report.report;
    remedies = reportData.remedy_recommendations || [];
    schemes = reportData.government_schemes || [];
  } else if (report?.problem_solve) {
    // ✅ CASE 2: Problem solver structure
    reportData = report.problem_solve;
    remedies = reportData.solutions || [];
    schemes = reportData.government_schemes_applicable || [];
  }

  // ✅ Extract other fields
  const summary = reportData?.summary_text_local || reportData?.problem_understood || 'No summary available';
  const severity = reportData?.severity_assessment || {};
  const diagnosis = reportData?.disease_diagnosis || {};
  const economic = reportData?.economic_impact_analysis || {};

  // ✅ Save report to phone storage
  const saveReport = async () => {
    try {
      const savedReports = await AsyncStorage.getItem('savedReports');
      let reports = savedReports ? JSON.parse(savedReports) : [];

      const newReport = {
        id: `report_${Date.now()}`,
        disease_class: disease,
        confidence: confidence,
        farmer_name: farmerName,
        language: language,
        timestamp: timestamp,
        report: reportData,
        crop: diagnosis.crop_affected || report?.crop || 'Unknown',
        district: report?.district || 'Unknown',
        state: report?.state || 'Unknown',
      };

      reports.push(newReport);
      await AsyncStorage.setItem('savedReports', JSON.stringify(reports));
      Alert.alert('✅ Success', 'Report saved successfully!');
    } catch (error) {
      console.error('❌ Error saving report:', error);
      Alert.alert('Error', 'Failed to save report');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📋 Disease Report</Text>
        <TouchableOpacity onPress={saveReport}>
          <Text style={styles.saveButton}>💾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ✅ DIAGNOSIS SECTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Diagnosis</Text>
          <Text style={styles.diagnosis}>{disease}</Text>
          
          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${Math.min(confidence * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              Confidence: {Math.round(confidence * 100)}%
            </Text>
          </View>

          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceBadgeText}>
              {confidence > 0.8 ? '🟢 High Confidence' : confidence > 0.5 ? '🟡 Medium Confidence' : '🔴 Low Confidence'}
            </Text>
          </View>

          {/* Scientific name */}
          {diagnosis?.disease_name_scientific && (
            <Text style={styles.scientificName}>
              Scientific: {diagnosis.disease_name_scientific}
            </Text>
          )}
        </View>

        {/* ✅ DETAILS SECTION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Report Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👨 Farmer:</Text>
            <Text style={styles.detailValue}>{farmerName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🌾 Crop:</Text>
            <Text style={styles.detailValue}>{diagnosis.crop_affected || report?.crop || 'Not specified'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location:</Text>
            <Text style={styles.detailValue}>{report?.district || 'N/A'}, {report?.state || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅 Date:</Text>
            <Text style={styles.detailValue}>{new Date(timestamp).toLocaleDateString()}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🌐 Language:</Text>
            <Text style={styles.detailValue}>{language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language}</Text>
          </View>
        </View>

        {/* ✅ SEVERITY SECTION */}
        {severity?.current_stage && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚠️ Severity Assessment</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stage:</Text>
              <Text style={styles.detailValue}>{severity.current_stage}</Text>
            </View>
            
            {severity.percentage_crop_affected && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Affected:</Text>
                <Text style={styles.detailValue}>{severity.percentage_crop_affected}%</Text>
              </View>
            )}
            
            {severity.days_until_major_loss && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Action Required In:</Text>
                <Text style={styles.detailValue}>{severity.days_until_major_loss} days</Text>
              </View>
            )}
            
            {severity.visual_symptoms && severity.visual_symptoms.length > 0 && (
              <>
                <Text style={styles.symptomLabel}>Symptoms:</Text>
                {severity.visual_symptoms.map((symptom, idx) => (
                  <Text key={idx} style={styles.symptomText}>• {symptom}</Text>
                ))}
              </>
            )}
          </View>
        )}

        {/* ✅ ECONOMIC SECTION */}
        {economic?.potential_loss_if_untreated && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Economic Impact</Text>
            
            <View style={styles.economicBox}>
              <Text style={styles.economicLabel}>Potential Loss (Untreated):</Text>
              <Text style={styles.economicValue}>
                ₹{economic.potential_loss_if_untreated.amount_rupees}
              </Text>
              <Text style={styles.economicSubText}>
                ({economic.potential_loss_if_untreated.loss_percentage}% loss in {economic.potential_loss_if_untreated.timeline_days} days)
              </Text>
            </View>

            {economic.treatment_cost_vs_savings && (
              <>
                <View style={styles.economicBox}>
                  <Text style={styles.economicLabel}>Treatment Costs:</Text>
                  <Text style={styles.economicSmall}>
                    💵 Cheapest: ₹{economic.treatment_cost_vs_savings.cheapest_treatment_cost}
                  </Text>
                  <Text style={styles.economicSmall}>
                    💵 Moderate: ₹{economic.treatment_cost_vs_savings.moderate_treatment_cost}
                  </Text>
                  <Text style={styles.economicSmall}>
                    💵 Premium: ₹{economic.treatment_cost_vs_savings.premium_treatment_cost}
                  </Text>
                </View>

                <View style={styles.savingsBox}>
                  <Text style={styles.savingsLabel}>💚 Potential Savings:</Text>
                  <Text style={styles.savingsValue}>
                    ₹{economic.treatment_cost_vs_savings.savings_if_treated_early}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* ✅ REMEDIES SECTION */}
        {remedies && remedies.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💊 Recommended Remedies ({remedies.length})</Text>
            
            {remedies.map((remedy, idx) => (
              <View key={idx} style={styles.remedyCard}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>
                    Remedy {remedy.rank || idx + 1}
                  </Text>
                </View>
                
                <Text style={styles.remedyTitle}>
                  {remedy.remedy_name_local || remedy.solution_name_local || remedy.remedy_name || `Solution ${idx + 1}`}
                </Text>
                
                {remedy.remedy_type && (
                  <Text style={styles.remedyType}>
                    📦 Type: {remedy.remedy_type}
                  </Text>
                )}

                {remedy.why_this_works_local && (
                  <Text style={styles.remedyDescription}>
                    {remedy.why_this_works_local}
                  </Text>
                )}

                {/* STEPS */}
                {remedy.step_by_step_application && remedy.step_by_step_application.length > 0 && (
                  <>
                    <Text style={styles.stepsLabel}>📋 Steps:</Text>
                    {remedy.step_by_step_application.map((step, stepIdx) => (
                      <Text key={stepIdx} style={styles.step}>
                        {stepIdx + 1}. {step}
                      </Text>
                    ))}
                  </>
                )}

                {remedy.steps_local && remedy.steps_local.length > 0 && (
                  <>
                    <Text style={styles.stepsLabel}>📋 Steps:</Text>
                    {remedy.steps_local.map((step, stepIdx) => (
                      <Text key={stepIdx} style={styles.step}>
                        {stepIdx + 1}. {step}
                      </Text>
                    ))}
                  </>
                )}
                
                <View style={styles.remedyDetails}>
                  {remedy.total_cost_rupees && (
                    <Text style={styles.remedyDetailText}>
                      💰 Cost: ₹{remedy.total_cost_rupees}
                    </Text>
                  )}
                  
                  {remedy.time_to_implement_days && (
                    <Text style={styles.remedyDetailText}>
                      ⏱️ Time: {remedy.time_to_implement_days} days
                    </Text>
                  )}
                  
                  {remedy.roi_percent && (
                    <Text style={styles.remedyDetailText}>
                      📈 ROI: {remedy.roi_percent}%
                    </Text>
                  )}
                  
                  {remedy.expected_results_local && (
                    <Text style={styles.remedyDetailText}>
                      ✅ Expected: {remedy.expected_results_local}
                    </Text>
                  )}

                  {remedy.cost_rupees && (
                    <Text style={styles.remedyDetailText}>
                      💰 Cost: ₹{remedy.cost_rupees}
                    </Text>
                  )}
                </View>

                {/* YouTube & Maps Links */}
                {(remedy.youtube_tutorial || remedy.maps_search_link) && (
                  <View style={styles.linksContainer}>
                    {remedy.youtube_tutorial && (
                      <TouchableOpacity style={styles.linkButton}>
                        <Text style={styles.linkText}>📹 Watch Tutorial</Text>
                      </TouchableOpacity>
                    )}
                    {remedy.maps_search_link && (
                      <TouchableOpacity style={styles.linkButton}>
                        <Text style={styles.linkText}>🗺️ Find Shop</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ✅ GOVERNMENT SCHEMES SECTION */}
        {schemes && schemes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏛️ Government Schemes ({schemes.length})</Text>
            
            {schemes.map((scheme, idx) => (
              <View key={idx} style={styles.schemeCard}>
                <Text style={styles.schemeTitle}>
                  {scheme.scheme_name || scheme.scheme_id || `Scheme ${idx + 1}`}
                </Text>
                
                {scheme.in_local_language && (
                  <Text style={styles.schemeLocal}>
                    {scheme.in_local_language}
                  </Text>
                )}

                {scheme.description && (
                  <Text style={styles.schemeDescription}>
                    {scheme.description}
                  </Text>
                )}
                
                <View style={styles.schemeDetails}>
                  {scheme.eligible && (
                    <Text style={styles.schemeDetailText}>
                      ✅ Eligible: {scheme.eligible === 'YES' ? 'Yes' : 'No'}
                    </Text>
                  )}
                  
                  {scheme.benefit_amount && (
                    <Text style={styles.schemeDetailText}>
                      💵 Benefit: {scheme.benefit_amount}
                    </Text>
                  )}
                  
                  {scheme.premium_amount && (
                    <Text style={styles.schemeDetailText}>
                      💳 Premium: {scheme.premium_amount}
                    </Text>
                  )}
                  
                  {scheme.helpline && (
                    <Text style={styles.schemeDetailText}>
                      📞 Helpline: {scheme.helpline}
                    </Text>
                  )}
                  
                  {scheme.website && (
                    <Text style={styles.schemeDetailText}>
                      🌐 Website: {scheme.website}
                    </Text>
                  )}

                  {scheme.how_to_apply && (
                    <Text style={styles.schemeDetailText}>
                      📝 Apply: {scheme.how_to_apply}
                    </Text>
                  )}

                  {scheme.application_deadline && (
                    <Text style={styles.schemeDetailText}>
                      📅 Deadline: {scheme.application_deadline}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ✅ EMPTY STATE */}
        {(!remedies || remedies.length === 0) && (!schemes || schemes.length === 0) && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              ⚠️ No detailed remedies or schemes available yet.
            </Text>
            <Text style={styles.emptyText}>
              Please check with the backend - report structure may be incomplete.
            </Text>
            <Text style={styles.debugText}>
              Remedies: {remedies?.length || 0}, Schemes: {schemes?.length || 0}
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { fontSize: 14, color: colors.primary, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  saveButton: { fontSize: 18 },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  diagnosis: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  scientificName: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.md, fontStyle: 'italic' },
  confidenceContainer: { marginBottom: spacing.lg },
  confidenceBar: { height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  confidenceBarFill: { height: '100%', backgroundColor: colors.primary },
  confidenceText: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  confidenceBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 6 },
  confidenceBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
  symptomLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  symptomText: { fontSize: 12, color: colors.text, marginLeft: spacing.md, marginBottom: spacing.xs },
  economicBox: { backgroundColor: '#E3F2FD', borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  economicLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  economicValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  economicSubText: { fontSize: 11, color: colors.textSecondary },
  economicSmall: { fontSize: 11, color: colors.text, marginBottom: spacing.xs },
  savingsBox: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  savingsLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  savingsValue: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  remedyCard: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: spacing.lg, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  rankBadge: { backgroundColor: '#4CAF50', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 4, alignSelf: 'flex-start', marginBottom: spacing.sm },
  rankBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#fff' },
  remedyTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  remedyType: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm },
  remedyDescription: { fontSize: 12, color: colors.text, marginBottom: spacing.md, lineHeight: 18 },
  stepsLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  step: { fontSize: 12, color: colors.text, marginLeft: spacing.md, marginBottom: spacing.xs, lineHeight: 18 },
  remedyDetails: { backgroundColor: '#fff', borderRadius: 6, padding: spacing.md, marginTop: spacing.md },
  remedyDetailText: { fontSize: 12, color: colors.text, marginBottom: spacing.xs, fontWeight: '500' },
  linksContainer: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  linkButton: { flex: 1, backgroundColor: colors.primary, paddingVertical: spacing.sm, borderRadius: 6, alignItems: 'center' },
  linkText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  schemeCard: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: spacing.lg, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: '#2E7D32' },
  schemeTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: spacing.sm },
  schemeLocal: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.sm, fontStyle: 'italic' },
  schemeDescription: { fontSize: 12, color: colors.text, marginBottom: spacing.md, lineHeight: 18 },
  schemeDetails: { backgroundColor: '#fff', borderRadius: 6, padding: spacing.md },
  schemeDetailText: { fontSize: 12, color: colors.text, marginBottom: spacing.xs, fontWeight: '500' },
  emptyCard: { backgroundColor: '#FFF9C4', borderRadius: 8, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: '#FBC02D' },
  emptyText: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: spacing.sm },
  debugText: { fontSize: 10, color: '#999', marginTop: spacing.md },
});

export default ReportDetailScreen;