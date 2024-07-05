import React, { createContext, useCallback, useContext, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

type BottomBarContextState = {
  bottomBarHeight: number;
  handleBottomBarLayout: (event: LayoutChangeEvent) => void;
};

const BottomBarContext = createContext<BottomBarContextState>({
  bottomBarHeight: 0,
  handleBottomBarLayout: () => null,
});

const BottomBarProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [bottomBarHeight, setBottomBarHeight] = useState(70);

  const handleBottomBarLayout = useCallback((event: LayoutChangeEvent) => {
    setBottomBarHeight(event.nativeEvent.layout.height);
  }, []);

  const value: BottomBarContextState = {
    handleBottomBarLayout: handleBottomBarLayout,
    bottomBarHeight: bottomBarHeight,
  };

  return (
    <BottomBarContext.Provider value={value}>
      {children}
    </BottomBarContext.Provider>
  );
};

const useBottomBar = () => {
  const context = useContext(BottomBarContext);

  if (context === undefined)
    throw new Error('useBottomBar must be used inside BottomBarProvider');

  return context;
};

export { BottomBarContext, useBottomBar };
export type { BottomBarContextState };
export default BottomBarProvider;
