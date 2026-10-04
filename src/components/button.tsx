import React from 'react';
import {
  composeRestyleFunctions,
  createVariant,
  useRestyle,
  VariantProps,
  AllProps,
} from '@shopify/restyle';

import Pressable, { PressableProps } from '@src/atoms/pressable';

import { type Theme } from '@src/themes';

// export const buttonVariants = variants(
//   {
//     fontFamily: 'Inter_500Medium',
//     fontSize: 14,
//     borderRadius: 6,
//     gap: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   {
//     variants: {
//       variant: {
//         // default:
//         //   'bg-primary text-primary-foreground shadow hover:bg-primary/90',
//         // destructive:
//         //   'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
//         // outline:
//         //   'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
//         // secondary:
//         //   'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
//         // ghost: 'hover:bg-accent hover:text-accent-foreground',
//         // link: 'text-primary underline-offset-4 hover:underline',
//         filled: {},
//         outline: {
//           backgroundColor: 'transparent',
//           borderWidth: 1,
//         },
//         ghost: {
//           backgroundColor: 'transparent',
//           borderWidth: 0,
//         },
//         link: {},
//       },
//       color: {
//         primary: {
//           backgroundColor: '',
//           borderColor: '',
//           color: '',
//         },
//         secondary: {
//           backgroundColor: '',
//           borderColor: '',
//           color: '',
//         },
//         destructive: {
//           backgroundColor: '',
//           borderColor: '',
//           color: '',
//         },
//         success: {
//           backgroundColor: '',
//           borderColor: '',
//           color: '',
//         },
//         grey: {
//           backgroundColor: '',
//           borderColor: '',
//           color: '',
//         },
//       },
//       size: {
//         default: {
//           height: 36,
//           paddingHorizontal: 16,
//           paddingVertical: 8,
//         },
//         sm: {
//           height: 32,
//           paddingHorizontal: 12,
//           fontSize: 12,
//         },
//         lg: {
//           height: 40,
//           paddingHorizontal: 32,
//         },
//         icon: {
//           width: 36,
//           height: 36,
//         },
//       },
//     },
//     defaultVariants: {
//       variant: 'filled',
//       color: 'primary',
//       size: 'default',
//     },
//   }
// );

// export interface ButtonProps
//   extends PressableProps,
//     VariantTypes<typeof buttonVariants> {}

const buttonVariants = createVariant<Theme, 'buttonVariants', 'variant'>({
  property: 'variant',
  themeKey: 'buttonVariants',
  defaults: {
    p: 'xs',
    backgroundColor: '$bottomBarActiveItem',
  },
});
const buttonSize = createVariant<Theme, 'buttonSize', 'size'>({
  property: 'size',
  themeKey: 'buttonSize',
  defaults: {
    width: 100,
  },
});

interface RestyleProps
  extends AllProps<Theme>,
    VariantProps<Theme, 'buttonVariants', 'variant'>,
    VariantProps<Theme, 'buttonSize', 'size'> {}

const restyleFunctions = composeRestyleFunctions<Theme, RestyleProps>([
  buttonVariants,
  buttonSize,
]);

interface ButtonProps extends PressableProps, RestyleProps {}

export const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(function ({ ...rest }, ref) {
  const props = useRestyle(restyleFunctions, { ...rest });

  return <Pressable ref={ref} {...props} />;
});
