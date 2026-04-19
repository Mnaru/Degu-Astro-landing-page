import type { ImageMetadata } from 'astro';

export type StackMedia =
  | { kind: 'image'; src: ImageMetadata }
  | { kind: 'video'; playbackId: string };
