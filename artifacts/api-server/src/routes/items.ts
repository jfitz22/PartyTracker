import { Router } from "express";
import { db } from "@workspace/db";
import { itemsTable } from "@workspace/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import {
  ListItemsParams,
  ListItemsQueryParams,
  CreateItemParams,
  CreateItemBody,
  GetItemParams,
  UpdateItemParams,
  UpdateItemBody,
  DeleteItemParams,
  UseItemParams,
  ToggleEquipParams,
} from "@workspace/api-zod";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const paramsParsed = ListItemsParams.safeParse({ characterId: Number(req.params.characterId) });
  const queryParsed = ListItemsQueryParams.safeParse(req.query);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid characterId" });
    return;
  }
  const { characterId } = paramsParsed.data;
  const query = queryParsed.success ? queryParsed.data : {};

  let items = await db
    .select()
    .from(itemsTable)
    .where(and(eq(itemsTable.characterId, characterId), eq(itemsTable.isTrashed, false)))
    .orderBy(itemsTable.createdAt);

  if (query.category) {
    items = items.filter((i) => i.category === query.category);
  }
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(searchLower) ||
        i.description.toLowerCase().includes(searchLower)
    );
  }
  if (!query.showConsumed) {
    items = items.filter((i) => !i.isConsumed);
  }

  res.json(items);
});

router.post("/", async (req, res) => {
  const paramsParsed = CreateItemParams.safeParse({ characterId: Number(req.params.characterId) });
  const bodyParsed = CreateItemBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { characterId } = paramsParsed.data;
  const data = bodyParsed.data;

  const [item] = await db
    .insert(itemsTable)
    .values({
      characterId,
      name: data.name,
      category: data.category as any,
      description: data.description,
      imageUrl: data.imageUrl ?? null,
      isEquipped: data.isEquipped,
      maxCharges: data.maxCharges ?? null,
      currentCharges: data.maxCharges ?? null,
      rechargeOn: data.rechargeOn as any ?? null,
      rarity: data.rarity as any ?? null,
      isConsumable: data.isConsumable,
      isConsumed: false,
      isTrashed: false,
    })
    .returning();
  res.status(201).json(item);
});

router.get("/:itemId", async (req, res) => {
  const parsed = GetItemParams.safeParse({
    characterId: Number(req.params.characterId),
    itemId: Number(req.params.itemId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(and(eq(itemsTable.id, parsed.data.itemId), eq(itemsTable.characterId, parsed.data.characterId)));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

router.put("/:itemId", async (req, res) => {
  const paramsParsed = UpdateItemParams.safeParse({
    characterId: Number(req.params.characterId),
    itemId: Number(req.params.itemId),
  });
  const bodyParsed = UpdateItemBody.safeParse(req.body);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const { itemId, characterId } = paramsParsed.data;
  const data = bodyParsed.success ? bodyParsed.data : {};

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.isEquipped !== undefined) updateData.isEquipped = data.isEquipped;
  if (data.maxCharges !== undefined) updateData.maxCharges = data.maxCharges;
  if (data.currentCharges !== undefined) updateData.currentCharges = data.currentCharges;
  if (data.rechargeOn !== undefined) updateData.rechargeOn = data.rechargeOn;
  if (data.rarity !== undefined) updateData.rarity = data.rarity;
  if (data.isConsumable !== undefined) updateData.isConsumable = data.isConsumable;

  const [item] = await db
    .update(itemsTable)
    .set(updateData)
    .where(and(eq(itemsTable.id, itemId), eq(itemsTable.characterId, characterId)))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

router.delete("/:itemId", async (req, res) => {
  const parsed = DeleteItemParams.safeParse({
    characterId: Number(req.params.characterId),
    itemId: Number(req.params.itemId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  await db
    .update(itemsTable)
    .set({ isTrashed: true })
    .where(and(eq(itemsTable.id, parsed.data.itemId), eq(itemsTable.characterId, parsed.data.characterId)));
  res.status(204).send();
});

router.post("/:itemId/use", async (req, res) => {
  const parsed = UseItemParams.safeParse({
    characterId: Number(req.params.characterId),
    itemId: Number(req.params.itemId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const [existing] = await db
    .select()
    .from(itemsTable)
    .where(and(eq(itemsTable.id, parsed.data.itemId), eq(itemsTable.characterId, parsed.data.characterId)));

  if (!existing) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  let updateData: Record<string, any> = {};

  if (existing.isConsumable) {
    updateData.isConsumed = true;
    updateData.isEquipped = false;
  } else if (existing.currentCharges != null && existing.currentCharges > 0) {
    updateData.currentCharges = existing.currentCharges - 1;
    if (existing.rechargeOn === "never" && updateData.currentCharges === 0) {
      updateData.isConsumed = true;
      updateData.isEquipped = false;
    }
  }

  const [item] = await db
    .update(itemsTable)
    .set(updateData)
    .where(eq(itemsTable.id, parsed.data.itemId))
    .returning();
  res.json(item);
});

router.post("/:itemId/equip", async (req, res) => {
  const parsed = ToggleEquipParams.safeParse({
    characterId: Number(req.params.characterId),
    itemId: Number(req.params.itemId),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const [existing] = await db
    .select()
    .from(itemsTable)
    .where(and(eq(itemsTable.id, parsed.data.itemId), eq(itemsTable.characterId, parsed.data.characterId)));

  if (!existing) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const [item] = await db
    .update(itemsTable)
    .set({ isEquipped: !existing.isEquipped })
    .where(eq(itemsTable.id, parsed.data.itemId))
    .returning();
  res.json(item);
});

export default router;
