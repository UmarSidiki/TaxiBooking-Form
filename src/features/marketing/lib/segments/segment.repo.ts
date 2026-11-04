import { connectDB } from "@/shared/db";
import Segment from "@/features/marketing/model/Segment";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import {
  parseSegmentFilter,
  type SegmentFilter,
} from "@/features/marketing/schema/segment.schema";

export type SegmentView = {
  id: string;
  name: string;
  filter: SegmentFilter;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type SegmentDoc = {
  _id: unknown;
  name: string;
  filter: unknown;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
};

const SEGMENT_LIMIT = 100;

function toView(doc: SegmentDoc): SegmentView | null {
  const filter = parseSegmentFilter(doc.filter);
  if (!filter) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    filter,
    createdBy: doc.createdBy ?? "",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listSegments(): Promise<SegmentView[]> {
  await connectDB();
  const docs = await Segment.find({})
    .sort({ updatedAt: -1 })
    .limit(SEGMENT_LIMIT)
    .lean<SegmentDoc[]>();
  return docs.map(toView).filter((row): row is SegmentView => row !== null);
}

export async function getSegment(id: string): Promise<SegmentView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const doc = await Segment.findById(id).lean<SegmentDoc | null>();
  return doc ? toView(doc) : null;
}

export async function createSegment(input: {
  name: string;
  filter: SegmentFilter;
  createdBy?: string;
}): Promise<SegmentView> {
  await connectDB();
  const doc = await Segment.create({
    name: input.name,
    filter: parseSegmentFilter(input.filter) ?? input.filter,
    createdBy: input.createdBy ?? "",
  });
  const view = toView(doc.toObject() as SegmentDoc);
  if (!view) throw new Error("segment_filter_invalid");
  return view;
}

export async function updateSegment(
  id: string,
  patch: { name?: string; filter?: SegmentFilter },
): Promise<SegmentView | null> {
  if (!isObjectIdString(id)) return null;
  await connectDB();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.filter !== undefined) {
    update.filter = parseSegmentFilter(patch.filter) ?? patch.filter;
  }
  if (Object.keys(update).length === 0) return getSegment(id);

  const doc = await Segment.findByIdAndUpdate(id, { $set: update }, { new: true })
    .lean<SegmentDoc | null>();
  return doc ? toView(doc) : null;
}

export async function deleteSegment(id: string): Promise<boolean> {
  if (!isObjectIdString(id)) return false;
  await connectDB();
  const result = await Segment.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
