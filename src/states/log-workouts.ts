import { atom } from 'jotai';

import { type WorkoutLog } from '@src/firebase';

type WorkoutLogAdd = WorkoutLog;

export const loggedWorkoutsAtom = atom<WorkoutLog[]>([]);

export const addWorkoutLogAtom = atom(
  null,
  (get, set, update: WorkoutLogAdd) => {
    set(loggedWorkoutsAtom, prevValue => {
      const newWorkouts = [...prevValue];
      newWorkouts.push(update);
      return newWorkouts;
    });
  }
);

export const updateLoggedWorkoutsAtom = atom(
  null,
  (_get, set, update: WorkoutLog[]) => {
    set(loggedWorkoutsAtom, prevValue => [...prevValue, ...update]);
  }
);

type RemoveWorkoutLogT = {
  id: string;
  loggedFor: string;
};

export const removeWorkoutLogAtom = atom(
  null,
  (_get, set, update: RemoveWorkoutLogT) => {
    set(loggedWorkoutsAtom, prevValue => {
      const newWorkouts = [...prevValue];
      const workoutIdx = newWorkouts.findIndex(
        workout =>
          workout.id === update.id && workout.loggedFor === update.loggedFor
      );

      if (workoutIdx !== -1) {
        newWorkouts.splice(workoutIdx, 1);
      } else {
        console.warn(`Invalid workout data: ${JSON.stringify(update)}`);
      }

      return newWorkouts;
    });
  }
);
