import RNDateTimePicker from '@react-native-community/datetimepicker';
import firestore from '@react-native-firebase/firestore';
import { format, parse } from 'date-fns';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Formik } from 'formik';
import { ArrowLeftIcon, UserCheck2Icon } from 'lucide-react-native';
import React, { useState } from 'react';
import { GestureResponderEvent } from 'react-native';
import Snackbar from 'react-native-snackbar';
import * as yup from 'yup';

import {
  ActivityIndicator,
  Box,
  LinearGradient,
  ScrollView,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import FieldError from '@src/components/field-error';
import FieldLabel from '@src/components/field-label';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

import { useAuth } from '@src/context/auth';

const editProfileSchema = yup.object({
  name: yup.string().trim().required('Required'),
  sex: yup
    .string()
    .matches(/male|female/)
    .required('Required'),
  weight: yup.number().required('Required'),
  height: yup.number().required('Required'),
  dateOfBirth: yup.date().required('Required'),
  zipcode: yup.string().trim().required('Required'),
});

const ProfileEditScreen = () => {
  const [isDatePickerVisible, setIsDatePickerVisible] =
    useState<boolean>(false);
  const { auth } = useAuth();

  const onSubmit = async (values: {
    name: string;
    sex: 'male' | 'female' | null;
    weight: string;
    height: string;
    dateOfBirth: Date | null;
    zipcode: string;
  }) => {
    if (!auth) {
      Snackbar.show({
        text: 'Must be logged in to perform action',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
      return;
    }
    if (values.sex === null) {
      Snackbar.show({
        text: 'Must select sex',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
      return;
    }

    const updateUser = {
      name: values.name,
      sex: values.sex,
      weight: +values.weight,
      height: +values.height,
      dateOfBirth: values.dateOfBirth
        ? format(values.dateOfBirth, 'dd-MM-yyyy')
        : null,
      zipcode: values.zipcode,

      updatedAt: new Date(),
    };

    try {
      await firestore().collection('users').doc(auth.id).update(updateUser);
      Snackbar.show({
        text: 'Update successful',
        textColor: '#BEE3DB',
        backgroundColor: '#212529',
      });
    } catch (error) {
      console.error('Error updating user:', error);
      Snackbar.show({
        text: 'Something went wrong! Try again later',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
    }
  };

  return (
    <ScrollView flex={1} bg='$background'>
      <Box flex={1} bg='$background' px='md' pb='2xl'>
        <Stack.Screen
          options={{
            headerShown: true,
            headerBackVisible: true,
            headerTitle: 'Edit Profile',
            header: headerProps => {
              return (
                <Box
                  p='sm'
                  gap='sm'
                  flexDirection='row'
                  alignItems='center'
                  justifyContent='space-between'
                  bg='$background'
                >
                  {headerProps.options.headerBackVisible && (
                    <Box overflow='hidden' borderRadius='full'>
                      <TouchableOpacity
                        onPress={() => router.back()}
                        rippleColor='$backgroundRippleColor'
                        width={36}
                        height={36}
                        borderRadius='full'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <LucideIcon Icon={ArrowLeftIcon} size={20} />
                      </TouchableOpacity>
                    </Box>
                  )}
                </Box>
              );
            },
          }}
        />

        <Text
          fontSize={66}
          fontFamily='BricolageGrotesque_400Regular'
          lineHeight={66}
          color='black500'
          my='md'
        >
          Edit Profile
        </Text>

        <Box
          maxWidth={175}
          maxHeight={175}
          aspectRatio={1 / 1}
          style={{ marginTop: 36, marginHorizontal: 'auto' }}
          position='relative'
          borderRadius='lg'
          overflow='hidden'
        >
          <LinearGradient
            colors={[
              'rgba(115,115,115,0)',
              'rgba(33,37,41,0.5)',
              'rgba(33,37,41,0.95)',
              'rgba(33,37,41,1)',
            ]}
            locations={[0, 0.59, 0.83, 1]}
            dither={false}
            position='absolute'
            top={0}
            right={0}
            bottom={0}
            left={0}
            zIndex={10}
          />
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              overflow: 'hidden',
              borderRadius: 16,
            }}
          />
        </Box>

        <Formik
          initialValues={{
            name: auth && auth.name ? auth.name : '',
            sex: auth && auth.sex,
            weight: auth && auth.weight ? String(auth.weight) : '',
            height: auth && auth.height ? String(auth.height) : '',
            dateOfBirth:
              auth && auth.dateOfBirth !== null
                ? parse(auth.dateOfBirth, 'dd-MM-yyyy', new Date())
                : null,
            zipcode: (auth && auth?.zipcode) ?? '',
          }}
          validationSchema={editProfileSchema}
          onSubmit={onSubmit}
        >
          {({
            values,
            errors,
            isSubmitting,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
          }) => (
            <>
              <FieldLabel label='Name' />
              <Input px='md'>
                <Input.Field
                  placeholder='John Smith'
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                />
              </Input>
              <FieldError touched={touched.name} error={errors.name} />

              <FieldLabel label='Sex' />
              <Box flexDirection='row' gap='md'>
                <ToggleButton
                  text='Male'
                  value='male'
                  selected={values.sex === 'male'}
                  onPress={value => setFieldValue('sex', value)}
                />
                <ToggleButton
                  text='Female'
                  value='female'
                  selected={values.sex === 'female'}
                  onPress={value => setFieldValue('sex', value)}
                />
              </Box>
              <FieldError touched={touched.sex} error={errors.sex} />

              <FieldLabel label='Weight' />
              <Input px='md'>
                <Input.Field
                  placeholder='55'
                  keyboardType='numeric'
                  value={values.weight}
                  onChangeText={handleChange('weight')}
                  onBlur={handleBlur('weight')}
                />
              </Input>
              <FieldError touched={touched.weight} error={errors.weight} />

              <FieldLabel label='Height' />
              <Input px='md'>
                <Input.Field
                  placeholder='165'
                  keyboardType='numeric'
                  value={values.height}
                  onChangeText={handleChange('height')}
                  onBlur={handleBlur('height')}
                />
              </Input>
              <FieldError touched={touched.height} error={errors.height} />

              <FieldLabel label='Date of Birth' />
              <Box overflow='hidden' borderRadius='md'>
                <TouchableOpacity
                  onPress={() => setIsDatePickerVisible(true)}
                  backgroundColor='$background'
                  rippleColor='$backgroundRippleColor'
                >
                  <Box
                    justifyContent='center'
                    borderColor='$fieldInputBorderColor'
                    borderWidth={1}
                    borderRadius='md'
                    minHeight={45}
                    p='md'
                  >
                    <Text
                      fontFamily='WorkSans_400Regular'
                      color={
                        values.dateOfBirth
                          ? '$foreground'
                          : '$fieldInputPlaceholderTextColor'
                      }
                      fontSize={16}
                      lineHeight={18}
                    >
                      {values.dateOfBirth
                        ? format(values.dateOfBirth, 'dd-MM-yyyy')
                        : 'Select a date'}
                    </Text>
                  </Box>
                </TouchableOpacity>
              </Box>
              <FieldError
                touched={touched.dateOfBirth}
                error={errors.dateOfBirth}
              />
              {isDatePickerVisible && (
                <RNDateTimePicker
                  mode='date'
                  value={values.dateOfBirth ?? new Date()}
                  onChange={(_ev, date) => {
                    if (date) setFieldValue('dateOfBirth', date);
                    else console.warn('Date not available');

                    setIsDatePickerVisible(false);
                  }}
                />
              )}

              <FieldLabel label='Zipcode' />
              <Input px='md'>
                <Input.Field
                  placeholder='133001'
                  keyboardType='numeric'
                  value={values.zipcode}
                  onChangeText={handleChange('zipcode')}
                  onBlur={handleBlur('zipcode')}
                />
              </Input>
              <FieldError touched={touched.zipcode} error={errors.zipcode} />

              <SubmitButton
                isSubmitting={isSubmitting}
                onPress={() => handleSubmit()}
              />
            </>
          )}
        </Formik>
      </Box>
    </ScrollView>
  );
};

const SubmitButton = ({
  isSubmitting,
  onPress,
}: {
  isSubmitting: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) => (
  <Box
    mt='lg'
    borderRadius='sm'
    overflow='hidden'
    opacity={isSubmitting ? 0.5 : 1}
  >
    <TouchableOpacity
      bg='pink'
      rippleColor='pink'
      minHeight={42}
      p='sm'
      borderRadius='sm'
      alignItems='center'
      justifyContent='center'
      flexDirection='row'
      gap='sm'
      disabled={isSubmitting}
      onPress={onPress}
    >
      {isSubmitting ? (
        <ActivityIndicator color='black900' />
      ) : (
        <>
          <Text
            color='black900'
            fontSize={15}
            lineHeight={17}
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
          >
            Update
          </Text>
          <LucideIcon Icon={UserCheck2Icon} stroke='black900' size={16} />
        </>
      )}
    </TouchableOpacity>
  </Box>
);

const ToggleButton = ({
  text,
  value,
  selected,
  onPress,
}: {
  text: string;
  value: string;
  selected: boolean;
  onPress: (value: string) => void;
}) => {
  return (
    <Box borderRadius='md' overflow='hidden'>
      <TouchableOpacity
        borderRadius='md'
        px='md'
        py='xs'
        bg={selected ? 'pink' : '$background'}
        rippleColor='$backgroundRippleColor'
        borderWidth={1}
        borderColor='pink'
        style={[!selected && { backgroundColor: 'transparent' }]}
        onPress={() => onPress(value)}
      >
        <Text
          fontWeight={selected ? '500' : '400'}
          fontFamily={selected ? 'WorkSans_500Medium' : 'WorkSans_400Regular'}
          color={selected ? 'black900' : 'pink'}
        >
          {text}
        </Text>
      </TouchableOpacity>
    </Box>
  );
};

export default ProfileEditScreen;
