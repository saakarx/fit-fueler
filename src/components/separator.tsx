import { BoxProps } from '@shopify/restyle';

import { Box } from '@src/atoms';
import { Theme } from '@src/themes';

const Separator = ({
  horizontal,
  width,
  height,
  borderColor = 'black300',
  borderBottomWidth = 1,
  borderRightWidth = 0,
  ...props
}: {
  horizontal: boolean;
} & BoxProps<Theme>) => {
  if (horizontal) {
    if (width === undefined) width = '100%';
    height = 0;
    borderBottomWidth = 1;
    borderRightWidth = 0;
  } else {
    if (height === undefined) height = '100%';
    width = 0;
    borderBottomWidth = 0;
    borderRightWidth = 1;
  }

  return (
    <Box
      {...props}
      borderColor={borderColor}
      borderBottomWidth={borderBottomWidth}
      borderRightWidth={borderRightWidth}
      width={width}
      height={height}
      style={[horizontal ? { marginHorizontal: 'auto' } : undefined]}
    />
  );
};

export default Separator;
