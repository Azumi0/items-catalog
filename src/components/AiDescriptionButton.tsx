'use client';

import { useState } from 'react';
import { Button, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSparkles } from '@tabler/icons-react';
import { generateDescriptionAction } from '@/app/actions/items';
import { ConfirmSheet } from './ConfirmSheet';

interface AiDescriptionButtonProps {
  /** A photo the user just picked, still only in the browser. */
  file: File | null;
  /** An original already on disk. Ignored when `file` is set. */
  storedFilename: string | null;
  /** Current field contents — decides whether overwriting needs confirming. */
  description: string;
  /** Hands the accepted proposal back to the form. */
  onGenerated: (description: string) => void;
  /** The form is saving; nothing else should be clickable. */
  disabled?: boolean;
}

/**
 * Asks the model for a description of the main photo and offers it to the
 * form. Rendered once inside ItemForm, which serves both the add and the edit
 * screen — there is no second copy of this to drift.
 *
 * It deliberately does not use `useActionRunner`. That hook exists for the
 * CRUD cycle and ends by showing a success notification and refreshing the
 * route; here the success is *visible* — text appears in the field the user is
 * looking at — and there is nothing on the server to re-read. Only the error
 * half of the pattern applies, so only that is reused.
 *
 * Nothing here saves. The generated text lands in the field and waits for the
 * user to accept it by submitting the form, exactly like text they typed.
 */
export function AiDescriptionButton({
  file,
  storedFilename,
  description,
  onGenerated,
  disabled,
}: AiDescriptionButtonProps) {
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasImage = Boolean(file || storedFilename);

  const generate = async () => {
    setConfirmOpen(false);
    setPending(true);

    try {
      const formData = new FormData();
      // The photo on screen wins. On the edit screen a freshly picked file
      // sits on top of the stored one, and describing the stored one would
      // answer about a picture the user replaced.
      if (file) {
        formData.append('mainImage', file);
      } else if (storedFilename) {
        formData.append('storedFilename', storedFilename);
      }

      const result = await generateDescriptionAction(formData);

      if (result?.error || !result?.description) {
        notifications.show({
          color: 'red',
          title: 'Błąd generowania',
          message: result?.error ?? 'Nie udało się wygenerować opisu.',
        });
        return;
      }

      onGenerated(result.description);
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Błąd generowania',
        message: err instanceof Error ? err.message : 'Nieoczekiwany błąd.',
      });
    } finally {
      // In `finally` and not on each path: an early return or a throw must
      // still give the button back, or the screen is stuck on a spinner with
      // no way out but a reload.
      setPending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="light"
        leftSection={<IconSparkles size={16} />}
        onClick={() =>
          description.trim() ? setConfirmOpen(true) : generate()
        }
        loading={pending}
        disabled={disabled || !hasImage}
        mih={44}
        fullWidth
      >
        {pending ? 'Generowanie…' : 'Wygeneruj opis z AI'}
      </Button>

      {!hasImage && (
        <Text fz={13} c="dimmed" mt={6}>
          Najpierw dodaj zdjęcie główne.
        </Text>
      )}

      <ConfirmSheet
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Nadpisać opis?"
        message="Obecna treść pola zostanie zastąpiona opisem wygenerowanym przez AI. Tej zmiany nie cofniesz."
        confirmLabel="Nadpisz"
        onConfirm={generate}
        loading={pending}
      />
    </>
  );
}
