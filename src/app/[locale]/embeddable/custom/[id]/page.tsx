import { getTranslations } from "next-intl/server";
import { isValidObjectId } from "mongoose";
import { AlertCircle } from "lucide-react";

import { BookingFormProvider } from "@/features/booking/context/booking-form-context";
import { CustomEmbeddableContent } from "@/features/booking/ui/embeddable/custom-embeddable-content";
import { FormLayout, type IFormLayout } from "@/features/form-builder/model";
import { connectDB } from "@/shared/db";

function toPlainLayout(layout: {
  _id: unknown;
  name: string;
  description?: string;
  fields: IFormLayout["fields"];
  style?: IFormLayout["style"];
  isDefault: boolean;
  isActive: boolean;
}): IFormLayout {
  return {
    _id: String(layout._id),
    name: layout.name,
    description: layout.description,
    fields: layout.fields,
    style: layout.style,
    isDefault: layout.isDefault,
    isActive: layout.isActive,
  };
}

async function UnavailableForm() {
  const t = await getTranslations("embeddable");

  return (
    <div className="flex items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">{t("form-unavailable")}</p>
          <p className="text-sm text-muted-foreground">{t("unavailable-description")}</p>
        </div>
      </div>
    </div>
  );
}

export default async function CustomEmbeddablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidObjectId(id)) return <UnavailableForm />;

  await connectDB();
  const layout = await FormLayout.findById(id).lean();

  if (!layout || !layout.isActive) return <UnavailableForm />;

  return (
    <BookingFormProvider>
      <CustomEmbeddableContent layout={toPlainLayout(layout)} />
    </BookingFormProvider>
  );
}
