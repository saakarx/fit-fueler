import { Image } from 'expo-image';
import { Link } from 'expo-router';
import {
  AtSignIcon,
  EyeIcon,
  EyeOffIcon,
  RectangleEllipsisIcon,
  UserRoundIcon,
  UserRoundPlusIcon,
} from 'lucide-react-native';
import { Fragment, useState } from 'react';

import { Box, Pressable, Text, TouchableOpacity } from '@src/atoms';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

const SignupScreen = () => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  return (
    <Fragment>
      <Text
        textTransform='lowercase'
        fontSize={90}
        letterSpacing={4.5}
        fontFamily='BricolageGrotesque_400Regular'
        color='black500'
      >
        Sign up
      </Text>

      <Image
        source={require('../../../assets/signup-illustration.svg')}
        style={{ width: '100%', minHeight: 290, marginHorizontal: 'auto' }}
      />

      <Box gap='lg'>
        <Input pl='md'>
          <Input.Icon mr='md' Icon={UserRoundIcon} />
          <Input.Field
            placeholder='John Smith'
            keyboardType='default'
            enterKeyHint='next'
          />
        </Input>

        <Input pl='md'>
          <Input.Icon mr='md' Icon={AtSignIcon} />
          <Input.Field
            placeholder='dummy@gmail.com'
            keyboardType='email-address'
            enterKeyHint='next'
          />
        </Input>

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

        <Box
          shadowColor='pink'
          shadowOffset={{ width: 0, height: 6 }}
          shadowOpacity={0.37}
          shadowRadius={7.49}
          elevation={12}
          borderRadius='md'
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
                  Sign up
                </Text>
                <LucideIcon
                  Icon={UserRoundPlusIcon}
                  size={18}
                  stroke='black900'
                />
              </Box>
            </TouchableOpacity>
          </Box>
        </Box>

        <Text textAlign='center'>
          Already have an account?{' '}
          <Link href='/signup' asChild>
            <Text color='pink' fontWeight='500' fontFamily='WorkSans_500Medium'>
              Sign in
            </Text>
          </Link>
        </Text>
      </Box>
    </Fragment>
  );
};

export default SignupScreen;
