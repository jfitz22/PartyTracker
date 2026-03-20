import { Router } from "express";
import { db } from "@workspace/db";
import { questsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  let query = db.select().from(questsTable).$dynamic();

  const { partyId, status } = req.query;
  if (partyId) {
    query = query.where(eq(questsTable.partyId, Number(partyId)));
  }
  if (status && typeof status === "string") {
    query = query.where(eq(questsTable.status, status as "active" | "completed" | "failed"));
  }

  const quests = await query.orderBy(desc(questsTable.createdAt));
  res.json(quests);
});

router.post("/", async (req, res) => {
  const { title, description, status, partyId } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const [quest] = await db
    .insert(questsTable)
    .values({
      title,
      description: description ?? "",
      status: (status as "active" | "completed" | "failed") ?? "active",
      partyId: partyId ?? null,
    })
    .returning();
  res.status(201).json(quest);
});

router.get("/:questId", async (req, res) => {
  const questId = Number(req.params.questId);
  if (isNaN(questId)) {
    res.status(400).json({ error: "Invalid questId" });
    return;
  }
  const [quest] = await db.select().from(questsTable).where(eq(questsTable.id, questId));
  if (!quest) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }
  res.json(quest);
});

router.put("/:questId", async (req, res) => {
  const questId = Number(req.params.questId);
  if (isNaN(questId)) {
    res.status(400).json({ error: "Invalid questId" });
    return;
  }
  const { title, description, status, partyId } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (partyId !== undefined) updates.partyId = partyId ?? null;

  const [quest] = await db
    .update(questsTable)
    .set(updates)
    .where(eq(questsTable.id, questId))
    .returning();
  if (!quest) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }
  res.json(quest);
});

router.delete("/:questId", async (req, res) => {
  const questId = Number(req.params.questId);
  if (isNaN(questId)) {
    res.status(400).json({ error: "Invalid questId" });
    return;
  }
  await db.delete(questsTable).where(eq(questsTable.id, questId));
  res.status(204).send();
});

export default router;
