import RNBottomSheet, {
  BottomSheetProps as RNBottomSheetProps,
} from '@gorhom/bottom-sheet';
import { ColorProps, useTheme } from '@shopify/restyle';

import { Theme } from '@src/themes';
import React from 'react';

type BottomSheetProps = RNBottomSheetProps & ColorProps<Theme>;

const BottomSheet = React.forwardRef<RNBottomSheet, BottomSheetProps>(
  (props, ref) => {
    const theme = useTheme<Theme>();
    const bgColor = theme.colors['$background'];
    const handleColor = theme.colors['$foreground'];

    return (
      <RNBottomSheet
        {...props}
        ref={ref}
        handleIndicatorStyle={{ backgroundColor: handleColor, opacity: 0.7 }}
        backgroundStyle={{ backgroundColor: bgColor }}
      />
    );
  }
);

export type { BottomSheetProps };
export default BottomSheet;
