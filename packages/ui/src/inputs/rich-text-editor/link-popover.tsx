'use client';

import { ActionIcon, Group, Popover, TextInput } from '@mantine/core';
import type { Editor } from '@tiptap/react';
import { Check, Link, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface LinkPopoverProps {
  editor: Editor;
  opened: boolean;
  onClose: () => void;
}

const LinkPopover = ({ editor, opened, onClose }: LinkPopoverProps) => {
  const t = useTranslations('frontend.richTextEditor.link');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (opened) {
      const currentUrl = editor.getAttributes('link').href || '';
      setUrl(currentUrl);
    }
  }, [opened, editor]);

  const apply = useCallback(() => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
    onClose();
  }, [editor, url, onClose]);

  const remove = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  }, [editor, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      apply();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <Popover
      opened={opened}
      onClose={onClose}
      position="bottom-start"
      withArrow
      trapFocus
    >
      <Popover.Target>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }} />
      </Popover.Target>
      <Popover.Dropdown>
        <Group gap="xs">
          <TextInput
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            placeholder={t('placeholder')}
            size="xs"
            onKeyDown={handleKeyDown}
            style={{ width: 260 }}
            leftSection={<Link size={14} />}
          />
          <ActionIcon size="sm" variant="filled" color="blue" onClick={apply} title={t('apply')}>
            <Check size={14} />
          </ActionIcon>
          {editor.isActive('link') && (
            <ActionIcon size="sm" variant="subtle" color="red" onClick={remove} title={t('remove')}>
              <Trash2 size={14} />
            </ActionIcon>
          )}
          <ActionIcon size="sm" variant="subtle" color="gray" onClick={onClose} title={t('cancel')}>
            <X size={14} />
          </ActionIcon>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
};

export default LinkPopover;
