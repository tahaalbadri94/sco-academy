// Safe wrapper for expo-screen-capture that works in Expo Go
export async function preventCapture(tag: string): Promise<void> {
  try {
    const ScreenCapture = await import('expo-screen-capture');
    await ScreenCapture.preventScreenCaptureAsync(tag);
  } catch {
    // Silently fail in Expo Go environment
  }
}

export async function allowCapture(tag: string): Promise<void> {
  try {
    const ScreenCapture = await import('expo-screen-capture');
    await ScreenCapture.allowScreenCaptureAsync(tag);
  } catch {
    // Silently fail in Expo Go environment
  }
}
