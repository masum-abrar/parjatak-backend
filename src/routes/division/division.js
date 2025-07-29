import express from "express";
import multer from "multer";
import {
  createDivision,
  deleteDivision,
  getDivision,
  getDivisionForCustomer,
  getDivisions,
  getDivisionsForCustomer,
  updateDivision,
} from "../../controllers/division/division.js";
import verify from "../../utils/verifyToken.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post("/v1/divisions", verify, upload.single("image"), createDivision);
router.get("/v1/divisions", verify, getDivisions);
router.get("/v1/divisions/:id", verify, getDivision);
router.put("/v1/divisions/:id", verify, upload.single("image"), updateDivision);
router.delete("/v1/divisions/:id", verify, deleteDivision);

//For customer
router.get("/v1/customer/divisions", getDivisionsForCustomer);
router.get("/v1/customer/divisions/:id", getDivisionForCustomer);

export default router;
