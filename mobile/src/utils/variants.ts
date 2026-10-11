import { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

type OmitUndefined<T> = T extends undefined ? never : T;

type Style = StyleProp<ViewStyle | TextStyle | ImageStyle>;

type VariantSchema = Record<string, Record<string, Style>>;

type Props<T extends VariantSchema> = VariantProps<T> & {
  style?: Style;
};

type VariantProps<T> = {
  [Key in keyof T]?: keyof T[Key] | null | undefined;
};

type CompoundVariant<T extends VariantSchema> = VariantProps<T> & {
  style: Style;
};

type VariantsConfig<T extends VariantSchema> = {
  variants?: T;
  defaultVariants?: VariantProps<T>;
  compoundVariants?: CompoundVariant<T>[];
};

export type VariantTypes<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  'style'
>;

export const variants =
  <T extends VariantSchema>(baseStyles?: Style, config?: VariantsConfig<T>) =>
  (props: Props<T>) => {
    if (!config?.variants) return [baseStyles, props.style];

    const { variants, defaultVariants, compoundVariants } = config;

    const variantStyles = Object.keys(variants).map(variantKey => {
      const variantProp = props?.[variantKey as keyof typeof props];
      const defaultValue = defaultVariants?.[variantKey as keyof T];
      const value = variantProp ?? defaultValue;

      if (value === null) return null;

      return variants[variantKey][value as string];
    });

    const compoundVariantStyles =
      compoundVariants?.reduce<Style[]>(
        (acc, { style, ...compoundVariant }) => {
          const isActive = Object.entries(compoundVariant).every(
            ([key, value]) => {
              const propVal =
                props?.[key as keyof typeof props] ??
                defaultVariants?.[key as keyof T];
              return propVal === value;
            }
          );

          return isActive ? [...acc, style] : acc;
        },
        []
      ) || [];

    return [
      baseStyles,
      ...variantStyles,
      ...compoundVariantStyles,
      props?.style,
    ];
  };
