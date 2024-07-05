import firestore from '@react-native-firebase/firestore';
import Snackbar from 'react-native-snackbar';

export const USERS_COL = 'users';

export const toggleNotifications = async (userId: string, value: boolean) => {
  try {
    await firestore()
      .collection(USERS_COL)
      .doc(userId)
      .update({ notificationsEnabled: value, updatedAt: new Date() });

    Snackbar.show({
      text: 'Updated notifications status',
      textColor: '#BEE3DB',
      backgroundColor: '#212529',
    });
  } catch (error) {
    console.error('Error toggling notifications:', error);
    Snackbar.show({
      text: 'Something went wrong! Try again later',
      textColor: '#DA4167',
      backgroundColor: '#212529',
    });
  }
};
