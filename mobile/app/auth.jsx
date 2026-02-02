import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Formik, useFormik } from "formik";
import * as Yup from "yup";
import * as SecureStore from "expo-secure-store";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string().when('isRegistering', {
    is: true,
    then: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
  }),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const router = useRouter();
  const { showToast } = useToast();

  const getPasswordStrength = (password) => {
    const criteria = [
      { label: 'At least 8 characters', test: password.length >= 8 },
      { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
      { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
      { label: 'Contains number', test: /\d/.test(password) },
      { label: 'Contains special character', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];

    const metCount = criteria.filter(c => c.test).length;

    let strength = 'Weak';
    let color = colors.expense; // red
    if (metCount >= 5) {
      strength = 'Strong';
      color = colors.profit; // green
    } else if (metCount >= 3) {
      strength = 'Good';
      color = colors.profit; // green, or yellow
    } else if (metCount >= 2) {
      strength = 'Fair';
      color = colors.textMuted; // yellow or something
    }

    return { strength, color, criteria };
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const endpoint = isRegistering ? '/api/auth/register/' : '/api/auth/login/';
        const body = isRegistering
          ? {
              email: values.email,
              username: values.email,
              password: values.password.trim(),
              password2: values.confirmPassword.trim(),
            }
          : { username: values.email, password: values.password.trim() };

        console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
        console.log('Endpoint:', endpoint);
        console.log('Request body:', body);

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}${endpoint}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const data = await response.json();
        console.log('Response data:', data);
        if (response.ok) {
          if (isRegistering) {
            showToast("Account created! Please log in.", "success");
            setIsRegistering(false);
            formik.resetForm();
          } else {
            await SecureStore.setItemAsync("accessToken", data.access);
            await SecureStore.setItemAsync("refreshToken", data.refresh);
            await SecureStore.setItemAsync("rememberMe", rememberMe ? "true" : "false");
            setIsAuthenticated(true);
            setUser({ email: values.email, username: values.email });
            showToast("Login successful!", "success");
            router.replace('/(tabs)');
          }
        } else {
           const errorMessage = isRegistering ? (data.error || "Registration failed") : (data.detail || "Invalid credentials");
           showToast(errorMessage, "error");
         }
       } catch (error) {
         console.log('Fetch error:', error);
         showToast(error.message, "error");
       }
      setLoading(false);
    },

  });

  const passwordStrength = formik.values.password ? getPasswordStrength(formik.values.password) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Image 
                  source={require('../assets/brand-icon.png')} 
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                />
        </View>
        <Text style={{ color: colors.textMain, fontSize: 32, fontWeight: '900', fontStyle: 'italic' }}>
          SIDEKICK
        </Text>
        <Text style={{ color: colors.textMuted }}>Driver Security Portal</Text>
      </View>

      <View style={{ gap: 16 }}>
        <TextInput
          placeholder="Driver Email"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.card,
            borderColor: formik.errors.email && formik.touched.email ? colors.expense : colors.border,
            borderWidth: 1,
            padding: 16,
            borderRadius: 12,
            color: colors.textMain,
          }}
          value={formik.values.email}
          onChangeText={formik.handleChange('email')}
          onBlur={formik.handleBlur('email')}
          keyboardType="email-address"
          editable={!loading}
        />
        {formik.errors.email && formik.touched.email && (
          <Text style={{ color: colors.expense, fontSize: 12, marginTop: 4 }}>
            {formik.errors.email}
          </Text>
        )}
        <View style={{ position: 'relative' }}>
          <TextInput
            placeholder="Security Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showPassword}
            style={{
              backgroundColor: colors.card,
              borderColor: formik.errors.password && formik.touched.password ? colors.expense : colors.border,
              borderWidth: 1,
              padding: 16,
              paddingRight: 50, // Space for the icon
              borderRadius: 12,
              color: colors.textMain,
            }}
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 16,
              top: 16,
              padding: 4,
            }}
            disabled={loading}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        {isRegistering && passwordStrength && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: passwordStrength.color, fontSize: 14, fontWeight: 'bold' }}>
              Password Strength: {passwordStrength.strength}
            </Text>
            {passwordStrength.criteria.map((criterion, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons
                  name={criterion.test ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={criterion.test ? colors.profit : colors.expense}
                />
                <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 4 }}>
                  {criterion.label}
                </Text>
              </View>
            ))}
          </View>
        )}
        {formik.errors.password && formik.touched.password && (
          <Text style={{ color: colors.expense, fontSize: 12, marginTop: 4 }}>
            {formik.errors.password}
          </Text>
        )}

        {isRegistering && (
          <>
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                style={{
                  backgroundColor: colors.card,
                  borderColor: formik.errors.confirmPassword && formik.touched.confirmPassword ? colors.expense : colors.border,
                  borderWidth: 1,
                  padding: 16,
                  paddingRight: 50, // Space for the icon
                  borderRadius: 12,
                  color: colors.textMain,
                }}
                value={formik.values.confirmPassword}
                onChangeText={formik.handleChange('confirmPassword')}
                onBlur={formik.handleBlur('confirmPassword')}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  padding: 4,
                }}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {formik.errors.confirmPassword && formik.touched.confirmPassword && (
              <Text style={{ color: colors.expense, fontSize: 12, marginTop: 4 }}>
                {formik.errors.confirmPassword}
              </Text>
            )}
          </>
        )}

        {!isRegistering && (
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}
            disabled={loading}
          >
            <Ionicons
              name={rememberMe ? "checkbox" : "checkbox-outline"}
              size={20}
              color={colors.textMain}
            />
            <Text style={{ color: colors.textMain, marginLeft: 8 }}>Remember me</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={formik.handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: colors.profit,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Text style={{ fontWeight: 'bold', marginRight: 8, color: '#FFFFFF' }}>
                {isRegistering ? "CREATE ACCOUNT" : "SECURE SIGN IN"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsRegistering(!isRegistering);
            formik.resetForm();
          }}
          disabled={loading}
        >
          <Text style={{ textAlign: 'center', color: colors.textMuted }}>
            {isRegistering
              ? "Already have an account? Sign In"
              : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

