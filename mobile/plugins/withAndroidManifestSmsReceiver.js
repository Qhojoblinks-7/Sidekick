/**
 * Expo Config Plugin for Custom SMS Receiver
 * 
 * This plugin automatically injects the custom SMS BroadcastReceiver
 * into AndroidManifest.xml during prebuild, preventing manual edits
 * from being overwritten.
 * 
 * Usage:
 * 1. Add to app.json plugins array:
 *    ["./plugins/withAndroidManifestSmsReceiver"]
 * 
 * 2. Run: npx expo prebuild --platform android
 */

const { withAndroidManifest, getMainApplicationOrApplicationAsync } = require('expo/config-plugins');

/**
 * The custom SMS receiver class name
 */
const SMS_RECEIVER_CLASS = 'com.maniac_tech.react_native_expo_read_sms.SmsReceiver';

/**
 * XML namespace for Android
 */
const ANDROID_XML = 'http://schemas.android.com/apk/res/android';

/**
 * Check if receiver already exists in manifest
 */
const receiverExists = (androidManifest) => {
  const { manifest } = androidManifest;
  if (!manifest || !manifest.application) return false;
  
  const application = Array.isArray(manifest.application) 
    ? manifest.application[0] 
    : manifest.application;
  
  if (!application || !application['receiver']) return false;
  
  const receivers = Array.isArray(application.receiver) 
    ? application.receiver 
    : [application.receiver];
  
  return receivers.some(receiver => {
    const attrs = receiver.$ || {};
    return attrs['android:name'] === SMS_RECEIVER_CLASS;
  });
};

/**
 * Add SMS receiver to AndroidManifest.xml
 */
const addSmsReceiver = (androidManifest) => {
  const { manifest } = androidManifest;
  
  if (!manifest) {
    throw new Error('AndroidManifest.xml is missing manifest element');
  }
  
  // Get application element
  let application = manifest.application;
  if (!application) {
    manifest.application = [{}];
    application = manifest.application[0];
  } else if (Array.isArray(application)) {
    application = application[0];
  }
  
  // Create receiver element
  const receiverElement = {
    $: {
      'android:name': SMS_RECEIVER_CLASS,
      'android:exported': 'false',
    },
    'intent-filter': [
      {
        $: {
          'android:priority': '1000',
        },
        action: [
          {
            $: {
              'android:name': 'android.provider.Telephony.SMS_RECEIVED',
            },
          },
        ],
      },
    ],
  };
  
  // Add receiver to application
  if (application.receiver) {
    const receivers = Array.isArray(application.receiver) 
      ? application.receiver 
      : [application.receiver];
    
    // Check if already exists
    if (receivers.some(r => r.$?.['android:name'] === SMS_RECEIVER_CLASS)) {
      console.log('[Config Plugin] SMS Receiver already exists, skipping');
      return androidManifest;
    }
    
    application.receiver = [...receivers, receiverElement];
  } else {
    application.receiver = [receiverElement];
  }
  
  console.log('[Config Plugin] SMS Receiver added to AndroidManifest.xml');
  return androidManifest;
};

/**
 * Add foreground service permission if missing
 */
const addForegroundServicePermissions = (androidManifest) => {
  const { manifest } = androidManifest;
  
  if (!manifest || !manifest['uses-permission']) {
    return androidManifest;
  }
  
  const permissions = Array.isArray(manifest['uses-permission'])
    ? manifest['uses-permission']
    : [manifest['uses-permission']];
  
  const requiredPermissions = [
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
    'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
    'android.permission.POST_NOTIFICATIONS',
  ];
  
  const existingNames = permissions
    .map(p => p.$?.['android:name'])
    .filter(Boolean);
  
  for (const perm of requiredPermissions) {
    if (!existingNames.includes(perm)) {
      manifest['uses-permission'].push({
        $: {
          'android:name': perm,
        },
      });
      console.log(`[Config Plugin] Added permission: ${perm}`);
    }
  }
  
  return androidManifest;
};

/**
 * Add foreground service declaration if missing
 */
const addForegroundService = (androidManifest) => {
  const { manifest } = androidManifest;
  
  if (!manifest || !manifest.application) {
    return androidManifest;
  }
  
  const application = Array.isArray(manifest.application)
    ? manifest.application[0]
    : manifest.application;
  
  if (!application || !application['service']) {
    return androidManifest;
  }
  
  const services = Array.isArray(application.service)
    ? application.service
    : [application.service];
  
  const fgServiceExists = services.some(s => {
    const name = s.$?.['android:name'];
    return name && name.includes('ForegroundService');
  });
  
  if (!fgServiceExists) {
    const fgServiceElement = {
      $: {
        'android:name': 'expo.modules.foregroundservice.ForegroundService',
        'android:foregroundServiceType': 'dataSync',
        'android:exported': 'false',
      },
      property: [
        {
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': 'tracking_earnings',
          },
        },
      ],
    };
    
    if (application.service) {
      application.service = Array.isArray(application.service)
        ? [...application.service, fgServiceElement]
        : [application.service, fgServiceElement];
    } else {
      application.service = [fgServiceElement];
    }
    
    console.log('[Config Plugin] Foreground Service added');
  }
  
  return androidManifest;
};

/**
 * Main config plugin function
 */
const withAndroidManifestSmsReceiver = (config) => {
  return withAndroidManifest(config, async (config) => {
    console.log('[Config Plugin] Applying SMS Receiver configuration...');
    
    // Add SMS receiver
    config.modResults = addSmsReceiver(config.modResults);
    
    // Add foreground service permissions
    config.modResults = addForegroundServicePermissions(config.modResults);
    
    // Add foreground service
    config.modResults = addForegroundService(config.modResults);
    
    return config;
  });
};

module.exports = withAndroidManifestSmsReceiver;
