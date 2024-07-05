import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

const Switch = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.elastic(1),
    }).start();
  }, [value]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        width: 40,

        padding: 4,

        borderRadius: 99999,
        backgroundColor: value ? '#96E6B3' : '#8E9AAF',
        alignItems: 'center',
        flexDirection: 'row',

        shadowColor: '#212529',
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 16,
        elevation: 16,
      }}
    >
      <Animated.View
        style={{
          transform: [{ translateX: translateX }],
          width: 18,
          height: 18,
          borderRadius: 99999,
          backgroundColor: 'white',
          shadowColor: '#212529',
          shadowOpacity: 0.5,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 16,
          elevation: 16,
        }}
      />
    </Pressable>
  );
};

export default Switch;
