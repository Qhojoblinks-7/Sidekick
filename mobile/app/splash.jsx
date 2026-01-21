import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  useEffect(() => {
    // Start Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Navigate to Dashboard after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
        
        {/* Logo Icon */}
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <Image 
        source={require('../assets/brand-logo.png')} 
        style={{ width: 300, height: 300 }}
        resizeMode="contain"
      />
        </View>

       
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>DRIVE</Text>
          <Text style={{ color: '#666', fontWeight: 'bold' }}> • </Text>
          <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>EARN</Text>
          <Text style={{ color: '#666', fontWeight: 'bold' }}> • </Text>
          <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>PROFIT</Text>
        </View>
      </Animated.View>

      {/* Footer Version */}
      <Text style={{ position: 'absolute', bottom: 50, color: '#333', fontSize: 12, fontWeight: 'bold' }}>
        v1.0.0|BY VISTA FORGE TECH GH | ACCRA, GH
      </Text>
    </View>
  );
}