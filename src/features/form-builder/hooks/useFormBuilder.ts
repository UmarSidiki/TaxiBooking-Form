"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import type {
  IFormLayout,
  IFormField,
  BookingFieldType,
  IFormStyle,
} from "@/features/form-builder/model";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/shared/http/api";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import {
  FIELD_REGISTRY,
  DEFAULT_STYLE,
  createDefaultFields,
} from "@/features/form-builder/ui/field-registry";
import { applyLoadedFormLayout, FORM_BUILDER_DRAFT_KEY } from "@/features/form-builder/lib/apply-loaded-form-layout";

const TABLET_MAX_WIDTH_QUERY = "(max-width: 1024px)";
const DRAG_ACTIVATION_DISTANCE_PX = 5;
const AUTOSAVE_DELAY_MS = 3000;
const UNDO_STACK_MAX = 20;

export function useFormBuilder() {
  const t = useTranslations("FormBuilder");
  const isTabletOrMobile = useMediaQuery(TABLET_MAX_WIDTH_QUERY); // Auto-switch breakpoint
  
  const [layouts, setLayouts] = useState<IFormLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<IFormLayout | null>(null);
  const [fields, setFields] = useState<IFormField[]>(createDefaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("Default Booking Form");
  const [layoutDescription, setLayoutDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showManager, setShowManager] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [undoStack, setUndoStack] = useState<IFormField[][]>([]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formStyle, setFormStyle] = useState<IFormStyle>(() => ({
    ...DEFAULT_STYLE,
    headingText: t("ui.default_heading"),
    subHeadingText: t("ui.default_subheading"),
    footerText: t("ui.default_footer"),
    buttonText: t("ui.search"),
  }));
  const isSavingRef = useRef(false);

  // Auto-switch preview mode based on screen size
  useEffect(() => {
    if (isTabletOrMobile) {
      setPreviewMode("mobile");
    } else {
      setPreviewMode("desktop");
    }
  }, [isTabletOrMobile]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  // ... (fetchLayouts, draft recovery, auto-save, keyboard shortcuts, undo helpers remain same) ...
  const fetchLayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<{ success: boolean; data: IFormLayout[] }>(
        "/api/form-layouts",
      );
      if (data.success) {
        setLayouts(data.data);
      } else {
        setNotice(t("load_error"));
      }
    } catch {
      setNotice(t("load_error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  useEffect(() => {
    if (currentLayout) return;
    const draft = localStorage.getItem(FORM_BUILDER_DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.fields?.length >= 0) {
          setFields(parsed.fields);
          setLayoutName(parsed.name || "Default Booking Form");
          setLayoutDescription(parsed.description || "");
          if (parsed.style) setFormStyle(parsed.style);
        }
      } catch { /* ignore */ }
    }
  }, [currentLayout]);

  useEffect(() => {
    if (fields.length > 0 || layoutName || currentLayout?._id) {
      localStorage.setItem(
        FORM_BUILDER_DRAFT_KEY,
        JSON.stringify({
          fields,
          name: layoutName,
          description: layoutDescription,
          style: formStyle,
          currentLayoutId: currentLayout?._id,
        }),
      );
    }
  }, [fields, layoutName, layoutDescription, formStyle, currentLayout?._id]);

  useEffect(() => {
    if (!currentLayout?._id || fields.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const data = await apiPatch<{ success: boolean; data: IFormLayout }>(
          `/api/form-layouts/${currentLayout._id}`, 
          {
            fields: fields.map((f, i) => ({ ...f, order: i })),
            style: formStyle,
            name: layoutName,
            description: layoutDescription,
          }
        );
        if (data.success && data.data) {
          // Update currentLayout with fresh server data to prevent stale state
          setCurrentLayout(data.data);
          setLastSaved(new Date());
        }
      } catch { /* silent fail */ }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [fields, layoutName, layoutDescription, currentLayout, formStyle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && undoStack.length > 0) {
        e.preventDefault();
        const prev = undoStack[undoStack.length - 1];
        setUndoStack((s) => s.slice(0, -1));
        setFields(prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoStack]);

  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-UNDO_STACK_MAX), [...fields]]);
  };

  const addField = (type: BookingFieldType) => {
    if (fields.some((f) => f.type === type)) return;
    const reg = FIELD_REGISTRY[type];
    pushUndo();
    const newField: IFormField = {
      id: `field_${type}_${Date.now()}`,
      type,
      label: t(reg.labelKey),
      placeholder: reg.placeholderKey ? t(reg.placeholderKey) : "",
      required: reg.required,
      enabled: true,
      width: reg.width,
      order: fields.length,
      step: 1,
      visibleWhen: reg.visibleWhen,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    pushUndo();
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const toggleField = (id: string) => {
    const field = fields.find((f) => f.id === id);
    if (!field) return;
    const reg = FIELD_REGISTRY[field.type];
    if (reg?.locked) return;
    pushUndo();
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  const updateField = (id: string, updates: Partial<IFormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    pushUndo();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Handle button dragging
      if (String(active.id) === 'button-search') {
        // Button is being dragged over a field
        if (String(over.id) !== 'button-search') {
          const overId = String(over.id).replace("preview-", "");
          const fieldIndex = fields.findIndex((f) => f.id === overId);
          if (fieldIndex !== -1) {
            setFormStyle((prev) => ({
              ...prev,
              buttonPosition: fieldIndex,
            }));
            pushUndo();
          }
        }
        return;
      }
      
      setFields((items) => {
        const activeId = String(active.id).replace("preview-", "");
        const overId = String(over.id).replace("preview-", "");
        const oldIndex = items.findIndex((i) => i.id === activeId);
        const newIndex = items.findIndex((i) => i.id === overId);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex).map((f, i) => ({
          ...f,
          order: i,
        }));
      });
    }
  };

  const saveLayout = async () => {
    if (isSavingRef.current) return;
    if (!layoutName.trim()) {
      setNotice(t("name_required"));
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const payload = {
        name: layoutName,
        description: layoutDescription,
        fields: fields.map((f, i) => ({ ...f, order: i })),
        style: {
          ...formStyle,
          // Ensure all optional fields have default values
          columns: formStyle.columns ?? 2,
          headingAlignment: formStyle.headingAlignment ?? "center",
          subHeadingAlignment: formStyle.subHeadingAlignment ?? "center",
          buttonAlignment: formStyle.buttonAlignment ?? "center",
          footerTextAlignment: formStyle.footerTextAlignment ?? "center",
          showLabels: formStyle.showLabels ?? false,
          inputSize: formStyle.inputSize ?? "default",
          fieldGap: formStyle.fieldGap ?? 12,
          inputBorderRadius: formStyle.inputBorderRadius ?? "0.5rem",
          buttonPosition: formStyle.buttonPosition, // Include button position if set
        },
        isActive: true,
        isDefault: currentLayout?.isDefault ?? false,
      };
      
      if (currentLayout?._id) {
        const data = await apiPatch<{ success: boolean; data: IFormLayout; message: string }>(
          `/api/form-layouts/${currentLayout._id}`, payload
        );
        if (data.success) {
          setCurrentLayout(data.data);
          setLastSaved(new Date());
          localStorage.removeItem(FORM_BUILDER_DRAFT_KEY);
          await fetchLayouts();
          setNotice(t("saved"));
        } else {
          setNotice(t("save_failed"));
        }
      } else {
        const data = await apiPost<{ success: boolean; data: IFormLayout; message: string }>(
          "/api/form-layouts", payload
        );
        if (data.success) {
          setCurrentLayout(data.data);
          setLastSaved(new Date());
          localStorage.removeItem(FORM_BUILDER_DRAFT_KEY);
          await fetchLayouts();
          setNotice(t("created"));
        } else {
          setNotice(t("save_failed"));
        }
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      setNotice(t("save_failed"));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const layoutSetters = {
    setCurrentLayout,
    setFields,
    setFormStyle,
    setLayoutName,
    setLayoutDescription,
    setSelectedFieldId,
    setUndoStack,
    setShowManager,
  };

  const selectLayout = async (layout: IFormLayout) => {
    try {
      // Fetch fresh data from server to ensure we have the latest version
      const data = await apiGet<{ success: boolean; data: IFormLayout }>(
        `/api/form-layouts/${layout._id}`
      );
      if (data.success && data.data) {
        applyLoadedFormLayout(data.data, layoutSetters, true);
      } else {
        console.warn("Failed to load fresh layout data, using fallback");
        applyLoadedFormLayout(layout, layoutSetters, false);
      }
    } catch (error) {
      console.error("Error loading layout:", error);
      applyLoadedFormLayout(layout, layoutSetters, false);
    }
  };

  const createNew = () => {
    setCurrentLayout(null);
    setFields(createDefaultFields());
    setFormStyle(DEFAULT_STYLE);
    setLayoutName("Default Booking Form");
    setLayoutDescription("");
    setSelectedFieldId(null);
    setUndoStack([]);
    setShowManager(false);
    localStorage.removeItem(FORM_BUILDER_DRAFT_KEY);
  };

  const duplicateLayout = async (id: string) => {
    try {
      const data = await apiPost<{ success: boolean; data: IFormLayout }>(
        `/api/form-layouts/${id}/duplicate`, {}
      );
      if (data.success) {
        await fetchLayouts();
        // Automatically load the duplicated layout
        if (data.data) {
          await selectLayout(data.data);
        }
      }
    } catch (error) {
      console.error("Error duplicating layout:", error);
    }
  };

  const deleteLayout = async (id: string) => {
    try {
      await apiDelete<{ success: boolean }>(`/api/form-layouts/${id}`);
      if (currentLayout?._id === id) {
        createNew();
        localStorage.removeItem(FORM_BUILDER_DRAFT_KEY);
      }
      await fetchLayouts();
    } catch (error) {
      console.error("Error deleting layout:", error);
    }
  };

  const setDefaultLayout = async (id: string) => {
    try {
      const data = await apiPatch<{ success: boolean; data: IFormLayout }>(
        `/api/form-layouts/${id}`, 
        { isDefault: true }
      );
      if (data.success && data.data && currentLayout?._id === id) {
        // Update currentLayout if it's the one being set as default
        setCurrentLayout(data.data);
      }
      await fetchLayouts();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const resetToDefaults = () => {
    pushUndo();
    setFields(createDefaultFields());
    setFormStyle(DEFAULT_STYLE);
    localStorage.removeItem(FORM_BUILDER_DRAFT_KEY);
  };

  const draggedField = activeId
    ? fields.find((f) => f.id === String(activeId).replace("preview-", ""))
    : null;

  return {
    t,
    isTabletOrMobile,
    layouts,
    currentLayout,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    layoutName,
    setLayoutName,
    isLoading,
    isSaving,
    previewMode,
    setPreviewMode,
    showManager,
    setShowManager,
    editingName,
    setEditingName,
    lastSaved,
    formStyle,
    setFormStyle,
    sensors,
    selectedField,
    addField,
    removeField,
    toggleField,
    updateField,
    handleDragStart,
    handleDragEnd,
    saveLayout,
    selectLayout,
    createNew,
    duplicateLayout,
    deleteLayout,
    setDefaultLayout,
    resetToDefaults,
    draggedField,
    notice,
    setNotice,
  };
}
