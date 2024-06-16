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
import { useState } from 'react';
import { FlatList } from 'react-native';
import { useSetAtom } from 'jotai';

import { Box, TouchableOpacity } from '@src/atoms';
import Dropdown, { DropdownItemType } from '@src/components/dropdown';
import Input from '@src/components/input';
import LucideIcon from '@src/components/lucide-icon';
import MealItem from '@src/components/meal-item';
import { logMeal } from '@src/states/logged-meals';
import { MealTimeT } from '@src/types.type';

const meals = [
  {
    id: 1,
    name: 'Pizza',
    cals: 180,
    serving: { quantity: 2, unit: 'Slice' },
    from: 'Pizza Pizza',
  },
  {
    id: 2,
    name: 'Apple',
    cals: 50,
    serving: { quantity: 1, unit: 'Whole' },
    from: '',
  },
  {
    id: 3,
    name: 'Coffee',
    cals: 90,
    serving: { quantity: 1, unit: 'Cup' },
    from: 'Homemade',
  },
  {
    id: 4,
    name: 'Fried Noodles',
    cals: 375,
    serving: { quantity: 500, unit: 'Gms' },
    from: 'Ramyeon Shop',
  },
  {
    id: 5,
    name: 'Momos',
    cals: 285,
    serving: { quantity: 8, unit: 'Pieces' },
    from: 'Momos Bar',
  },
];

const LogMealScreen = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const searchParams = useLocalSearchParams<{ mealTime?: MealTimeT }>();
  const addMealLog = useSetAtom(logMeal);

  const onAddMealPress = ({
    meal_id,
    meal_name,
    number_of_servings,
    serving_size,
    logged_for_date,
  }: {
    meal_id: string;
    meal_name: string;
    number_of_servings: number;
    serving_size: string;
    logged_for_date: Date;
  }) => {
    addMealLog({
      for: logged_for_date,
      mealTime: searchParams.mealTime ?? 'breakfast',
      mealItem: {
        id: 'NEW ID',
        user_id: 'Saakar GOGIA`s USER ID GOES HERE',
        meal_id: meal_id,
        meal_name: meal_name,
        number_of_servings: number_of_servings,
        serving_size: serving_size,
        logged_for_date: logged_for_date,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  };

  return (
    <Box flex={1} bg='$background' p='md'>
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

      <Box mt='sm' mb='md'>
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

      <FlatList
        contentContainerStyle={{ gap: 8 }}
        data={meals}
        renderItem={({ item }) => (
          <MealItem {...item} onAddPress={onAddMealPress} />
        )}
      />
    </Box>
  );
};

export default LogMealScreen;
