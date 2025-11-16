import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import ALL screens
import SplashScreen from '../screens/SplashScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import HomeScreen from '../screens/HomeScreen';
import NewsScreen from '../screens/NewsScreen';
import SummaryScreen from '../screens/SummaryScreen';
import DiseaseDetection from '../screens/DiseaseDetectionScreen';
import MarketPrices from '../screens/MarketPricesScreen';
import GovernmentSchemes from '../screens/GovernmentSchemesScreen';
import SavedReportsScreen from '../screens/SavedReportsScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyle: { backgroundColor: '#fff' },
          transitionConfig: () => ({
            transitionSpec: {
              duration: 300,
              timing: require('react-native').Animated.timing,
              easing: require('react-native').Easing.out(
                require('react-native').Easing.cubic
              ),
            },
          }),
        }}
        initialRouteName="SplashScreen"
      >
        {/* Splash Screen */}
        <Stack.Screen 
          name="SplashScreen" 
          component={SplashScreen}
          options={{
            animationEnabled: false,
          }}
        />

        {/* Language Screen */}
        <Stack.Screen 
          name="LanguageSelectionScreen" 
          component={LanguageSelectionScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />

        {/* Onboarding Screen */}
        <Stack.Screen 
          name="OnboardingScreen" 
          component={OnboardingScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: false,
          }}
        />

        {/* User Setup */}
        <Stack.Screen 
          name="UserDetailsScreen" 
          component={UserDetailsScreen}
          options={{
            animationEnabled: false,
          }}
        />

        {/* Main Home Screen */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            animationEnabled: false,
          }}
        />

        {/* News Screen - Full news with tabs */}
        <Stack.Screen 
          name="NewsScreen" 
          component={NewsScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        {/* Summary Screen - Full weather summary */}
        <Stack.Screen 
          name="SummaryScreen" 
          component={SummaryScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        {/* Disease Detection Screen */}
        <Stack.Screen 
          name="DiseaseDetection" 
          component={DiseaseDetection}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        {/* Market Prices Screen */}
        <Stack.Screen 
          name="MarketPrices" 
          component={MarketPrices}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        {/* Government Schemes Screen */}
        <Stack.Screen 
          name="GovernmentSchemes" 
          component={GovernmentSchemes}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        {/* Saved Reports Screen */}
        <Stack.Screen 
          name="SavedReportsScreen" 
          component={SavedReportsScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />

        {/* Report Detail Screen */}
        <Stack.Screen 
          name="ReportDetailScreen" 
          component={ReportDetailScreen}
          options={{
            animationEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
