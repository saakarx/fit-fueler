import { PlusIcon } from 'lucide-react-native';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

type MealItemProps = {
  name: string;
  cals: number;
  serving: { quantity: number; unit: string };
  from: string;
  onAddPress: ({
    meal_id,
    meal_name,
    number_of_servings,
    serving_size,
    logged_for_date,
  }: {
    meal_id: string;
    meal_name: string;
    number_of_servings: number;
    serving_size: string;
    logged_for_date: Date;
  }) => void;
};

const MealItem = ({ name, cals, serving, from, onAddPress }: MealItemProps) => {
  return (
    <Box
      flexDirection='row'
      gap='sm'
      justifyContent='space-between'
      alignItems='center'
      bg='black700'
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
          {name}
        </Text>

        <Text fontSize={15} color='$fieldInputPlaceholderTextColor'>
          {cals} cal, {serving.quantity}
          {serving.unit && ` ${serving.unit}`}
          {from && `, ${from}`}
        </Text>
      </Box>

      <Box overflow='hidden' borderRadius='full'>
        <TouchableOpacity
          bg='black300'
          p='xxs'
          width={40}
          height={40}
          borderRadius='full'
          alignItems='center'
          justifyContent='center'
          rippleColor='black300'
          onPress={() =>
            onAddPress({
              meal_id: 'MEAL_ID GOES HERE',
              meal_name: name,
              number_of_servings: serving.quantity,
              serving_size: serving.unit,
              logged_for_date: new Date(),
            })
          }
        >
          <LucideIcon Icon={PlusIcon} size={25} stroke='purple' />
        </TouchableOpacity>
      </Box>
    </Box>
  );
};

export default MealItem;
