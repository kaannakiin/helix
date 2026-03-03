'use client';

import { DrawerFlatList } from './DrawerFlatList';
import { DrawerTreeList } from './DrawerTreeList';
import { RelationDrawerContent } from './RelationDrawerContent';
import { RelationDrawerFooter } from './RelationDrawerFooter';
import { RelationDrawerGridDisplay } from './RelationDrawerGridDisplay';
import { RelationDrawerRoot } from './RelationDrawerRoot';
import { RelationDrawerSearch } from './RelationDrawerSearch';
import { RelationDrawerSelectionBar } from './RelationDrawerSelectionBar';
import { RelationDrawerTrigger } from './RelationDrawerTrigger';
import type { RelationDrawerProps, RelationDrawerRootProps } from './types';

function RelationDrawerComponent(props: RelationDrawerProps) {
  const {
    title,
    label,
    description,
    placeholder,
    error,
    required,
    disabled,
    drawerSize,
    renderItem,
    renderOption,
    renderSelected,
    emptyMessage,
    searchDebounce,
    ...rest
  } = props;

  const itemRenderer = renderItem ?? renderOption;

  const rootProps = {
    ...rest,
    renderItem: itemRenderer,
    renderSelected,
    emptyMessage,
    searchDebounce,
  } as unknown as RelationDrawerRootProps;

  return (
    <RelationDrawerRoot {...rootProps}>
      <RelationDrawerTrigger
        label={label}
        description={description}
        placeholder={placeholder}
        error={error}
        required={required}
        disabled={disabled}
      />
      <RelationDrawerContent title={title} size={drawerSize}>
        {'tree' in props && props.tree ? (
          <DrawerTreeList />
        ) : (
          <DrawerFlatList />
        )}
      </RelationDrawerContent>
    </RelationDrawerRoot>
  );
}

interface RelationDrawerCompound {
  (props: RelationDrawerProps): React.JSX.Element;
  Root: typeof RelationDrawerRoot;
  Trigger: typeof RelationDrawerTrigger;
  Content: typeof RelationDrawerContent;
  Search: typeof RelationDrawerSearch;
  SelectionBar: typeof RelationDrawerSelectionBar;
  FlatList: typeof DrawerFlatList;
  TreeList: typeof DrawerTreeList;
  Footer: typeof RelationDrawerFooter;
  GridDisplay: typeof RelationDrawerGridDisplay;
}

export const RelationDrawer: RelationDrawerCompound = Object.assign(
  RelationDrawerComponent,
  {
    Root: RelationDrawerRoot,
    Trigger: RelationDrawerTrigger,
    Content: RelationDrawerContent,
    Search: RelationDrawerSearch,
    SelectionBar: RelationDrawerSelectionBar,
    FlatList: DrawerFlatList,
    TreeList: DrawerTreeList,
    Footer: RelationDrawerFooter,
    GridDisplay: RelationDrawerGridDisplay,
  }
);
