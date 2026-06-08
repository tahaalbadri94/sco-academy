import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      const id = await Application.getAndroidId();
      return id ?? Device.osInternalBuildId ?? 'unknown-android';
    } else if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      return id ?? 'unknown-ios';
    }
    return `${Device.modelName}-${Device.osVersion}-${Device.deviceName}`;
  } catch {
    return 'fallback-device-id';
  }
}
