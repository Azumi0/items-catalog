'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Group,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createItemAction, updateItemAction } from '@/app/actions/items';
import type { CategoryWithCount } from '@/lib/services/categories';
import type { ItemWithCategory } from '@/lib/services/items';
import { thumbUrl } from '@/lib/images';
import { useActionRunner } from '@/hooks/useActionRunner';
import {
  useMultiImagePreviews,
  useSingleImagePreview,
} from '@/hooks/useImagePreviews';
import { AiDescriptionButton } from './AiDescriptionButton';
import { AutoGrid } from './AutoGrid';
import { CameraButton } from './CameraButton';
import {
  FieldBlock,
  FIELD_LABEL_STYLES,
  selectableSurface,
} from './FormField';
import { FormActionBar } from './FormActionBar';
import { ImageDropzone } from './ImageDropzone';
import { RemovableImage } from './RemovableImage';

interface ItemFormProps {
  categories: CategoryWithCount[];
  /** Absent when adding. */
  item?: ItemWithCategory;
  /** Preselected category when adding from inside one. */
  initialCategoryId?: string;
  /**
   * Whether AI description generation is available at all. Resolved on the
   * server from the presence of GEMINI_API_KEY; only ever this boolean crosses
   * to the client, never the key.
   */
  aiEnabled?: boolean;
}

/**
 * The add and edit screens are the same form: the only real differences are
 * that editing starts with photos already on disk and may leave the main one
 * untouched. Keeping them as one component keeps the two flows from drifting.
 */
