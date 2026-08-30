import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MantineProvider } from '@mantine/core';
import { CameraButton } from '@/components/CameraButton';
import { ImageDropzone } from '@/components/ImageDropzone';

/**
 * Which picker a phone opens is decided entirely by the attributes on the
 * rendered `<input type="file">`, so that is what these assertions read.
 *
 * The bug they pin: Chrome on Android hands an image-only `accept` to the
 * system photo picker, which lists the gallery and has no shutter. A field
 * whose only input is that one cannot take a live photo at all — see
 * ADR-004 §3.1.
 */
function renderInputs(element: React.ReactElement) {
  const html = renderToStaticMarkup(
    createElement(MantineProvider, null, element)
  );
  return html.match(/<input[^>]*>/g) ?? [];
}

describe('taking a photo on a phone', () => {
  it('gives the camera its own input, which bypasses the picker entirely', () => {
    const inputs = renderInputs(
      createElement(CameraButton, { onCapture: () => {} })
    );

    expect(inputs).toHaveLength(1);
    // `capture` is what replaces the picker with the camera; the plain
    // `image/*` keeps Chrome from routing it back to the photo picker.
    expect(inputs[0]).toContain('capture="environment"');
    expect(inputs[0]).toContain('accept="image/*"');
  });

  it('leaves the dropzone as the gallery path, without capture', () => {
    const inputs = renderInputs(
      createElement(ImageDropzone, { onDrop: () => {}, title: 'x' })
    );

    expect(inputs).toHaveLength(1);
    expect(inputs[0]).not.toContain('capture=');
  });
});
