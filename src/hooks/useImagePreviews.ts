'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Object URLs created for local file previews have to be revoked by hand or the
 * blobs leak for the lifetime of the document. NewItemForm and EditItemForm
 * each carried their own copy of this bookkeeping — a mirror ref updated on
 * every render plus an unmount effect — for both the main image and the
 * additional ones.
 *
 * The ref mirrors the current URLs so the unmount cleanup can read them without
 * re-subscribing the effect on every change. The mirror is written in an effect
 * rather than during render: a render-phase ref write is a side effect during
 * render, which React (and react-hooks/refs) rejects.
 */

/** A single selected image and its preview URL — the main photo of an item. */
export function useSingleImagePreview() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  const select = useCallback((files: File[]) => {
    const next = files[0];
    if (!next) return;

    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(next);
    });
    setFile(next);
  }, []);

  const clear = useCallback(() => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFile(null);
  }, []);

  return { file, preview, select, clear };
}

/** A growing set of selected images and their preview URLs — additional photos. */
export function useMultiImagePreviews() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const previewsRef = useRef<string[]>([]);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const add = useCallback((incoming: File[]) => {
    if (!incoming.length) return;
    const urls = incoming.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...incoming]);
    setPreviews((prev) => [...prev, ...urls]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { files, previews, add, removeAt };
}
