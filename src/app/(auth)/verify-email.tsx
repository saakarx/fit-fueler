import { Image } from 'expo-image';
import { MailCheckIcon } from 'lucide-react-native';
import { Fragment, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  TextInputKeyPressEventData,
} from 'react-native';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

const VerifyEmailScreen = () => {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const inputRefs = useRef<(NativeTextInput | null)[]>([]);

  const onChangeCode = (text: string, idx: number) => {
    setOtp(prevVal => {
      const newOtp = [...prevVal];
      newOtp[idx] = text;
      return newOtp;
    });

    if (text !== '' && idx < otp.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    } else if (idx === otp.length - 1) {
      inputRefs.current[otp.length - 1]?.blur();
    }
  };

  const handleKeyPress = (
    { nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>,
    idx: number
  ) => {
    const regex = /^\d$/;

    if (key === 'Backspace' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (otp[idx] !== '' && regex.test(key) && idx < otp.length - 1) {
      onChangeCode(key, idx + 1);
    }
  };

  return (
    <Fragment>
      <Text
        textTransform='lowercase'
        fontSize={90}
        letterSpacing={4.5}
        fontFamily='BricolageGrotesque_400Regular'
        color='black500'
        // style={{
        //   alignSelf: 'flex-start',
        // }}
      >
        Verify Email
      </Text>

      <Image
        source={require('../../../assets/verify-email-illustration.svg')}
        style={{
          width: '70%',
          aspectRatio: 290 / 288,
          marginHorizontal: 'auto',
        }}
      />

      <Box gap='lg' alignSelf='stretch'>
        <Box flexDirection='row' gap='lg'>
          {otp.map((digit, idx) => (
            <Input
              borderColor={
                focusedIdx === idx
                  ? 'activeBottomBarLink'
                  : '$fieldInputBorderColor'
              }
              key={idx}
              flex={1}
            >
              <Input.Field
                placeholder='-'
                textAlign='center'
                keyboardType='numeric'
                enterKeyHint='next'
                maxLength={1}
                value={digit}
                ref={el => (inputRefs.current[idx] = el)}
                onChangeText={text => onChangeCode(text, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                onFocus={() => setFocusedIdx(idx)}
                onBlur={() => setFocusedIdx(null)}
              />
            </Input>
          ))}
        </Box>

        <Box
          borderRadius='md'
          shadowColor='pink'
          shadowOffset={{ width: 0, height: 6 }}
          shadowOpacity={0.37}
          shadowRadius={7.49}
          elevation={12}
        >
          <Box borderRadius='md' overflow='hidden'>
            <TouchableOpacity
              onPress={() => console.log('Verify OTP pressed')}
              overflow='visible'
              rippleColor='pink'
            >
              <Box
                flexDirection='row'
                alignItems='center'
                justifyContent='center'
                gap='md'
                p='md'
                borderRadius='md'
                bg='pink'
                borderColor='pink'
                borderWidth={1}
              >
                <Text
                  textTransform='uppercase'
                  letterSpacing={1.28}
                  fontSize={16}
                  lineHeight={21}
                  color='black900'
                  fontWeight='500'
                  fontFamily='WorkSans_500Medium'
                >
                  Verify OTP
                </Text>
                <LucideIcon Icon={MailCheckIcon} size={18} stroke='black900' />
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </Box>
    </Fragment>
  );
};

export default VerifyEmailScreen;
