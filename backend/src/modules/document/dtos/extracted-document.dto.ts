export interface ExtractedDocument {
  text: string;
  pages: {
    pageNumber: number;
    content: string;
  }[];
  raw?: unknown; // opcional (debug o auditoría)
}
