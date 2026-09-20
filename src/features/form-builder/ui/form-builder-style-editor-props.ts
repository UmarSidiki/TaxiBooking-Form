"use client";

import type { IFormStyle } from "@/features/form-builder/model";
import type { useFormBuilder } from "@/features/form-builder/hooks/useFormBuilder";
import type { Dispatch, SetStateAction } from "react";

export type FormBuilderStyleEditorProps = {
  t: ReturnType<typeof useFormBuilder>["t"];
  formStyle: IFormStyle;
  setFormStyle: Dispatch<SetStateAction<IFormStyle>>;
};
