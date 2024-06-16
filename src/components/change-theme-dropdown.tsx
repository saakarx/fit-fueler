import { useAtom } from 'jotai';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Box, Text, TouchableOpacity } from '@src/atoms';
import { activeThemeId } from '@src/states/theme';
import { ThemeNames, themes } from '@src/themes';
import LucideIcon from './lucide-icon';

const ChangeTheme = () => {
  const [dimens, setDimens] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  return (
    <Box
      borderBottomWidth={1}
      borderColor='black700'
      width='100%'
      flexDirection='row'
      alignItems='center'
      justifyContent='space-between'
      gap='md'
      py='md'
      minHeight={58}
      onLayout={e =>
        setDimens({ x: e.nativeEvent.layout.x, y: e.nativeEvent.layout.y })
      }
    >
      <Text fontSize={18} fontFamily='WorkSans_600SemiBold' fontWeight='600'>
        Change theme
      </Text>

      <ChangeThemeDropdown fromTop={dimens.y} />
    </Box>
  );
};

const ChangeThemeDropdown = ({ fromTop = 0 }: { fromTop?: number }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [triggerDimens, setTriggerDimens] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  }>({ width: 0, height: 0, x: 0, y: 0 });

  const [activeTheme, setActiveTheme] = useAtom(activeThemeId);

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
            x: ev.nativeEvent.layout.x,
            y: ev.nativeEvent.layout.y,
          });
        }}
      >
        <TouchableOpacity
          alignItems='center'
          justifyContent='center'
          bg='$background'
          borderRadius='sm'
          p='sm'
          px='md'
          flexDirection='row'
          gap='xs'
          onPress={() => toggleDropdown(true)}
        >
          <Text fontSize={15} lineHeight={17}>
            {themes.find(i => i.id === activeTheme)?.title ?? themes[0].title}
          </Text>
          <LucideIcon
            Icon={!visible ? ChevronDownIcon : ChevronUpIcon}
            size={16}
            stroke='white'
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
            top={triggerDimens.y + triggerDimens.height + fromTop + 8}
            left={0}
            right={0}
            p='xs'
            borderRadius='md'
            onTouchStart={e => e.stopPropagation()}
          >
            {themes.map(({ id, title }, idx) => (
              <Fragment key={id}>
                <Box flex={1} overflow='hidden' borderRadius='sm'>
                  <TouchableOpacity
                    flex={1}
                    borderRadius='sm'
                    px='md'
                    py='sm'
                    gap='md'
                    alignItems='center'
                    flexDirection='row'
                    onPress={() => {
                      setActiveTheme(id as ThemeNames);
                      toggleDropdown(false);
                    }}
                  >
                    <Text style={{ flex: 1 }}>{title}</Text>

                    {activeTheme === id && (
                      <LucideIcon
                        Icon={CheckIcon}
                        size={20}
                        stroke='lightGreen'
                        strokeWidth={1.5}
                      />
                    )}
                  </TouchableOpacity>
                </Box>

                {idx !== themes.length - 1 && (
                  <Box
                    width='95%'
                    borderBottomWidth={1}
                    borderColor='black700'
                    my='xxs'
                    style={{ marginHorizontal: 'auto' }}
                  />
                )}
              </Fragment>
            ))}
          </Box>
        </SafeAreaView>
      </Modal>
    </Fragment>
  );
};

export { ChangeThemeDropdown };
export default ChangeTheme;
