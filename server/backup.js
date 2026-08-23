// Periodic, rotating hot backups of the SQLite file — so a bad write, a
// corrupted page, or an accidental delete doesn't cost the whole knowledge
// base. Runs on the same persistent volume as the live DB (Fly/Render both
// mount one); this guards against in-place data loss, not a lost volume —
// pair with the host's own volume/disk snapshots for that.
import { dirname, join } from "path";
import fs from "fs";
import { db, DB_PATH } from "./db.js";

const BACKUP_DIR = process.env.BACKUP_DIR || join(dirname(DB_PATH), "backups");
const KEEP = Number(process.env.BACKUP_KEEP || 10);
const INTERVAL_MS = Number(process.env.BACKUP_INTERVAL_HOURS || 6) * 60 * 60 * 1000;

function rotate() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("data-") && f.endsWith(".db"))
    .sort(); // ISO timestamps in the filename sort chronologically
  for (const f of files.slice(0, Math.max(0, files.length - KEEP))) {
    fs.unlinkSync(join(BACKUP_DIR, f));
  }
}

async function runBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = join(BACKUP_DIR, `data-${stamp}.db`);
  try {
    await db.backup(dest);
    rotate();
    console.log(`[backup] wrote ${dest}`);
  } catch (err) {
    console.error("[backup] failed:", err.message);
  }
}

/** Call once at server startup. First backup shortly after boot, then on a fixed interval. */
export function startBackupSchedule() {
  if (process.env.BACKUP_DISABLE === "true") {
    console.log("[backup] BACKUP_DISABLE=true — periodic backups off");
    return;
  }
  setTimeout(() => { void runBackup(); }, 60 * 1000);
  setInterval(() => { void runBackup(); }, INTERVAL_MS);
}
