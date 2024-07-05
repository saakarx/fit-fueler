import {
  addDays,
  eachDayOfInterval,
  format,
  isAfter,
  isSameDay,
  subDays,
} from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LucideIcon as RNLucideIcon,
} from 'lucide-react-native';
import React, { Fragment, useMemo, useState } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  ActivityIndicator,
  AnimatedBox,
  Box,
  ScrollView,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import LogsList from '@src/components/logs-list';
import LucideIcon from '@src/components/lucide-icon';
import MealLogItem from '@src/components/meal-log-item';
import WaterLogItem from '@src/components/water-log-item';
import WorkoutLogItem from '@src/components/workout-log-item';

import { useAuth } from '@src/context/auth';
import useGetMealsWithSS from '@src/hooks/useGetMealsWithSS';
import useGetWaterWithSS from '@src/hooks/useGetWaterWithSS';
import useGetWorkoutsWithSS from '@src/hooks/useGetWorkoutsWithSS';

import { type MealLog } from '@src/firebase';
import type { MealTimeT } from '@src/types.type';

const getDaysList = (curDate: Date = new Date()) => {
  const twoDaysPrev = subDays(curDate, 2);
  const twoDaysNext = addDays(curDate, 2);

  return eachDayOfInterval({ start: twoDaysPrev, end: twoDaysNext });
};

const DatePill = ({
  date,
  isActive,
  isDisabled,
  onPress,
}: {
  date: Date;
  isActive: boolean;
  isDisabled: boolean;
  onPress: () => void;
}) => {
  return (
    <Box
      overflow='hidden'
      flex={1}
      borderRadius='sm'
      opacity={isDisabled ? 0.35 : 1}
    >
      <TouchableOpacity
        flexGrow={1}
        width='100%'
        onPress={onPress}
        borderRadius='sm'
        alignItems={'center'}
        borderWidth={1}
        backgroundColor={isActive ? 'black700' : '$background'}
        borderColor='black500'
        style={{ paddingVertical: 6 }}
        disabled={isDisabled}
      >
        <Text
          fontSize={13}
          fontWeight='500'
          fontFamily='WorkSans_500Medium'
          marginBottom='xs'
          color={isActive ? 'white' : 'black300'}
        >
          {format(date, 'EEE')}
        </Text>
        <Text
          fontSize={15}
          fontWeight='600'
          fontFamily='WorkSans_600SemiBold'
          color={isActive ? 'white' : 'black300'}
        >
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    </Box>
  );
};

const IconButton = ({
  icon,
  isDisabled,
  onPress,
}: {
  icon: RNLucideIcon;
  isDisabled: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedBox
      borderRadius='full'
      overflow='hidden'
      style={[animatedStyle, { marginVertical: 'auto' }]}
      opacity={isDisabled ? 0.5 : 1}
    >
      <TouchableOpacity
        width={40}
        height={40}
        backgroundColor='$background'
        rippleColor='black500'
        alignItems='center'
        justifyContent='center'
        borderRadius='full'
        borderWidth={1}
        borderColor='black700'
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isDisabled}
      >
        <LucideIcon Icon={icon} size={20} />
      </TouchableOpacity>
    </AnimatedBox>
  );
};

const WorkoutLogs = ({ selectedDate }: { selectedDate: Date }) => {
  const { auth } = useAuth();

  const {
    isLoading: isWorkoutsLoading,
    data: workoutLogs,
    isError: isWorkoutsError,
    error: workoutsError,
  } = useGetWorkoutsWithSS(auth?.id ?? '', selectedDate);

  return (
    <LogsList
      isLoading={isWorkoutsLoading}
      isEmpty={!workoutLogs || !workoutLogs.length}
      isError={isWorkoutsError}
      error={workoutsError}
      emptyText='No workout logged'
    >
      {workoutLogs?.map(workout => (
        <WorkoutLogItem
          key={workout.id}
          workout={workout}
          removeWorkoutLogItem={() => {}} // FIXME:
        />
      ))}
    </LogsList>
  );
};

