import { atom } from 'jotai';

type WorkoutLog = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  logged_for: Date;
  created_at: Date;
  updated_at: Date;
};

type WorkoutLogAdd = Omit<WorkoutLog, 'id' | 'created_at' | 'updated_at'>;

export const loggedWorkouts = atom<WorkoutLog[]>([]);

export const addWorkoutLog = atom(null, (get, set, update: WorkoutLogAdd) => {
  set(loggedWorkouts, prevValue => {
    const newWorkouts = [...prevValue];
    const logItem: WorkoutLog = {
      id: 'WORKOUT_ID_' + get(loggedWorkouts).length + 1,
      ...update,
      created_at: new Date(),
      updated_at: new Date(),
    };

    newWorkouts.push(logItem);
    return newWorkouts;
  });
});

export const removeWorkoutLog = atom(
  null,
  (_get, set, update: { id: string; logged_for: Date }) => {
    set(loggedWorkouts, prevValue => {
      const newWorkouts = [...prevValue];

      const workoutIdx = newWorkouts.findIndex(
        workout =>
          workout.id === update.id &&
          workout.logged_for.toLocaleDateString() ===
            update.logged_for.toLocaleDateString()
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
