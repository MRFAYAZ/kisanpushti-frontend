import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../theme/colors';
import { INDIAN_STATES } from '../constants/languages';
import { VoiceAssistantToggle } from '../components/VoiceAssistantToggle';
import { getTranslatedName } from '../utils/stateDistrictTranslations';
import { VoiceService } from '../services/voiceAssistant';

const DISTRICTS_BY_STATE = {
  'Andaman and Nicobar Islands': ['North and Middle Andaman', 'South Andaman', 'Nicobar'],
  'Andhra Pradesh': ["AlluriSitharamaRaju","Anakapalli","Anantapur","Annamayya","Bapatla","Chittoor","Dr.B.R.AmbedkarKonaseema","Eluru","EastGodavari","Guntur","Kakinada","Krishna","Kurnool","NTR","Nandyal","Palnadu","ParvathipuramManyam","Prakasam","SriPottiSriramuluNellore","SriSathyaSai","Srikakulam","Tirupati","Visakhapatnam","Vizianagaram","WestGodavari","YSRKadapa"],
  'Arunachal Pradesh': ["Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Kra Daadi","Kurung Kumey","Lohit","Lower Dibang Valley","Lower Siang","Lower Subansiri","Longding","Namsai","Papum Pare","Siang","Tawang","Tirap","Upper Siang","Upper Subansiri","West Kameng","West Siang"],
  'Assam': ["Baksa","Barpeta","Bajali","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara Mankachar","Tamulpur","Tinsukia","Udalguri","West Karbi Anglong"],
  'Bihar': ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"],
  'Chandigarh': ["Chandigarh"],
  'Chhattisgarh': ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Kondagaon","Korba","Korea","Mahasamund","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sukma","Surajpur","Surguja"],
  'Dadra and Nagar Haveli': ["Dadra","Nagar Haveli"],
  'Daman and Diu': ["Daman","Diu"],
  'Delhi': ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
  'Goa': ["North Goa","South Goa"],
  'Gujarat': ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"],
  'Haryana': ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurgaon","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Mewat","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"],
  'Himachal Pradesh': ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi","Shimla","Sirmaur","Solan","Una"],
  'Jharkhand': ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahibganj","Saraikela Kharsawan","Simdega","West Singhbhum"],
  'Jammu and Kashmir': ['Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur'],
  'Karnataka': ["Bagalkot","Bangalore Rural","Bangalore Urban","Belagavi","Ballari","Bidar","Chamarajanagar","Chikballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davangere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"],
  'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
  'Lakshadweep': ['Agatti', 'Amini', 'Andrott', 'Kavaratti', 'Kalapeni', 'Kiltan', 'Minicoy'],
  'Ladakh': ['Kargil', 'Leh'],
  'Madhya Pradesh': ['Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'],
  'Maharashtra': ['Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'],
  'Manipur': ['Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West','Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl','Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'],
  'Meghalaya': ['East Garo Hills','East Jaintia Hills','East Khasi Hills','North Garo Hills','Ri Bhoi','South Garo Hills','South West Garo Hills','West Garo Hills','West Jaintia Hills','West Khasi Hills'],
  'Mizoram': ['Aizawl','Champhai','Kolasib','Lawngtlai','Lunglei','Mamit','Saiha','Serchhip'],
  'Nagaland': ['Dimapur','Kiphire','Kohima','Longleng','Mokokchung','Mon','Peren','Phek','Tuensang','Wokha','Zunheboto'],
  'Odisha': ['Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh'],
  'Punjab': ['Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Fazilka','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Mansa','Moga','Muktsar','Nawanshahr','Pathankot','Patiala','Rupnagar','Sangrur','Shaheed Bhagat Singh Nagar','Tarn Taran'],
  'Puducherry': ['Karaikal','Mahe','Puducherry','Yanam'],
  'Rajasthan': ['Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'],
  'Sikkim': ['East Sikkim','North Sikkim','South Sikkim','West Sikkim'],
  'Tamil Nadu': ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Vellore','Viluppuram','Virudhunagar','Nilgiris'],
  'Telangana': ['Adilabad','Bhadradri Kothagudem','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Komaram Bheem Asifabad','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal (Rural)','Warangal (Urban)','Yadadri Bhuvanagiri'],
  'Tripura': ['Dhalai','Gomati','Khowai','North Tripura','Sepahijala','South Tripura','Unakoti','West Tripura'],
  'Uttar Pradesh': ['Agra','Aligarh','Allahabad','Ambedkar Nagar','Amethi','Amroha','Auraiya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Faizabad','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri (Lakhimpur Kheri)','Kushinagar','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Rae Bareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra','Sultanpur','Unnao'],
  'Uttarakhand': ['Almora','Bageshwar','Chamoli','Champawat','Dehradun','Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'],
'West Bengal': ['Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'],
};

