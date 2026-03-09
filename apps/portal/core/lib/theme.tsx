import { TransitionOverride, createTheme } from '@mantine/core';
import { ChevronDown } from 'lucide-react';

const FADE_TRANSITION: TransitionOverride = {
  transition: 'fade' as const,
  duration: 220,
  exitDuration: 150,
  timingFunction: 'ease',
};

const ChevronIcon = () => (
  <ChevronDown size={16} strokeWidth={2} style={{ display: 'block' }} />
);

export const theme = createTheme({
  primaryColor: 'primary',
  primaryShade: { light: 6, dark: 4 },
  colors: {
    primary: [
      '#eff2ff',
      '#dfe2f2',
      '#bdc2de',
      '#99a0ca',
      '#7a84b9',
      '#6672af',
      '#5c69ac',
      '#4c5897',
      '#424e88',
      '#36437a',
    ],
  },
  components: {
    Modal: { defaultProps: { transitionProps: FADE_TRANSITION } },
    ModalRoot: { defaultProps: { transitionProps: FADE_TRANSITION } },
    Popover: { defaultProps: { transitionProps: FADE_TRANSITION } },
    Menu: { defaultProps: { transitionProps: FADE_TRANSITION } },
    Combobox: { defaultProps: { transitionProps: FADE_TRANSITION } },
    Select: {
      defaultProps: {
        rightSection: <ChevronIcon />,
        rightSectionPointerEvents: 'none',
      },
    },
    MultiSelect: {
      defaultProps: {
        rightSection: <ChevronIcon />,
        rightSectionPointerEvents: 'none',
      },
    },
    NativeSelect: {
      defaultProps: {
        rightSection: <ChevronIcon />,
        rightSectionPointerEvents: 'none',
      },
    },
  },
});
