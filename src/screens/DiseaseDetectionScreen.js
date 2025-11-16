import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme/colors';
import { VoiceService } from '../services/voiceAssistant';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import { getImageBase64 } from '../services/ModelService'

const { width } = Dimensions.get('window');

export const DiseaseDetectionScreen = ({ navigation, route }) => {
  const { i18n, t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const scrollViewRef = useRef(null);

  const backendUrl = route?.params?.backendUrl || 'https://kisanpushti-backend.onrender.com';
  const farmerName = route?.params?.farmerName || 'Farmer';
  const userLanguage = route?.params?.language || 'en';
  const district = route?.params?.district || 'Unknown';
  const state = route?.params?.state || 'Unknown';

  useEffect(() => {
    loadSavedReports();
    checkBackendHealth();
    return () => {
      setIsMounted(false);
    };
  }, []);

  const safeSetSelectedImage = (uri) => {
    if (isMounted) setSelectedImage(uri);
  };

  const safeSetReport = (data) => {
    if (isMounted) setReport(data);
  };

  const checkBackendHealth = async () => {
    try {
      console.log(`\n🏥 CHECKING BACKEND HEALTH`);
      const healthResponse = await axios.get(`${backendUrl}/health`, { timeout: 10000 });
      if (isMounted) setBackendHealthy(true);
    } catch (error) {
      console.error('❌ BACKEND UNREACHABLE');
      if (isMounted) setBackendHealthy(false);
    }
  };

  const loadSavedReports = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedReports');
      if (saved && isMounted) {
        setSavedReports(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  // ✅ NEW: Save report locally
  const saveReportLocally = async (reportData) => {
    try {
      const reportEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        disease: reportData.disease_class,
        confidence: reportData.confidence,
        language: userLanguage,
        farmerName: farmerName,
        location: `${district}, ${state}`,
        fullReport: reportData.report
      };

      const updatedReports = [reportEntry, ...savedReports];
      await AsyncStorage.setItem('savedReports', JSON.stringify(updatedReports));
      if (isMounted) setSavedReports(updatedReports);
      console.log('✅ Report saved locally');
      Alert.alert('Success', 'Report saved successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', 'Failed to save report');
    }
  };

  // ✅ ENHANCED: Voice service with report content
  const speakReportContent = async (reportData) => {
    if (!isVoiceEnabled) return;
    
    try {
      const r = reportData.report;
      
      // Speak disease diagnosis
      const diseaseName = r.disease_diagnosis?.disease_name_local || reportData.disease_class;
      const confidence = Math.round(reportData.confidence * 100);
      
      let reportText = `Disease detected: ${diseaseName}. Confidence: ${confidence} percent. `;
      
      // Add why disease appeared
      if (r.why_this_disease_appeared?.primary_reason_local) {
        reportText += `Why this disease appeared: ${r.why_this_disease_appeared.primary_reason_local}. `;
      }
      
      // Add severity
      if (r.severity_assessment?.current_stage) {
        reportText += `Severity: ${r.severity_assessment.current_stage}. `;
      }
      
      // Add remedy recommendations
      if (r.remedy_recommendations && r.remedy_recommendations.length > 0) {
        reportText += `Recommended remedies: `;
        r.remedy_recommendations.forEach((remedy, idx) => {
          reportText += `${idx + 1}. ${remedy.remedy_name_local} costing rupees ${remedy.total_cost_rupees}. `;
        });
      }
      
      // Add government schemes
      if (r.government_schemes && r.government_schemes.length > 0) {
        reportText += `Government schemes available: `;
        r.government_schemes.slice(0, 2).forEach((scheme) => {
          reportText += `${scheme.in_local_language}. `;
        });
      }
      
      // Speak the report
      await VoiceService.speak(reportText, userLanguage);
    } catch (error) {
      console.error('Voice error:', error);
    }
  };

  const imageToBase64 = async (uri) => {
    try {
      if (!uri || typeof uri !== 'string' || uri.length < 5) {
        throw new Error('Invalid image URI');
      }

      console.log('🔄 Starting base64 conversion...');

      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Content || base64Content.length < 50) {
        throw new Error('Invalid base64 content');
      }

      const sizeMB = (base64Content.length / (1024 * 1024)).toFixed(2);
      if (sizeMB > 50) {
        throw new Error(`File too large: ${sizeMB}MB`);
      }

      console.log(`✅ Base64 conversion successful: ${sizeMB} MB\n`);
      return base64Content;
    } catch (error) {
      console.error('❌ BASE64 ERROR:', error.message);
      Alert.alert('Image Processing Error', error.message || 'Failed to process image');
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      console.log('\n📷 OPENING IMAGE PICKER');
      
      if (!ImagePicker) {
        throw new Error('ImagePicker not initialized');
      }

      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: [ImagePicker.MediaType.image],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } catch (apiError) {
        console.warn('⚠️ New API format failed, trying old format...');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result || result.canceled) {
        console.log('ℹ️ Image picker cancelled');
        return;
      }

      let imageUri = null;

      if (result.assets && Array.isArray(result.assets) && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset && typeof asset === 'object' && asset.uri) {
          imageUri = asset.uri;
        }
      }

      if (!imageUri && result.uri) {
        imageUri = result.uri;
      }

      if (!imageUri) {
        Alert.alert('Error', 'No image URI found. Please try again.');
        return;
      }

      if (typeof imageUri !== 'string' || imageUri.length < 5) {
        throw new Error('Invalid URI');
      }

      console.log('✅ Image validation passed');
      safeSetSelectedImage(imageUri);
      safeSetReport(null);
      console.log('✅ Image state updated\n');
    } catch (error) {
      console.error('❌ IMAGE PICKER ERROR:', error.message);
      Alert.alert('Image Picker Error', error.message || 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('\n📹 OPENING CAMERA');
      
      if (!ImagePicker) {
        throw new Error('ImagePicker not initialized');
      }

      let result;
      try {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: [ImagePicker.MediaType.image],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } catch (apiError) {
        console.warn('⚠️ New API format failed, trying old format...');
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result || result.canceled) {
        console.log('ℹ️ Camera cancelled');
        return;
      }

      let imageUri = null;

      if (result.assets && Array.isArray(result.assets) && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset && typeof asset === 'object' && asset.uri) {
          imageUri = asset.uri;
        }
      }

      if (!imageUri && result.uri) {
        imageUri = result.uri;
      }

      if (!imageUri) {
        Alert.alert('Error', 'No photo URI found. Please try again.');
        return;
      }

      if (typeof imageUri !== 'string' || imageUri.length < 5) {
        throw new Error('Invalid URI');
      }

      console.log('✅ Photo validation passed');
      safeSetSelectedImage(imageUri);
      safeSetReport(null);
      console.log('✅ Photo state updated\n');
    } catch (error) {
      console.error('❌ CAMERA ERROR:', error.message);
      Alert.alert('Camera Error', error.message || 'Failed to take photo');
    }
  };

  const predictDisease = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select or take a photo first');
      return;
    }

    if (!backendHealthy) {
      Alert.alert('Backend Not Ready', 'Tap ✅ icon to check backend');
      return;
    }

    try {
      setPredicting(true);
      setLoading(true);
      safeSetReport(null);

      console.log('\n' + '='*70);
      console.log('🎬 DISEASE DETECTION - STEP 1: IMAGE VALIDATION');
      console.log('='*70);

      if (!selectedImage || typeof selectedImage !== 'string' || selectedImage.length < 5) {
        throw new Error('Invalid image URI in state');
      }

      console.log('✅ Image validation passed');

      console.log('\n' + '='*70);
      console.log('🎬 DISEASE DETECTION - STEP 2: IMAGE CONVERSION');
      console.log('='*70);

      let base64Image;
      try {
        base64Image = await getImageBase64(selectedImage);
      } catch (conversionError) {
        setPredicting(false);
        setLoading(false);
        return;
      }

      if (!base64Image || typeof base64Image !== 'string' || base64Image.length < 100) {
        throw new Error('Invalid base64 data');
      }

      const imageSizeMB = (base64Image.length / (1024 * 1024)).toFixed(2);
      console.log(`✅ Image converted: ${imageSizeMB} MB`);

      console.log('\n' + '='*70);
      console.log('🎬 DISEASE DETECTION - STEP 3: REQUEST PREPARATION');
      console.log('='*70);

      const requestPayload = {
        image: base64Image,
        language: userLanguage,
        district: district,
        state: state,
        farmer_name: farmerName,
      };

      console.log(`✅ Request ready for ${backendUrl}`);

      console.log('\n' + '='*70);
      console.log('🎬 DISEASE DETECTION - STEP 4: SENDING REQUEST');
      console.log('='*70);

      const startTime = Date.now();

      const response = await axios.post(
        `${backendUrl}/api/predict`,
        requestPayload,
        {
          timeout: 120000,
          maxBodyLength: 50 * 1024 * 1024,
          maxContentLength: 50 * 1024 * 1024,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      const duration = Date.now() - startTime;
      console.log(`✅ Response received in ${(duration / 1000).toFixed(2)}s`);

      console.log('\n' + '='*70);
      console.log('🎬 DISEASE DETECTION - STEP 5: RESPONSE PROCESSING');
      console.log('='*70);

      if (!response.data) {
        throw new Error('No response data');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Request failed');
      }

      if (!response.data.report) {
        throw new Error('No report in response');
      }

      console.log('\n' + '='*70);
      console.log('🎬 DISEASE DETECTION - STEP 6: REPORT DISPLAY');
      console.log('='*70);

      const reportData = {
        disease_class: response.data.disease_class,
        confidence: response.data.confidence,
        language_generated: response.data.language_generated,
        farmer_name: response.data.farmer_name || farmerName,
        generated_timestamp: response.data.generated_timestamp,
        report: response.data.report,
        selectedImage: selectedImage,
      };

      console.log('✅ Report received:', reportData.disease_class);

      safeSetReport(reportData);
      
      // ✅ Enhanced voice service
      speakReportContent(reportData);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);

      console.log('\n' + '='*70);
      console.log('✅✅✅ ALL STEPS COMPLETED SUCCESSFULLY! ✅✅✅');
      console.log('='*70 + '\n');

    } catch (error) {
      console.error('\n' + '='*70);
      console.error('❌ PREDICTION ERROR');
      console.error('='*70);
      console.error('Type:', error.constructor.name);
      console.error('Message:', error.message);

      Alert.alert('Detection Error', error.message || 'Failed to detect disease');
    } finally {
      setPredicting(false);
      setLoading(false);
    }
  };

  // ✅ NEW: Open YouTube in app/browser
  const openYouTubeLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Unable to open YouTube');
        console.error(err);
      });
    }
  };

  // ✅ NEW: Open Google Maps
  const openMapsLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Unable to open Maps');
        console.error(err);
      });
    }
  };

  // ✅ Generate PDF (without video embeds)
  const generateReportPDF = async () => {
    if (!report || !report.report) {
      Alert.alert('No Report', 'Generate a report first');
      return;
    }

    try {
      setDownloadingReport(true);

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN');
      const timeStr = now.toLocaleTimeString('en-IN');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; background: #f5f5f5; }
            .container { background: white; max-width: 900px; margin: 0 auto; padding: 20px; border-radius: 8px; }
            .header { border-bottom: 3px solid #2E7D32; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { font-size: 28px; color: #2E7D32; font-weight: bold; }
            .header p { font-size: 12px; color: #666; margin-top: 5px; }
            .metadata { background: #F1F8F6; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 11px; }
            .metadata-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; color: #fff; background: #2E7D32; padding: 10px 15px; border-radius: 4px; margin-bottom: 12px; }
            .section-content { padding: 0 10px; }
            .field { margin-bottom: 8px; font-size: 11px; }
            .field-label { font-weight: bold; color: #2E7D32; }
            .field-value { color: #333; }
            .remedy-box, .scheme-box { background: #F9F9F9; padding: 12px; margin: 10px 0; border-left: 4px solid #2E7D32; border-radius: 4px; font-size: 11px; }
            .scheme-box { background: #E8F5E9; border-left-color: #4CAF50; }
            .box-title { font-weight: bold; color: #2E7D32; margin-bottom: 6px; font-size: 12px; }
            .box-detail { margin: 3px 0; font-size: 10px; }
            .link { color: #1976D2; word-break: break-all; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 9px; color: #666; text-align: center; }
            .disclaimer { background: #FFF3E0; padding: 10px; border-radius: 4px; margin-top: 15px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- HEADER -->
            <div class="header">
              <h1>🌾 KisanPushti AI Disease Report</h1>
              <p>AI-Powered Crop Disease Detection & Management System</p>
            </div>

            <!-- METADATA -->
            <div class="metadata">
              <div class="metadata-row">
                <span><strong>Report ID:</strong> ${report.report?.report_metadata?.report_id || 'N/A'}</span>
                <span><strong>Generated:</strong> ${dateStr} ${timeStr}</span>
              </div>
              <div class="metadata-row">
                <span><strong>Farmer:</strong> ${report.farmer_name || farmerName}</span>
                <span><strong>Location:</strong> ${district}, ${state}</span>
              </div>
              <div class="metadata-row">
                <span><strong>Confidence:</strong> ${Math.round(report.confidence * 100)}%</span>
                <span><strong>Valid:</strong> ${report.report?.report_metadata?.validity_days || 90} days</span>
              </div>
            </div>

            <!-- DISEASE DIAGNOSIS -->
            <div class="section">
              <div class="section-title">🔬 Disease Diagnosis</div>
              <div class="section-content">
                <div class="field"><span class="field-label">Disease (Local):</span> <span class="field-value">${report.report?.disease_diagnosis?.disease_name_local || 'N/A'}</span></div>
                <div class="field"><span class="field-label">Disease (English):</span> <span class="field-value">${report.report?.disease_diagnosis?.disease_name_english || 'N/A'}</span></div>
                <div class="field"><span class="field-label">Scientific Name:</span> <span class="field-value">${report.report?.disease_diagnosis?.disease_name_scientific || 'N/A'}</span></div>
                <div class="field"><span class="field-label">Crop Affected:</span> <span class="field-value">${report.report?.disease_diagnosis?.crop_affected || 'N/A'}</span></div>
                <div class="field"><span class="field-label">Causal Agent:</span> <span class="field-value">${report.report?.disease_diagnosis?.causal_agent || 'N/A'}</span></div>
              </div>
            </div>

            <!-- WHY DISEASE APPEARED -->
            <div class="section">
              <div class="section-title">📍 Why This Disease Appeared</div>
              <div class="section-content">
                <div class="field"><span class="field-value">${report.report?.why_this_disease_appeared?.primary_reason_local || 'N/A'}</span></div>
                <table>
                  <tr><th>Factor</th><th>Condition</th></tr>
                  <tr><td>Temperature</td><td>${report.report?.why_this_disease_appeared?.weather_conditions?.temperature_range || 'N/A'}</td></tr>
                  <tr><td>Humidity</td><td>${report.report?.why_this_disease_appeared?.weather_conditions?.humidity_level || 'N/A'}</td></tr>
                  <tr><td>Rainfall</td><td>${report.report?.why_this_disease_appeared?.weather_conditions?.rainfall_pattern || 'N/A'}</td></tr>
                </table>
              </div>
            </div>

            <!-- SEVERITY ASSESSMENT -->
            <div class="section">
              <div class="section-title">⚠️ Severity Assessment</div>
              <div class="section-content">
                <table>
                  <tr><th>Factor</th><th>Value</th></tr>
                  <tr><td>Current Stage</td><td>${report.report?.severity_assessment?.current_stage || 'N/A'}</td></tr>
                  <tr><td>Crop Affected</td><td>${report.report?.severity_assessment?.percentage_crop_affected || '0'}%</td></tr>
                  <tr><td>Spread Rate</td><td>${report.report?.severity_assessment?.spread_rate || 'N/A'}</td></tr>
                  <tr><td>Days Until Major Loss</td><td>${report.report?.severity_assessment?.days_until_major_loss || '0'}</td></tr>
                  <tr><td>Urgent Action</td><td>${report.report?.severity_assessment?.urgent_action_needed || 'N/A'}</td></tr>
                </table>
              </div>
            </div>

            <!-- ECONOMIC IMPACT -->
            <div class="section">
              <div class="section-title">💰 Economic Impact Analysis</div>
              <div class="section-content">
                <table>
                  <tr><th>Factor</th><th>Value</th></tr>
                  <tr><td>Potential Loss (If Untreated)</td><td>${report.report?.economic_impact_analysis?.potential_loss_if_untreated?.amount_rupees || 'N/A'}</td></tr>
                  <tr><td>Loss Percentage</td><td>${report.report?.economic_impact_analysis?.potential_loss_if_untreated?.loss_percentage || '0'}%</td></tr>
                  <tr><td>Timeline</td><td>${report.report?.economic_impact_analysis?.potential_loss_if_untreated?.timeline_days || '0'} days</td></tr>
                  <tr><td>Cheapest Treatment Cost</td><td>₹${report.report?.economic_impact_analysis?.treatment_cost_vs_savings?.cheapest_treatment_cost || '0'}</td></tr>
                  <tr><td>Moderate Treatment Cost</td><td>₹${report.report?.economic_impact_analysis?.treatment_cost_vs_savings?.moderate_treatment_cost || '0'}</td></tr>
                  <tr><td>Savings (Early Treatment)</td><td>₹${report.report?.economic_impact_analysis?.treatment_cost_vs_savings?.savings_if_treated_early || '0'}</td></tr>
                </table>
              </div>
            </div>

            <!-- REMEDY RECOMMENDATIONS -->
            <div class="section">
              <div class="section-title">💊 Remedy Recommendations</div>
              <div class="section-content">
                ${report.report?.remedy_recommendations && report.report.remedy_recommendations.length > 0 ? report.report.remedy_recommendations.map((remedy, idx) => `
                  <div class="remedy-box">
                    <div class="box-title">Remedy ${remedy.rank}: ${remedy.remedy_name_local || 'N/A'}</div>
                    <div class="box-detail"><strong>Type:</strong> ${remedy.remedy_type || 'N/A'} | <strong>ICAR Approved:</strong> ${remedy.icar_approved ? 'Yes' : 'No'}</div>
                    <div class="box-detail"><strong>Total Cost:</strong> ₹${remedy.total_cost_rupees || '0'} | <strong>ROI:</strong> ${remedy.roi_percent || '0'}%</div>
                    ${remedy.step_by_step_application && remedy.step_by_step_application.length > 0 ? `
                      <div class="box-detail"><strong>Application Steps:</strong></div>
                      ${remedy.step_by_step_application.map((step, i) => `<div class="box-detail" style="margin-left: 10px;">• ${step}</div>`).join('')}
                    ` : ''}
                    ${remedy.youtube_tutorial ? `<div class="box-detail"><strong>Video Tutorial:</strong> <span class="link">${remedy.youtube_tutorial}</span></div>` : ''}
                    ${remedy.maps_search_link ? `<div class="box-detail"><strong>Nearby Shops:</strong> <span class="link">${remedy.maps_search_link}</span></div>` : ''}
                  </div>
                `).join('') : '<p>No remedies available</p>'}
              </div>
            </div>

            <!-- GOVERNMENT SCHEMES -->
            <div class="section">
              <div class="section-title">🏛️ Government Schemes & Insurance</div>
              <div class="section-content">
                ${report.report?.government_schemes && report.report.government_schemes.length > 0 ? report.report.government_schemes.map((scheme, idx) => `
                  <div class="scheme-box">
                    <div class="box-title">${scheme.in_local_language || scheme.scheme_name}</div>
                    <div class="box-detail"><strong>Eligible:</strong> ${scheme.eligible || 'N/A'}</div>
                    <div class="box-detail"><strong>Benefit Amount:</strong> ${scheme.benefit_amount || 'N/A'}</div>
                    <div class="box-detail"><strong>Helpline:</strong> ${scheme.helpline || 'N/A'}</div>
                    ${scheme.website ? `<div class="box-detail"><strong>Website:</strong> <span class="link">${scheme.website}</span></div>` : ''}
                  </div>
                `).join('') : '<p>No government schemes available</p>'}
              </div>
            </div>

            <!-- DISCLAIMER -->
            <div class="disclaimer">
              <strong>🤖 AI Disclaimer:</strong> ${report.report?.ai_disclaimer?.message_local || 'This is an AI-generated diagnosis. For confirmation and expert advice, please visit your nearest KVK (Krishi Vigyan Kendra).'}
            </div>

            <!-- FOOTER -->
            <div class="footer">
              <p>Generated by KisanPushti AI on ${dateStr} at ${timeStr}</p>
              <p>This report is valid for ${report.report?.report_metadata?.validity_days || 90} days from the date of generation.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      console.log('✅ PDF generated:', uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'KisanPushti Disease Report',
        });
      } else {
        Alert.alert('Success', 'PDF saved successfully');
      }

      setDownloadingReport(false);
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
      setDownloadingReport(false);
    }
  };

  // ✅ NEW: Render remedy card with YouTube embed and Maps link
  const renderRemedyCard = (remedy) => {
    return (
      <View style={styles.remedyCard} key={remedy.rank}>
        <Text style={styles.remedyTitle}>Remedy {remedy.rank}: {remedy.remedy_name_local}</Text>
        
        <View style={styles.remedyDetails}>
          <Text style={styles.remedyText}><Text style={styles.label}>Type:</Text> {remedy.remedy_type}</Text>
          <Text style={styles.remedyText}><Text style={styles.label}>Cost:</Text> ₹{remedy.total_cost_rupees}</Text>
          <Text style={styles.remedyText}><Text style={styles.label}>ROI:</Text> {remedy.roi_percent}%</Text>
        </View>

        {/* Application steps */}
        {remedy.step_by_step_application && remedy.step_by_step_application.length > 0 && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Steps:</Text>
            {remedy.step_by_step_application.map((step, idx) => (
              <Text key={idx} style={styles.stepText}>• {step}</Text>
            ))}
          </View>
        )}

        {/* YouTube Video Embed & Link */}
        {remedy.youtube_tutorial && (
          <View style={styles.videoSection}>
            <TouchableOpacity 
              style={styles.videoButton}
              onPress={() => setShowVideoModal(true) || setSelectedVideoUrl(remedy.youtube_tutorial)}
            >
              <Text style={styles.videoButtonText}>▶️ Watch Tutorial (In App)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => openYouTubeLink(remedy.youtube_tutorial)}
            >
              <Text style={styles.linkButtonText}>📺 Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Google Maps Link */}
        {remedy.maps_search_link && (
          <TouchableOpacity 
            style={styles.mapsButton}
            onPress={() => openMapsLink(remedy.maps_search_link)}
          >
            <Text style={styles.mapsButtonText}>📍 Find Nearby Shops</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ✅ Render scheme card with enhanced details
  const renderSchemeCard = (scheme) => {
    return (
      <View style={styles.schemeCard} key={scheme.scheme_name}>
        <Text style={styles.schemeName}>{scheme.in_local_language || scheme.scheme_name}</Text>
        <Text style={styles.schemeText}><Text style={styles.label}>Eligible:</Text> {scheme.eligible}</Text>
        <Text style={styles.schemeText}><Text style={styles.label}>Benefit:</Text> {scheme.benefit_amount}</Text>
        {scheme.helpline && <Text style={styles.schemeText}><Text style={styles.label}>Helpline:</Text> {scheme.helpline}</Text>}
        {scheme.documents_needed && (
          <View>
            <Text style={styles.label}>Documents Needed:</Text>
            {scheme.documents_needed.map((doc, idx) => (
              <Text key={idx} style={styles.docText}>• {doc}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disease Detection</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsVoiceEnabled(!isVoiceEnabled)}>
            <Text style={styles.voiceButton}>{isVoiceEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.clearButton} onPress={() => { safeSetSelectedImage(null); safeSetReport(null); }}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.cameraButton]} onPress={takePhoto} disabled={predicting}>
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.galleryButton]} onPress={pickImage} disabled={predicting}>
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Predict Button */}
        <TouchableOpacity style={[styles.predictButton, (predicting || !selectedImage) && { opacity: 0.6 }]} onPress={predictDisease} disabled={predicting || !selectedImage}>
          {predicting ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.predictButtonText, { marginLeft: spacing.md }]}>Processing...</Text>
            </>
          ) : (
            <Text style={styles.predictButtonText}>Detect Disease</Text>
          )}
        </TouchableOpacity>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing & Generating Report...</Text>
            <Text style={styles.loadingSubText}>(30-60 seconds)</Text>
          </View>
        )}

        {/* Report Display */}
        {report && report.report && (
          <View style={styles.reportContainer}>
            {/* Quick Summary */}
            <View style={styles.diagnosisCard}>
              <Text style={styles.diseaseName}>{report.report.disease_diagnosis?.disease_name_local}</Text>
              <Text style={styles.diseaseConfidence}>Confidence: {Math.round(report.confidence * 100)}%</Text>
            </View>

            {/* Remedies */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💊 Remedy Recommendations</Text>
              {report.report.remedy_recommendations && report.report.remedy_recommendations.map(remedy => renderRemedyCard(remedy))}
            </View>

            {/* Schemes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏛️ Government Schemes</Text>
              {report.report.government_schemes && report.report.government_schemes.map(scheme => renderSchemeCard(scheme))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={() => saveReportLocally(report)}>
                <Text style={styles.saveButtonText}>💾 Save Report</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.downloadButton} onPress={generateReportPDF} disabled={downloadingReport}>
                <Text style={styles.downloadButtonText}>⬇️ Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* YouTube Video Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowVideoModal(false)}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
          {selectedVideoUrl && (
            <WebView
              source={{ uri: selectedVideoUrl }}
              style={styles.webview}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 14, fontWeight: '600', color: colors.primary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  voiceButton: { fontSize: 24 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl },
  imageSection: { borderRadius: 12, overflow: 'hidden', marginBottom: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  selectedImage: { width: '100%', height: 250, resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: 250, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  placeholderText: { fontSize: 18, color: colors.textSecondary },
  clearButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255, 0, 0, 0.8)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20 },
  clearButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg, gap: spacing.md },
  actionButton: { flex: 1, paddingVertical: spacing.md, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cameraButton: { backgroundColor: '#2196F3' },
  galleryButton: { backgroundColor: '#FF9800' },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  predictButton: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, flexDirection: 'row' },
  predictButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  loadingContainer: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: spacing.lg },
  loadingText: { marginTop: spacing.md, color: colors.text, fontSize: 14, fontWeight: '600' },
  loadingSubText: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 12 },
  reportContainer: { marginTop: spacing.lg, marginBottom: spacing.xl },
  diagnosisCard: { backgroundColor: '#E3F2FD', borderRadius: 8, padding: spacing.lg, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  diseaseName: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  diseaseConfidence: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: spacing.sm },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  remedyCard: { backgroundColor: '#fff', borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  remedyTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: spacing.sm },
  remedyDetails: { marginBottom: spacing.md },
  remedyText: { fontSize: 12, marginBottom: spacing.xs },
  label: { fontWeight: 'bold', color: '#2E7D32' },
  stepsContainer: { marginBottom: spacing.md },
  stepsTitle: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32', marginBottom: spacing.xs },
  stepText: { fontSize: 11, marginLeft: spacing.md, marginBottom: spacing.xs },
  videoSection: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  videoButton: { flex: 1, backgroundColor: '#FF6B6B', padding: spacing.sm, borderRadius: 6, alignItems: 'center' },
  videoButtonText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  linkButton: { flex: 1, backgroundColor: '#4CAF50', padding: spacing.sm, borderRadius: 6, alignItems: 'center' },
  linkButtonText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  mapsButton: { backgroundColor: '#2196F3', padding: spacing.md, borderRadius: 6, alignItems: 'center', marginBottom: spacing.md },
  mapsButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  schemeCard: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  schemeName: { fontSize: 13, fontWeight: 'bold', color: '#2E7D32', marginBottom: spacing.sm },
  schemeText: { fontSize: 11, marginBottom: spacing.xs },
  docText: { fontSize: 10, marginLeft: spacing.md },
  actionButtonsContainer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  saveButton: { flex: 1, backgroundColor: '#FF9800', paddingVertical: spacing.lg, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  downloadButton: { flex: 1, backgroundColor: '#2196F3', paddingVertical: spacing.lg, borderRadius: 8, alignItems: 'center' },
  downloadButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalContainer: { flex: 1, backgroundColor: 'black' },
  closeButton: { backgroundColor: 'red', padding: spacing.md, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
  webview: { flex: 1 },
});

export default DiseaseDetectionScreen;