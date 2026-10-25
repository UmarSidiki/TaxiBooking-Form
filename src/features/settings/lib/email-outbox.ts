import type { SendMailOptions } from "nodemailer";

type GlobalOutbox = { __qaMailOutbox?: SendMailOptions[] };

export function qaEmailMockEnabled() {
  return process.env.QA_MOCK_EMAIL === "1";
}

function bucket() {
  const g = globalThis as GlobalOutbox;
  g.__qaMailOutbox ??= [];
  return g.__qaMailOutbox;
}

export function pushQaMail(mail: SendMailOptions) {
  bucket().push(mail);
}

export function readQaMail() {
  return bucket().slice();
}

export function clearQaMail() {
  bucket().length = 0;
}
