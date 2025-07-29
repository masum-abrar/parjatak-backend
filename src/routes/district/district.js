import express from "express";
import multer from "multer";
import {
  //   banProduct,
  createDistrict,
  createDistrictFollower,
  //   createProductAttribute,
  createDistrictImage,
  deleteDistrict,
  deleteDistrictFollower,
  //   deleteProductAttribute,
  deleteDistrictImage,
  //   getFeaturedProductsForCustomer,
  getDistrict,
  getDistrictByDivisionIdForCustomer,
  //   getProductAttributes,
  getDistrictForCustomer,
  getDistrictImages,
  getDistrictPlacesForCustomer,
  getDistrictPostDiscussionForCustomer,
  getDistrictPostEventForCustomer,
  getDistricts,
  //   getDistrictsByUser,
  getDistrictsForCustomer,
  //   getTrendingProductsForCustomer,
  //   increaseProductViewCount,
  //   sendProductEmail,
  updateDistrict,
  //   updateProductAttribute,
  updateDistrictImage,
} from "../../controllers/district/district.js";
// import {
//   productBan,
//   productCreate,
//   productEdit,
//   productList,
//   productRemove,
//   productSingle,
//   productUserList,
// } from "../../utils/modules.js";
import verify from "../../utils/verifyToken.js";

// const upload = multer({ dest: "public/images/product" });
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post("/v1/districts", verify, upload.array("images"), createDistrict);
// router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/districts", verify, getDistricts);
// router.get("/v1/user/products/", productUserList, verify, getProductsByUser);
router.get("/v1/districts/:slug", verify, getDistrict);
router.put("/v1/districts/:id", verify, upload.array("images"), updateDistrict);
// router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put(
  "/v1/districts/images/:id",
  verify,
  upload.single("image"),
  updateDistrictImage
);
// router.put("/v1/products/:id/viewCount", increaseProductViewCount);
// router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete("/v1/districts/images/:id", verify, deleteDistrictImage);
router.delete("/v1/districts/:id", verify, deleteDistrict);

//attributes
// router.post("/v1/products-attributes", verify, createProductAttribute);
// router.get("/v1/products-attributes/:id", verify, getProductAttributes);
// router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
// router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/districts-images/:id", verify, getDistrictImages);
router.post(
  "/v1/districts-images",
  verify,
  upload.single("image"),
  createDistrictImage
);
router.delete("/v1/districts-images/:id", verify, deleteDistrictImage);

// For Customer
router.get("/v1/customer/districts", getDistrictsForCustomer);
router.get("/v1/customer/districts/:slug", getDistrictForCustomer);
router.get(
  "/v1/customer/districts-by-division-id/:id",
  getDistrictByDivisionIdForCustomer
);
router.get(
  "/v1/customer/districts-posts-discussion/:id",
  getDistrictPostDiscussionForCustomer
);
router.get(
  "/v1/customer/districts-posts-event/:id",
  getDistrictPostEventForCustomer
);
router.get("/v1/customer/districts-places/:id", getDistrictPlacesForCustomer);
router.post("/v1/customer/create-district-follower", createDistrictFollower);
router.delete("/v1/customer/delete-district-follower", deleteDistrictFollower);
// router.get("/v1/customer/trending-products", getTrendingProductsForCustomer);
// router.get("/v1/customer/featured-products", getFeaturedProductsForCustomer);

export default router;
