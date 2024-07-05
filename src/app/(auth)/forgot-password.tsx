import { Image } from 'expo-image';
import { AtSignIcon, SendIcon } from 'lucide-react-native';
import React, { Fragment } from 'react';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

const ForgotPasswordScreen = () => {
  return (
    <Fragment>
      <Text
        textTransform='lowercase'
        fontSize={90}
        letterSpacing={4.5}
        fontFamily='BricolageGrotesque_400Regular'
        color='black500'
      >
        Forgot Password?
      </Text>
      <Image
        source={require('../../../assets/forgot-password-illustration.svg')}
        style={{
          width: '100%',
          aspectRatio: 398 / 265,
          marginHorizontal: 'auto',
        }}
      />
      <Box gap='lg'>
        <Input pl='md'>
          <Input.Icon mr='md' Icon={AtSignIcon} />
          <Input.Field
            placeholder='dummy@gmail.com'
            keyboardType='email-address'
            enterKeyHint='next'
          />
        </Input>

        <Box
          borderRadius='md'
          shadowColor='pink'
          shadowOffset={{ width: 0, height: 6 }}
          shadowOpacity={0.37}
          shadowRadius={7.49}
          elevation={12}
        >
          <Box borderRadius='md' overflow='hidden'>
            <TouchableOpacity onPress={() => console.log('Send OTP pressed')}>
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
                shadowColor='purple'
                shadowOffset={{ width: 0, height: 6 }}
                shadowOpacity={0.37}
                shadowRadius={7.49}
                elevation={12}
              >
                <Text
                  textTransform='uppercase'
                  letterSpacing={1.28}
                  fontSize={16}
                  lineHeight={21}
                  color='black900'
                  fontFamily='WorkSans_500Medium'
                >
                  Send OTP
                </Text>
                <LucideIcon Icon={SendIcon} size={18} stroke='black900' />
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </Box>
    </Fragment>
  );
};

export default ForgotPasswordScreen;
