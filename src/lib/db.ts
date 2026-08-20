import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

function readEnv() {
  const uri = process.env.COGNODB_URI;
  const user = process.env.COGNODB_USER;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error(
      "Missing CognoDB connection settings. Set COGNODB_URI, COGNODB_USER and COGNODB_PASSWORD (see .env.example)."
    );
  }

  return { uri, user, password };
}

export function getDriver(): Driver {
  if (driver) return driver;

  const { uri, user, password } = readEnv();
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 20,
    connectionAcquisitionTimeout: 10_000,
  });

  return driver;
}

export async function getSession(): Promise<Session> {
  return getDriver().session();
}

export class DatabaseUnavailableError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DatabaseUnavailableError";
    this.cause = cause;
  }
}

export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  let session: Session;

  try {
    session = await getSession();
  } catch (err) {
    throw new DatabaseUnavailableError(
      "CognoDB connection is not configured on this server.",
      err
    );
  }

  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject() as T);
  } catch (err) {
    throw new DatabaseUnavailableError(
      "Could not reach the CognoDB instance. It may be paused, unreachable, or the credentials are wrong.",
      err
    );
  } finally {
    await session.close();
  }
}

export async function pingDatabase(): Promise<{ ok: boolean; message: string }> {
  try {
    await runQuery("RETURN 1 AS ok");
    return { ok: true, message: "Connected to CognoDB." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return { ok: false, message };
  }
}
