"use client";

import type { IFormStyle } from "@/models/form-layout";
import type { useFormBuilder } from "@/hooks/form-builder/useFormBuilder";
import type { Dispatch, SetStateAction } from "react";

export type FormBuilderStyleEditorProps = {
  t: ReturnType<typeof useFormBuilder>["t"];
  formStyle: IFormStyle;
  setFormStyle: Dispatch<SetStateAction<IFormStyle>>;
};
