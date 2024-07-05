import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { PenIcon, RulerIcon, WeightIcon } from 'lucide-react-native';
import React from 'react';
import Snackbar from 'react-native-snackbar';

import {
  Box,
  LinearGradient,
  ScrollView,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import ChangeTheme from '@src/components/change-theme-dropdown';
import LucideIcon from '@src/components/lucide-icon';
import SignoutButton from '@src/components/sign-out-button';
import Switch from '@src/components/switch';

import { useAuth } from '@src/context/auth';
import { toggleNotifications } from '@src/firebase/profile';

const ProfileScreen = () => {
  const { auth } = useAuth();

  return (
    <ScrollView flex={1} bg='$background'>
      <Box flex={1} bg='$background' py='xl' px='md'>
        <Text
          fontSize={66}
          fontFamily='BricolageGrotesque_400Regular'
          lineHeight={66}
          color='black500'
          my='md'
        >
          Profile
        </Text>

        <Box alignItems='center'>
          <Box
            maxWidth={175}
            maxHeight={175}
            mt='lg'
            aspectRatio={1 / 1}
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
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              dither={false}
              position='absolute'
              top={0}
              right={0}
              bottom={0}
              left={0}
              zIndex={10}
              borderRadius='lg'
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

          <Box flexDirection='row' alignItems='center' gap='md' mt='lg'>
            <Text
              fontFamily='WorkSans_500Medium'
              fontWeight='500'
              fontSize={22}
            >
              John Smith
            </Text>

            {auth && auth.sex !== null ? (
              <Image
                source={
                  auth.sex === 'male'
                    ? require(`../../../../assets/gender-male.svg`)
                    : require('../../../../assets/gender-female.svg')
                }
                style={{ width: 20, height: 20 }}
              />
            ) : (
              <Text color='lightGreen'>?</Text>
            )}
          </Box>

          <Box flexDirection='row' alignItems='center' gap='md' mt='lg'>
            <LucideIcon
              Icon={WeightIcon}
              size={20}
              absoluteStrokeWidth
              stroke='lightGreen'
              strokeWidth={1}
            />
            <Text>
              Weight - {auth && auth.weight !== null ? auth.weight : '?'} Kg
            </Text>
          </Box>

          <Box flexDirection='row' alignItems='center' gap='md' mt='md'>
            <LucideIcon
              Icon={RulerIcon}
              size={20}
              absoluteStrokeWidth
              stroke='lightGreen'
              strokeWidth={1}
            />
            <Text>
              Height - {auth && auth.height !== null ? auth.height : '?'} cm
            </Text>
          </Box>

          <Box mt='3xl' borderRadius='md' overflow='hidden'>
            <Link push={true} href='/profile/edit' asChild>
              <TouchableOpacity
                flexDirection='row'
                gap='sm'
                px='md'
                py='sm'
                borderColor='lightGreen'
                borderWidth={1}
                borderRadius='md'
                backgroundColor='$background'
                rippleColor='black700'
              >
                <LucideIcon
                  Icon={PenIcon}
                  stroke='lightGreen'
                  strokeWidth={1}
                  size={16}
                />
                <Text fontSize={14} lineHeight={16} color='lightGreen'>
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </Link>
          </Box>
        </Box>

        <Box
          borderBottomWidth={1}
          borderColor='black700'
          width='100%'
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          gap='md'
          mt='6xl'
          py='lg'
        >
          <Text
            fontSize={18}
            fontFamily='WorkSans_600SemiBold'
            fontWeight='600'
          >
            Notifications
          </Text>
          <Switch
            value={auth?.notificationsEnabled ?? true}
            onChange={async (value: boolean) => {
              if (!auth) {
                Snackbar.show({
                  text: 'Unauthorized! Must be logged in to perform action',
                  textColor: '#DA4167',
                });
                return;
              }

              await toggleNotifications(auth.id, value);
            }}
          />
        </Box>

        <ChangeTheme />
        <SignoutButton />
      </Box>
    </ScrollView>
  );
};

export default ProfileScreen;
