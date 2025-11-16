import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export class ReportPDFService {
  static async generatePDF(report, prediction, selectedImage, farmerDetails) {
    try {
      // Get current date/time
      const now = new Date();
      const date = now.toLocaleDateString('en-IN');
      const time = now.toLocaleTimeString('en-IN');

      // Convert image to base64 for embedding
      let imageBase64 = '';
      if (selectedImage) {
        try {
          const imageData = await FileSystem.readAsStringAsync(selectedImage, {
            encoding: FileSystem.EncodingType.Base64,
          });
          imageBase64 = `data:image/jpeg;base64,${imageData}`;
        } catch (e) {
          console.log('Image embedding skipped:', e.message);
          imageBase64 = '';
        }
      }

      // Generate HTML template
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 3px solid #2E7D32; 
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header-left h1 { 
              font-size: 24px; 
              color: #2E7D32; 
              font-weight: bold; 
            }
            .header-left p { 
              font-size: 10px; 
              color: #666; 
              margin-top: 3px; 
            }
            .header-right img { 
              width: 100px; 
              height: 100px; 
              border-radius: 8px; 
              border: 2px solid #2E7D32; 
              object-fit: cover;
            }
            .metadata { 
              background: #F1F8F6; 
              padding: 12px; 
              border-radius: 6px; 
              margin-bottom: 15px; 
              font-size: 10px;
            }
            .metadata-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .section { 
              margin-bottom: 20px; 
            }
            .section-title { 
              font-size: 12px; 
              font-weight: bold; 
              color: #fff; 
              background: #2E7D32; 
              padding: 8px 12px; 
              border-radius: 4px; 
              margin-bottom: 8px; 
            }
            .section-content { 
              padding: 0 8px; 
            }
            .field { 
              margin-bottom: 6px; 
              font-size: 10px; 
            }
            .field-label { 
              font-weight: bold; 
              color: #2E7D32; 
            }
            .field-value { 
              color: #333; 
            }
            .remedy-box, .scheme-box, .action-box { 
              background: #F9F9F9; 
              padding: 10px; 
              margin: 8px 0; 
              border-left: 4px solid #2E7D32; 
              border-radius: 4px; 
            }
            .scheme-box {
              background: #E8F5E9;
              border-left-color: #4CAF50;
            }
            .action-box {
              border-left-color: #D32F2F;
            }
            .box-title { 
              font-weight: bold; 
              color: #2E7D32; 
              margin-bottom: 4px;
              font-size: 11px;
            }
            .box-detail { 
              font-size: 9px; 
              margin: 2px 0; 
            }
            .link { 
              color: #1976D2; 
              font-size: 8px; 
              word-break: break-all; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 8px 0; 
              font-size: 9px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
            }
            th { 
              background: #f5f5f5; 
              font-weight: bold; 
            }
            .footer { 
              margin-top: 25px; 
              padding-top: 12px; 
              border-top: 1px solid #ddd; 
              font-size: 8px; 
              color: #666; 
              text-align: center; 
            }
          </style>
        </head>
        <body>
          <!-- HEADER -->
          <div class="header">
            <div class="header-left">
              <h1>🌾 KisanPushti</h1>
              <p>AI-Powered Crop Disease Detection & Management</p>
            </div>
            ${imageBase64 ? `<div class="header-right"><img src="${imageBase64}" alt="Crop"></div>` : ''}
          </div>

          <!-- METADATA -->
          <div class="metadata">
            <div class="metadata-row">
              <span><strong>Report ID:</strong> ${report.report_metadata?.report_id || 'N/A'}</span>
              <span><strong>Generated:</strong> ${date} ${time}</span>
            </div>
            <div class="metadata-row">
              <span><strong>Valid:</strong> ${report.report_metadata?.validity_days || 90} days</span>
              <span><strong>Confidence:</strong> ${report.report_metadata?.model_confidence || 0}%</span>
            </div>
          </div>

          <!-- FARMER INFO -->
          <div class="section">
            <div class="section-title">👨‍🌾 Farmer Information</div>
            <div class="section-content">
              <div class="field"><span class="field-label">Name:</span> ${farmerDetails.name || 'N/A'}</div>
              <div class="field"><span class="field-label">Location:</span> ${farmerDetails.district || 'N/A'}, ${farmerDetails.state || 'N/A'}</div>
              <div class="field"><span class="field-label">Language:</span> ${report.report_metadata?.farmer_language || 'en'}</div>
            </div>
          </div>

          <!-- DISEASE DIAGNOSIS -->
          <div class="section">
            <div class="section-title">🔬 Disease Diagnosis</div>
            <div class="section-content">
              <div class="field"><span class="field-label">Disease (Local):</span> ${report.disease_diagnosis?.disease_name_local || 'N/A'}</div>
              <div class="field"><span class="field-label">Disease (English):</span> ${report.disease_diagnosis?.disease_name_english || 'N/A'}</div>
              <div class="field"><span class="field-label">Scientific Name:</span> ${report.disease_diagnosis?.disease_name_scientific || 'N/A'}</div>
              <div class="field"><span class="field-label">Causal Agent:</span> ${report.disease_diagnosis?.causal_agent || 'N/A'}</div>
            </div>
          </div>

          <!-- WHY DISEASE -->
          <div class="section">
            <div class="section-title">📍 Why This Disease Appeared</div>
            <div class="section-content">
              <div class="field">${report.why_this_disease_appeared?.primary_reason_local || 'N/A'}</div>
              <table>
                <tr><th>Factor</th><th>Condition</th></tr>
                <tr>
                  <td>Temperature</td>
                  <td>${report.why_this_disease_appeared?.weather_conditions?.temperature_range || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Humidity</td>
                  <td>${report.why_this_disease_appeared?.weather_conditions?.humidity_level || 'N/A'}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- SEVERITY -->
          <div class="section">
            <div class="section-title">⚠️ Severity Assessment</div>
            <div class="section-content">
              <div class="field"><span class="field-label">Stage:</span> ${report.severity_assessment?.current_stage || 'N/A'}</div>
              <div class="field"><span class="field-label">Affected:</span> ${report.severity_assessment?.percentage_crop_affected || '0'}%</div>
              <div class="field"><span class="field-label">Spread Rate:</span> ${report.severity_assessment?.spread_rate || 'N/A'}</div>
              <div class="field"><span class="field-label">Days Until Loss:</span> ${report.severity_assessment?.days_until_major_loss || '0'}</div>
            </div>
          </div>

          <!-- ECONOMIC -->
          <div class="section">
            <div class="section-title">💰 Economic Impact</div>
            <div class="section-content">
              <table>
                <tr><th>Item</th><th>Value</th></tr>
                <tr><td>Potential Loss</td><td>${report.economic_impact_analysis?.potential_loss_if_untreated?.amount_rupees || 'N/A'}</td></tr>
                <tr><td>Cheapest Treatment</td><td>₹${report.economic_impact_analysis?.treatment_cost_vs_savings?.cheapest_treatment_cost || '0'}</td></tr>
                <tr><td>Savings (Early Treatment)</td><td>₹${report.economic_impact_analysis?.treatment_cost_vs_savings?.savings_if_treated_early || '0'}</td></tr>
              </table>
            </div>
          </div>

          <!-- REMEDIES -->
          <div class="section">
            <div class="section-title">💊 Remedies</div>
            <div class="section-content">
              ${report.remedy_recommendations && report.remedy_recommendations.length > 0 ? report.remedy_recommendations.map((remedy, idx) => `
                <div class="remedy-box">
                  <div class="box-title">Remedy ${remedy.rank}: ${remedy.remedy_name_local || 'N/A'}</div>
                  <div class="box-detail"><strong>Type:</strong> ${remedy.remedy_type || 'N/A'}</div>
                  <div class="box-detail"><strong>Cost:</strong> ₹${remedy.total_cost_rupees || '0'} | <strong>ROI:</strong> ${remedy.roi_percent || '0'}%</div>
                  ${remedy.youtube_tutorial ? `<div class="box-detail"><strong>Video:</strong> <span class="link">${remedy.youtube_tutorial}</span></div>` : ''}
                  ${remedy.maps_search_link ? `<div class="box-detail"><strong>Shops:</strong> <span class="link">${remedy.maps_search_link}</span></div>` : ''}
                </div>
              `).join('') : '<p>No remedies available</p>'}
            </div>
          </div>

          <!-- GOVERNMENT SCHEMES -->
          <div class="section">
            <div class="section-title">🏛️ Government Schemes</div>
            <div class="section-content">
              ${report.government_schemes && report.government_schemes.length > 0 ? report.government_schemes.map((scheme, idx) => `
                <div class="scheme-box">
                  <div class="box-title">${scheme.in_local_language || scheme.scheme_name}</div>
                  <div class="box-detail"><strong>Eligible:</strong> ${scheme.eligible || 'N/A'}</div>
                  <div class="box-detail"><strong>Benefit:</strong> ${scheme.benefit_amount || 'N/A'}</div>
                  ${scheme.application_link ? `<div class="box-detail"><strong>Apply:</strong> <span class="link">${scheme.application_link}</span></div>` : ''}
                  <div class="box-detail"><strong>Helpline:</strong> ${scheme.helpline || 'N/A'}</div>
                </div>
              `).join('') : '<p>No schemes available</p>'}
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <p><strong>🤖 AI Disclaimer:</strong> ${report.ai_disclaimer?.message_local || 'This is AI-generated. Consult KVK for confirmation.'}</p>
            <p>Generated by KisanPushti AI on ${date}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF using Expo Print
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      console.log('✅ PDF generated:', uri);

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'KisanPushti Disease Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }

      return uri;
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      throw error;
    }
  }
}
