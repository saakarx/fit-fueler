import firebaseAuth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AuthErrorCodes } from 'firebase/auth';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { createContext, useContext, useEffect } from 'react';
import Snackbar from 'react-native-snackbar';

import { AuthState, getAuth, isLoggedInAtom, setAuth } from '@src/states/auth';

type AuthContextState = {
  isLoggedIn: boolean;
  auth: AuthState | null;

  signin: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => Promise<void>;
  signup: ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextState>({
  auth: null,
  isLoggedIn: false,

  signin: async () => {},
  signup: async () => {},
  signout: async () => {},
});

const getSigninErrorText = (error: any): string => {
  switch (error.code) {
    case AuthErrorCodes.USER_DELETED:
      return 'Unauthorized';

    case AuthErrorCodes.INVALID_EMAIL:
      return 'Invalid credentials, check email and password';

    case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
      return 'Invalid credentials, check email and password';

    default:
      return 'Something went wrong! Try again later';
  }
};

const getSignupErrorText = (error: any): string => {
  switch (error.code) {
    case AuthErrorCodes.EMAIL_EXISTS:
      return 'Email is already in use';

    case AuthErrorCodes.INVALID_EMAIL:
      return 'Invalid email, check again';

    case AuthErrorCodes.OPERATION_NOT_ALLOWED:
      return 'Internal server error! Try again later';

    case AuthErrorCodes.WEAK_PASSWORD:
      return 'Weak password, create a strong password';

    default:
      return 'Something went wrong! Try again later';
  }
};

const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const authState = useAtomValue(getAuth);
  const isUserLoggedIn = useAtomValue(isLoggedInAtom);
  const setAuthState = useSetAtom(setAuth);

  useEffect(() => {
    let unsubscribeUserSnapshot: (() => void) | null = null;
    const unsubscribe = firebaseAuth().onAuthStateChanged(async user => {
      if (user === null) {
        setAuthState(null);
        return;
      }

      const userDetails: AuthState = {
        id: user.uid,
        name: '',
        email: '',
        profilePhotoURL: '',
        weight: 0,
        height: 0,
        sex: 'male',
        dateOfBirth: '25/04/2002',
        timezone: '',
        zipcode: '',
        units: {
          weight: 'kgs',
          height: 'feet-inches',
          distance: 'kms',
          energy: 'cals',
          water: 'mls',
        },
        notificationsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLoggedIn: true,
      };

      unsubscribeUserSnapshot = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot(
          userFromFirestore => {
            if (!userFromFirestore.exists)
              throw new Error('No user data found');

            const userData = userFromFirestore.data();
            if (userData === undefined) throw new Error('No user data found');

            userDetails.name = userData.name;
            userDetails.email = userData.email;
            userDetails.profilePhotoURL = userData.profilePhotoURL;
            userDetails.weight = userData.weight;
            userDetails.height = userData.height;
            userDetails.sex = userData.sex;
            userDetails.dateOfBirth = userData.dateOfBirth;
            userDetails.timezone = userData.timezone;
            userDetails.zipcode = userData.zipcode;
            userDetails.units = userData.units;
            userDetails.notificationsEnabled =
              userData.notificationsEnabled ?? true;
            userDetails.createdAt = userData.createdAt;
            userDetails.updatedAt = userData.updatedAt;

            setAuthState(userDetails);
          },
          error => {
            console.error(
              'auth-context.tsx:95 ~ useEffect->onAuthStateChanged->userSnapshot:',
              error
            );

            signout();
            setAuthState(null);
            return;
          }
        );
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserSnapshot) unsubscribeUserSnapshot();
    };
  }, []);

  const signin = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      await firebaseAuth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);

      Snackbar.show({
        text: getSigninErrorText(error),
        backgroundColor: '#212529',
        textColor: '#DA4167',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const signup = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      const { user } = await firebaseAuth().createUserWithEmailAndPassword(
        email,
        password
      );
      if (user) {
        const uid = user.uid;

        await firestore()
          .collection('users')
          .doc(uid)
          .set({
            uid: uid,
            name: name,
            email: email,
            profilePhotoURL: null,
            weight: null,
            height: null,
            sex: null,
            dateOfBirth: null,
            timezone: null,
            zipcode: null,
            units: {
              weight: 'kgs',
              height: 'feet-inches',
              distance: 'kms',
              energy: 'cals',
              water: 'mls',
            },
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
    } catch (error) {
      console.error(error);

      Snackbar.show({
        text: getSignupErrorText(error),
        backgroundColor: '#212529',
        textColor: '#DA4167',
        duration: Snackbar.LENGTH_LONG,
      });
    }
  };

  const signout = async () => {
    await firebaseAuth().signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: isUserLoggedIn,
        auth: authState,
        signin,
        signup,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error('useAuth must be used inside AuthProvider');

  return context;
};

export { AuthContext, useAuth };
export type { AuthContextState };
export default AuthProvider;
