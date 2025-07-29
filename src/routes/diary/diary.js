import express from "express";
import multer from "multer";
import {
  //   banProduct,
  createDiary,
  //   createProductAttribute,
  createDiaryImage,
  //   createVisitor,
  deleteDiary,
  //   deleteProductAttribute,
  deleteDiaryImage,
  getDiaries,
  getDiariesByUser,
  //   getDistrictsByUser,
  getDiariesForCustomer,
  //   deleteVisitor,
  //   getFeaturedProductsForCustomer,
  getDiary,
  //   getProductAttributes,
  getDiaryForCustomer,
  getDiaryImages,
  //   getPopularPlaceReviews,
  //   getPopularPlaces,
  //   getTrendingProductsForCustomer,
  //   increaseProductViewCount,
  //   sendProductEmail,
  updateDiary,
  //   updateProductAttribute,
  updateDiaryImage,
} from "../../controllers/diary/diary.js";
// import {
//   productBan,
//   productCreate,
//   productEdit,
//   productList,
//   productRemove,
//   productSingle,
//   productUserList,
// } from "../../utils/modules.js";

// const upload = multer({ dest: "public/images/product" });
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post("/v1/diaries", upload.array("images"), createDiary);
// router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/diaries", getDiaries);
router.get("/v1/user/diaries/", getDiariesByUser);
router.get("/v1/diaries/:slug", getDiary);
router.put("/v1/diaries/:id", upload.array("images"), updateDiary);
// router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put("/v1/diaries/images/:id", upload.single("image"), updateDiaryImage);
// router.put("/v1/products/:id/viewCount", increaseProductViewCount);
// router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete("/v1/diaries/images/:id", deleteDiaryImage);
router.delete("/v1/diaries/:id", deleteDiary);

//attributes
// router.post("/v1/products-attributes", verify, createProductAttribute);
// router.get("/v1/products-attributes/:id", verify, getProductAttributes);
// router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
// router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/diaries-images/:id", getDiaryImages);
router.post("/v1/diaries-images", upload.single("image"), createDiaryImage);
router.delete("/v1/diaries-images/:id", deleteDiaryImage);

// For Customer
router.get("/v1/customer/diaries", getDiariesForCustomer);
router.get("/v1/customer/diaries/:slug", getDiaryForCustomer);
// router.post("/v1/customer/create-visitor", createVisitor);
// router.delete("/v1/customer/delete-visitor", deleteVisitor);
// router.post("/v1/customer/create-place-follower", createPlaceFollower);
// router.delete("/v1/customer/delete-place-follower", deletePlaceFollower);
// router.post("/v1/customer/create-place-like", createPlaceLike);
// router.delete("/v1/customer/delete-place-like", deletePlaceLike);
// router.post("/v1/customer/create-place-review", createPlaceReview);
// router.post("/v1/customer/delete-place-review/:id", deletePlaceReview);
// router.get("/v1/customer/place-reviews", getPlaceReviews);
// router.get("/v1/customer/popular-place-reviews", getPopularPlaceReviews);
// router.post("/v1/customer/create-place-review-like", createPlaceReviewLike);
// router.delete(
//   "/v1/customer/delete-place-review-like/:id",
//   deletePlaceReviewLike
// );
// router.get("/v1/customer/popular-places", getPopularPlaces);
// router.get("/v1/customer/trending-products", getTrendingProductsForCustomer);
// router.get("/v1/customer/featured-products", getFeaturedProductsForCustomer);

export default router;
