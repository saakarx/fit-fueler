import firestore from '@react-native-firebase/firestore';
import { eachDayOfInterval, format } from 'date-fns';

export type WorkoutLog = {
  id: string;
  userId: string;
  workoutId: string;

  workoutName: string;
  duration: number;
  calsBurned: number;
  reps: number;
  sets: number;
  weight: number;
  loggedFor: string; // DD-MM-YYYY

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const WORKOUT_LOGS_COL = 'workout-logs';

export const getWorkoutLogsForInterval = async (
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
      .collection(WORKOUT_LOGS_COL)
      .where('userId', '==', userId)
      .where('loggedFor', 'in', loggedForIntervals)
      .get();
    const workoutLogs = result.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        } as WorkoutLog)
    );

    const workoutsObj: {
      [key: string]: number;
    } = {};

    for (const workout of workoutLogs) {
      if (workout.loggedFor in workoutsObj) {
        workoutsObj[workout.loggedFor] += workout.duration;
      } else {
        workoutsObj[workout.loggedFor] = workout.duration;
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
        duration: dateStr in workoutsObj ? workoutsObj[dateStr] : 0,
      };
    });
  } catch (error) {
    console.error('Error getting workout logs:', error);
    throw error;
  }
};

export const getWorkoutLogsForDateWithSnapshot = (
  userId: string,
  date: Date,
  onSuccess: (workouts: WorkoutLog[]) => void,
  onError: (error: any) => void
) => {
  const loggedForDate = format(date, 'dd-MM-yyyy');

  return firestore()
    .collection(WORKOUT_LOGS_COL)
    .where('userId', '==', userId)
    .where('isDeleted', '==', false)
    .where('loggedFor', '==', loggedForDate)
    .orderBy('createdAt', 'asc')
    .onSnapshot(result => {
      const workoutLogs = result.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate(),
          } as WorkoutLog)
      );

      onSuccess(workoutLogs);
    }, onError);
};

type createWorkoutLogT = Omit<
  WorkoutLog,
  'id' | 'isDeleted' | 'createdAt' | 'updatedAt'
>;
export const createWorkoutLog = async ({
  userId,
  workoutId,
  workoutName,
  reps,
  sets,
  weight,
  calsBurned,
  duration,
  loggedFor,
}: createWorkoutLogT) => {
  const docData: Omit<WorkoutLog, 'id'> = {
    userId: userId,
    workoutId: workoutId,

    workoutName: workoutName,
    reps: reps,
    sets: sets,
    weight: weight,
    calsBurned: calsBurned,
    duration: duration,
    loggedFor: loggedFor,

    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const res = await firestore().collection(WORKOUT_LOGS_COL).add(docData);
    return {
      id: res.id,
      ...docData,
    };
  } catch (error) {
    console.error('Error adding meal log:', error);
    throw error;
  }
};

export const deleteWorkoutLog = async (
  id: string,
  userId: string,
  loggedFor: string
) => {
  try {
    await firestore()
      .collection(WORKOUT_LOGS_COL)
      .doc(id)
      .update({ isDeleted: true, deletedAt: new Date() });
  } catch (error) {
    console.error('Error deleting workout log', { id, userId, loggedFor });
    throw error;
  }
};
