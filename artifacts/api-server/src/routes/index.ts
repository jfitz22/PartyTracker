import { Router, type IRouter } from "express";
import healthRouter from "./health";
import charactersRouter from "./characters";
import itemsRouter from "./items";
import journalRouter from "./journal";
import questsRouter from "./quests";
import dmRouter from "./dm";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/characters", charactersRouter);
router.use("/characters/:characterId/items", itemsRouter);
router.use("/characters/:characterId/journal", journalRouter);
router.use("/quests", questsRouter);
router.use("/dm", dmRouter);

export default router;
