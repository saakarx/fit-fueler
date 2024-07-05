import firebaseAuth from '@react-native-firebase/auth';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { AuthErrorCodes } from 'firebase/auth';
import { Formik } from 'formik';
import {
  AtSignIcon,
  EyeIcon,
  EyeOffIcon,
  LogInIcon,
  RectangleEllipsisIcon,
} from 'lucide-react-native';
import React, { Fragment, useState } from 'react';
import Snackbar from 'react-native-snackbar';
import * as yup from 'yup';

import {
  ActivityIndicator,
  Box,
  Pressable,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import FieldError from '@src/components/field-error';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

const signinSchema = yup.object({
  email: yup.string().email('Must be valid email').required('Required'),
  password: yup
    .string()
    .min(6, 'Must be atleast 6 characters')
    .required('Required'),
});

const getSigninErrorText = (error: any): string => {
  switch (error.code) {
    case AuthErrorCodes.USER_DELETED:
      return 'Unauthorized';

    case AuthErrorCodes.INVALID_EMAIL:
      return 'Invalid credentials, check email and password';

    case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
      return 'Invalid credentials, check email and password';

    default:
      return 'Something went wrong! Try again later';
  }
};

const SigninScreen = () => {
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  const signin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      await firebaseAuth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);

      Snackbar.show({
        text: getSigninErrorText(error),
        backgroundColor: '#212529',
        textColor: '#DA4167',
        duration: Snackbar.LENGTH_LONG,
      });
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
      >
        Sign in
      </Text>

      <Image
        source={require('../../../assets/signin-illustration.svg')}
        style={{ width: 338, height: 206, marginHorizontal: 'auto' }}
      />

      <Box gap='lg'>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={signinSchema}
          onSubmit={signin}
        >
          {({
            values,
            touched,
            errors,
            isSubmitting,
            handleChange,
            handleBlur,
            handleSubmit,
          }) => (
            <>
              <Box>
                <Input pl='md'>
                  <Input.Icon mr='md' Icon={AtSignIcon} />
                  <Input.Field
                    placeholder='dummy@gmail.com'
                    keyboardType='email-address'
                    enterKeyHint='next'
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                  />
                </Input>
                <FieldError touched={touched.email} error={errors.email} />
              </Box>
              <Box>
                <Input pl='md'>
                  <Input.Icon mr='md' Icon={RectangleEllipsisIcon} />
                  <Input.Field
                    placeholder='Password'
                    keyboardType={
                      passwordVisible ? 'visible-password' : 'default'
                    }
                    secureTextEntry={!passwordVisible}
                    enterKeyHint='next'
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
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
                <FieldError
                  touched={touched.password}
                  error={errors.password}
                />
              </Box>
              <Link href='/forgot-password' asChild>
                <Text
                  textAlign='right'
                  fontWeight='500'
                  fontFamily='WorkSans_500Medium'
                  color='pink'
                >
                  Forgot password?
                </Text>
              </Link>
              <Box
                shadowColor='pink'
                shadowOffset={{ width: 0, height: 6 }}
                shadowOpacity={0.37}
                shadowRadius={7.49}
                elevation={12}
                borderRadius='md'
                opacity={isSubmitting ? 0.6 : 1}
              >
                <Box borderRadius='md' overflow='hidden'>
                  <TouchableOpacity
                    disabled={isSubmitting}
                    onPress={() => handleSubmit()}
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
                      {isSubmitting ? (
                        <ActivityIndicator color='black900' />
                      ) : (
                        <>
                          <Text
                            textTransform='uppercase'
                            letterSpacing={1.28}
                            fontSize={16}
                            lineHeight={21}
                            color='black900'
                            fontFamily='WorkSans_500Medium'
                          >
                            Sign in
                          </Text>
                          <LucideIcon
                            Icon={LogInIcon}
                            size={18}
                            stroke='black900'
                          />
                        </>
                      )}
                    </Box>
                  </TouchableOpacity>
                </Box>
              </Box>
            </>
          )}
        </Formik>
        <Text textAlign='center'>
          Don’t have an account?{' '}
          <Link href='/signup' asChild>
            <Text color='pink' fontWeight='500' fontFamily='WorkSans_500Medium'>
              Create one
            </Text>
          </Link>
        </Text>
      </Box>
    </Fragment>
  );
};

export default SigninScreen;
