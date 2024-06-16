import {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetModal as RNBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@shopify/restyle';
import { Link } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { GlassWaterIcon, MinusIcon, PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { StyleProp, TextStyle } from 'react-native';

import { Box, Text, TouchableOpacity, BottomSheetModal } from '@src/atoms';
import LucideIcon from '@src/components/lucide-icon';
import Separator from '@src/components/separator';

import { loggedWorkouts, removeWorkoutLog } from '@src/states/log-workouts';
import { loggedMeals, removeLogMeal } from '@src/states/logged-meals';

import { Theme } from '@src/themes';

import type { MealTimeT } from '@src/types.type';

const AddWorkoutButton = () => {
  return (
    <Link href='/log-workout' asChild>
      <TouchableOpacity
        rippleColor='$background'
        borderStyle='dashed'
        borderColor='white'
        borderWidth={1.5}
        borderRadius='sm'
        px='md'
        py='sm'
        height={45}
        alignItems='center'
        justifyContent='center'
      >
        <Text textAlign='center'>Add Exercise</Text>
      </TouchableOpacity>
    </Link>
  );
};

const AddMealButton = ({ mealTime }: { mealTime: MealTimeT }) => {
  return (
    <Box borderRadius='sm' overflow='hidden'>
      <Link
        asChild
        href={{ pathname: '/log-meal', params: { mealTime: mealTime } }}
      >
        <TouchableOpacity
          rippleColor='$background'
          borderStyle='dashed'
          borderWidth={1.5}
          borderColor='white'
          borderRadius='sm'
          px='md'
          py='sm'
          height={45}
          alignItems='center'
          justifyContent='center'
        >
          <Text textAlign='center'>Add Food</Text>
        </TouchableOpacity>
      </Link>
    </Box>
  );
};

const AddWaterButton = ({ openSheet }: { openSheet: () => void }) => {
  return (
    <Box borderRadius='sm' overflow='hidden'>
      <TouchableOpacity
        justifyContent='center'
        alignItems='center'
        flexDirection='row'
        gap='md'
        borderRadius='sm'
        borderColor='white'
        borderStyle='dashed'
        borderWidth={1.5}
        height={45}
        py='sm'
        px='md'
        backgroundColor='$background'
        rippleColor='$background'
        onPress={() => openSheet()}
      >
        <LucideIcon Icon={GlassWaterIcon} stroke='lightGreen' size={20} />
        <Text color='lightGreen' textAlign='center'>
          Add Water
        </Text>
      </TouchableOpacity>
    </Box>
  );
};

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
        rippleColor='$background'
        borderWidth={1}
        borderColor='activeBottomBarLink'
        alignItems='center'
        justifyContent='center'
        gap='xs'
        p='sm'
        onPress={onPress}
      >
        <LucideIcon
          Icon={GlassWaterIcon}
          size={24}
          stroke='activeBottomBarLink'
          strokeWidth={2}
        />
        <Text
          fontFamily='WorkSans_600SemiBold'
          fontWeight='600'
          color='activeBottomBarLink'
        >
          +{quantity} ml
        </Text>
      </TouchableOpacity>
    </Box>
  );
};

