import { Router } from "express";

const router = Router();

router.post("/storage/uploads/request-url", (req, res) => {
  const { filename } = req.body || {};
  const safeName = (filename || "artwork-image.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `/artwork/${Date.now()}_${safeName}`;
  
  res.json({
    uploadUrl: objectPath,
    objectPath,
  });
});

export default router;
