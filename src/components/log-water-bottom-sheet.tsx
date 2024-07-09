import {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetModal as RNBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { GlassWaterIcon, PlusIcon } from 'lucide-react-native';
import React, { forwardRef, Fragment, useState } from 'react';

import {
  ActivityIndicator,
  BottomSheetModal,
  Box,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import LucideIcon from './lucide-icon';

const AddWaterPill = ({
  quantity,
  onPress,
}: {
  quantity: number;
  onPress: () => void;
}) => {
  return (
    <Box flex={1} minWidth={150} borderRadius='md' overflow='hidden'>
      <TouchableOpacity
        borderRadius='md'
        bg='$background'
        rippleColor='$backgroundRippleColor'
        borderWidth={1}
        borderColor='$bottomBarActiveItem'
        alignItems='center'
        justifyContent='center'
        gap='xs'
        p='sm'
        onPress={onPress}
      >
        <LucideIcon
          Icon={GlassWaterIcon}
          size={24}
          stroke='$bottomBarActiveItem'
          strokeWidth={2}
        />
        <Text
          fontFamily='WorkSans_600SemiBold'
          fontWeight='600'
          color='$bottomBarActiveItem'
        >
          +{quantity} ml
        </Text>
      </TouchableOpacity>
    </Box>
  );
};

type LogWaterBottomSheetProps = {
  collapse: () => void;
  onLog: (quantity: number, loggedFor: Date) => Promise<void>;
};

const LogWaterBottomSheet = forwardRef<
  RNBottomSheetModal,
  LogWaterBottomSheetProps
>(({ collapse, onLog }, ref) => {
  const [waterQuantity, setWaterQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogOnPress = async () => {
    setIsLoading(true);

    const date = new Date();
    await onLog(waterQuantity, date);

    setWaterQuantity(0);
    collapse();
    setIsLoading(false);
  };

  return (
    <BottomSheetModal
      name='water-log-bottom-sheet-modal'
      ref={ref}
      index={1}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      enablePanDownToClose={true}
      detached={true}
      topInset={12}
      bottomInset={12}
      snapPoints={['30%', '60%']}
      style={{ marginHorizontal: 12, zIndex: 1000 }}
      enableDismissOnClose
      onDismiss={() => {
        setWaterQuantity(0);
      }}
    >
      <BottomSheetView style={{ flex: 1, padding: 12 }}>
        <Text fontSize={24} fontWeight='600' fontFamily='WorkSans_600SemiBold'>
          Log your water intake
        </Text>

        <Text
          textAlign='center'
          fontSize={40}
          fontWeight='600'
          fontFamily='WorkSans_600SemiBold'
          my='lg'
        >
          {waterQuantity} ml
        </Text>

        <Box flexDirection='row' flexWrap='wrap' gap='md'>
          <AddWaterPill
            quantity={250}
            onPress={() => setWaterQuantity(prevVal => prevVal + 250)}
          />
          <AddWaterPill
            quantity={500}
            onPress={() => setWaterQuantity(prevVal => prevVal + 500)}
          />
          <AddWaterPill
            quantity={750}
            onPress={() => setWaterQuantity(prevVal => prevVal + 750)}
          />
          <AddWaterPill
            quantity={1000}
            onPress={() => setWaterQuantity(prevVal => prevVal + 1000)}
          />
        </Box>

        <Box
          mt='lg'
          borderRadius='sm'
          overflow='hidden'
          opacity={isLoading ? 0.5 : 1}
        >
          <TouchableOpacity
            borderRadius='sm'
            backgroundColor='pink'
            p='sm'
            height={42}
            alignItems='center'
            justifyContent='center'
            flexDirection='row'
            gap='sm'
            onPress={handleLogOnPress}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color='black900' />
            ) : (
              <Fragment>
                <Text
                  color='black900'
                  fontWeight='500'
                  fontFamily='WorkSans_500Medium'
                  lineHeight={17}
                >
                  Log
                </Text>
                <LucideIcon
                  Icon={PlusIcon}
                  stroke='black900'
                  strokeWidth={2}
                  size={18}
                />
              </Fragment>
            )}
          </TouchableOpacity>
        </Box>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default LogWaterBottomSheet;
