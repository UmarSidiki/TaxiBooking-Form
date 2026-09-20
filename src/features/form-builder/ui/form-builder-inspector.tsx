"use client";

import { FormBuilderButtonProperties } from "@/features/form-builder/ui/form-builder-button-properties";
import { FormBuilderDesignTab } from "@/features/form-builder/ui/form-builder-design-tab";
import { FormBuilderEmptyProperties } from "@/features/form-builder/ui/form-builder-empty-properties";
import { FormBuilderFieldProperties } from "@/features/form-builder/ui/form-builder-field-properties";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { useFormBuilder } from "@/features/form-builder/hooks/useFormBuilder";

type Builder = ReturnType<typeof useFormBuilder>;

export function FormBuilderInspector({
  t,
  selectedFieldId,
  selectedField,
  formStyle,
  setFormStyle,
  updateField,
  toggleField,
}: Pick<
  Builder,
  | "t"
  | "selectedFieldId"
  | "selectedField"
  | "formStyle"
  | "setFormStyle"
  | "updateField"
  | "toggleField"
>) {
  return (
    <div className="lg:col-span-3">
      <Card className="border border-border bg-card overflow-hidden sticky top-6 h-[calc(100vh-140px)] flex flex-col">
        <Tabs defaultValue="properties" className="w-full flex flex-col h-full">
          <CardHeader className="p-0 shrink-0">
            <div className="px-4 pt-4 pb-0 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 pb-3 h-auto">
                <TabsTrigger value="properties" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 text-xs text-muted-foreground data-[state=active]:text-foreground">
                  {t("properties")}
                </TabsTrigger>
                <TabsTrigger value="design" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md py-1.5 text-xs text-muted-foreground data-[state=active]:text-foreground">
                  {t("design")}
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <div className="flex-1 overflow-y-auto">
            <CardContent className="p-4">
              <TabsContent value="properties" className="mt-0 space-y-5">
                {selectedFieldId === "__button_search" ? (
                  <FormBuilderButtonProperties
                    t={t}
                    formStyle={formStyle}
                    setFormStyle={setFormStyle}
                  />
                ) : selectedField ? (
                  <FormBuilderFieldProperties
                    t={t}
                    selectedField={selectedField}
                    updateField={updateField}
                    toggleField={toggleField}
                  />
                ) : (
                  <FormBuilderEmptyProperties t={t} />
                )}
              </TabsContent>

              <TabsContent value="design" className="mt-0 space-y-6">
                <FormBuilderDesignTab
                  t={t}
                  formStyle={formStyle}
                  setFormStyle={setFormStyle}
                />
              </TabsContent>
            </CardContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
