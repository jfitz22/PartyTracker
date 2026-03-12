import { Router, type IRouter } from "express";
import healthRouter from "./health";
import charactersRouter from "./characters";
import itemsRouter from "./items";
import dmRouter from "./dm";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/characters", charactersRouter);
router.use("/characters/:characterId/items", itemsRouter);
router.use("/dm", dmRouter);

export default router;