export function ItemForm({
  categories,
  item,
  initialCategoryId,
  aiEnabled = false,
}: ItemFormProps) {
  const router = useRouter();
  const { run, pending } = useActionRunner();

  const [categoryId, setCategoryId] = useState<string | null>(
    item?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? null
  );
  const [description, setDescription] = useState(item?.description ?? '');

  const newMain = useSingleImagePreview();
  const newAdditional = useMultiImagePreviews();

  /** Stored filenames the user has not removed — they already live on disk. */
  const [keptMain, setKeptMain] = useState<string | null>(
    item?.mainImage ?? null
  );
  const [keptAdditional, setKeptAdditional] = useState<string[]>(
    item?.additionalImages ?? []
  );

  const mainPreview = newMain.preview ?? (keptMain ? thumbUrl(keptMain) : null);

  const cancelHref = item
    ? `/items/${item.id}`
    : initialCategoryId
      ? `/categories/${initialCategoryId}/items`
      : '/';

  const fail = (message: string) =>
    notifications.show({ color: 'red', title: 'Błąd', message });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!categoryId) {
      fail('Wybierz kategorię.');
      return;
    }
    if (!newMain.file && !keptMain) {
      fail('Zdjęcie główne jest wymagane.');
      return;
    }

    const formData = new FormData();
    formData.append('categoryId', categoryId);
    formData.append('description', description);

    if (item) {
      formData.append('id', item.id);
      if (newMain.file) {
        formData.append('mainImage', newMain.file);
      }
      formData.append(
        'keptAdditionalImages',
        JSON.stringify(keptAdditional)
      );
      for (const file of newAdditional.files) {
        formData.append('newAdditionalImages', file);
      }

      await run({
        action: () => updateItemAction(null, formData),
        errorTitle: 'Błąd edycji',
        successTitle: 'Zapisano zmiany',
        successMessage: 'Przedmiot został zaktualizowany.',
        // The list of the category the item is in *now* — which is not
        // necessarily the one it was opened from.
        onSuccess: () => router.push(`/categories/${categoryId}/items`),
      });
      return;
    }

    formData.append('mainImage', newMain.file as File);
    for (const file of newAdditional.files) {
      formData.append('additionalImages', file);
    }

    await run({
      action: () => createItemAction(null, formData),
      errorTitle: 'Błąd dodawania',
      successTitle: 'Sukces',
      successMessage: 'Przedmiot został dodany do katalogu.',
      onSuccess: () => router.push(`/categories/${categoryId}/items`),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={20} maw={640} mx="auto">
        <FieldBlock label="Zdjęcie główne">
          {mainPreview ? (
            <RemovableImage
              variant="hero"
              src={mainPreview}
              alt="Zdjęcie główne"
              removeLabel="Usuń zdjęcie główne"
              disabled={pending}
              onRemove={() => {
                newMain.clear();
                setKeptMain(null);
              }}
            />
          ) : (
            <Stack gap={8}>
              <ImageDropzone
                onDrop={newMain.select}
                maxFiles={1}
                disabled={pending}
                idleIcon="photo"
                iconSize={32}
                minHeight={180}
                // No `capture` here — it would replace the picker with the
                // camera and close off the gallery this label promises. The
                // camera is the button below instead. See ADR-004 §3.1.
                title="Wybierz zdjęcie z galerii"
                hint="JPG, PNG — maks. 10 MB"
              />
              <CameraButton onCapture={newMain.select} disabled={pending} />
            </Stack>
          )}
        </FieldBlock>

        <FieldBlock label="Zdjęcia dodatkowe">
          <Stack gap={8}>
            <AutoGrid min={88} gap={8}>
              {keptAdditional.map((filename) => (
                <RemovableImage
                  key={filename}
                  src={thumbUrl(filename)}
                  alt="Zdjęcie dodatkowe"
                  removeLabel="Usuń zdjęcie"
                  disabled={pending}
                  onRemove={() =>
                    setKeptAdditional((current) =>
                      current.filter((name) => name !== filename)
                    )
                  }
                />
              ))}

              {newAdditional.previews.map((preview, index) => (
                <RemovableImage
                  key={preview}
                  src={preview}
                  alt={`Nowe zdjęcie ${index + 1}`}
                  removeLabel="Usuń zdjęcie"
                  disabled={pending}
                  onRemove={() => newAdditional.removeAt(index)}
                />
              ))}

              <ImageDropzone
                onDrop={newAdditional.add}
                disabled={pending}
                idleIcon="plus"
                iconSize={22}
                variant="tile"
              />
            </AutoGrid>
            <CameraButton
              onCapture={newAdditional.add}
              disabled={pending}
              label="Zrób kolejne zdjęcie"
            />
          </Stack>
        </FieldBlock>

        <FieldBlock label="Kategoria">
          <Group gap={8}>
            {categories.map((category) => {
              const isSelected = categoryId === category.id;
              return (
                <UnstyledButton
                  key={category.id}
                  type="button"
                  mih={44}
                  px={16}
                  aria-pressed={isSelected}
                  onClick={() => setCategoryId(category.id)}
                  disabled={pending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    ...selectableSurface(isSelected),
                  }}
                >
                  {category.name}
                </UnstyledButton>
              );
            })}
          </Group>
          {categories.length === 0 && (
            <Text fz={13} c="dimmed">
              Najpierw utwórz kategorię w zakładce Kategorie.
            </Text>
          )}
        </FieldBlock>

        <Stack gap={8}>
          <Textarea
            label="Opis"
            placeholder="Co to jest, gdzie leży, stan…"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            disabled={pending}
            styles={{
              ...FIELD_LABEL_STYLES,
              input: { minHeight: 120, fontSize: 16, resize: 'vertical' },
            }}
          />

          {/*
            Absent, not disabled, when the server has no API key: a control
            that can never do anything is worse than no control on a screen
            this narrow. The field itself stays editable either way.
          */}
          {aiEnabled && (
            <AiDescriptionButton
              file={newMain.file}
              storedFilename={keptMain}
              description={description}
              onGenerated={setDescription}
              disabled={pending}
            />
          )}
        </Stack>
      </Stack>

      <FormActionBar
        cancelHref={cancelHref}
        submitLabel={item ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
        loading={pending}
        disabled={!categoryId}
      />
    </form>
  );
}
