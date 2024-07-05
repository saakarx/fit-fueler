import { useCallback, useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';

type AsyncFunction = (...args: any[]) => unknown;

const useFirestoreAsync = <DataT>(
  fn: AsyncFunction,
  ...params: Parameters<AsyncFunction>
) => {
  type DataType = Awaited<DataT>;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<DataType | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const result = await fn(...params);
      setData(result as DataType);
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
  }, [...params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { isLoading, isError, data, error, refetch: fetchData };
};

export default useFirestoreAsync;
