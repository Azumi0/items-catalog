'use client';

import { createElement, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Modal,
  Text,
  TextInput,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  columnsForWidth,
  ICON_GRID,
  iconGridWindow,
  iconPool,
  iconTilePosition,
  labelFor,
} from '@/lib/iconPicker';
import { TABLER_ICON_NAMES, tablerIcon } from '@/lib/tablerIcons';

interface IconPickerModalProps {
  onClose: () => void;
  /** Called with the chosen export name; the field closes the modal after. */
  onPick: (name: string) => void;
}

/**
 * The whole Tabler library as a searchable grid.
 *
 * **Reached only through next/dynamic** — see @/lib/tablerIcons for why. The
 * import below is what makes this file worth ~2.6 MB, and splitting it here
 * keeps that off every screen except the one where the picker is opened.
 *
 * The grid is windowed by hand rather than with a virtualisation library:
 * @/lib/iconPicker owns the arithmetic, it is six lines of it, and it is the
 * part worth having tests for. Rendering all 6250 buttons instead locks the
 * main thread for seconds.
 *
 * Mounted only while open, which is what makes „opening the picker clears the
 * search and scrolls to the top" true by construction rather than by an effect
 * that fires on the way in.
 */
export function IconPickerModal({ onClose, onPick }: IconPickerModalProps) {
  const [search, setSearch] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: gridRef, width } = useElementSize();

  const cols = columnsForWidth(width);
  // Scrolling re-renders this component on every frame, and re-scoring 6250
  // icons per frame is what makes a windowed grid feel unwindowed. The pool
  // only ever depends on the query.
  const pool = useMemo(() => iconPool(TABLER_ICON_NAMES, search), [search]);
  const { contentHeight, startIndex, endIndex } = iconGridWindow(pool.length, scrollTop, cols);
  const isFiltered = search.trim().length > 0;
  const isEmpty = isFiltered && pool.length === 0;

  const handleSearch = (value: string) => {
    // Both halves matter: the state drives which slice renders, and the DOM
    // property is what the browser actually scrolled. Leaving the element
    // where it was would show row 300 of a four-row result.
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setSearch(value);
    setScrollTop(0);
  };

  const tiles = [];
  for (let index = startIndex; index < endIndex; index++) {
    const name = pool[index];
    const glyph = tablerIcon(name);
    if (!glyph) continue;

    const label = labelFor(name);
    const { top, left } = iconTilePosition(index, cols);

    tiles.push(
      // variant="default" is the handoff's tile as Mantine already draws it:
      // body background, 1px default border, gray-light on hover.
      <ActionIcon
        key={name}
        type="button"
        variant="default"
        radius="md"
        w={52}
        h={52}
        c="dimmed"
        title={label}
        aria-label={label}
        onClick={() => onPick(name)}
        pos="absolute"
        top={top}
        left={left}
      >
        {createElement(glyph, { size: 22 })}
      </ActionIcon>
    );
  }

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      size={560}
      radius="lg"
      padding={0}
      withCloseButton={false}
      zIndex="var(--mantine-z-index-modal)"
      overlayProps={{ backgroundOpacity: 0.45 }}
      styles={{
        content: { maxHeight: '82vh', display: 'flex', flexDirection: 'column' },
        body: { display: 'flex', flexDirection: 'column', minHeight: 0 },
      }}
    >
      <Group
        justify="space-between"
        wrap="nowrap"
        gap={12}
        pt={16}
        px={16}
        pb={12}
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Text fz={16} fw={700}>
          Wybierz ikonę
        </Text>
        {/* 32px of visible control inside a 44px target, per the handoff. */}
        <ActionIcon
          variant="subtle"
          color="gray"
          w={44}
          h={44}
          radius="sm"
          aria-label="Zamknij"
          onClick={onClose}
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>

      <Box px={16} py={12} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <TextInput
          value={search}
          onChange={(event) => handleSearch(event.currentTarget.value)}
          data-autofocus
          autoFocus
          placeholder="Szukaj ikony… np. lampa, dom, rower"
          aria-label="Szukaj ikony"
          leftSection={<IconSearch size={18} />}
          styles={{
            // 16px, not 15: below it iOS Safari zooms the page on focus.
            input: {
              height: 44,
              fontSize: 16,
              background: 'var(--mantine-color-gray-light)',
            },
          }}
        />
      </Box>

      <Box
        ref={scrollRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        h={ICON_GRID.VIEW_H}
        px={16}
        py={14}
        style={{ overflowY: 'auto', overflowX: 'hidden' }}
      >
        {/* gridRef stays mounted through an empty result so the width it
            measured — and with it the column count — survives a query that
            matches nothing. The canvas claims contentHeight only when it has
            tiles to place: the empty state is a sibling in the same box, and
            a canvas still floored at VIEW_H would push it a full screen down,
            out of sight inside its own scroll container. */}
        <Box ref={gridRef} pos="relative" h={isEmpty ? undefined : contentHeight}>
          {isEmpty ? (
            <Text px={8} py={32} ta="center" fz={13} c="dimmed">
              Brak ikon dla „{search}”
            </Text>
          ) : (
            <Box pos="relative" h="100%" w={cols * ICON_GRID.COL_W} mx="auto">
              {tiles}
            </Box>
          )}
        </Box>
      </Box>

      <Box px={16} py={10} style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Text fz={12} c="dimmed">
          {isFiltered
            ? `Znaleziono ${pool.length} z ${TABLER_ICON_NAMES.length} ikon Tabler.`
            : `Biblioteka: ${TABLER_ICON_NAMES.length} ikon Tabler.`}
        </Text>
      </Box>
    </Modal>
  );
}

export default IconPickerModal;
