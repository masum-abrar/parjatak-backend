import express from "express";
import multer from "multer";
import {
  //   banProduct,
  createBucketList,
  //   createProductAttribute,
  createBucketListImage,
  createBucketListLike,
  //   createVisitor,
  deleteBucketList,
  //   deleteProductAttribute,
  deleteBucketListImage,
  deleteBucketListLike,
  //   deleteVisitor,
  //   getFeaturedProductsForCustomer,
  getBucketList,
  //   getProductAttributes,
  getBucketListForCustomer,
  getBucketListImages,
  getBucketLists,
  getBucketListsByUser,
  //   getDistrictsByUser,
  getBucketListsForCustomer,
  //   getPopularPlaceReviews,
  //   getPopularPlaces,
  //   getTrendingProductsForCustomer,
  //   increaseProductViewCount,
  //   sendProductEmail,
  updateBucketList,
  //   updateProductAttribute,
  updateBucketListImage,
} from "../../controllers/bucketList/bucketList.js";
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

router.post("/v1/bucketLists", upload.array("images"), createBucketList);
// router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/bucketLists", getBucketLists);
router.get("/v1/user/bucketLists/", getBucketListsByUser);
router.get("/v1/bucketLists/:slug", getBucketList);
router.put("/v1/bucketLists/:id", upload.array("images"), updateBucketList);
// router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put(
  "/v1/bucketLists/images/:id",
  upload.single("image"),
  updateBucketListImage
);
// router.put("/v1/products/:id/viewCount", increaseProductViewCount);
// router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete("/v1/bucketLists/images/:id", deleteBucketListImage);
router.delete("/v1/bucketLists/:id", deleteBucketList);

//attributes
// router.post("/v1/products-attributes", verify, createProductAttribute);
// router.get("/v1/products-attributes/:id", verify, getProductAttributes);
// router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
// router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/bucketLists-images/:id", getBucketListImages);
router.post(
  "/v1/bucketLists-images",
  upload.single("image"),
  createBucketListImage
);
router.delete("/v1/bucketLists-images/:id", deleteBucketListImage);

// For Customer
router.get("/v1/customer/bucketLists", getBucketListsForCustomer);
router.get("/v1/customer/bucketLists/:slug", getBucketListForCustomer);
// router.post("/v1/customer/create-visitor", createVisitor);
// router.delete("/v1/customer/delete-visitor", deleteVisitor);
// router.post("/v1/customer/create-place-follower", createPlaceFollower);
// router.delete("/v1/customer/delete-place-follower", deletePlaceFollower);
router.post("/v1/customer/create-bucket-list-like", createBucketListLike);
router.delete("/v1/customer/delete-bucket-list-like", deleteBucketListLike);
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
