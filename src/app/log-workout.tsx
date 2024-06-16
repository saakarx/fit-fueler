import {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetModal as RNBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { router, Stack } from 'expo-router';
import { useSetAtom } from 'jotai';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react-native';
import { useRef, useState } from 'react';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import { BottomSheetModal } from '@src/atoms/bottom-sheet';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

import { addWorkoutLog } from '@src/states/log-workouts';

const exercises = [
  { id: '1', name: 'Abdominal Crunches' },
  { id: '2', name: 'Abdominal Leg Raise' },
  { id: '3', name: 'Abdominal Twist, Seated, Machine' },
  { id: '4', name: 'Back Butterfly' },
  { id: '5', name: 'Back Extension' },
  { id: '6', name: 'Bar Dip, Palms in, Neutral Grip' },
  { id: '7', name: 'Barbell Military Press' },
  { id: '8', name: 'Barbell Row, Bent Over' },
  { id: '9', name: 'Bench (Chest) Press, Machine' },
];

const LogWorkoutScreen = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeExercise, setActiveExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const bottomSheetRef = useRef<RNBottomSheetModal>(null);
  const addWorkoutLogItem = useSetAtom(addWorkoutLog);

  const handleOpenBottomSheet = () => {
    const { current: bottomSheet } = bottomSheetRef;
    if (bottomSheet) bottomSheet.present();
  };

  return (
    <Box flex={1} bg='$background' p='md'>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: true,
          headerTitle: 'Log Workout',
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
                      rippleColor='$background'
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

      <Box mb='md'>
        <Input px='md'>
          <Input.Icon
            Icon={SearchIcon}
            mr='md'
            stroke='purple'
            strokeWidth={2}
          />
          <Input.Field
            placeholder='Search exercise'
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {!!searchTerm.length && (
            <Box borderRadius='full' overflow='hidden'>
              <TouchableOpacity
                rippleColor='pink'
                width={32}
                height={32}
                borderRadius='full'
                alignItems='center'
                justifyContent='center'
                onPress={() => setSearchTerm('')}
              >
                <Input.Icon Icon={XIcon} />
              </TouchableOpacity>
            </Box>
          )}
        </Input>
      </Box>

      <Box gap='sm'>
        {exercises.map(exercise => (
          <Box key={exercise.id} borderRadius='md' overflow='hidden'>
            <TouchableOpacity
              onPress={() => {
                setActiveExercise({ id: exercise.id, name: exercise.name });
                handleOpenBottomSheet();
              }}
              bg='black700'
              rippleColor='black700'
              p='md'
              borderRadius='md'
              flexDirection='row'
              alignItems='center'
              justifyContent='space-between'
            >
              <Text>{exercise.name}</Text>
              <LucideIcon
                Icon={ChevronRightIcon}
                stroke='black300'
                strokeWidth={1.5}
                size={20}
              />
            </TouchableOpacity>
          </Box>
        ))}
      </Box>

      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose={true}
        snapPoints={['40%', '80%']}
        detached={true}
        topInset={12}
        bottomInset={12}
        keyboardBehavior='fillParent'
        keyboardBlurBehavior='restore'
        onDismiss={() => setActiveExercise(null)}
        style={{ marginHorizontal: 12 }}
      >
        <BottomSheetView style={{ flex: 1, padding: 12 }}>
          <Text
            fontSize={24}
            fontWeight='600'
            fontFamily='WorkSans_600SemiBold'
            mb='lg'
          >
            {`Log Workout › \n\n`}
            {activeExercise && activeExercise.name}
          </Text>

          <Text
            color='$fieldInputPlaceholderTextColor'
            fontSize={15}
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
            mb='xs'
          >
            Number of Sets
          </Text>
          <BottomSheetTextInput
            placeholder='Required'
            style={{
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              color: 'white',
              borderWidth: 1,
              borderColor: '#888',
            }}
            placeholderTextColor='#777'
            cursorColor='white'
          />

          <Text
            color='$fieldInputPlaceholderTextColor'
            fontSize={15}
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
            mt='sm'
            mb='xs'
          >
            Repetions / Set
          </Text>
          <BottomSheetTextInput
            placeholder='Required'
            style={{
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              color: 'white',
              borderWidth: 1,
              borderColor: '#888',
            }}
            placeholderTextColor='#777'
            cursorColor='white'
          />

          <Text
            color='$fieldInputPlaceholderTextColor'
            fontSize={15}
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
            mt='sm'
            mb='xs'
          >
            Weight per Repetition
          </Text>
          <BottomSheetTextInput
            placeholder='Optional'
            style={{
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              color: 'white',
              borderWidth: 1,
              borderColor: '#888',
            }}
            placeholderTextColor='#777'
            cursorColor='white'
          />

          <Box mt='lg' borderRadius='sm' overflow='hidden'>
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
              onPress={() => {
                if (!activeExercise) return;

                addWorkoutLogItem({
                  name: activeExercise.name,
                  reps: 8,
                  sets: 2,
                  weight: 0,
                  logged_for: new Date(),
                });
              }}
            >
              <Text
                color='black900'
                fontSize={15}
                lineHeight={17}
                fontWeight='500'
                fontFamily='WorkSans_500Medium'
              >
                Log Workout
              </Text>
              <LucideIcon Icon={PlusIcon} stroke='black900' size={20} />
            </TouchableOpacity>
          </Box>
        </BottomSheetView>
      </BottomSheetModal>
    </Box>
  );
};

export default LogWorkoutScreen;
