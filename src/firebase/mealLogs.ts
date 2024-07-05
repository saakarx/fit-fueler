import firestore from '@react-native-firebase/firestore';
import { eachDayOfInterval, format } from 'date-fns';

import { MealTimeT } from '@src/types.type';

export type MealLog = {
  id: string;
  userId: string;
  mealId: string;

  mealName: string;
  mealTime: MealTimeT;
  cals: number;
  carbohydrates: number;
  protein: number;
  loggedFor: string; // DD-MM-YYYY

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const MEAL_LOGS_COL = 'meal-logs';

export const getMealLogsForInterval = async (
  userId: string,
  startOfInterval: Date,
  endOfInterval: Date
) => {
  const loggedForIntervals: string[] = eachDayOfInterval({
    start: startOfInterval,
    end: endOfInterval,
  }).map(date => format(date, 'dd-MM-yyyy'));

  try {
    const result = await firestore()
      .collection(MEAL_LOGS_COL)
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .where('loggedFor', 'in', loggedForIntervals)
      .get();
    const mealLogs = result.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        } as MealLog)
    );

    const mealsObj: {
      [key: string]: number;
    } = {};
    for (const meal of mealLogs) {
      if (meal.loggedFor in mealsObj) {
        mealsObj[meal.loggedFor] += meal.cals;
      } else {
        mealsObj[meal.loggedFor] = meal.cals;
      }
    }

    return eachDayOfInterval({
      start: startOfInterval,
      end: endOfInterval,
    }).map(date => {
      const dateStr = format(date, 'dd-MM-yyyy');
      return {
        date: date,
        weekDay: format(date, 'EEE'),
        calories: dateStr in mealsObj ? mealsObj[dateStr] : 0,
      };
    });
  } catch (error) {
    console.error('Error getting meal logs:', error);
    throw error;
  }
};

export const getMealLogsForDateWithSnapshot = (
  userId: string,
  date: Date,
  onSuccess: (meals: MealLog[]) => void,
  onError: (error: any) => void
) => {
  const loggedForDate = format(date, 'dd-MM-yyyy');

  return firestore()
    .collection(MEAL_LOGS_COL)
    .where('userId', '==', userId)
    .where('isDeleted', '==', false)
    .where('loggedFor', '==', loggedForDate)
    .orderBy('createdAt', 'asc')
    .onSnapshot(result => {
      const mealLogs = result.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
          } as MealLog)
      );
      onSuccess(mealLogs);
    }, onError);
};

export const createMealLog = async ({
  userId,
  mealId,
  mealName,
  mealTime,
  cals,
  carbohydrates,
  protein,
  loggedFor,
}: {
  userId: string;
  mealId: string;
  mealName: string;
  mealTime: MealTimeT;
  cals: number;
  carbohydrates: number;
  protein: number;
  loggedFor: Date;
}) => {
  const loggedForDate = format(loggedFor, 'dd-MM-yyyy');
  const docData: Omit<MealLog, 'id'> = {
    userId: userId,
    mealId: mealId,

    mealName: mealName,
    mealTime: mealTime,
    cals: cals,
    carbohydrates: carbohydrates,
    protein: protein,
    loggedFor: loggedForDate,

    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const res = await firestore().collection(MEAL_LOGS_COL).add(docData);
    return {
      id: res.id,
      ...docData,
    };
  } catch (error) {
    console.error('Error adding meal log:', error);
    throw error;
  }
};

export const deleteMealLog = async (
  id: string,
  userId: string,
  loggedFor: string
) => {
  try {
    await firestore()
      .collection(MEAL_LOGS_COL)
      .doc(id)
      .update({ isDeleted: true, deletedAt: new Date() });
  } catch (error) {
    console.error('Error deleting meal log', { id, userId, loggedFor });
    throw error;
  }
};
