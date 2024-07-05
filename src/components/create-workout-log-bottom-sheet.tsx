import {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
  BottomSheetModal as RNBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { Formik } from 'formik';
import { useSetAtom } from 'jotai';
import { PlusIcon } from 'lucide-react-native';
import React, { forwardRef, Fragment } from 'react';
import { GestureResponderEvent } from 'react-native';
import Snackbar from 'react-native-snackbar';
import * as yup from 'yup';

import {
  ActivityIndicator,
  BottomSheetModal,
  Box,
  Text,
  TouchableOpacity,
} from '@src/atoms';
import FieldError from './field-error';
import FieldLabel from './field-label';
import LucideIcon from './lucide-icon';

import { useAuth } from '@src/context/auth';
import { createWorkoutLog } from '@src/firebase';
import { addWorkoutLogAtom } from '@src/states/log-workouts';

const addWorkoutLogSchema = yup.object({
  reps: yup.number().positive('Must be negative').required('Required'),
  sets: yup.number().positive('Must be positive').required('Required'),
  weight: yup.number().positive('Must be positive').nullable(),
});

type Props = {
  activeExercise: { id: string; name: string } | null;
  closeModal: () => void;
};

const CreateWorkoutLogBottomSheet = forwardRef<RNBottomSheetModal, Props>(
  ({ activeExercise, closeModal }, ref) => {
    const { auth } = useAuth();
    const addWorkoutLog = useSetAtom(addWorkoutLogAtom);

    const onSubmit = async (values: {
      reps: string;
      sets: string;
      weight: string;
    }) => {
      if (!auth || activeExercise === null) return;

      try {
        const response = await createWorkoutLog({
          userId: auth.id,
          workoutId: activeExercise.id,
          workoutName: activeExercise.name,

          calsBurned: 0,
          duration: 0,
          reps: +values.reps,
          sets: +values.sets,
          weight: +values.weight,

          loggedFor: format(new Date(), 'dd-MM-yyyy'),
        });

        addWorkoutLog({
          id: response.id,
          userId: response.userId,
          workoutId: response.workoutId,
          workoutName: response.workoutName,
          calsBurned: response.calsBurned,
          duration: response.duration,
          reps: response.reps,
          sets: response.sets,
          weight: response.weight,
          loggedFor: response.loggedFor,
          isDeleted: response.isDeleted,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        });
      } catch (error) {
        console.error('Error logging workout:', error);
        Snackbar.show({
          text: 'Something went wrong! Try again later',
          textColor: '#DA4167',
          backgroundColor: '#212529',
        });
      }

      closeModal();
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={1}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        enablePanDownToClose={true}
        snapPoints={['40%', '80%']}
        detached={true}
        topInset={12}
        bottomInset={12}
        keyboardBehavior='fillParent'
        keyboardBlurBehavior='restore'
        onDismiss={() => closeModal()}
        style={{ marginHorizontal: 12 }}
      >
        <BottomSheetView style={{ flex: 1, padding: 12 }}>
          <Text
            mb='xs'
            fontWeight='400'
            fontFamily='BricolageGrotesque_400Regular'
            textTransform='uppercase'
            letterSpacing={3}
          >
            Log Workout
          </Text>
          <Text
            color='pink'
            fontSize={24}
            fontWeight='600'
            fontFamily='WorkSans_600SemiBold'
            mb='lg'
          >
            {activeExercise && activeExercise.name}
          </Text>

          <Formik
            initialValues={{ sets: '', reps: '', weight: '' }}
            validationSchema={addWorkoutLogSchema}
            onSubmit={onSubmit}
          >
            {({
              values,
              errors,
              isSubmitting,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
            }) => (
              <>
                <Box>
                  <FieldLabel label='Repetions / Set' />
                  <BottomSheetTextInput
                    placeholder='Required'
                    style={{
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      color: 'white',
                      borderWidth: 1,
                      borderColor: '#888',
                    }}
                    placeholderTextColor='#777'
                    cursorColor='white'
                    value={values.reps}
                    keyboardType='numeric'
                    onChangeText={handleChange('reps')}
                    onBlur={handleBlur('reps')}
                  />
                  <FieldError touched={touched.reps} error={errors.reps} />
                </Box>

                <Box>
                  <FieldLabel label='Number of Sets' />
                  <BottomSheetTextInput
                    placeholder='Required'
                    style={{
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      color: 'white',
                      borderWidth: 1,
                      borderColor: '#888',
                    }}
                    placeholderTextColor='#777'
                    cursorColor='white'
                    value={values.sets}
                    keyboardType='numeric'
                    onChangeText={handleChange('sets')}
                    onBlur={handleBlur('sets')}
                  />
                  <FieldError touched={touched.sets} error={errors.sets} />
                </Box>

                <Box>
                  <FieldLabel label='Weight per Repetition' />
                  <BottomSheetTextInput
                    placeholder='Optional'
                    style={{
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      color: 'white',
                      borderWidth: 1,
                      borderColor: '#888',
                    }}
                    placeholderTextColor='#777'
                    cursorColor='white'
                    value={values.weight}
                    keyboardType='numeric'
                    onChangeText={handleChange('weight')}
                    onBlur={handleBlur('weight')}
                  />
                  <FieldError touched={touched.weight} error={errors.weight} />
                </Box>

                <SubmitButton
                  isSubmitting={isSubmitting}
                  onPress={() => handleSubmit()}
                />
              </>
            )}
          </Formik>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const SubmitButton = ({
  isSubmitting,
  onPress,
}: {
  isSubmitting: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) => (
  <Box
    mt='lg'
    borderRadius='sm'
    overflow='hidden'
    opacity={isSubmitting ? 0.5 : 1}
  >
    <TouchableOpacity
      bg='pink'
      rippleColor='pink'
      minHeight={42}
      p='sm'
      borderRadius='sm'
      alignItems='center'
      justifyContent='center'
      flexDirection='row'
      gap='sm'
      disabled={isSubmitting}
      onPress={onPress}
    >
      {isSubmitting ? (
        <ActivityIndicator color='black900' />
      ) : (
        <Fragment>
          <Text
            color='black900'
            fontSize={15}
            lineHeight={17}
            fontWeight='500'
            fontFamily='WorkSans_500Medium'
          >
            Log Workout
          </Text>
          <LucideIcon Icon={PlusIcon} stroke='black900' size={20} />
        </Fragment>
      )}
    </TouchableOpacity>
  </Box>
);

export default CreateWorkoutLogBottomSheet;
