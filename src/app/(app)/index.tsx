import { BottomSheetModal as RNBottomSheetModal } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import {
  CookingPotIcon,
  DonutIcon,
  DumbbellIcon,
  GlassWaterIcon,
  LucideIcon as RNLucideIcon,
  SandwichIcon,
  UtensilsIcon,
} from 'lucide-react-native';
import React, { useRef } from 'react';
import Snackbar from 'react-native-snackbar';

import {
  ActivityIndicator,
  Box,
  ScrollView,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import LogWaterBottomSheet from '@src/components/log-water-bottom-sheet';
import LogsList from '@src/components/logs-list';
import LucideIcon from '@src/components/lucide-icon';
import MealLogItem from '@src/components/meal-log-item';
import Separator from '@src/components/separator';
import WaterLogItem from '@src/components/water-log-item';
import WorkoutLogItem from '@src/components/workout-log-item';

import { useAuth } from '@src/context/auth';
import useGetMealsWithSS from '@src/hooks/useGetMealsWithSS';
import useGetWaterWithSS from '@src/hooks/useGetWaterWithSS';
import useGetWorkoutsWithSS from '@src/hooks/useGetWorkoutsWithSS';

import {
  createWaterLog,
  deleteMealLog,
  deleteWaterLog,
  deleteWorkoutLog,
  type MealLog,
} from '@src/firebase';
import type { MealTimeT } from '@src/types.type';

const AddWorkoutButton = () => {
  return (
    <Box borderRadius='md' overflow='hidden' alignSelf='flex-start'>
      <Link href='/log-workout' asChild>
        <TouchableOpacity
          alignItems='center'
          justifyContent='center'
          flexDirection='row'
          gap='md'
          rippleColor='black700'
          px='lg'
          py='sm'
          minHeight={36}
          borderWidth={1}
          borderColor='black500'
          borderRadius='md'
        >
          <LucideIcon
            Icon={DumbbellIcon}
            strokeWidth={2}
            size={20}
            stroke='lightBlue'
          />
          <Text
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
            textAlign='center'
            color='lightBlue'
          >
            Add Exercise
          </Text>
        </TouchableOpacity>
      </Link>
    </Box>
  );
};

const AddMealButton = ({
  mealTime,
  icon,
  text,
}: {
  mealTime: MealTimeT;
  icon: RNLucideIcon;
  text: string;
}) => {
  return (
    <Box borderRadius='md' overflow='hidden' alignSelf='flex-start'>
      <Link
        asChild
        href={{ pathname: '/log-meal', params: { mealTime: mealTime } }}
      >
        <TouchableOpacity
          flexDirection='row'
          gap='md'
          rippleColor='black700'
          px='lg'
          py='sm'
          minHeight={36}
          alignItems='center'
          justifyContent='center'
          borderWidth={1}
          borderColor='black500'
          borderRadius='md'
        >
          <LucideIcon Icon={icon} strokeWidth={2} size={20} stroke='yellow' />
          <Text
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
            textAlign='center'
            color='yellow'
          >
            Add {text}
          </Text>
        </TouchableOpacity>
      </Link>
    </Box>
  );
};

const AddWaterButton = ({ openSheet }: { openSheet: () => void }) => {
  return (
    <Box borderRadius='md' overflow='hidden' alignSelf='flex-start'>
      <TouchableOpacity
        justifyContent='center'
        alignItems='center'
        flexDirection='row'
        gap='md'
        minHeight={36}
        py='sm'
        px='lg'
        backgroundColor='$background'
        rippleColor='black700'
        borderWidth={1}
        borderColor='black500'
        borderRadius='md'
        onPress={() => openSheet()}
      >
        <LucideIcon Icon={GlassWaterIcon} stroke='lightGreen' size={20} />
        <Text
          fontWeight='500'
          fontFamily='WorkSans_500Medium'
          textAlign='center'
          color='lightGreen'
        >
          Add Water
        </Text>
      </TouchableOpacity>
    </Box>
  );
};

const WorkoutLogs = ({
  userId,
  selectedDate,
}: {
  userId: string;
  selectedDate: Date;
}) => {
  const { data, error, isError, isLoading } = useGetWorkoutsWithSS(
    userId,
    selectedDate
  );

  const removeLog = async ({
    id,
    loggedFor,
  }: {
    id: string;
    loggedFor: string;
  }) => {
    try {
      await deleteWorkoutLog(id, userId, loggedFor);
    } catch (error) {
      Snackbar.show({
        text: 'Something went wrong! Try again later',
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
    }
  };

  return (
    <Box>
      <Box flexDirection='row' gap='md' mb='md' alignItems='center'>
        <Text fontSize={20} fontFamily='WorkSans_500Medium'>
          Today's Workout
        </Text>
        <Text color='purple' fontFamily='WorkSans_500Medium'>
          ( {data?.length ?? 0} workout logged )
        </Text>
      </Box>

      <LogsList
        isLoading={isLoading}
        isEmpty={false}
        isError={isError}
        emptyText='No workout logged'
        error={error}
      >
        {data?.map(workout => (
          <WorkoutLogItem
            key={workout.id}
            workout={workout}
            removeWorkoutLogItem={removeLog}
          />
        ))}
      </LogsList>

      <AddWorkoutButton />
    </Box>
  );
};

const MealLogs = ({
  userId,
  selectedDate,
}: {
  userId: string;
  selectedDate: Date;
}) => {
  const { data, isLoading, isError, error } = useGetMealsWithSS(
    userId,
    selectedDate
  );
  const mealTimes: {
    text: string;
    mealTime: MealTimeT;
    mt: number;
    icon: RNLucideIcon;
  }[] = React.useMemo(
    () => [
      { text: 'Breakfast', mealTime: 'breakfast', mt: 0, icon: SandwichIcon },
      { text: 'Lunch', mealTime: 'lunch', mt: 12, icon: CookingPotIcon },
      { text: 'Dinner', mealTime: 'dinner', mt: 12, icon: UtensilsIcon },
      { text: 'Snacks', mealTime: 'snacks', mt: 12, icon: DonutIcon },
    ],
    []
  );
  const todayMeal = data
    ?.filter(meal => meal.loggedFor === format(selectedDate, 'dd-MM-yyyy'))
    .reduce(
      (acc, cur) => {
        acc[cur.mealTime].push(cur);
        return acc;
      },
      { breakfast: [], lunch: [], dinner: [], snacks: [] } as {
        breakfast: MealLog[];
        lunch: MealLog[];
        dinner: MealLog[];
        snacks: MealLog[];
      }
    );

  const removeLog = async ({
    id,
    loggedFor,
  }: {
    id: string;
    loggedFor: string;
  }) => {
    try {
      await deleteMealLog(id, userId, loggedFor);
    } catch (error) {
      Snackbar.show({
        text: 'Something went wrong! Try again later',
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
    }
  };

  if (isLoading)
    return (
      <Box height={100} alignItems='center' justifyContent='center' gap='sm'>
        <ActivityIndicator size='large' color='pink' />
        <Text fontSize={14} color='pink'>
          Loading...
        </Text>
      </Box>
    );

  if (isError) {
    console.error(error);
    return (
      <Box>
        <Text>Error getting meals</Text>
      </Box>
    );
  }

  return (
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

      {mealTimes.map((item, idx) => (
        <Box mb='md' key={idx}>
          <Text fontWeight='500' fontFamily='WorkSans_500Medium' fontSize={17}>
            {item.text}
          </Text>

          <Box gap='xs' my='sm'>
            {todayMeal &&
              todayMeal[item.mealTime].map(meal => (
                <MealLogItem
                  key={`${meal.id}-${item.mealTime}-${meal.mealName
                    .replaceAll(/\s/g, '_')
                    .toLowerCase()}-${meal.createdAt.toLocaleString()}`}
                  meal={meal}
                  removeMealLogItem={removeLog}
                />
              ))}
          </Box>

          <AddMealButton
            mealTime={item.mealTime}
            icon={item.icon}
            text={item.text}
          />
        </Box>
      ))}
    </Box>
  );
};

const WaterLogs = ({
  userId,
  selectedDate,
}: {
  userId: string;
  selectedDate: Date;
}) => {
  const bottomSheetRef = useRef<RNBottomSheetModal>(null);
  const { data, error, isError, isLoading } = useGetWaterWithSS(
    userId,
    selectedDate
  );

  const handleOpenSheet = () => {
    const { current: bottomSheet } = bottomSheetRef;

    if (bottomSheet) bottomSheet.present();
  };

  const handleCloseSheet = () => {
    const { current: bottomSheet } = bottomSheetRef;

    if (bottomSheet) bottomSheet.forceClose();
  };

  const handleOnLogPress = async (quantity: number, loggedFor: Date) => {
    const isUpdate = data !== null && data.length > 0;

    try {
      await createWaterLog({
        id: data && data.length > 0 ? data[data.length - 1].id : undefined,
        userId: userId,
        loggedFor: format(loggedFor, 'dd-MM-yyyy'),
        quantity: quantity,
        isUpdate: isUpdate,
      });
    } catch (error) {
      console.error(error);
      Snackbar.show({
        text: 'Something went wrong! Try again later',
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
    }
  };

  const removeLog = async ({
    id,
    loggedFor,
  }: {
    id: string;
    loggedFor: string;
  }) => {
    try {
      await deleteWaterLog(id, userId, loggedFor);
    } catch (error) {
      Snackbar.show({
        text: 'Something went wrong! Try again later',
        backgroundColor: '#212529',
        textColor: '#DA4167',
      });
    }
  };

  return (
    <Box>
      <Box flexDirection='row' gap='md' mb='md' alignItems='center'>
        <Text fontSize={20} fontFamily='WorkSans_500Medium' fontWeight='500'>
          Today's Water
        </Text>
        <Text color='purple' fontFamily='WorkSans_500Medium' fontWeight='500'>
          ( {data?.length ?? 0} water logged )
        </Text>
      </Box>

      <LogsList
        isLoading={isLoading}
        isEmpty={!data || !data.length}
        isError={isError}
        emptyText='No water logged'
        error={error}
      >
        {data?.map((water, idx) => (
          <WaterLogItem
            key={`${selectedDate.toString()}_${water.id}_${idx}`}
            water={water}
            removeWaterLogItem={removeLog}
          />
        ))}
      </LogsList>

      <AddWaterButton openSheet={handleOpenSheet} />
      <LogWaterBottomSheet
        ref={bottomSheetRef}
        collapse={handleCloseSheet}
        onLog={handleOnLogPress}
      />
    </Box>
  );
};

const HomeScreen = () => {
  const { auth } = useAuth();

  const today = new Date();

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
          {format(today, 'dd MMM')}
        </Text>

        <WorkoutLogs selectedDate={today} userId={auth?.id ?? ''} />
        <Separator width='90%' my='xl' horizontal={true} />

        <MealLogs selectedDate={today} userId={auth?.id ?? ''} />
        <Separator horizontal={true} width='90%' my='xl' />

        <WaterLogs selectedDate={today} userId={auth?.id ?? ''} />
      </Box>
    </ScrollView>
  );
};

export default HomeScreen;