const MealLogs = ({ selectedDate }: { selectedDate: Date }) => {
  const { auth } = useAuth();
  const {
    isLoading: isMealsLoading,
    data: mealsLogs,
    isError: isMealsError,
    error: mealsError,
  } = useGetMealsWithSS(auth?.id ?? '', selectedDate);

  const mealsByIntervals = useMemo(() => {
    if (mealsLogs && mealsLogs.length) {
      return mealsLogs.reduce(
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
    }

    return { breakfast: [], lunch: [], dinner: [], snacks: [] } as {
      breakfast: MealLog[];
      lunch: MealLog[];
      dinner: MealLog[];
      snacks: MealLog[];
    };
  }, [mealsLogs]);

  if (isMealsLoading)
    return (
      <Box height={100} alignItems='center' justifyContent='center' gap='sm'>
        <ActivityIndicator size='large' color='pink' />
        <Text fontSize={14} color='pink'>
          Loading...
        </Text>
      </Box>
    );

  if (isMealsError) {
    console.error(mealsError);
    return (
      <Box>
        <Text>Error getting meals</Text>
        <Text>Error encountered</Text>
        <Text
          color='danger'
          fontSize={20}
          fontWeight='600'
          fontFamily='WorkSans_600SemiBold'
        >
          {mealsError.message}
        </Text>
      </Box>
    );
  }

  if (!mealsLogs || !mealsLogs.length)
    return (
      <Box py='md' px='sm'>
        <Text>No meals logged</Text>
      </Box>
    );

  return (
    <Box gap='xs' my='xs'>
      {(
        [
          { text: 'Breakfast', mealTime: 'breakfast', mt: 0 },
          { text: 'Lunch', mealTime: 'lunch', mt: 4 },
          { text: 'Dinner', mealTime: 'dinner', mt: 4 },
          { text: 'Snacks', mealTime: 'snacks', mt: 4 },
        ] as {
          text: string;
          mealTime: MealTimeT;
          mt: number;
        }[]
      ).map((item, idx) => {
        if (!mealsByIntervals[item.mealTime].length) return null;

        return (
          <Fragment key={`${new Date().toString()}_${item.mealTime}_${idx}`}>
            <Text
              fontSize={17}
              fontWeight='500'
              fontFamily='WorkSans_500Medium'
              color='$fieldInputPlaceholderTextColor'
              style={{ marginTop: item.mt }}
            >
              {item.text}
            </Text>

            {mealsByIntervals[item.mealTime].map((meal, mealIdx) => (
              <MealLogItem
                key={`${new Date().toString()}_${item.mealTime}_${
                  meal.id
                }_${mealIdx}`}
                meal={meal}
                removeMealLogItem={() => {}}
              />
            ))}
          </Fragment>
        );
      })}
    </Box>
  );
};

const WaterLogs = ({ selectedDate }: { selectedDate: Date }) => {
  const { auth } = useAuth();
  const {
    isLoading: isWaterLoading,
    data: waterLogs,
    isError: isWaterError,
    error: waterError,
  } = useGetWaterWithSS(auth?.id ?? '', selectedDate);

  return (
    <LogsList
      isLoading={isWaterLoading}
      isEmpty={!waterLogs || !waterLogs.length}
      isError={isWaterError}
      emptyText='No water logged'
      error={waterError}
    >
      {waterLogs?.map(water => {
        return (
          <WaterLogItem
            key={water.id}
            water={water}
            removeWaterLogItem={() => {}}
          />
        );
      })}
    </LogsList>
  );
};

const LogsScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dates = useMemo(() => getDaysList(selectedDate), [selectedDate]);

  const today = new Date();
  const isNextDisabled =
    isSameDay(selectedDate, today) || isAfter(selectedDate, today);

  return (
    <ScrollView flex={1} bg='$background'>
      <Box flex={1} py='xl' px='md' backgroundColor='$background'>
        <Box
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
          marginBottom='md'
        >
          <Text
            fontSize={66}
            fontFamily='BricolageGrotesque_400Regular'
            lineHeight={66}
            color='black500'
            my='md'
          >
            Logs
          </Text>
          <Text fontFamily='WorkSans_500Medium' fontWeight='500' fontSize={18}>
            {format(selectedDate, 'MMMM yyyy')}
          </Text>
        </Box>

        <Box
          flexDirection='row'
          alignItems='flex-start'
          justifyContent='space-between'
          gap='xs'
        >
          <IconButton
            icon={ChevronLeftIcon}
            isDisabled={false}
            onPress={() => setSelectedDate(prevValue => subDays(prevValue, 1))}
          />

          {dates.map((date, dateIdx) => (
            <DatePill
              key={dateIdx}
              isActive={isSameDay(date, selectedDate)}
              isDisabled={isAfter(date, today)}
              date={date}
              onPress={() => setSelectedDate(date)}
            />
          ))}
          <IconButton
            icon={ChevronRightIcon}
            isDisabled={isNextDisabled}
            onPress={() =>
              setSelectedDate(prevValue => {
                const newDate = addDays(prevValue, 1);
                if (isAfter(newDate, new Date())) return prevValue;
                return newDate;
              })
            }
          />
        </Box>

        {/* Workout Logs */}
        <Box mt='lg'>
          <Text fontSize={20} fontFamily='WorkSans_500Medium'>
            Workouts
          </Text>

          <WorkoutLogs selectedDate={selectedDate} />
        </Box>

        {/* Meal Logs */}
        <Box mt='lg'>
          <Text fontSize={22} fontFamily='WorkSans_500Medium'>
            Meals
          </Text>

          <MealLogs selectedDate={selectedDate} />
        </Box>

        {/* Water Logs */}
        <Box mt='lg'>
          <Text fontSize={20} fontFamily='WorkSans_500Medium'>
            Water
          </Text>

          <WaterLogs selectedDate={selectedDate} />
        </Box>
      </Box>
    </ScrollView>
  );
};

export default LogsScreen;