export const UserDetailsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [farmerName, setFarmerName] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [searchState, setSearchState] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const filteredStates = INDIAN_STATES.filter(state =>
    getTranslatedName(state, i18n.language).toLowerCase().includes(searchState.toLowerCase())
  );

  const availableDistricts = selectedState
    ? DISTRICTS_BY_STATE[selectedState] || []
    : [];

  const filteredDistricts = availableDistricts.filter(district =>
    getTranslatedName(district, i18n.language).toLowerCase().includes(searchDistrict.toLowerCase())
  );

  const handleVoiceToggle = (enabled) => {
    setIsVoiceEnabled(enabled);
    if (enabled) {
      VoiceService.speak(t('set_up_profile'), i18n.language);
    }
  };

  const handleNameFocus = () => {
    if (isVoiceEnabled) {
      VoiceService.speak(t('enter_name'), i18n.language);
    }
  };

  const handleStateTap = () => {
    setShowStateModal(true);
    if (isVoiceEnabled) {
      VoiceService.speak(t('select_state'), i18n.language);
    }
  };

  const handleDistrictTap = () => {
    setShowDistrictModal(true);
    if (isVoiceEnabled) {
      VoiceService.speak(t('select_district'), i18n.language);
    }
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setShowStateModal(false);
    setSearchState('');
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setShowDistrictModal(false);
    setSearchDistrict('');
  };

  const handleContinue = async () => {
    if (farmerName.trim() && selectedState && selectedDistrict) {
      try {
        // ✅ FIXED: Save all data including userLanguage if not already saved
        const currentLanguage = i18n?.language || 'en';

        
        await Promise.all([
          AsyncStorage.setItem('farmerName', farmerName),
          AsyncStorage.setItem('userState', selectedState),
          AsyncStorage.setItem('userDistrict', selectedDistrict),
          AsyncStorage.setItem('userLanguage', currentLanguage),
          AsyncStorage.setItem('onboardingComplete', 'true')
        ]);

        console.log('✅ User details saved:', { farmerName, selectedState, selectedDistrict, currentLanguage });

        if (isVoiceEnabled) {
          const displayState = getTranslatedName(selectedState, currentLanguage);
          const displayDistrict = getTranslatedName(selectedDistrict, currentLanguage);
          await VoiceService.speak(
            `${t('welcome')} ${farmerName}! ${t('location')}: ${displayState}, ${displayDistrict}`,
            currentLanguage
          );
        }

        setTimeout(() => {
          console.log('📍 Navigating to Home...');
          navigation.replace('Home');
        }, 500);
      } catch (error) {
        console.error('❌ Error saving user details:', error);
        alert(t('error_saving_details'));
      }
    } else {
      alert(t('please_fill_details'));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>{t('set_up_profile')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('your_name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enter_name')}
            value={farmerName}
            onChangeText={setFarmerName}
            onFocus={handleNameFocus}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('select_state')}</Text>
          <TouchableOpacity style={styles.selectButton} onPress={handleStateTap}>
            <Text style={styles.selectButtonText}>
              {selectedState
                ? getTranslatedName(selectedState, i18n.language)
                : t('tap_to_select')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('select_district')}</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              !selectedState && styles.selectButtonDisabled
            ]}
            onPress={handleDistrictTap}
            disabled={!selectedState}
          >
            <Text style={styles.selectButtonText}>
              {selectedDistrict
                ? getTranslatedName(selectedDistrict, i18n.language)
                : t('tap_to_select')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ✅ FIXED: Voice Button positioned better - above continue button */}
      <View style={styles.voiceButtonContainer}>
        <VoiceAssistantToggle onToggle={handleVoiceToggle} initialState={false} />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!farmerName.trim() || !selectedState || !selectedDistrict) &&
              styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!farmerName.trim() || !selectedState || !selectedDistrict}
        >
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_state')}</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_state')}
              value={searchState}
              onChangeText={setSearchState}
              placeholderTextColor={colors.textSecondary}
            />
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleStateSelect(item)}
                >
                  <Text style={styles.listItemText}>
                    {getTranslatedName(item, i18n.language)}
                  </Text>
                  {selectedState === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* District Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_district')}</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_district')}
              value={searchDistrict}
              onChangeText={setSearchDistrict}
              placeholderTextColor={colors.textSecondary}
            />
            <FlatList
              data={filteredDistricts}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleDistrictSelect(item)}
                >
                  <Text style={styles.listItemText}>
                    {getTranslatedName(item, i18n.language)}
                  </Text>
                  {selectedDistrict === item && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  welcomeSection: { marginBottom: spacing.xl, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center'
  },
  section: { marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    color: colors.text
  },
  selectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary
  },
  selectButtonDisabled: { opacity: 0.5, borderColor: colors.border },
  selectButtonText: { fontSize: 16, fontWeight: '500', color: colors.text },
  voiceButtonContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingTop: spacing.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  closeButton: { fontSize: 24, color: colors.text },
  searchInput: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  listItemText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: 'bold' },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg
  },
  continueButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  continueButtonDisabled: { backgroundColor: colors.border, opacity: 0.5 },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface
  }
});

export default UserDetailsScreen;