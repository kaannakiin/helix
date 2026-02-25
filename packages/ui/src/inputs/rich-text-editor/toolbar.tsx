'use client';

import { ActionIcon, Divider, Group } from '@mantine/core';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Redo,
  RemoveFormatting,
  Strikethrough,
  TextQuote,
  Underline,
  Undo,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
}

interface ToolbarButton {
  icon: React.ElementType;
  key: string;
  action: () => void;
  isActive?: () => boolean;
}

const ICON_SIZE = 16;

const Toolbar = ({ editor, onLinkClick }: ToolbarProps) => {
  const t = useTranslations('common.richTextEditor.toolbar');

  const groups: ToolbarButton[][] = [
    [
      {
        icon: Bold,
        key: 'bold',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold'),
      },
      {
        icon: Italic,
        key: 'italic',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
      },
      {
        icon: Underline,
        key: 'underline',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
      },
      {
        icon: Strikethrough,
        key: 'strikethrough',
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
      },
      {
        icon: Code,
        key: 'code',
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: () => editor.isActive('code'),
      },
    ],
    [
      {
        icon: Heading1,
        key: 'heading1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive('heading', { level: 1 }),
      },
      {
        icon: Heading2,
        key: 'heading2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive('heading', { level: 2 }),
      },
      {
        icon: Heading3,
        key: 'heading3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive('heading', { level: 3 }),
      },
    ],
    [
      {
        icon: List,
        key: 'bulletList',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive('bulletList'),
      },
      {
        icon: ListOrdered,
        key: 'orderedList',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive('orderedList'),
      },
      {
        icon: TextQuote,
        key: 'blockquote',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive('blockquote'),
      },
      {
        icon: Minus,
        key: 'horizontalRule',
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        icon: Link,
        key: 'link',
        action: onLinkClick,
        isActive: () => editor.isActive('link'),
      },
      {
        icon: RemoveFormatting,
        key: 'clearFormatting',
        action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      },
    ],
    [
      {
        icon: Undo,
        key: 'undo',
        action: () => editor.chain().focus().undo().run(),
      },
      {
        icon: Redo,
        key: 'redo',
        action: () => editor.chain().focus().redo().run(),
      },
    ],
  ];

  return (
    <Group
      gap={4}
      p="xs"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        flexWrap: 'wrap',
      }}
    >
      {groups.map((group, groupIndex) => (
        <Group key={groupIndex} gap={2}>
          {groupIndex > 0 && (
            <Divider orientation="vertical" mx={4} style={{ alignSelf: 'stretch', height: 24 }} />
          )}
          {group.map((button) => {
            const Icon = button.icon;
            const active = button.isActive?.();
            return (
              <ActionIcon
                key={button.key}
                variant={active ? 'filled' : 'subtle'}
                color={active ? 'blue' : 'gray'}
                size="sm"
                onClick={button.action}
                title={t(button.key)}
              >
                <Icon size={ICON_SIZE} />
              </ActionIcon>
            );
          })}
        </Group>
      ))}
    </Group>
  );
};

export default Toolbar;
