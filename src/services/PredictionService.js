import axios from 'axios';
import { API_ENDPOINTS, API_TIMEOUT } from '../config/API_CONFIG';

export class PredictionService {
  // ✅ Convert image to Base64 correctly
  static async imageToBase64(imageUri) {
    try {
      console.log('🎬 Starting Base64 conversion...');
      console.log('📷 Image URI:', imageUri);

      // ✅ Read file and convert
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64,
          console.log('✅ Base64 conversion successful');
          console.log('📊 Base64 size:', Math.round(base64.length / 1024), 'KB');
          resolve(base64);
        };
        
        reader.onerror = (error) => {
          console.error('❌ Base64 conversion failed:', error);
          reject(error);
        };
        
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Image to Base64 error:', error);
      throw new Error('Failed to convert image to Base64');
    }
  }

  // ✅ Predict disease - Main function
  static async predictDisease(
    imageUri,
    district,
    state,
    language,
    farmerName = 'Farmer'
  ) {
    try {
      // ✅ Step 1: Validate inputs
      console.log('\n🎬 DISEASE DETECTION - STEP 1: INPUT VALIDATION');
      if (!imageUri) throw new Error('No image provided');
      if (!district) throw new Error('No district provided');
      if (!state) throw new Error('No state provided');
      if (!language) language = 'en';
      
      console.log('✅ Inputs validated');
      console.log(`   Image: ${imageUri.substring(0, 50)}...`);
      console.log(`   District: ${district}`);
      console.log(`   State: ${state}`);
      console.log(`   Language: ${language}`);
      console.log(`   Farmer: ${farmerName}`);

      // ✅ Step 2: Convert image to Base64
      console.log('\n🎬 DISEASE DETECTION - STEP 2: IMAGE CONVERSION');
      const imageBase64 = await this.imageToBase64(imageUri);

      // ✅ Step 3: Send to backend
      console.log('\n🎬 DISEASE DETECTION - STEP 3: SENDING REQUEST');
      console.log(`📤 API Endpoint: ${API_ENDPOINTS.PREDICT}`);
      console.log(`📍 Timeout: ${API_TIMEOUT}ms`);

      const payload = {
        image: imageBase64,
        language: language,
        district: district,
        state: state,
        farmer_name: farmerName,
      };

      console.log('📦 Payload prepared');
      console.log(`   Image size: ${Math.round(imageBase64.length / 1024)}KB`);
      console.log(`   Language: ${language}`);

      // ✅ Send with axios (better error handling than fetch)
      const response = await axios.post(
        API_ENDPOINTS.PREDICT,
        payload,
        {
          timeout: API_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      // ✅ Step 4: Parse response
      console.log('\n🎬 DISEASE DETECTION - STEP 4: RESPONSE RECEIVED');
      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Backend returned error');
      }

      console.log('✅ Disease detection successful');
      console.log(`   Disease: ${result.disease_class}`);
      console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);

      // ✅ Step 5: Return full data
      console.log('\n🎬 DISEASE DETECTION - STEP 5: RETURNING DATA');
      console.log(`   Report sections: ${result.report ? Object.keys(result.report).length : 0}`);

      return {
        success: true,
        disease_class: result.disease_class,
        confidence: result.confidence,
        language_generated: result.language_generated || language,
        farmer_name: result.farmer_name || farmerName,
        generated_timestamp: result.generated_timestamp || new Date().toISOString(),
        report: result.report, // Full Gemini report
        is_downloadable: result.is_downloadable !== false,
      };

    } catch (error) {
      console.error('❌ PREDICTION ERROR:', error.message);
      console.error('📍 Full error:', error);
      throw error;
    }
  }
}

export default PredictionService;