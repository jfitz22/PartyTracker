import { Router } from "express";
import { db } from "@workspace/db";
import { journalEntriesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const p = req.params as Record<string, string>;
  const characterId = Number(p.characterId);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid characterId" });
    return;
  }
  const entries = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.characterId, characterId))
    .orderBy(desc(journalEntriesTable.createdAt));
  res.json(entries);
});

router.post("/", async (req, res) => {
  const p = req.params as Record<string, string>;
  const characterId = Number(p.characterId);
  if (isNaN(characterId)) {
    res.status(400).json({ error: "Invalid characterId" });
    return;
  }
  const { title, body } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [entry] = await db
    .insert(journalEntriesTable)
    .values({ characterId, title, body: body ?? "" })
    .returning();
  res.status(201).json(entry);
});

router.get("/:entryId", async (req, res) => {
  const p = req.params as Record<string, string>;
  const characterId = Number(p.characterId);
  const entryId = Number(p.entryId);
  if (isNaN(characterId) || isNaN(entryId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [entry] = await db
    .select()
    .from(journalEntriesTable)
    .where(and(eq(journalEntriesTable.id, entryId), eq(journalEntriesTable.characterId, characterId)));
  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }
  res.json(entry);
});

router.put("/:entryId", async (req, res) => {
  const p = req.params as Record<string, string>;
  const characterId = Number(p.characterId);
  const entryId = Number(p.entryId);
  if (isNaN(characterId) || isNaN(entryId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { title, body } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [entry] = await db
    .update(journalEntriesTable)
    .set({ title, body: body ?? "", updatedAt: new Date() })
    .where(and(eq(journalEntriesTable.id, entryId), eq(journalEntriesTable.characterId, characterId)))
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }
  res.json(entry);
});

router.delete("/:entryId", async (req, res) => {
  const p = req.params as Record<string, string>;
  const characterId = Number(p.characterId);
  const entryId = Number(p.entryId);
  if (isNaN(characterId) || isNaN(entryId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db
    .delete(journalEntriesTable)
    .where(and(eq(journalEntriesTable.id, entryId), eq(journalEntriesTable.characterId, characterId)));
  res.status(204).send();
});

export default router;
