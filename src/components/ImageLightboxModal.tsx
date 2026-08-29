'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  Box,
  Group,
  ActionIcon,
  Text,
  Tooltip,
  Paper,
} from '@mantine/core';
import {
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
  IconMaximize,
  IconMinimize,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchContentRef,
} from 'react-zoom-pan-pinch';
import { originalUrl } from '@/lib/images';

export interface ImageLightboxModalProps {
  opened: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
}

export function ImageLightboxModal({
  opened,
  onClose,
  images,
  initialIndex = 0,
  title,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const transformRef = useRef<ReactZoomPanPinchContentRef | null>(null);

  // Sync currentIndex with initialIndex when the lightbox opens or the
  // requested image changes. React's documented way to adjust state to a prop
  // is a guarded assignment during render, not an effect: an effect renders
  // once with the stale index and then immediately renders again, which is the
  // cascade react-hooks/set-state-in-effect rejects.
  const [syncedTo, setSyncedTo] = useState<number | null>(null);
  const requestedIndex = opened ? initialIndex : null;
  if (syncedTo !== requestedIndex) {
    setSyncedTo(requestedIndex);
    if (requestedIndex !== null) {
      setCurrentIndex(requestedIndex);
    }
  }

  // Zooming is imperative state living inside react-zoom-pan-pinch, so it is
  // reset from an effect. No setState here, so no cascade.
  useEffect(() => {
    if (opened) {
      transformRef.current?.resetTransform(0);
    }
  }, [opened, initialIndex]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    transformRef.current?.resetTransform(0);
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    transformRef.current?.resetTransform(0);
  }, [images.length]);

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  // Keyboard navigation for arrow keys and fullscreen
  useEffect(() => {
    if (!opened) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [opened, handlePrev, handleNext]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex] || images[0];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size={isFullScreen ? '100%' : '90vw'}
      fullScreen={isFullScreen}
      centered
      withCloseButton={false}
      removeScrollProps={{ allowPinchZoom: true }}
      padding={0}
      styles={{
        content: {
          overflow: 'hidden',
          backgroundColor: '#0f1115',
          color: '#ffffff',
          borderRadius: isFullScreen ? 0 : 12,
        },
        header: {
          display: 'none',
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: isFullScreen ? '100vh' : '85vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0f1115',
        },
      }}
    >
      {/* Top Header Bar */}
      <Group
        justify="space-between"
        align="center"
        px="md"
        py="xs"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      >
        <Text size="sm" fw={600} c="white" style={{ pointerEvents: 'auto', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
          {images.length > 1 ? `Zdjęcie ${currentIndex + 1} z ${images.length}` : title || 'Podgląd zdjęcia'}
        </Text>

        <Group gap="xs" style={{ pointerEvents: 'auto' }}>
          <Tooltip label={isFullScreen ? 'Wyłącz pełny ekran' : 'Pełny ekran (F)'} withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="xl"
              onClick={toggleFullScreen}
              aria-label="Przełącz pełny ekran"
              style={{ color: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            >
              {isFullScreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Zamknij (Esc)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="xl"
              onClick={onClose}
              aria-label="Zamknij podgląd"
              style={{ color: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            >
              <IconX size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Main Zoom & Pan Viewport */}
      <Box
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={1}
          maxScale={8}
          centerOnInit
          limitToBounds
          wheel={{ step: 0.2 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: 'toggle', step: 2.5 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl(currentImage)}
                  alt={`${title || 'Zdjęcie'} ${currentIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    userSelect: 'none',
                    display: 'block',
                  }}
                  draggable={false}
                />
              </TransformComponent>

              {/* Bottom Floating Control Toolbar */}
              <Paper
                shadow="md"
                radius="xl"
                px="xs"
                py={4}
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  backgroundColor: 'rgba(20, 24, 30, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Group gap={4}>
                  <Tooltip label="Oddal" withArrow position="top">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="md"
                      radius="xl"
                      onClick={() => zoomOut()}
                      aria-label="Oddal"
                      style={{ color: '#ffffff' }}
                    >
                      <IconZoomOut size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Dopasuj do ekranu (1:1)" withArrow position="top">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="md"
                      radius="xl"
                      onClick={() => resetTransform()}
                      aria-label="Dopasuj do ekranu"
                      style={{ color: '#ffffff' }}
                    >
                      <IconZoomReset size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Przybliż" withArrow position="top">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="md"
                      radius="xl"
                      onClick={() => zoomIn()}
                      aria-label="Przybliż"
                      style={{ color: '#ffffff' }}
                    >
                      <IconZoomIn size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Paper>
            </>
          )}
        </TransformWrapper>

        {/* Previous Image Button */}
        {images.length > 1 && (
          <Tooltip label="Poprzednie zdjęcie (←)" withArrow position="right">
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              onClick={handlePrev}
              aria-label="Poprzednie zdjęcie"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 9,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Next Image Button */}
        {images.length > 1 && (
          <Tooltip label="Następne zdjęcie (→)" withArrow position="left">
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              onClick={handleNext}
              aria-label="Następne zdjęcie"
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 9,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
              }}
            >
              <IconChevronRight size={24} />
            </ActionIcon>
          </Tooltip>
        )}
      </Box>
    </Modal>
  );
}
