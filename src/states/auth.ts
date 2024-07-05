import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { storage } from '.';

export type AuthState = {
  id: string;
  name: string | null;
  email: string | null;
  profilePhotoURL: string | null;
  weight: number | null;
  height: number | null;
  sex: 'male' | 'female' | null;
  dateOfBirth: string | null;
  timezone: string | null;
  zipcode: string | null;
  units: {
    weight: 'kgs' | 'pounds' | 'stones';
    height: 'feet-inches' | 'cms';
    distance: 'kms' | 'miles';
    energy: 'cals' | 'kilojoules';
    water: 'mls' | 'fluid-ounces' | 'cups';
  };
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  isLoggedIn: boolean;
};

const AUTH_KEY = '@auth';
const AUTH_IS_LOGGED_IN = '@auth_is_logged_in';

export const isLoggedInAtom = atomWithStorage(
  AUTH_IS_LOGGED_IN,
  false,
  storage<boolean>()
);
export const authAtom = atomWithStorage(
  AUTH_KEY,
  null,
  storage<AuthState | null>()
);

export const getAuth = atom(async get => {
  try {
    const value = await get(authAtom);
    return value;
  } catch (error) {
    console.error('Error in getAuth:', error);
    return null;
  }
});

export const setAuth = atom(null, (_get, set, update: AuthState | null) => {
  set(isLoggedInAtom, update !== null);
  set(authAtom, update);
});
