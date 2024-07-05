import { BottomSheetModal as RNBottomSheetModal } from '@gorhom/bottom-sheet';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { router, Stack } from 'expo-router';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { FlatList } from 'react-native';

import { ActivityIndicator, Box, Text, TouchableOpacity } from '@src/atoms';
import CreateWorkoutLogBottomSheet from '@src/components/create-workout-log-bottom-sheet';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';

import { GetWorkoutsResponse } from '@src/types.type';

const getExercises = ({
  limit = 20,
  page = 1,
}: {
  limit?: number;
  page?: number;
}): Promise<GetWorkoutsResponse> => {
  const EXERCISES_API_URL = new URL('https://wger.de/api/v2/exercisebaseinfo');
  EXERCISES_API_URL.searchParams.set('ordering', 'id');
  EXERCISES_API_URL.searchParams.set('limit', String(limit));
  EXERCISES_API_URL.searchParams.set('offset', String((page - 1) * limit));

  return axios.get(EXERCISES_API_URL.toString()).then(res => res.data);
};

const LogWorkoutScreen = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deferredSearchTerm, setDeferredSearchTerm] = useState<string>('');
  const [activeExercise, setActiveExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const bottomSheetRef = useRef<RNBottomSheetModal>(null);
  const limit = useRef(20).current;
  const timer = useRef<NodeJS.Timeout>();

  const {
    isLoading,
    data: exercisesData,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['exercises'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      return getExercises({ limit, page: pageParam });
    },
    getNextPageParam: lastPage => {
      const url = new URL(lastPage.next ?? '');
      const searchParams = new URLSearchParams(url.search);
      const offset = Number(searchParams.get('offset') ?? 0);

      return lastPage.next !== null ? offset / limit + 1 : null;
    },
  });

  React.useEffect(() => {
    timer.current = setTimeout(() => {
      setDeferredSearchTerm(searchTerm);
    }, 1000);

    return () => {
      clearTimeout(timer.current);
    };
  }, [searchTerm]);

  const handleOpenBottomSheet = () => {
    const { current: bottomSheet } = bottomSheetRef;
    if (bottomSheet) bottomSheet.present();
  };

  const handleCloseBottomSheet = () => {
    const { current: bottomSheet } = bottomSheetRef;
    if (bottomSheet) bottomSheet.forceClose();

    setActiveExercise(null);
  };

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  if (isError) console.error(error);

  const exerciseResults = React.useMemo(() => {
    const result = exercisesData?.pages.flatMap(page => page.results);

    return result;
  }, [exercisesData]);

  return (
    <Box flex={1} bg='$background'>
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
                      rippleColor='black700'
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

      <Box pt='md' px='md' mb='md'>
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

      {isLoading ? (
        <Box
          my='md'
          minHeight={300}
          alignItems='center'
          justifyContent='center'
        >
          <ActivityIndicator size='large' color='pink' />
          <Text
            color='pink'
            fontFamily='WorkSans_500Medium'
            fontWeight='500'
            fontSize={14}
          >
            Loading...
          </Text>
        </Box>
      ) : (
        exercisesData && (
          <FlatList
            data={exerciseResults}
            style={{ paddingHorizontal: 12 }}
            contentContainerStyle={{ gap: 6 }}
            renderItem={({ item }) => {
              const exercise = item.exercises.find(
                exercise => exercise.language === 2
              );
              if (!exercise) return null;

              return (
                <Box key={exercise.id} borderRadius='md' overflow='hidden'>
                  <TouchableOpacity
                    onPress={() => {
                      setActiveExercise({
                        id: String(exercise.id),
                        name: exercise.name,
                      });
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
              );
            }}
            keyExtractor={item => item.uuid}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              <Box
                minHeight={24}
                alignItems='center'
                justifyContent='center'
                gap='sm'
              >
                {isFetchingNextPage && (
                  <React.Fragment>
                    <ActivityIndicator
                      size='large'
                      color='pink'
                      marginTop='md'
                    />
                    <Text
                      color='pink'
                      fontWeight='500'
                      fontFamily='WorkSans_500Medium'
                      fontSize={14}
                      marginBottom='md'
                    >
                      Loading...
                    </Text>
                  </React.Fragment>
                )}
              </Box>
            }
          />
        )
      )}

      {/* <Box gap='sm'>
          {isLoading && <ActivityIndicator size='large' color='pink' />}
          {exercisesData?.results.map(result => {
            const exercise = result.exercises.find(
              exercise => exercise.language === 2
            );
            if (!exercise) return null;

            return (
              <Box key={exercise.id} borderRadius='md' overflow='hidden'>
                <TouchableOpacity
                  onPress={() => {
                    setActiveExercise({
                      id: String(exercise.id),
                      name: exercise.name,
                    });
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
            );
          })}
        </Box> */}

      <CreateWorkoutLogBottomSheet
        ref={bottomSheetRef}
        activeExercise={activeExercise}
        closeModal={handleCloseBottomSheet}
      />
    </Box>
  );
};

export default LogWorkoutScreen;
