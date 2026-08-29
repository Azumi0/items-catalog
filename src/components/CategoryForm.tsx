'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Box,
  Image,
  Stack,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { IconX } from '@tabler/icons-react';
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
import { thumbUrl, THUMB_PLACEHOLDER } from '@/lib/images';
import { useSingleImagePreview } from '@/hooks/useImagePreviews';
import { AutoGrid } from './AutoGrid';
import { FieldBlock, TALL_INPUT_STYLES } from './FormField';
import { FormActionBar } from './FormActionBar';
import { ImageDropzone } from './ImageDropzone';

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
                  // and there is nowhere else to say "actually, no icon".
                  onClick={() => setIcon(isSelected ? null : iconName)}
                  disabled={pending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--mantine-radius-md)',
                    border: `1px solid ${
                      isSelected
                        ? 'var(--mantine-color-teal-filled)'
                        : 'var(--mantine-color-default-border)'
                    }`,
                    background: isSelected
                      ? 'var(--mantine-color-teal-light)'
                      : 'var(--mantine-color-body)',
                    color: isSelected
                      ? 'var(--mantine-color-teal-filled)'
                      : 'var(--mantine-color-dimmed)',
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
            <Box pos="relative" w={140}>
              <Image
                src={previewSrc}
                alt="Zdjęcie kategorii"
                fallbackSrc={THUMB_PLACEHOLDER}
                h={140}
                w={140}
                radius="md"
                style={{ objectFit: 'cover' }}
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                pos="absolute"
                top={6}
                right={6}
                onClick={() => {
                  newImage.clear();
                  setKeptImage(null);
                }}
                disabled={pending}
                aria-label="Usuń zdjęcie kategorii"
                title="Usuń zdjęcie kategorii"
              >
                <IconX size={14} />
              </ActionIcon>
            </Box>
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
