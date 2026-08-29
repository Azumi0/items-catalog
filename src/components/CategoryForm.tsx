'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, TextInput } from '@mantine/core';
import { useActionRunner } from '@/hooks/useActionRunner';
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/actions/categories';
import { thumbUrl } from '@/lib/images';
import { useSingleImagePreview } from '@/hooks/useImagePreviews';
import { FieldBlock, TALL_INPUT_STYLES } from './FormField';
import { IconPickerField } from './IconPickerField';
import { FormActionBar } from './FormActionBar';
import { ImageDropzone } from './ImageDropzone';
import { RemovableImage } from './RemovableImage';

interface CategoryFormProps {
  /** Absent when creating. */
  category?: {
    id: string;
    name: string;
    icon: string | null;
    mainImage: string | null;
  };
}

const CANCEL_HREF = '/categories';

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const { run, pending } = useActionRunner();

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const newImage = useSingleImagePreview();
  const [keptImage, setKeptImage] = useState<string | null>(
    category?.mainImage ?? null
  );

  const previewSrc =
    newImage.preview ?? (keptImage ? thumbUrl(keptImage) : null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('icon', icon ?? '');
    if (newImage.file) {
      formData.append('mainImage', newImage.file);
    } else if (category && !keptImage) {
      formData.append('removeMainImage', '1');
    }

    if (category) {
      formData.append('id', category.id);
      await run({
        action: () => updateCategoryAction(null, formData),
        errorTitle: 'Błąd edycji',
        successTitle: 'Zaktualizowano kategorię',
        successMessage: `Kategoria „${name.trim()}” została zapisana.`,
        onSuccess: () => router.push(CANCEL_HREF),
      });
      return;
    }

    await run({
      action: () => createCategoryAction(null, formData),
      errorTitle: 'Błąd tworzenia',
      successTitle: 'Sukces',
      successMessage: `Utworzono kategorię „${name.trim()}”.`,
      onSuccess: () => router.push(CANCEL_HREF),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={20} maw={640} mx="auto">
        <TextInput
          label="Nazwa kategorii"
          placeholder="np. Elektronika, Narzędzia"
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          disabled={pending}
          styles={TALL_INPUT_STYLES}
        />

        <IconPickerField value={icon} onChange={setIcon} disabled={pending} />

        <FieldBlock label="Zdjęcie kategorii">
          {previewSrc ? (
            <RemovableImage
              src={previewSrc}
              alt="Zdjęcie kategorii"
              removeLabel="Usuń zdjęcie kategorii"
              disabled={pending}
              w={140}
              onRemove={() => {
                newImage.clear();
                setKeptImage(null);
              }}
            />
          ) : (
            <ImageDropzone
              onDrop={newImage.select}
              maxFiles={1}
              disabled={pending}
              idleIcon="photo"
              iconSize={28}
              minHeight={140}
              hint="Zdjęcie ma pierwszeństwo przed ikoną"
            />
          )}
        </FieldBlock>
      </Stack>

      <FormActionBar
        cancelHref={CANCEL_HREF}
        submitLabel={category ? 'Zapisz zmiany' : 'Utwórz kategorię'}
        loading={pending}
        disabled={!name.trim()}
      />
    </form>
  );
}
