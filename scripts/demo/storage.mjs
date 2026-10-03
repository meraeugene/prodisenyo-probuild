import { PDFDocument, StandardFonts } from "pdf-lib";
import { SEED_TAG } from "./context.mjs";
import { checked } from "./client.mjs";

export const DEMO_FILES = [
  ...[0, 1, 2].map((p) => ({ bucket: "project-documents", path: `${SEED_TAG}/site-report-${p}.pdf`, title: `Demo construction site report ${p + 1}` })),
  { bucket: "workflow-evidence", path: `${SEED_TAG}/purchase-receipt.pdf`, title: "Demo material purchase receipt" },
];

export async function preflightStorage(client) {
  for (const file of DEMO_FILES) checked(await client.storage.getBucket(file.bucket), `Check ${file.bucket} storage bucket (apply Supabase migrations)`);
}

export async function seedDemoFiles(client, tables) {
  for (const file of DEMO_FILES) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage();
    page.drawText(file.title, { x: 50, y: 760, size: 20, font });
    page.drawText("Sample attachment for UI testing. Demo data only.", { x: 50, y: 720, size: 12, font });
    const bytes = await doc.save();
    const upload = await client.storage.from(file.bucket).upload(file.path, bytes, { contentType: "application/pdf", upsert: false });
    // Preserve the original file when resuming or rerunning.
    if (upload.error && !["409", "Duplicate"].includes(String(upload.error.statusCode)) && !/already exists|duplicate/i.test(upload.error.message)) checked(upload, `Upload ${file.path}`);
    if (file.bucket === "project-documents") for (const row of tables.project_documents) if (row.storage_path === file.path) row.file_size = bytes.length;
  }
}

export async function deleteDemoFiles(client) {
  for (const file of DEMO_FILES) {
    const result = await client.storage.from(file.bucket).remove([file.path]);
    if (result.error && !/not found/i.test(result.error.message)) checked(result, `Delete ${file.path}`);
  }
}
