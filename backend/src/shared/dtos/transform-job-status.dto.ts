export type TransformJobStatus =
  | { status: 'waiting' }
  | { status: 'processing' }
  | { status: 'completed' }
  | { status: 'failed'; error: string };
