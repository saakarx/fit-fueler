import { useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';

import { getWaterLogsForDateWithSnapshot, type WaterLog } from '@src/firebase';

const useGetWaterWithSS = (userId: string, selectedDate: Date) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);
  const [data, setData] = useState<WaterLog[] | null>(null);

  useEffect(() => {
    const unsubscribe = getWaterLogsForDateWithSnapshot(
      userId,
      selectedDate,
      (water: WaterLog[]) => {
        setData(water);

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

export default useGetWaterWithSS;
