import { createText } from '@shopify/restyle';

import { Theme } from '../themes';

const Text = createText<Theme>();

export type TextProps = React.ComponentProps<typeof Text>;
export default Text;
