import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { COLORS } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/login-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 132, 62, 0.4)', 'rgba(0, 107, 50, 0.85)', 'rgba(15, 23, 42, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative elements */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200 }}
          style={[styles.decorCircle, { top: -50, right: -50, width: 200, height: 200 }]}
        />

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
            style={styles.logoContainer}
          >
            <Image
              source={require('../../assets/UBS.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 500 }}
            style={styles.textContainer}
          >
            <Text style={styles.title}>
              UHAS <Text style={styles.titleAccent}>BASIC</Text> SCHOOL
            </Text>
            <Text style={styles.motto}>LEARNING TODAY LEADING TOMORROW</Text>
            <Text style={styles.description}>
              Empowering the next generation with knowledge, discipline, and a bright future. 
              Welcome to our digital academic campus.
            </Text>
          </MotiView>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 700 }}
          style={styles.footer}
        >
          <TouchableOpacity
            style={styles.buttonShadow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={['#00843e', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <View style={styles.buttonIconBox}>
                <ChevronRight size={20} color={COLORS.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoImage: {
    width: '75%',
    height: '75%',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  titleAccent: {
    color: '#facc15',
  },
  motto: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
    maxWidth: width * 0.85,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderRadius: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  buttonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WelcomeScreen;
