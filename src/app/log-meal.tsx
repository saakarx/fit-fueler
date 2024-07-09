import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeftIcon,
  CookingPotIcon,
  DonutIcon,
  SandwichIcon,
  SearchIcon,
  UtensilsIcon,
  XIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList } from 'react-native';
import Snackbar from 'react-native-snackbar';

import { ActivityIndicator, Box, Text, TouchableOpacity } from '@src/atoms';
import Dropdown, { DropdownItemType } from '@src/components/dropdown';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';
import MealItem from '@src/components/meal-item';

import { useAuth } from '@src/context/auth';
import { createMealLog } from '@src/firebase';
import type { GetFoodsResponse, MealTimeT } from '@src/types.type';

const getFoods = async ({
  limit = 20,
  page = 1,
}: {
  limit?: number;
  page?: number;
}): Promise<GetFoodsResponse> => {
  const FOODS_API_URL = new URL('https://api.nal.usda.gov/fdc/v1/foods/list');
  FOODS_API_URL.searchParams.set('api_key', 'DEMO_KEY');
  FOODS_API_URL.searchParams.set('pageSize', String(limit));
  FOODS_API_URL.searchParams.set('pageNumber', String(page));
  FOODS_API_URL.searchParams.set(
    'dataType',
    ['Branded', 'Foundation', 'Survey (FNDDS)', 'SR Legacy']
      .map(item => encodeURIComponent(item))
      .join(',')
  );
  // FOODS_API_URL.searchParams.set('sortBy', 'lowercaseDescription.keyword');
  FOODS_API_URL.searchParams.set('sortOrder', 'asc');

  return axios
    .get(FOODS_API_URL.toString())
    .then(res => res.data as GetFoodsResponse);
};

const LogMealScreen = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const searchParams = useLocalSearchParams<{ mealTime?: MealTimeT }>();
  const { auth } = useAuth();
  const LIMIT = React.useRef(20).current;

  const {
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    data: foodsList,
  } = useInfiniteQuery({
    queryKey: ['foods'],
    queryFn: ({ pageParam }) => getFoods({ limit: LIMIT, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (lastPage.length < LIMIT) return null;
      else return lastPageParam + 1;
    },
  });

  const foodsData = React.useMemo(() => {
    return foodsList?.pages.flat();
  }, [foodsList]);

  const onAddMealPress = async ({
    mealId,
    mealName,
    cals,
    carbohydrates,
    protein,
    loggedForDate,
  }: {
    mealId: string;
    mealName: string;
    cals: number;
    carbohydrates: number;
    protein: number;
    loggedForDate: Date;
  }) => {
    if (!auth) return;

    try {
      await createMealLog({
        userId: auth?.id,
        loggedFor: loggedForDate,
        mealId: mealId,
        mealName: mealName,
        cals: cals,
        carbohydrates: carbohydrates,
        protein: protein,
        mealTime: searchParams.mealTime ?? 'breakfast',
      });
    } catch (error) {
      console.error('Error adding meal log:', error);
      Snackbar.show({
        text: 'Something went wrong! Try again later',
        textColor: '#DA4167',
        backgroundColor: '#212529',
      });
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage) fetchNextPage();
  };

  return (
    <Box flex={1} bg='$background'>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: true,
          headerTitle: 'Log Workout',
          header: headerProps => {
            const params = headerProps.route.params as { mealTime: string };
            const dropdownItems: DropdownItemType[] = [
              {
                action: (id: string) =>
                  headerProps.navigation.setParams({ ...params, mealTime: id }),
                icon: SandwichIcon,
                id: 'breakfast',
                text: 'Breakfast',
              },
              {
                action: (id: string) =>
                  headerProps.navigation.setParams({ ...params, mealTime: id }),
                icon: CookingPotIcon,
                id: 'lunch',
                text: 'Lunch',
              },
              {
                action: (id: string) =>
                  headerProps.navigation.setParams({ ...params, mealTime: id }),
                icon: UtensilsIcon,
                id: 'dinner',
                text: 'Dinner',
              },
              {
                action: (id: string) =>
                  headerProps.navigation.setParams({ ...params, mealTime: id }),
                icon: DonutIcon,
                id: 'snacks',
                text: 'Snacks',
              },
            ];

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

                <Dropdown
                  items={dropdownItems}
                  activeMealTime={params.mealTime ?? 'breakfast'}
                  renderDropdownItem={props => (
                    <Dropdown.Item key={props.id} {...props} />
                  )}
                />

                <Box
                  overflow='hidden'
                  borderRadius='full'
                  width={36}
                  height={36}
                />
              </Box>
            );
          },
        }}
      />

      <Box p='md' mt='sm' mb='md'>
        <Input px='md'>
          <Input.Icon
            Icon={SearchIcon}
            mr='md'
            stroke='purple'
            strokeWidth={2}
          />
          <Input.Field
            placeholder='Search food'
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {!!searchTerm.length && (
            <Box borderRadius='full' overflow='hidden'>
              <TouchableOpacity
                rippleColor='$backgroundRippleColor'
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
          minHeight={300}
          alignItems='center'
          justifyContent='center'
          gap='sm'
        >
          <ActivityIndicator size='large' color='pink' marginTop='md' />
          <Text
            color='pink'
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
            fontSize={14}
            marginBottom='md'
          >
            Loading...
          </Text>
        </Box>
      ) : (
        foodsData && (
          <FlatList
            style={{ paddingHorizontal: 12 }}
            contentContainerStyle={{ gap: 8 }}
            data={foodsData}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => (
              <MealItem
                id={String(item.fdcId)}
                name={item.description}
                cals={
                  item.foodNutrients.find(i => i.name.startsWith('Energy'))
                    ?.amount ?? 0
                }
                carbohydrates={
                  item.foodNutrients.find(i =>
                    i.name.startsWith('Carbohydrate')
                  )?.amount ?? 0
                }
                protein={
                  item.foodNutrients.find(i => i.name.startsWith('Protein'))
                    ?.amount ?? 0
                }
                onAddPress={onAddMealPress}
              />
            )}
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
    </Box>
  );
};

export default LogMealScreen;
