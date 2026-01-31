import { useContext, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

export default function RootIndex() {
  console.log('RootIndex: Component rendered');
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're coming from splash screen
  const fromSplash = params.from === 'splash';

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Show splash screen first if not coming from splash
  useEffect(() => {
    if (!fromSplash && !isLoading) {
      router.replace('/splash');
    }
  }, [fromSplash, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#4AFF85" />
    </View>
  );
}