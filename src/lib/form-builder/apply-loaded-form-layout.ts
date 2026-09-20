import { DEFAULT_STYLE } from "@/components/form-builder/field-registry";
import type { IFormField, IFormLayout, IFormStyle } from "@/models/form-layout";
import type { Dispatch, SetStateAction } from "react";

const FORM_BUILDER_DRAFT_KEY = "formBuilderDraft";

export function applyLoadedFormLayout(
  layout: IFormLayout,
  setters: {
    setCurrentLayout: Dispatch<SetStateAction<IFormLayout | null>>;
    setFields: Dispatch<SetStateAction<IFormField[]>>;
    setFormStyle: Dispatch<SetStateAction<IFormStyle>>;
    setLayoutName: Dispatch<SetStateAction<string>>;
    setLayoutDescription: Dispatch<SetStateAction<string>>;
    setSelectedFieldId: Dispatch<SetStateAction<string | null>>;
    setUndoStack: Dispatch<SetStateAction<IFormField[][]>>;
    setShowManager: Dispatch<SetStateAction<boolean>>;
  },
  clearDraft: boolean,
) {
  setters.setCurrentLayout(layout);
  setters.setFields(layout.fields || []);
  setters.setFormStyle({ ...DEFAULT_STYLE, ...layout.style });
  setters.setLayoutName(layout.name);
  setters.setLayoutDescription(layout.description || "");
  setters.setSelectedFieldId(null);
  setters.setUndoStack([]);
  setters.setShowManager(false);
  if (clearDraft) {
    localStorage.removeItem(FORM_BUILDER_DRAFT_KEY);
  }
}

export { FORM_BUILDER_DRAFT_KEY };
