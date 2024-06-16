import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

const Switch = () => {
  const [notifsEnabled, setNotifsEnabled] = useState<boolean>(false);
  const animatedValue = useRef(
    new Animated.Value(notifsEnabled ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: notifsEnabled ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.elastic(1),
    }).start();
  }, [notifsEnabled]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 14],
  });

  return (
    <Pressable
      onPress={() => setNotifsEnabled(prevVal => !prevVal)}
      style={{
        width: 40,

        padding: 4,

        borderRadius: 99999,
        backgroundColor: notifsEnabled ? '#96E6B3' : '#8E9AAF',
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
