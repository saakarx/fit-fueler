import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react-native';

import { ActivityIndicator, Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

type MealItemProps = {
  id: string;
  name: string;
  cals: number;
  carbohydrates: number;
  protein: number;
  onAddPress: ({
    mealId,
    mealName,
    loggedForDate,
  }: {
    mealId: string;
    mealName: string;
    cals: number;
    carbohydrates: number;
    protein: number;
    loggedForDate: Date;
  }) => Promise<void>;
};

const MealItem = ({
  id,
  name,
  cals,
  carbohydrates,
  protein,
  onAddPress,
}: MealItemProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <Box
      flexDirection='row'
      gap='sm'
      justifyContent='space-between'
      alignItems='center'
      bg='$logItemBg'
      py='md'
      px='lg'
      borderRadius='md'
    >
      <Box alignSelf='stretch' flex={1} gap='xs'>
        <Text
          fontSize={17}
          fontWeight='500'
          fontFamily='WorkSans_500Medium'
          color='purple'
        >
          {name.trim()}
        </Text>

        <Text fontSize={15} color='$fieldInputPlaceholderTextColor'>
          {cals} KCAL, {protein} G (Protein), {carbohydrates} G (Carbs)
        </Text>
      </Box>

      <Box overflow='hidden' borderRadius='full' opacity={isLoading ? 0.5 : 1}>
        <TouchableOpacity
          bg='$logItemButtonBg'
          rippleColor='$logItemButtonRippleColor'
          p='xxs'
          width={40}
          height={40}
          borderRadius='full'
          alignItems='center'
          justifyContent='center'
          disabled={isLoading}
          onPress={async () => {
            setIsLoading(true);
            await onAddPress({
              mealId: id,
              mealName: name,
              cals: cals,
              carbohydrates: carbohydrates,
              protein: protein,
              loggedForDate: new Date(),
            });
            setIsLoading(false);
          }}
        >
          {isLoading ? (
            <ActivityIndicator color='purple' />
          ) : (
            <LucideIcon Icon={PlusIcon} size={25} stroke='purple' />
          )}
        </TouchableOpacity>
      </Box>
    </Box>
  );
};

export default MealItem;
