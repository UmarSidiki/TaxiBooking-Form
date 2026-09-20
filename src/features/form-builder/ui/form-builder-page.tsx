"use client";

import { FormBuilderCanvas } from "@/components/form-builder/form-builder-canvas";
import { FormBuilderHeader } from "@/components/form-builder/form-builder-header";
import { FormBuilderInspector } from "@/components/form-builder/form-builder-inspector";
import { FormBuilderPalette } from "@/components/form-builder/form-builder-palette";
import { FieldPreview } from "@/components/form-builder/field-preview";
import { useFormBuilder } from "@/hooks/form-builder/useFormBuilder";
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";

export function FormBuilderPage() {
  const builder = useFormBuilder();
  const {
    sensors,
    handleDragStart,
    handleDragEnd,
    draggedField,
  } = builder;

  return (
    <div className="space-y-6">
      <FormBuilderHeader
        t={builder.t}
        layouts={builder.layouts}
        currentLayout={builder.currentLayout}
        layoutName={builder.layoutName}
        setLayoutName={builder.setLayoutName}
        isLoading={builder.isLoading}
        isSaving={builder.isSaving}
        showManager={builder.showManager}
        setShowManager={builder.setShowManager}
        editingName={builder.editingName}
        setEditingName={builder.setEditingName}
        lastSaved={builder.lastSaved}
        fields={builder.fields}
        saveLayout={builder.saveLayout}
        selectLayout={builder.selectLayout}
        createNew={builder.createNew}
        duplicateLayout={builder.duplicateLayout}
        deleteLayout={builder.deleteLayout}
        setDefaultLayout={builder.setDefaultLayout}
        resetToDefaults={builder.resetToDefaults}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <FormBuilderPalette
            t={builder.t}
            fields={builder.fields}
            selectedFieldId={builder.selectedFieldId}
            setSelectedFieldId={builder.setSelectedFieldId}
            addField={builder.addField}
            toggleField={builder.toggleField}
            removeField={builder.removeField}
          />
          <FormBuilderCanvas
            t={builder.t}
            fields={builder.fields}
            setSelectedFieldId={builder.setSelectedFieldId}
            previewMode={builder.previewMode}
            setPreviewMode={builder.setPreviewMode}
            formStyle={builder.formStyle}
            isTabletOrMobile={builder.isTabletOrMobile}
          />
          <FormBuilderInspector
            t={builder.t}
            selectedFieldId={builder.selectedFieldId}
            selectedField={builder.selectedField}
            formStyle={builder.formStyle}
            setFormStyle={builder.setFormStyle}
            updateField={builder.updateField}
            toggleField={builder.toggleField}
          />
        </div>
        <DragOverlay>
          {draggedField ? <FieldPreview field={draggedField} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
