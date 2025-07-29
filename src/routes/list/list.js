import express from "express";
import multer from "multer";
import {
  //   banProduct,
  createList,
  //   createProductAttribute,
  createListImage,
  createListLike,
  createListPlace,
  createListReview,
  //   createVisitor,
  deleteList,
  //   deleteProductAttribute,
  deleteListImage,
  deleteListLike,
  deleteListReview,
  //   deleteVisitor,
  //   getFeaturedProductsForCustomer,
  getList,
  //   getProductAttributes,
  getListForCustomer,
  getListImages,
  getListReviews,
  getLists,
  getListsByUser,
  //   getDistrictsByUser,
  getListsForCustomer,
  //   getPopularPlaceReviews,
  //   getPopularPlaces,
  //   getTrendingProductsForCustomer,
  //   increaseProductViewCount,
  //   sendProductEmail,
  updateList,
  //   updateProductAttribute,
  updateListImage,
} from "../../controllers/list/list.js";
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

router.post("/v1/lists", upload.array("images"), createList);
router.post("/v1/add-lists-places", createListPlace);
// router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/lists", getLists);
router.get("/v1/user/lists/", getListsByUser);
router.get("/v1/lists/:slug", getList);
router.put("/v1/lists/:id", upload.array("images"), updateList);
// router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put("/v1/lists/images/:id", upload.single("image"), updateListImage);
// router.put("/v1/products/:id/viewCount", increaseProductViewCount);
// router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete("/v1/lists/images/:id", deleteListImage);
router.delete("/v1/lists/:id", deleteList);

//attributes
// router.post("/v1/products-attributes", verify, createProductAttribute);
// router.get("/v1/products-attributes/:id", verify, getProductAttributes);
// router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
// router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/lists-images/:id", getListImages);
router.post("/v1/lists-images", upload.single("image"), createListImage);
router.delete("/v1/lists-images/:id", deleteListImage);

// For Customer
router.get("/v1/customer/lists", getListsForCustomer);
router.get("/v1/customer/lists/:slug", getListForCustomer);
// router.post("/v1/customer/create-visitor", createVisitor);
// router.delete("/v1/customer/delete-visitor", deleteVisitor);
// router.post("/v1/customer/create-place-follower", createPlaceFollower);
// router.delete("/v1/customer/delete-place-follower", deletePlaceFollower);
router.post("/v1/customer/create-list-like", createListLike);
router.delete("/v1/customer/delete-list-like", deleteListLike);
router.post("/v1/customer/create-list-review", createListReview);
router.post("/v1/customer/delete-list-review/:id", deleteListReview);
router.get("/v1/customer/list-reviews", getListReviews);
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
