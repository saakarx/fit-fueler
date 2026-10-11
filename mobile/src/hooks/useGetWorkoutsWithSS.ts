import { useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';

import {
  getWorkoutLogsForDateWithSnapshot,
  type WorkoutLog,
} from '@src/firebase';

const useGetWorkoutsWithSS = (userId: string, selectedDate: Date) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);
  const [data, setData] = useState<WorkoutLog[] | null>(null);

  useEffect(() => {
    const unsubscribe = getWorkoutLogsForDateWithSnapshot(
      userId,
      selectedDate,
      (workouts: WorkoutLog[]) => {
        setData(workouts);

        setIsLoading(false);
        setIsError(false);
        setError(null);
      },
      error => {
        setIsLoading(false);
        setIsError(true);
        setError(error);
        setData(null);

        Snackbar.show({
          text: 'Something went wrong! Try again later',
          backgroundColor: '#212529',
          textColor: '#DA4167',
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, selectedDate]);

  return {
    isLoading,
    isError,
    data,
    error,
  };
};

export default useGetWorkoutsWithSS;
