import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LucideIcon as RNLucideIcon,
} from 'lucide-react-native';
import React, { Fragment, ReactNode, useState } from 'react';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import LucideIcon from './lucide-icon';

export type DropdownItemType = {
  action: (id: string) => void;
  id: string;
  icon: RNLucideIcon;
  text: string;
};

type DropdownProps = {
  items: DropdownItemType[];
  renderDropdownItem: (props: DropdownItemProps) => ReactNode;
  activeMealTime: string;
};

type DropdownItemProps = DropdownItemType & {
  activeMealTime: string;
  closeDropdown: () => void;
};

type DropdownComposition = {
  Item: React.FC<DropdownItemProps>;
};

const Dropdown: React.FC<DropdownProps> & DropdownComposition = ({
  items,
  activeMealTime,
  renderDropdownItem,
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [triggerDimens, setTriggerDimens] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const toggleDropdown = (visibility: boolean) => {
    setVisible(visibility);
  };

  return (
    <Fragment>
      <Box
        borderRadius='sm'
        overflow='hidden'
        onLayout={ev => {
          setTriggerDimens({
            width: ev.nativeEvent.layout.width,
            height: ev.nativeEvent.layout.height,
          });
        }}
      >
        <TouchableOpacity
          alignItems='center'
          justifyContent='center'
          bg='$background'
          rippleColor='$backgroundRippleColor'
          borderRadius='sm'
          p='sm'
          px='md'
          flexDirection='row'
          gap='xs'
          onPress={() => toggleDropdown(true)}
        >
          <Text fontSize={15} lineHeight={17}>
            {items.find(i => i.id === activeMealTime)?.text ?? 'Breakfast'}
          </Text>
          <LucideIcon
            Icon={!visible ? ChevronDownIcon : ChevronUpIcon}
            size={16}
            stroke='black300'
            strokeWidth={2}
          />
        </TouchableOpacity>
      </Box>

      <Modal
        transparent={true}
        animationType='fade'
        visible={visible}
        onRequestClose={() => toggleDropdown(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
          onTouchStart={() => toggleDropdown(false)}
        >
          <Box
            bg='$background'
            position='absolute'
            top={triggerDimens.height + 16}
            left={0}
            right={0}
            mx='sm'
            p='sm'
            borderRadius='md'
            gap='xs'
            shadowColor='black700'
            shadowOpacity={0.9}
            shadowOffset={{ width: 0, height: 4 }}
            shadowRadius={12}
            elevation={12}
            onTouchStart={e => e.stopPropagation()}
          >
            {items.map((props, idx) =>
              renderDropdownItem({
                ...props,
                activeMealTime: activeMealTime,
                closeDropdown: () => toggleDropdown(false),
              })
            )}
          </Box>
        </SafeAreaView>
      </Modal>
    </Fragment>
  );
};

const DropdownItem: React.FC<DropdownItemProps> = ({
  action,
  activeMealTime,
  icon,
  id,
  text,
  closeDropdown,
}) => (
  <Fragment>
    <Box overflow='hidden' borderRadius='sm'>
      <TouchableOpacity
        rippleColor='$backgroundRippleColor'
        borderRadius='sm'
        px='md'
        py='sm'
        gap='md'
        alignItems='center'
        flexDirection='row'
        onPress={() => {
          action(id);
          closeDropdown();
        }}
      >
        <LucideIcon Icon={icon} size={20} stroke='pink' strokeWidth={1.5} />
        <Text style={{ flex: 1 }}>{text}</Text>

        {activeMealTime === id && (
          <LucideIcon
            Icon={CheckIcon}
            size={20}
            stroke='lightGreen'
            strokeWidth={1.5}
          />
        )}
      </TouchableOpacity>
    </Box>
  </Fragment>
);

Dropdown.Item = DropdownItem;

export default Dropdown;
