import firestore, { increment } from '@react-native-firebase/firestore';
import { eachDayOfInterval, format } from 'date-fns';

export type WaterLog = {
  id: string;
  userId: string;
  quantity: number;
  loggedFor: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const WATER_LOGS_COL = 'water-logs';

export const getWaterLogsForInterval = async (
  userId: string,
  startOfInterval: Date,
  endOfInterval: Date
) => {
  const loggedForIntervals = eachDayOfInterval({
    start: startOfInterval,
    end: endOfInterval,
  }).map(date => format(date, 'dd-MM-yyyy'));

  try {
    const result = await firestore()
      .collection(WATER_LOGS_COL)
      .where('userId', '==', userId)
      .where('loggedFor', 'in', loggedForIntervals)
      .get();

    const waterLogs = result.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        } as WaterLog)
    );

    const waterObj: {
      [key: string]: number;
    } = {};

    for (const water of waterLogs) {
      if (water.loggedFor in waterObj) {
        waterObj[water.loggedFor] += water.quantity;
      } else {
        waterObj[water.loggedFor] = water.quantity;
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
        quantity: dateStr in waterObj ? waterObj[dateStr] : 0,
      };
    });
  } catch (error) {
    console.error('Error getting workout logs:', error);
    throw error;
  }
};

export const getWaterLogsForDateWithSnapshot = (
  userId: string,
  date: Date,
  onSuccess: (water: WaterLog[]) => void,
  onError: (error: any) => void
) => {
  const loggedForDate = format(date, 'dd-MM-yyyy');

  return firestore()
    .collection(WATER_LOGS_COL)
    .where('userId', '==', userId)
    .where('isDeleted', '==', false)
    .where('loggedFor', '==', loggedForDate)
    .orderBy('createdAt', 'asc')
    .onSnapshot(result => {
      const waterLogs = result.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
          } as WaterLog)
      );
      onSuccess(waterLogs);
    }, onError);
};

type createWaterLogT = {
  id?: string;
  userId: string;
  quantity: number;
  loggedFor: string;
  isUpdate: boolean;
};
export const createWaterLog = async ({
  id,
  userId,
  quantity,
  loggedFor,
  isUpdate = false,
}: createWaterLogT) => {
  const collection = firestore().collection(WATER_LOGS_COL);

  try {
    if (isUpdate) {
      if (id === undefined) {
        console.error('id cannot be undefined for update');
        throw new Error('id cannot be undefined for update');
      }

      await collection.doc(id).update({
        quantity: increment(quantity),
        updatedAt: new Date(),
      });
      const doc = await collection.doc(id).get();
      const data = doc.data();
      if (data === undefined) throw new Error('Document does not exists');

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    } else {
      const docData: Omit<WaterLog, 'id'> = {
        userId: userId,
        quantity: quantity,
        loggedFor: loggedFor,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const response = await collection.add(docData);

      return {
        id: response.id,
        ...docData,
      };
    }
  } catch (error) {
    console.error('error creating water log:', error);
    throw error;
  }
};

export const deleteWaterLog = async (
  id: string,
  userId: string,
  loggedFor: string
) => {
  try {
    await firestore()
      .collection(WATER_LOGS_COL)
      .doc(id)
      .update({ isDeleted: true, deletedAt: new Date() });
  } catch (error) {
    console.error('Error deleting water log', { id, userId, loggedFor });
    throw error;
  }
};
