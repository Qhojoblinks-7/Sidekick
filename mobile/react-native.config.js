module.exports = {
  project: {
    android: {
      sourceDir: './android',
      // Configuration for finding React Native libraries
      unstable_reactLegacyComponentSets: [],
    },
  },
  // This is needed to properly link React Native libraries
  dependencies: {
    // Don't use project-based linking for these - use npm linking
    '@maniac-tech/react-native-expo-read-sms': {
      platforms: {
        android: {
          sourceDir: './android',
          packageImportPath: 'import { startReadSMS } from "@maniac-tech/react-native-expo-read-sms";',
        },
      },
    },
  },
};
