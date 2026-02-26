'use client';

import {
  Accordion,
  Badge,
  Button,
  Checkbox,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import type { PaginatedResponse } from '@org/types/pagination';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LookupItem, TreeFetchOptions, TreeNode } from './types';

interface NormalizedTreePage {
  items: TreeNode[];
  hasMore: boolean;
}

function normalizeTreePage(
  result: LookupItem[] | PaginatedResponse<TreeNode>
): NormalizedTreePage {
  if (Array.isArray(result)) {
    return { items: result as TreeNode[], hasMore: false };
  }
  return {
    items: result.data,
    hasMore: result.pagination.page < result.pagination.totalPages,
  };
}

interface ModalTreeListProps {
  queryKey: readonly unknown[];
  fetchOptions: TreeFetchOptions;
  debouncedSearch: string;
  selectedIds: Set<string>;
  onToggle: (item: LookupItem) => void;
  renderOption?: (item: LookupItem) => React.ReactNode;
  emptyMessage?: string;
  initialSelectedItems?: LookupItem[];
}

export function ModalTreeList({
  queryKey,
  fetchOptions,
  debouncedSearch,
  selectedIds,
  onToggle,
  renderOption,
  emptyMessage,
  initialSelectedItems,
}: ModalTreeListProps) {
  const t = useTranslations('common.relationModal');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const autoExpandedRef = useRef(false);

  const [nodeChildren, setNodeChildren] = useState<Map<string, TreeNode[]>>(
    new Map()
  );
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  const [openedNodes, setOpenedNodes] = useState<Set<string>>(new Set());

  const [childPages, setChildPages] = useState<Map<string, number>>(new Map());
  const [childHasMore, setChildHasMore] = useState<Map<string, boolean>>(
    new Map()
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [...queryKey, 'modal-tree-search', debouncedSearch || ''],
      queryFn: async ({ pageParam }) => {
        const result = await fetchOptions({
          q: debouncedSearch || undefined,
          page: pageParam,
        });
        return normalizeTreePage(result);
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.hasMore ? lastPageParam + 1 : undefined,
      staleTime: 2 * 60 * 1000,
    });

  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  const treeNodes = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  useEffect(() => {
    setNodeChildren(new Map());
    setLoadingNodes(new Set());
    setOpenedNodes(new Set());
    setChildPages(new Map());
    setChildHasMore(new Map());
    autoExpandedRef.current = false;
  }, [debouncedSearch]);

  const fetchChildren = useCallback(
    async (nodeId: string, page = 1, append = false) => {
      if (loadingNodes.has(nodeId)) return;
      setLoadingNodes((prev) => new Set(prev).add(nodeId));
      try {
        const result = await fetchOptions({ parentId: nodeId, page });
        const { items, hasMore } = normalizeTreePage(result);
        setNodeChildren((prev) => {
          const existing = append ? prev.get(nodeId) ?? [] : [];
          return new Map(prev).set(nodeId, [...existing, ...items]);
        });
        setChildHasMore((prev) => new Map(prev).set(nodeId, hasMore));
        setChildPages((prev) => new Map(prev).set(nodeId, page));
      } finally {
        setLoadingNodes((prev) => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }
    },
    [loadingNodes, fetchOptions]
  );

  const fetchChildrenRef = useRef(fetchChildren);
  fetchChildrenRef.current = fetchChildren;

  useEffect(() => {
    if (autoExpandedRef.current) return;
    if (isLoading) return;
    if (!initialSelectedItems?.length) return;

    const allAncestorIds = new Set<string>();
    for (const item of initialSelectedItems) {
      const ancestorIds = item.extra?.ancestorIds as string[] | undefined;
      ancestorIds?.forEach((id) => allAncestorIds.add(id));
    }

    if (allAncestorIds.size === 0) return;

    autoExpandedRef.current = true;
    setOpenedNodes((prev) => new Set([...prev, ...allAncestorIds]));
    for (const ancestorId of allAncestorIds) {
      void fetchChildrenRef.current(ancestorId, 1, false);
    }
  }, [initialSelectedItems, isLoading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPageRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage]);

  const renderLabel = (item: LookupItem) =>
    renderOption ? renderOption(item) : item.label;

  const hasChildrenFn = (node: TreeNode): boolean => {
    const childCount = (node.extra?.childCount as number | undefined) ?? 0;
    const preLoaded = node.children && node.children.length > 0;
    return preLoaded || childCount > 0;
  };

  const getChildren = (node: TreeNode): TreeNode[] => {
    return nodeChildren.get(node.id) ?? node.children ?? [];
  };

  const countSelectedInSubtree = useCallback(
    (node: TreeNode): number => {
      const children = getChildren(node);
      return children.reduce((acc, child) => {
        const childSelected = selectedIds.has(child.id) ? 1 : 0;
        return acc + childSelected + countSelectedInSubtree(child);
      }, 0);
    },

    [selectedIds, nodeChildren]
  );

  const renderNode = useCallback(
    (node: TreeNode, depth = 0): React.ReactNode => {
      const nodeHasChildren = hasChildrenFn(node);
      const isSelected = selectedIds.has(node.id);
      const isNodeLoading = loadingNodes.has(node.id);
      const children = getChildren(node);
      const selectedSubCount = countSelectedInSubtree(node);
      const isOpened = openedNodes.has(node.id);
      const hasMore = childHasMore.get(node.id) ?? false;
      const currentPage = childPages.get(node.id) ?? 1;

      if (!nodeHasChildren) {
        return (
          <Group
            key={node.id}
            gap="sm"
            p="sm"
            pl={depth > 0 ? 'md' : 'sm'}
            style={{
              cursor: 'pointer',
              backgroundColor: isSelected
                ? 'var(--mantine-color-blue-light)'
                : undefined,
            }}
            onClick={() => onToggle(node)}
            wrap="nowrap"
          >
            <Checkbox
              checked={isSelected}
              onChange={() => {}}
              readOnly
              tabIndex={-1}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {typeof renderLabel(node) === 'string' ? (
                <Text size="sm" truncate>
                  {renderLabel(node)}
                </Text>
              ) : (
                renderLabel(node)
              )}
            </div>
          </Group>
        );
      }

      return (
        <Accordion
          key={node.id}
          multiple
          variant="filled"
          value={isOpened ? [node.id] : []}
          onChange={(values) => {
            const nowOpen = values.includes(node.id);
            setOpenedNodes((prev) => {
              const next = new Set(prev);
              if (nowOpen) {
                next.add(node.id);
                if (!nodeChildren.has(node.id)) {
                  void fetchChildren(node.id, 1, false);
                }
              } else {
                next.delete(node.id);
              }
              return next;
            });
          }}
          chevron={<ChevronRight size={16} />}
          styles={{
            chevron: {
              '&[dataRotate]': { transform: 'rotate(90deg)' },
            },
          }}
        >
          <Accordion.Item value={node.id}>
            <Accordion.Control>
              <Group gap="sm" wrap="nowrap">
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggle(node);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  tabIndex={-1}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {typeof renderLabel(node) === 'string' ? (
                    <Text size="sm" truncate>
                      {renderLabel(node)}
                    </Text>
                  ) : (
                    renderLabel(node)
                  )}
                </div>
                {isNodeLoading && <Loader size={14} />}
                {!isNodeLoading && selectedSubCount > 0 && (
                  <Badge size="xs" variant="light">
                    {selectedSubCount}
                  </Badge>
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              {isNodeLoading && children.length === 0 ? (
                <Group justify="center" p="sm">
                  <Loader size="xs" />
                </Group>
              ) : (
                <Stack gap={0} ml="md">
                  {children.map((child) => renderNode(child, depth + 1))}
                  {hasMore && (
                    <Button
                      size="xs"
                      variant="subtle"
                      loading={isNodeLoading}
                      onClick={() =>
                        fetchChildren(node.id, currentPage + 1, true)
                      }
                      mt={4}
                    >
                      {t('loadMore')}
                    </Button>
                  )}
                </Stack>
              )}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      );
    },

    [
      selectedIds,
      loadingNodes,
      openedNodes,
      nodeChildren,
      childHasMore,
      childPages,
      onToggle,
      renderOption,
      fetchChildren,
      countSelectedInSubtree,
    ]
  );

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader size="sm" />
      </Group>
    );
  }

  if (treeNodes.length === 0) {
    return (
      <Text c="dimmed" ta="center" p="xl" size="sm">
        {emptyMessage ?? t('empty')}
      </Text>
    );
  }

  return (
    <ScrollArea.Autosize mah={400} type="scroll">
      <Stack gap={0}>{treeNodes.map((node) => renderNode(node))}</Stack>
      {hasNextPage && (
        <div ref={sentinelRef}>
          {isFetchingNextPage && (
            <Group justify="center" p="sm">
              <Loader size="xs" />
            </Group>
          )}
        </div>
      )}
    </ScrollArea.Autosize>
  );
}