const HomeScreen = () => {
  const theme = useTheme<Theme>();
  const bottomSheetRef = useRef<RNBottomSheetModal>(null);

  const meals = useAtomValue(loggedMeals);
  const workouts = useAtomValue(loggedWorkouts);
  const removeMealLogItem = useSetAtom(removeLogMeal);
  const removeWorkoutLogItem = useSetAtom(removeWorkoutLog);

  const todayMeal = meals.find(
    meal => meal.for.toLocaleDateString() === new Date().toLocaleDateString()
  );

  const linkStyle: StyleProp<TextStyle> = {
    ...theme.textVariants.defaults,
    marginBottom: theme.spacing.lg,
    textDecorationLine: 'underline',
    color: theme.colors.$foreground,
  };

  const handleOpenSheet = () => {
    const { current: bottomSheet } = bottomSheetRef;

    if (bottomSheet) bottomSheet.present();
  };

  return (
    <Box flex={1} bg='$background'>
      <Link style={linkStyle} href='/signin'>
        Signin Screen
      </Link>
      <Link style={linkStyle} href='/signup'>
        Signup Screen
      </Link>
      <Link style={linkStyle} href='/forgot-password'>
        Forgot Password Screen
      </Link>
      <Link style={linkStyle} href='/verify-email'>
        Verify Email Screen
      </Link>
      <Link style={linkStyle} href='/reset-password'>
        Reset Password Screen
      </Link>

      <Box px='md'>
        {/* WORKOUT LOGGING SECTION BELOW */}
        <Box>
          <Box flexDirection='row' gap='md' mb='md' alignItems='center'>
            <Text fontSize={20} fontFamily='WorkSans_500Medium'>
              Today's Workout
            </Text>
            <Text color='purple' fontFamily='WorkSans_500Medium'>
              ( {workouts.length} workout logged )
            </Text>
          </Box>

          <Box gap='xs' my='sm'>
            {workouts.map(workout => {
              const today = new Date();
              if (
                workout.logged_for.toLocaleDateString() ===
                today.toLocaleDateString()
              ) {
                return (
                  <Box
                    key={workout.id}
                    bg='black700'
                    p='sm'
                    px='lg'
                    borderRadius='md'
                    gap='xxs'
                    flexDirection='row'
                    alignItems='center'
                    justifyContent='space-between'
                  >
                    <Box>
                      <Text fontWeight='500' fontFamily='WorkSans_500Medium'>
                        {workout.name}
                      </Text>
                      <Text color='$fieldInputPlaceholderTextColor'>
                        {workout.reps} Reps, {workout.sets} Sets,{' '}
                        {workout.weight} kg
                      </Text>
                    </Box>
                    <Box borderRadius='full' overflow='hidden'>
                      <TouchableOpacity
                        bg='black700'
                        rippleColor='black500'
                        p='sm'
                        borderRadius='full'
                        onPress={() => {
                          removeWorkoutLogItem({
                            id: workout.id,
                            logged_for: workout.logged_for,
                          });
                        }}
                      >
                        <LucideIcon
                          Icon={MinusIcon}
                          size={18}
                          stroke='$fieldInputPlaceholderTextColor'
                        />
                      </TouchableOpacity>
                    </Box>
                  </Box>
                );
              }
            })}
          </Box>

          <AddWorkoutButton />
        </Box>

        <Separator width='90%' my='xl' horizontal={true} />

        {/* MEALS LOGGING SECTION BELOW */}
        <Box>
          <Box flexDirection='row' gap='md' mb='md' alignItems='center'>
            <Text fontSize={20} fontFamily='WorkSans_500Medium'>
              Today's Meals
            </Text>
            <Text color='purple' fontFamily='WorkSans_500Medium'>
              ({' '}
              {todayMeal
                ? todayMeal.breakfast.length +
                  todayMeal.lunch.length +
                  todayMeal.dinner.length +
                  todayMeal.snacks.length
                : 0}{' '}
              meals logged )
            </Text>
          </Box>

          {(
            [
              { text: 'Breakfast', mealTime: 'breakfast', mt: 0 },
              { text: 'Lunch', mealTime: 'lunch', mt: 12 },
              { text: 'Dinner', mealTime: 'dinner', mt: 12 },
              { text: 'Snacks', mealTime: 'snacks', mt: 12 },
            ] as {
              text: string;
              mealTime: MealTimeT;
              mt: number;
            }[]
          ).map((item, idx) => (
            <Box mb='md' key={idx}>
              <Text
                fontWeight='500'
                fontFamily='WorkSans_500Medium'
                fontSize={17}
              >
                {item.text}
              </Text>

              <Box gap='xs' my='sm'>
                {todayMeal &&
                  todayMeal[item.mealTime].map(meal => (
                    <Box
                      key={`${item.mealTime}-${
                        meal.id
                      }-${meal.created_at.toLocaleTimeString()}`}
                      bg='black700'
                      p='sm'
                      px='lg'
                      borderRadius='md'
                      gap='xxs'
                      flexDirection='row'
                      alignItems='center'
                      justifyContent='space-between'
                    >
                      <Box>
                        <Text fontWeight='500' fontFamily='WorkSans_500Medium'>
                          {meal.meal_name}
                        </Text>
                        <Text color='$fieldInputPlaceholderTextColor'>
                          {meal.number_of_servings} {meal.serving_size}
                        </Text>
                      </Box>
                      <Box borderRadius='full' overflow='hidden'>
                        <TouchableOpacity
                          bg='black700'
                          rippleColor='black500'
                          p='sm'
                          borderRadius='full'
                          onPress={() => {
                            removeMealLogItem({
                              id: meal.id,
                              for: meal.logged_for_date,
                              mealTime: item.mealTime,
                            });
                          }}
                        >
                          <LucideIcon
                            Icon={MinusIcon}
                            size={18}
                            stroke='$fieldInputPlaceholderTextColor'
                          />
                        </TouchableOpacity>
                      </Box>
                    </Box>
                  ))}
              </Box>

              <AddMealButton mealTime={item.mealTime} />
            </Box>
          ))}
        </Box>

        <Separator horizontal={true} width='90%' my='xl' />

        <AddWaterButton openSheet={handleOpenSheet} />

        <Box height={70 + 32} />
      </Box>

      <BottomSheetModal
        name='water-log-bottom-sheet-modal'
        ref={bottomSheetRef}
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
      >
        <BottomSheetView style={{ flex: 1, padding: 12 }}>
          <Text
            fontSize={24}
            fontWeight='600'
            fontFamily='WorkSans_600SemiBold'
            mb='lg'
          >
            Log your water intake
          </Text>

          <Box flexDirection='row' flexWrap='wrap' gap='md'>
            <AddWaterPill
              quantity={250}
              onPress={() => console.log('+250ml water log')}
            />
            <AddWaterPill
              quantity={500}
              onPress={() => console.log('+500ml water log')}
            />
            <AddWaterPill
              quantity={750}
              onPress={() => console.log('+750ml water log')}
            />
            <AddWaterPill
              quantity={1000}
              onPress={() => console.log('+1000ml water log')}
            />
          </Box>

          <Box mt='lg' borderRadius='sm' overflow='hidden'>
            <TouchableOpacity
              borderRadius='sm'
              backgroundColor='pink'
              p='sm'
              height={42}
              alignItems='center'
              justifyContent='center'
              flexDirection='row'
              gap='sm'
              onPress={() => console.log('Logged water intake')}
            >
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
            </TouchableOpacity>
          </Box>
        </BottomSheetView>
      </BottomSheetModal>
    </Box>
  );
};

export default HomeScreen;
