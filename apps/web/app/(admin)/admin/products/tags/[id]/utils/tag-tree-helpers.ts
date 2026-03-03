import type { RecursiveTagInput } from '@org/schemas/admin/tags';
import type { AdminTagChildrenPrismaType } from '@org/types/admin/tags';

/**
 * Form state tag'ini AG-Grid tablo gösterim formatına çevirir.
 * AdminTagChildrenPrismaType ile uyumlu obje döner.
 */
export function formTagToDisplayTag(
  tag: RecursiveTagInput,
  depth: number
): AdminTagChildrenPrismaType {
  const now = new Date();
  return {
    id: tag.id,
    slug: tag.slug,
    parentTagId: tag.parentTagId,
    tagGroupId: '',
    isActive: tag.isActive,
    sortOrder: tag.sortOrder,
    depth,
    translations: tag.translations.map((tr) => ({
      id: '',
      locale: tr.locale as any,
      name: tr.name,
      description: tr.description ?? null,
      tagId: tag.id,
      createdAt: now,
      updatedAt: now,
    })),
    images: [],
    _count: { children: tag.children?.length ?? 0 },
    createdAt: now,
    updatedAt: now,
  } as unknown as AdminTagChildrenPrismaType;
}

/** Ağaca tag ekle (root veya nested). Immutable. */
export function addTagToTree(
  tags: RecursiveTagInput[],
  newTag: RecursiveTagInput,
  parentId: string | null
): RecursiveTagInput[] {
  if (parentId === null) {
    return [...tags, newTag];
  }

  return tags.map((tag) => {
    if (tag.id === parentId) {
      return { ...tag, children: [...(tag.children ?? []), newTag] };
    }
    if (tag.children?.length) {
      return {
        ...tag,
        children: addTagToTree(tag.children, newTag, parentId),
      };
    }
    return tag;
  });
}

/** Ağaçtaki tag'i güncelle (id üzerinden bulup replace). Immutable. */
export function updateTagInTree(
  tags: RecursiveTagInput[],
  updatedTag: RecursiveTagInput
): RecursiveTagInput[] {
  return tags.map((tag) => {
    if (tag.id === updatedTag.id) {
      return { ...updatedTag, children: tag.children ?? [] };
    }
    if (tag.children?.length) {
      return {
        ...tag,
        children: updateTagInTree(tag.children, updatedTag),
      };
    }
    return tag;
  });
}

/** Ağaçtan tag sil. Immutable. */
export function removeTagFromTree(
  tags: RecursiveTagInput[],
  tagId: string
): RecursiveTagInput[] {
  return tags
    .filter((tag) => tag.id !== tagId)
    .map((tag) => {
      if (tag.children?.length) {
        return {
          ...tag,
          children: removeTagFromTree(tag.children, tagId),
        };
      }
      return tag;
    });
}

/** Ağaçtan birden fazla tag sil. Immutable. */
export function removeTagsFromTree(
  tags: RecursiveTagInput[],
  tagIds: string[]
): RecursiveTagInput[] {
  const idSet = new Set(tagIds);
  return tags
    .filter((tag) => !idSet.has(tag.id))
    .map((tag) => {
      if (tag.children?.length) {
        return {
          ...tag,
          children: removeTagsFromTree(tag.children, tagIds),
        };
      }
      return tag;
    });
}

/** Belirli parent'ın doğrudan children'larını bul. */
export function findChildrenInTree(
  tags: RecursiveTagInput[],
  parentId: string
): RecursiveTagInput[] {
  for (const tag of tags) {
    if (tag.id === parentId) {
      return tag.children ?? [];
    }
    if (tag.children?.length) {
      const found = findChildrenInTree(tag.children, parentId);
      if (found.length > 0) return found;
    }
  }
  return [];
}
