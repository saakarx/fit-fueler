import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'jotai/utils';

const storage = <ValueT>() => createJSONStorage<ValueT>(() => AsyncStorage);

export { storage };
