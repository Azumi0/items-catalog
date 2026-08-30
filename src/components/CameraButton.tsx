'use client';

import { useRef } from 'react';
import { Button } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';

interface CameraButtonProps {
  /** Receives the shot as a one-element array, matching Dropzone's `onDrop`. */
  onCapture: (files: File[]) => void;
  disabled?: boolean;
  /** Copy of the button. Defaults to the plain "take a photo". */
  label?: string;
}

/**
 * The live-camera half of a photo field.
 *
 * Chrome on Android hands an `accept` that lists only image types to the
 * system photo picker, which shows the gallery and offers no shutter — so the
 * dropzone next to this button can reach existing photos and nothing else.
 * `capture` fixes that by replacing the picker with the camera outright, which
 * is why it lives on a button of its own rather than on the dropzone: the two
 * paths cannot share one input, because the attribute that opens the camera is
 * the same attribute that closes off the gallery. See ADR-004 §3.1.
 *
 * `accept="image/*"` rather than the dropzone's explicit MIME list: a list of
 * specific types is the other thing that makes Chrome drop the camera, and a
 * photo straight off the camera is a JPEG regardless.
 */
export function CameraButton({
  onCapture,
  disabled,
  label = 'Zrób zdjęcie',
}: CameraButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="default"
        mih={44}
        fz={14}
        fw={600}
        fullWidth
        disabled={disabled}
        leftSection={<IconCamera size={18} stroke={1.5} />}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) onCapture([file]);
          // Clear it, or shooting the same-named file twice in a row fires no
          // change event the second time.
          event.currentTarget.value = '';
        }}
      />
    </>
  );
}
