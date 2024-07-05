import { useTheme } from '@shopify/restyle';
import { format } from 'date-fns';
import React, { useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

import { ActivityIndicator, Box, ScrollView, Text } from '@src/atoms';
import { useAuth } from '@src/context/auth';
import useGetMealsWithInterval from '@src/hooks/useGetMealsWithInterval';
import useGetWaterWithInterval from '@src/hooks/useGetWaterWithInterval';
import useGetWorkoutsWithInterval from '@src/hooks/useGetWorkoutsWithInterval';
import { Theme } from '@src/themes';

const screenWidth = Dimensions.get('window').width;

const Charts = () => {
  const { auth } = useAuth();
  const today = useRef(new Date());

  const {
    data: workoutData,
    error: workoutDataError,
    isError: isWorkoutDataError,
    isLoading: isWorkoutDataLoading,
  } = useGetWorkoutsWithInterval(auth?.id ?? '', today.current);

  const {
    data: mealData,
    error: mealDataError,
    isError: isMealDataError,
    isLoading: isMealDataLoading,
  } = useGetMealsWithInterval(auth?.id ?? '', today.current);

  const {
    data: waterData,
    error: waterDataError,
    isError: isWaterDataError,
    isLoading: isWaterDataLoading,
  } = useGetWaterWithInterval(auth?.id ?? '', today.current);

  return (
    <ScrollView flex={1} backgroundColor='$background' px='md' pb='lg'>
      <Text style={[styles.header, { marginTop: 12 }]}>
        This weeks' workout duration
      </Text>
      {isWorkoutDataLoading ? (
        <Box height={220} alignItems='center' justifyContent='center' gap='sm'>
          <ActivityIndicator size='large' color='pink' />
          <Text
            fontSize={14}
            color='pink'
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
          >
            Loading...
          </Text>
        </Box>
      ) : isWorkoutDataError ? (
        <Box>
          <Text color='danger' fontSize={15}>
            {JSON.stringify(workoutDataError)}
          </Text>
        </Box>
      ) : (
        workoutData !== null && <WorkoutChart data={workoutData} />
      )}

      <Text style={styles.header}>This weeks' calories intake</Text>
      {isMealDataLoading ? (
        <Box height={220} alignItems='center' justifyContent='center' gap='sm'>
          <ActivityIndicator size='large' color='pink' />
          <Text
            fontSize={14}
            color='pink'
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
          >
            Loading...
          </Text>
        </Box>
      ) : isMealDataError ? (
        <Box>
          <Text color='danger' fontSize={15}>
            {JSON.stringify(mealDataError)}
          </Text>
        </Box>
      ) : (
        mealData !== null && <MealChart data={mealData} />
      )}

      <Text style={styles.header}>This weeks' water consumption</Text>
      {isWaterDataLoading ? (
        <Box height={220} alignItems='center' justifyContent='center' gap='sm'>
          <ActivityIndicator size='large' color='pink' />
          <Text
            fontSize={14}
            color='pink'
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
          >
            Loading...
          </Text>
        </Box>
      ) : isWaterDataError ? (
        <Box>
          <Text color='danger' fontSize={15}>
            {JSON.stringify(waterDataError)}
          </Text>
        </Box>
      ) : (
        waterData !== null && <WaterChart data={waterData} />
      )}
    </ScrollView>
  );
};

const WorkoutChart = ({
  data,
}: {
  data: { date: Date; weekDay: string; duration: number }[];
}) => {
  const { colors } = useTheme<Theme>();
  const chartData = data.map(workout => ({
    value: workout.duration,
    label: format(workout.date, 'dd EEE'),
  }));

  return (
    <LineChart
      data={chartData}
      curved={!chartData.some(i => i.value < 5)}
      areaChart={true}
      width={screenWidth - 24}
      height={220}
      isAnimated={true}
      thickness={2}
      noOfSections={5}
      startOpacity={0.5}
      endOpacity={0}
      dataPointsColor={colors.purple}
      startFillColor={colors.purple}
      color={colors.purple}
      rulesColor={colors.black300}
      xAxisColor={colors.black300}
      xAxisIndicesColor={colors.black300}
      xAxisLabelTextStyle={{ color: colors.black300 }}
      xAxisLabelsVerticalShift={2}
      yAxisColor={colors.black300}
      yAxisIndicesColor={colors.black300}
      yAxisTextStyle={{ color: colors.black300 }}
    />
  );
};

const MealChart = ({
  data,
}: {
  data: {
    date: Date;
    weekDay: string;
    calories: number;
  }[];
}) => {
  const { colors } = useTheme<Theme>();

  const BAR_SPACING = 8;
  const TOTAL_SPACING_BTW_BARS =
    BAR_SPACING * (data.length - 1) + 2 * BAR_SPACING;
  const barWidth =
    (screenWidth - 24 - TOTAL_SPACING_BTW_BARS) / (data.length + 1);

  const chartData = data.map(item => ({
    value: item.calories,
    label: `${item.date.getDate()} ${item.weekDay}`,
  }));

  return (
    <BarChart
      data={chartData}
      isAnimated={true}
      width={screenWidth - 24}
      height={220}
      barWidth={barWidth}
      barBorderRadius={4}
      barMarginBottom={6}
      spacing={BAR_SPACING}
      noOfSections={5}
      rulesColor={colors.black300}
      xAxisLabelTextStyle={{ color: colors.black300 }}
      yAxisTextStyle={{ color: colors.black300 }}
      xAxisColor={colors.black300}
      yAxisColor={colors.black300}
      frontColor={colors.purple}
    />
  );
};

const WaterChart = ({
  data,
}: {
  data: { date: Date; weekDay: string; quantity: number }[];
}) => {
  const { colors } = useTheme<Theme>();
  const chartData = data.map(item => ({
    value: item.quantity,
    label: `${item.date.getDate()} ${item.weekDay}`,
  }));

  return (
    <LineChart
      data={chartData}
      areaChart={true}
      width={screenWidth - 24}
      height={220}
      isAnimated={true}
      thickness={2}
      noOfSections={4}
      yAxisLabelPrefix=''
      yAxisLabelSuffix='ml'
      color={colors.purple}
      dataPointsColor={colors.purple}
      startFillColor={colors.purple}
      startOpacity={0.5}
      endOpacity={0}
      rulesColor={colors.black300}
      xAxisColor={colors.black300}
      yAxisColor={colors.black300}
      xAxisLabelTextStyle={{ color: colors.black300 }}
      yAxisTextStyle={{ color: colors.black300 }}
      curved={!chartData.some(i => i.value < 5)}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'WorkSans_500Medium',
    color: 'white',

    marginTop: 24,
    marginBottom: 16,
  },
});

export default Charts;
