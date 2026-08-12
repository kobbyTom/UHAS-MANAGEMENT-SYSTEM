import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';

const Header = ({ title, subtitle, Icon, iconSize = 22, RightComponent, showBack = true }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <LinearGradient
      colors={['#00843e', '#006b32', '#0f4a2e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 20, paddingBottom: 16 }}
    >
      <View style={styles.headerContent}>
        {showBack && navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#fff" size={24} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {Icon && !RightComponent && (
          <View style={styles.iconBox}>
            <Icon size={iconSize} color="#fff" />
          </View>
        )}
        {RightComponent && (
          <View>
            <RightComponent />
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});

export default Header;
