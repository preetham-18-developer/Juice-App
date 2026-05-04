import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../theme/tokens';

const { width } = Dimensions.get('window');

export interface ToastHandle {
  show: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

export const Toast = forwardRef<ToastHandle>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('success');
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useImperativeHandle(ref, () => ({
    show: (msg, t = 'success', duration = 3000) => {
      setMessage(msg);
      setType(t);
      setVisible(true);
      
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 20,
          useNativeDriver: true,
          tension: 80,
          friction: 10
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      setTimeout(() => {
        hide();
      }, duration);
    }
  }));

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => setVisible(false));
  };

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#1e293b';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} color={COLORS.white} />;
      case 'error': return <AlertCircle size={20} color={COLORS.white} />;
      case 'info': return <Info size={20} color={COLORS.white} />;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          opacity
        }
      ]}
    >
      <View style={styles.content}>
        {getIcon()}
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  }
});
