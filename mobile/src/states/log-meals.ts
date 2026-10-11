import { atom } from 'jotai';

import type { MealTimeT } from '@src/types.type';
import { type MealLog } from '@src/firebase';

type MealLogItem = {
  id: string;
  userId: string;
  mealId: string;
  mealName: string;
  numberOfServings: number;
  servingSize: string;
  loggedForDate: string;
  createdAt: Date;
  updatedAt: Date;
};

export const loggedMealsAtom = atom<MealLog[]>([]);

export const addMealLogAtom = atom(null, (_, set, update: MealLog) => {
  set(loggedMealsAtom, prevValue => [...prevValue, update]);
});

export const updateLoggedMealsAtom = atom(
  null,
  (_get, set, update: MealLog[]) => {
    set(loggedMealsAtom, prevValue => [...prevValue, ...update]);
  }
);

export const removeMealLogAtom = atom(
  null,
  (
    _get,
    set,
    update: { id: string; mealTime: MealTimeT; loggedFor: string }
  ) => {
    set(loggedMealsAtom, prevValue => {
      const newMeals = [...prevValue];

      const mealIdx = newMeals.findIndex(
        meal =>
          meal.id === update.id &&
          meal.mealTime === update.mealTime &&
          meal.loggedFor === update.loggedFor
      );

      if (mealIdx !== -1) {
        newMeals.splice(mealIdx, 1);
      } else {
        console.warn(
          `No meal found for id: ${update.id}, mealTime: ${update.mealTime}, loggedFor: ${update.loggedFor}`
        );
      }

      return newMeals;
    });
  }
);
