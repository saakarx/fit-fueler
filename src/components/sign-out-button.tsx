import firebaseAuth from '@react-native-firebase/auth';
import { LogOutIcon } from 'lucide-react-native';
import React, { useState } from 'react';

import { ActivityIndicator, Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

const SignoutButton = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const signout = async () => {
    await firebaseAuth().signOut();
  };

  return (
    <Box borderRadius='md' overflow='hidden' mt='md'>
      <TouchableOpacity
        bg='$background'
        rippleColor='black700'
        minHeight={42}
        flexDirection='row'
        alignItems='center'
        justifyContent='center'
        gap='md'
        borderRadius='md'
        borderWidth={1}
        borderColor='danger'
        opacity={isLoading ? 0.5 : 1}
        disabled={isLoading}
        onPress={async () => {
          setIsLoading(true);
          await signout();
          setIsLoading(false);
        }}
      >
        {isLoading ? (
          <ActivityIndicator color='danger' />
        ) : (
          <>
            <Text
              color='danger'
              fontWeight='500'
              fontFamily='WorkSans_500Medium'
              textTransform='uppercase'
              letterSpacing={2}
              lineHeight={20}
              style={{ marginLeft: 2 }}
            >
              Sign out
            </Text>
            <LucideIcon
              Icon={LogOutIcon}
              size={20}
              strokeWidth={2}
              stroke='danger'
            />
          </>
        )}
      </TouchableOpacity>
    </Box>
  );
};

export default SignoutButton;
