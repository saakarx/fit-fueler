import { atom } from 'jotai';

import { type WaterLog } from '@src/firebase';

type AddWaterLog = WaterLog;
type RemoveWaterLog = { loggedFor: string };

export const loggedWaterAtom = atom<WaterLog[]>([]);

export const addWaterLogAtom = atom(null, (_get, set, update: AddWaterLog) => {
  set(loggedWaterAtom, prevValue => {
    const newValue = [...prevValue];
    const logIdx = newValue.findIndex(
      item => item.loggedFor === update.loggedFor
    );

    if (logIdx !== -1) {
      newValue[logIdx].quantity += update.quantity;
    } else {
      newValue.push(update);
    }

    return newValue;
  });
});

export const updateLoggedWaterAtom = atom(
  null,
  (_get, set, update: WaterLog[]) => {
    set(loggedWaterAtom, prevValue => [...prevValue, ...update]);
  }
);

export const removeWaterLogAtom = atom(
  null,
  (_get, set, update: RemoveWaterLog) => {
    set(loggedWaterAtom, prevValue => {
      let found = false;

      const newValue: WaterLog[] = [];

      for (let log of prevValue) {
        if (log.loggedFor !== update.loggedFor) {
          newValue.push(log);
          continue;
        }

        found = true;
      }

      if (!found) {
        console.warn(`No log found for date: ${update.loggedFor}`);
      }

      return newValue;
    });
  }
);
