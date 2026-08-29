'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, TextInput, UnstyledButton } from '@mantine/core';
import { useActionRunner } from '@/hooks/useActionRunner';
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/actions/categories';
import {
  CATEGORY_ICON_NAMES,
  categoryIconComponent,
  categoryIconLabel,
} from '@/lib/categoryIcons';
import { thumbUrl } from '@/lib/images';
import { useSingleImagePreview } from '@/hooks/useImagePreviews';
import { AutoGrid } from './AutoGrid';
import {
  FieldBlock,
  TALL_INPUT_STYLES,
  selectableSurface,
} from './FormField';
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

        <FieldBlock
          label="Ikona"
          hint="Opcjonalna. Bez ikony i zdjęcia użyjemy zdjęcia pierwszego przedmiotu."
        >
          <AutoGrid min={56} gap={8}>
            {CATEGORY_ICON_NAMES.map((iconName) => {
              const Icon = categoryIconComponent(iconName);
              const isSelected = icon === iconName;

              return (
                <UnstyledButton
                  key={iconName}
                  type="button"
                  h={56}
                  aria-label={categoryIconLabel(iconName)}
                  aria-pressed={isSelected}
                  title={categoryIconLabel(iconName)}
                  // Pressing the selected icon clears it — the field is optional
                  // and there is nowhere else to say "actually, no icon". Without
                  // this, step 3 of the fallback rule (the newest item's photo)
                  // is unreachable for any category that ever had an icon.
                  // See ADR-004 §3.5.
                  onClick={() => setIcon(isSelected ? null : iconName)}
                  disabled={pending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--mantine-radius-md)',
                    ...selectableSurface(
                      isSelected,
                      'var(--mantine-color-dimmed)'
                    ),
                  }}
                >
                  <Icon size={24} />
                </UnstyledButton>
              );
            })}
          </AutoGrid>
        </FieldBlock>

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
