import { MinusIcon } from 'lucide-react-native';
import React from 'react';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

import { WorkoutLog } from '@src/firebase';

const WorkoutLogItem = ({
  workout,
  removeWorkoutLogItem,
}: {
  workout: WorkoutLog;
  removeWorkoutLogItem: (update: { id: string; loggedFor: string }) => void;
}) => {
  return (
    <Box
      bg='$logItemBg'
      p='sm'
      px='lg'
      borderRadius='md'
      gap='xxs'
      flexDirection='row'
      alignItems='center'
      justifyContent='space-between'
    >
      <Box>
        <Text fontWeight='500' fontFamily='WorkSans_500Medium' color='purple'>
          {workout.workoutName}
        </Text>
        <Text color='$fieldInputPlaceholderTextColor'>
          {workout.reps} Reps, {workout.sets} Sets, {workout.weight} kg
        </Text>
      </Box>

      <Box borderRadius='full' overflow='hidden'>
        <TouchableOpacity
          bg='$logItemButtonBg'
          rippleColor='$logItemButtonRippleColor'
          p='sm'
          borderRadius='full'
          onPress={() => {
            removeWorkoutLogItem({
              id: workout.id,
              loggedFor: workout.loggedFor,
            });
          }}
        >
          <LucideIcon
            Icon={MinusIcon}
            size={18}
            stroke='$fieldInputPlaceholderTextColor'
          />
        </TouchableOpacity>
      </Box>
    </Box>
  );
};

export default WorkoutLogItem;
