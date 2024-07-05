import { Image } from 'expo-image';
import {
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  RectangleEllipsisIcon,
} from 'lucide-react-native';
import React, { Fragment, useState } from 'react';

import { Box, Pressable, Text, TouchableOpacity } from '@src/atoms';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

const ResetPasswordScreen = () => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState<boolean>(false);

  return (
    <Fragment>
      <Text
        textTransform='lowercase'
        fontSize={90}
        letterSpacing={4.5}
        fontFamily='BricolageGrotesque_400Regular'
        color='black500'
      >
        Reset Password
      </Text>

      <Image
        source={require('../../../assets/reset-password-illustration.svg')}
        style={{
          width: '100%',
          aspectRatio: 398 / 278,
          marginHorizontal: 'auto',
        }}
      />

      <Box gap='lg'>
        <Input pl='md'>
          <Input.Icon mr='md' Icon={RectangleEllipsisIcon} />
          <Input.Field
            placeholder='Password'
            keyboardType={passwordVisible ? 'visible-password' : 'default'}
            secureTextEntry={!passwordVisible}
            enterKeyHint='next'
          />
          <Pressable
            onPress={() => setPasswordVisible(prevVal => !prevVal)}
            p='sm'
            borderRadius='full'
            mr='xs'
          >
            {passwordVisible ? (
              <Input.Icon Icon={EyeIcon} />
            ) : (
              <Input.Icon Icon={EyeOffIcon} />
            )}
          </Pressable>
        </Input>

        <Input pl='md'>
          <Input.Icon mr='md' Icon={RectangleEllipsisIcon} />
          <Input.Field
            placeholder='Confirm Password'
            keyboardType={
              confirmPasswordVisible ? 'visible-password' : 'default'
            }
            secureTextEntry={!confirmPasswordVisible}
            enterKeyHint='next'
          />
          <Pressable
            onPress={() => setConfirmPasswordVisible(prevVal => !prevVal)}
            p='sm'
            borderRadius='full'
            mr='xs'
          >
            {confirmPasswordVisible ? (
              <Input.Icon Icon={EyeIcon} />
            ) : (
              <Input.Icon Icon={EyeOffIcon} />
            )}
          </Pressable>
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
            <TouchableOpacity onPress={() => console.log('Sign in pressed')}>
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
                  fontFamily='WorkSans_500Medium'
                >
                  Reset Password
                </Text>
                <LucideIcon Icon={KeyIcon} size={18} stroke='black900' />
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>
      </Box>
    </Fragment>
  );
};

export default ResetPasswordScreen;
