import express from "express";
import {
  createPlaceCategory,
  deletePlaceCategory,
  getPlaceCategories,
  getPlaceCategory,
  updatePlaceCategory,
} from "../../controllers/placeCategory/placeCategory.js";

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

const router = express.Router();

router.post("/v1/place-categories", createPlaceCategory);
router.get("/v1/place-categories", getPlaceCategories);
router.get("/v1/place-categories/:id", getPlaceCategory);
router.put("/v1/place-categories/:id", updatePlaceCategory);
router.delete("/v1/place-categories/:id", deletePlaceCategory);

//For customer
// router.get("/v1/customer/coupons", getCouponsForCustomer);
// router.get("/v1/customer/coupons/:id", getCouponForCustomer);

export default router;
