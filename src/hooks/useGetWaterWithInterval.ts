import { endOfWeek, startOfWeek } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';

import { getWaterLogsForInterval } from '@src/firebase';

const useGetWaterWithInterval = (userId: string, selectedDate: Date) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);
  const [data, setData] = useState<
    { date: Date; weekDay: string; quantity: number }[] | null
  >(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await getWaterLogsForInterval(
        userId,
        startOfWeek(selectedDate),
        endOfWeek(selectedDate)
      );

      setData(result);
    } catch (error) {
      setIsError(true);
      setError(error);
      setData(null);

      Snackbar.show({
        text: 'Something went wrong! Try again later',
        textColor: '#DA4167',
        backgroundColor: '#212529',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { isLoading, isError, error, data, refetch: fetchData };
};

export default useGetWaterWithInterval;
