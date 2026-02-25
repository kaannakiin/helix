import {
  LoadingOverlay as MantineLoadingOverlay,
  LoadingOverlayProps as MantineLoadingOverlayProps,
} from '@mantine/core';

type LoadingOverlayProps = MantineLoadingOverlayProps;

const LoadingOverlay = ({ visible, ...props }: LoadingOverlayProps) => {
  return <MantineLoadingOverlay visible={visible} {...props} />;
};

export default LoadingOverlay;
