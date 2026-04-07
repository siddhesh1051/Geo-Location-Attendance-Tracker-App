import { useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AppCard } from '../../components/ui/AppCard';
import { getTheme, isDarkResolved } from '../../utils/theme';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen: React.FC = () => {
  const systemScheme = useColorScheme();
  const theme = getTheme(isDarkResolved('system', systemScheme));
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [loading, setLoading] = useState(false);
  const redirectUrl = useMemo(
    () => AuthSession.makeRedirectUri({ path: 'oauth-native-callback' }),
    []
  );

  const onGooglePress = useCallback(async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Login failed', `Could not sign in with Google. Please try again.\n\n${message}`);
    } finally {
      setLoading(false);
    }
  }, [redirectUrl, startOAuthFlow]);

  const buttonLabel = useMemo(
    () => (loading ? 'Connecting...' : 'Continue with Google'),
    [loading]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppCard theme={theme} style={styles.card}>
        <View style={[styles.logoWrap, { borderColor: theme.border }]}>
          <Ionicons name="flash" size={24} color={theme.present} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Razor Attendance</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Login to sync attendance securely across devices.
        </Text>

        <Pressable
          disabled={loading}
          onPress={onGooglePress}
          style={({ pressed }) => [
            styles.googleButton,
            {
              borderColor: theme.border,
              backgroundColor: theme.card,
              opacity: pressed || loading ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="logo-google" size={16} color={theme.text} />
          <Text style={[styles.googleButtonText, { color: theme.text }]}>{buttonLabel}</Text>
        </Pressable>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    textAlign: 'center',
    fontSize: 13,
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 220,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
