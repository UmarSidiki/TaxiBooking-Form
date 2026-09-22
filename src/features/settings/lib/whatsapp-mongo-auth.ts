import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataSet,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";

import { connectDB } from "@/shared/db";
import WhatsAppAuth from "@/features/settings/model/WhatsAppAuth";

const CREDS = "creds";

async function readPayload(name: string) {
  await connectDB();
  const doc = await WhatsAppAuth.findOne({ name }).lean<{ payload: string }>();
  return doc?.payload ?? null;
}

async function writePayload(name: string, payload: string) {
  await connectDB();
  await WhatsAppAuth.updateOne({ name }, { $set: { payload } }, { upsert: true });
}

export async function readWhatsAppRegistered() {
  const payload = await readPayload(CREDS);
  if (!payload) return false;
  try {
    const creds = JSON.parse(payload) as { registered?: boolean };
    return creds.registered === true;
  } catch {
    return false;
  }
}

export async function clearWhatsAppAuth() {
  await connectDB();
  await WhatsAppAuth.deleteMany({});
}

export async function loadMongoAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const baileys = await import("@whiskeysockets/baileys");
  const { BufferJSON, initAuthCreds, proto } = baileys;

  const readData = async (name: string) => {
    const payload = await readPayload(name);
    if (!payload) return null;
    return JSON.parse(payload, BufferJSON.reviver) as unknown;
  };

  const writeData = async (name: string, data: unknown) => {
    await writePayload(name, JSON.stringify(data, BufferJSON.replacer));
  };

  const creds = ((await readData(CREDS)) || initAuthCreds()) as AuthenticationCreds;
  const keys: AuthenticationState["keys"] = {
    get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
      const data: { [id: string]: SignalDataTypeMap[T] } = {};
      await Promise.all(
        ids.map(async (id) => {
          let value = await readData(`${type}-${id}`);
          if (type === "app-state-sync-key" && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          if (value) data[id] = value as SignalDataTypeMap[T];
        })
      );
      return data;
    },
    set: async (data: SignalDataSet) => {
      await connectDB();
      const tasks: Promise<unknown>[] = [];
      for (const category of Object.keys(data) as (keyof SignalDataSet)[]) {
        const entries = data[category];
        if (!entries) continue;
        for (const id of Object.keys(entries)) {
          const value = entries[id];
          const name = `${category}-${id}`;
          tasks.push(value ? writeData(name, value) : WhatsAppAuth.deleteOne({ name }));
        }
      }
      await Promise.all(tasks);
    },
  };

  return {
    state: { creds, keys },
    saveCreds: () => writeData(CREDS, creds),
  };
}
