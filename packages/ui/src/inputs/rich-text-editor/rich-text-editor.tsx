'use client';

import { Box, Input, Text } from '@mantine/core';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExtension from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
  type PathValue,
} from 'react-hook-form';
import LinkPopover from './link-popover';
import Toolbar from './toolbar';

export interface RichTextEditorProps<T extends FieldValues> {
  name: Path<T>;
  labelKey?: string;
  descriptionKey?: string;
  placeholderKey?: string;
  error?: string;
  minHeight?: number;
  defaultValue?: string;
}

const RichTextEditorInner = ({
  value,
  onChange,
  error,
  label,
  description,
  placeholder,
  minHeight = 200,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  minHeight?: number;
}) => {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    immediatelyRender: false,
  });

  const lastValueRef = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValueRef.current) {
      const currentContent = editor.getHTML();
      const normalizedValue = value || '';
      if (currentContent !== normalizedValue) {
        editor.commands.setContent(normalizedValue, { emitUpdate: false });
      }
      lastValueRef.current = value;
    }
  }, [value, editor]);

  const handleLinkClick = useCallback(() => {
    setLinkPopoverOpen(true);
  }, []);

  if (!editor) return null;

  return (
    <Box>
      {label && <Input.Label mb={4}>{label}</Input.Label>}
      {description && (
        <Text size="xs" c="dimmed" mb={4}>
          {description}
        </Text>
      )}
      <Box
        ref={wrapperRef}
        style={{
          border: `1px solid ${
            error
              ? 'var(--mantine-color-error)'
              : 'var(--mantine-color-default-border)'
          }`,
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'border-color 100ms ease',
        }}
      >
        <Toolbar editor={editor} onLinkClick={handleLinkClick} />
        <LinkPopover
          editor={editor}
          opened={linkPopoverOpen}
          onClose={() => setLinkPopoverOpen(false)}
        />
        <Box
          style={{ minHeight, padding: 'var(--mantine-spacing-sm)' }}
          onClick={() => editor.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </Box>
      </Box>
      {error && <Input.Error mt={4}>{error}</Input.Error>}
    </Box>
  );
};

const RichTextEditor = <T extends FieldValues>({
  name,
  labelKey,
  descriptionKey,
  placeholderKey,
  error: externalError,
  minHeight,
  defaultValue,
}: RichTextEditorProps<T>) => {
  const { control } = useFormContext<T>();
  const t = useTranslations('common');

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={(defaultValue ?? '') as PathValue<T, Path<T>>}
      render={({ field, fieldState }) => (
        <RichTextEditorInner
          value={field.value ?? ''}
          onChange={field.onChange}
          error={externalError ?? fieldState.error?.message}
          label={labelKey ? t(labelKey) : undefined}
          description={descriptionKey ? t(descriptionKey) : undefined}
          placeholder={placeholderKey ? t(placeholderKey) : undefined}
          minHeight={minHeight}
        />
      )}
    />
  );
};

export default RichTextEditor;
