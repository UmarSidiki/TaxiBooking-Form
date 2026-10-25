type DocumentWithFile = { fileData?: string };

type PartnerWithDocuments = {
  documents?: DocumentWithFile[];
  toObject?: () => PartnerWithDocuments;
};

/** Drop base64 document bodies before an admin JSON response. */
export function omitPartnerDocumentFileData<T extends PartnerWithDocuments>(partner: T): T {
  const plain = typeof partner.toObject === "function" ? partner.toObject() : partner;
  if (!plain.documents) return plain as T;
  return {
    ...plain,
    documents: plain.documents.map((doc) => {
      const { fileData: _fileData, ...rest } = doc;
      void _fileData;
      return rest;
    }),
  } as T;
}
