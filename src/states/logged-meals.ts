import { atom } from 'jotai';

import type { MealTimeT } from '@src/types.type';

type MealLogItem = {
  id: string;
  user_id: string;
  meal_id: string;
  meal_name: string;
  number_of_servings: number;
  serving_size: string;
  logged_for_date: Date;
  created_at: Date;
  updated_at: Date;
};

type MealLog = {
  for: Date;
  breakfast: MealLogItem[];
  lunch: MealLogItem[];
  dinner: MealLogItem[];
  snacks: MealLogItem[];
};

export const loggedMeals = atom<MealLog[]>([]);

type LoggedMealsUpdateItem = {
  for: Date;
  mealTime: MealTimeT;
  mealItem: MealLogItem;
};

export const logMeal = atom(null, (_, set, update: LoggedMealsUpdateItem) => {
  set(loggedMeals, prevValue => {
    const newMeals = [...prevValue];

    const idx = newMeals.findIndex(
      meal => meal.for.toLocaleDateString() === update.for.toLocaleDateString()
    );
    if (idx !== -1) {
      newMeals[idx][update.mealTime].push(update.mealItem);
    } else {
      const newItem: MealLog = {
        for: update.for,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      };
      newItem[update.mealTime].push(update.mealItem);

      newMeals.push(newItem);
    }

    return newMeals;
  });
});

export const removeLogMeal = atom(
  null,
  (_get, set, update: { id: string; mealTime: MealTimeT; for: Date }) => {
    set(loggedMeals, prevValue => {
      const newMeals = [...prevValue];

      const removeMealFromIdx = newMeals.findIndex(
        meal =>
          meal.for.toLocaleDateString() === update.for.toLocaleDateString()
      );

      if (removeMealFromIdx !== -1) {
        const mealTimeMeals = newMeals[removeMealFromIdx][update.mealTime];
        const removeMealItemIdx = mealTimeMeals.findIndex(
          i => i.id === update.id
        );

        if (removeMealItemIdx !== 1) {
          newMeals[removeMealFromIdx][update.mealTime].splice(
            removeMealItemIdx,
            1
          );
        } else {
          console.warn(
            `No meal found for id: ${update.id}, mealTime: ${update.mealTime}`
          );
        }
      } else {
        console.warn(
          `No meal found for date: ${update.for.toLocaleDateString()}`
        );
      }

      return newMeals;
    });
  }
);
