// Open vocabulary: KNOWLEDGE_TYPES in data.ts lists the built-in suggestions,
// but users can add their own (same pattern as Interface and IC).
export type KnowledgeType = string;

export interface Attachment {
  name: string;
  type: string;
}

export interface Entry {
  id: string;
  ownerId?: number | null;
  title: string;
  interface: string;
  ic: string;
  project: string;
  types: KnowledgeType[];
  tags: string[];
  content: string;
  attachments: Attachment[];
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
}

export type Page =
  | "dashboard"
  | "add"
  | "search"
  | "review"
  | "settings"
  | "detail"
  | "profile";

// Lifted to App state (rather than owned by SearchKnowledge) so filters
// survive navigating away to an entry and back.
export interface SearchFilters {
  q: string;
  fInterface: string;
  fIc: string;
  fProject: string;
  fType: string;
  fTag: string;
  fromDate: string;
  toDate: string;
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  q: "", fInterface: "", fIc: "", fProject: "", fType: "", fTag: "", fromDate: "", toDate: "",
};
