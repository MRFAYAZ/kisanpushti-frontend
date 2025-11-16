import { GoogleGenerativeAI } from '@google/generative-ai';
import AsyncStorage from '@react-native-async-storage/async-storage';

const genAI = new GoogleGenerativeAI('YOUR_GEMINI_API_KEY'); // Get from https://ai.google.dev/

export class GeminiService {
  static async generateDetailedReport(disease, confidence, location, state, selectedLanguage = 'en') {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Get current weather and time
      const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      const prompt = `
You are an expert agricultural consultant for Indian farmers. Generate a PROFESSIONAL, ACTIONABLE disease treatment report.

**Context:**
- Disease Detected: ${disease}
- Confidence: ${(confidence * 100).toFixed(1)}%
- Location: ${location}, ${state}, India
- Detection Time: ${currentTime}
- Language: ${selectedLanguage}

**IMPORTANT:** Generate the response in **${selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'ta' ? 'Tamil' : selectedLanguage === 'te' ? 'Telugu' : selectedLanguage === 'en' ? 'English' : selectedLanguage === 'ka' ? 'Kannada' : 'English' }** language ONLY.

Generate a JSON report with this EXACT structure:

{
  "disease_name": "Disease name in ${selectedLanguage} language",
  "severity": "Critical/High/Medium/Low",
  "why_appeared": "Explain cause in farmer-friendly language in ${selectedLanguage}",
  "disease_stage": "Early/Mid/Severe - with explanation in ${selectedLanguage}",
  "economic_impact": {
    "if_untreated": "₹1,50,000 - Expected crop loss if not treated",
    "treatment_cost": "₹300-₹1,200 depending on remedy chosen",
    "expected_savings": "₹1,48,000 if treated within 24 hours"
  },
  "weather_risk": {
    "current_weather": "Based on ${location} weather pattern",
    "risk_escalation": "High/Medium/Low - disease spread rate",
    "best_treatment_time": "Morning 6-8 AM or Evening 5-7 PM when humidity is optimal"
  },
  "remedies": [
    {
      "name": "Traditional Organic (in ${selectedLanguage})",
      "type": "Organic",
      "cost": "₹300-500",
      "effectiveness": "85%",
      "time_to_work": "3-5 days",
      "materials": ["Material 1 in ${selectedLanguage}", "Material 2 in ${selectedLanguage}"],
      "materials_english": ["Neem oil", "Water", "Liquid soap"],
      "application_steps": [
        {
          "step": 1,
          "description": "Step 1 in ${selectedLanguage}",
          "duration": "5 minutes"
        },
        {
          "step": 2,
          "description": "Step 2 in ${selectedLanguage}",
          "duration": "2 minutes"
        },
        {
          "step": 3,
          "description": "Step 3 in ${selectedLanguage}",
          "duration": "15-20 minutes"
        }
      ],
      "when_to_apply": "Morning 6-8 AM or Evening 5-7 PM (in ${selectedLanguage})",
      "video_tutorial": "link for respective detected disease",
      "where_to_buy": "Local co-operative, agricultural shop, online"
    },
    {
      "name": "Modern Organic (in ${selectedLanguage})",
      "type": "Organic",
      "cost": "₹600-800",
      "effectiveness": "90%",
      "time_to_work": "2-3 days",
      "materials": ["Trichoderma viride powder (in ${selectedLanguage})", "Water"],
      "materials_english": ["Trichoderma viride", "Water"],
      "application_steps": [
        {
          "step": 1,
          "description": "Mix 5gm powder with 1 liter water (in ${selectedLanguage})",
          "duration": "3 minutes"
        },
        {
          "step": 2,
          "description": "Spray on plants and soil around base (in ${selectedLanguage})",
          "duration": "10-15 minutes"
        }
      ],
      "when_to_apply": "Evening after 5 PM when sun is low",
      "video_tutorial": "video of desired tutorial",
      "where_to_buy": "Agricultural university, certified bio-shops"
    },
    {
      "name": "Chemical (Last Resort) (in ${selectedLanguage})",
      "type": "Chemical",
      "cost": "₹1,000-1,500",
      "effectiveness": "95%",
      "time_to_work": "1-2 days",
      "materials": ["Copper Oxychloride 50% WP", "Water", "Protective gear"],
      "application_steps": [
        {
          "step": 1,
          "description": "Mix 30gm powder with 10 liters water (in ${selectedLanguage})",
          "duration": "5 minutes"
        },
        {
          "step": 2,
          "description": "Wear mask and gloves. Spray evenly (in ${selectedLanguage})",
          "duration": "20 minutes"
        }
      ],
      "when_to_apply": "Early morning before 9 AM",
      "video_tutorial": "link for tutorial from youtube with selected language",
      "where_to_buy": "Licensed agricultural chemical dealers",
      "warning": "Use protective equipment. Follow safety instructions (in ${selectedLanguage})"
    }
  ],
  "urgent_actions": [
    "Remove severely infected leaves immediately (in ${selectedLanguage})",
    "Do not water plants from top - water at soil level (in ${selectedLanguage})",
    "Apply remedy by tomorrow ${new Date(Date.now() + 86400000).toLocaleDateString()} before disease spreads (in ${selectedLanguage})"
  ],
  "expected_results": {
    "day_1": "Symptoms visible reduction (in ${selectedLanguage})",
    "day_3": "50% recovery if organic remedy used (in ${selectedLanguage})",
    "day_7": "Complete control expected (in ${selectedLanguage})"
  },
  "prevention_tips": [
    "Maintain proper plant spacing for air circulation (in ${selectedLanguage})",
    "Remove crop residue after harvest (in ${selectedLanguage})",
    "Use disease-resistant varieties next season (in ${selectedLanguage})"
  ],
  "insurance_proof": {
    "report_id": "KP-${Date.now()}",
    "detection_date": "${currentTime}",
    "note": "This report can be used for crop insurance claims (in ${selectedLanguage})"
  }
}

CRITICAL: Generate ALL text content in ${selectedLanguage === 'hi' ? 'Hindi (हिंदी)' : selectedLanguage === 'ta' ? 'Tamil (தமிழ்)' : selectedLanguage === 'te' ? 'Telugu (తెలుగు)' : selectedLanguage === 'ka' ? 'Kannada (ಕನ್ನಡ)' : 'English'} language. Include selected language only remember.
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Gemini response');
      }

      const reportData = JSON.parse(jsonMatch[0]);

      // Save to history
      await this.saveReportToHistory(reportData, disease, confidence, location);

      return reportData;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  static async saveReportToHistory(report, disease, confidence, location) {
    try {
      const history = JSON.parse(await AsyncStorage.getItem('reportHistory') || '[]');
      
      const reportEntry = {
        id: `KP-${Date.now()}`,
        timestamp: new Date().toISOString(),
        disease,
        confidence,
        location,
        report
      };

      history.unshift(reportEntry); // Add to beginning
      await AsyncStorage.setItem('reportHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50
      
      console.log('✅ Report saved to history');
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  static async getReportHistory() {
    try {
      return JSON.parse(await AsyncStorage.getItem('reportHistory') || '[]');
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }
}
//see the vioce assistance error has not solved yet please i want you to go through deep and solve the every error of why the vioce is not working properly and i wan to make sure that once the farmer pressed the voice toggler to in on state then i want it to be on in whole app while differing with screens too and again the voice assistant says only in english and hindi languagaes only please solve it very deeply and perfectly