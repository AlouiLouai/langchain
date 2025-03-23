import express, { Request, Response } from "express";
import { uploadCV } from "../middlewares/uploadMiddleware";
import { uploadAndAnalyzeCV } from "../controllers/cvController";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});
router.post("/upload-cv", uploadCV, uploadAndAnalyzeCV);

export default router;
