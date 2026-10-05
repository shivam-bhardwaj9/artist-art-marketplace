import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketplaceRouter from "./marketplace";
import buyerRouter from "./buyer";
import artistRouter from "./artist";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketplaceRouter);
router.use(buyerRouter);
router.use(artistRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
