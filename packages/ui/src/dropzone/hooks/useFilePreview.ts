'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DropzoneFile, FileType } from '../types';
import { classifyMime } from '../utils/file-helpers';

interface PreviewState {
  isOpen: boolean;
  file: DropzoneFile | null;
  url: string | null;
  fileType: FileType | null;
}

const INITIAL_STATE: PreviewState = {
  isOpen: false,
  file: null,
  url: null,
  fileType: null,
};

export function useFilePreview() {
  const [state, setState] = useState<PreviewState>(INITIAL_STATE);
  const urlRef = useRef<string | null>(null);

  const openPreview = useCallback((file: DropzoneFile) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }

    const url = URL.createObjectURL(file.file);
    urlRef.current = url;

    setState({
      isOpen: true,
      file,
      url,
      fileType: file.fileType ?? classifyMime(file.file.type),
    });
  }, []);

  const openPreviewWithUrl = useCallback((url: string, fileType: FileType) => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setState({ isOpen: true, file: null, url, fileType });
  }, []);

  const closePreview = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, []);

  return { preview: state, openPreview, openPreviewWithUrl, closePreview };
}
