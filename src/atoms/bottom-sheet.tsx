import RNBottomSheet, {
  BottomSheetModal as RNBottomSheetModal,
  BottomSheetModalProps as RNBottomSheetModalProps,
  BottomSheetProps as RNBottomSheetProps,
} from '@gorhom/bottom-sheet';
import { ColorProps, useTheme } from '@shopify/restyle';
import React from 'react';

import { Theme } from '@src/themes';

type BottomSheetProps = RNBottomSheetProps & ColorProps<Theme>;

const BottomSheet = React.forwardRef<RNBottomSheet, BottomSheetProps>(
  ({ handleIndicatorStyle, backgroundStyle, ...props }, ref) => {
    const theme = useTheme<Theme>();

    const bgColor = theme.colors['$background'];
    const handleColor = theme.colors['$foreground'];

    return (
      <RNBottomSheet
        {...props}
        ref={ref}
        handleIndicatorStyle={[
          handleIndicatorStyle,
          { backgroundColor: handleColor, opacity: 0.7 },
        ]}
        backgroundStyle={[backgroundStyle, { backgroundColor: bgColor }]}
      />
    );
  }
);

type BottomSheetModalProps = RNBottomSheetModalProps & ColorProps<Theme>;

const BottomSheetModal = React.forwardRef<
  RNBottomSheetModal,
  BottomSheetModalProps
>(({ handleIndicatorStyle, backgroundStyle, ...props }, ref) => {
  const theme = useTheme<Theme>();

  const bgColor = theme.colors['$background'];
  const handleColor = theme.colors['$foreground'];

  return (
    <RNBottomSheetModal
      {...props}
      ref={ref}
      handleIndicatorStyle={[
        handleIndicatorStyle,
        { backgroundColor: handleColor, opacity: 0.7 },
      ]}
      backgroundStyle={[backgroundStyle, { backgroundColor: bgColor }]}
    />
  );
});

export { BottomSheetModal };
export type { BottomSheetProps };
export default BottomSheet;
