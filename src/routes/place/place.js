import express from "express";
import multer from "multer";
import {
  createFavoritePlace,
  //   banProduct,
  createPlace,
  createPlaceFollower,
  //   createProductAttribute,
  createPlaceImage,
  createPlaceLike,
  createPlaceReview,
  createPlaceReviewLike,
  createVisitor,
  deleteFavoritePlaces,
  deletePlace,
  deletePlaceFollower,
  //   deleteProductAttribute,
  deletePlaceImage,
  deletePlaceLike,
  deletePlaceReview,
  deletePlaceReviewLike,
  deleteVisitor,
  getFavoritePlaces,
  //   getFeaturedProductsForCustomer,
  getPlace,
  getPlaceByDistrictIdForCustomer,
  //   getProductAttributes,
  getPlaceForCustomer,
  getPlaceImages,
  getPlaceReviews,
  getPlaceReviewsByUser,
  getPlaces,
  //   getDistrictsByUser,
  getPlacesForCustomer,
  getPopularPlaceReviews,
  getPopularPlaces,
  //   getTrendingProductsForCustomer,
  //   increaseProductViewCount,
  //   sendProductEmail,
  updatePlace,
  //   updateProductAttribute,
  updatePlaceImage,
} from "../../controllers/place/place.js";
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

router.post("/v1/places", upload.array("images"), createPlace);
// router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/places", getPlaces);
// router.get("/v1/user/products/", productUserList, verify, getProductsByUser);
router.get("/v1/places/:slug", getPlace);
router.put("/v1/places/:id", upload.array("images"), updatePlace);
// router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put("/v1/places/images/:id", upload.single("image"), updatePlaceImage);
// router.put("/v1/products/:id/viewCount", increaseProductViewCount);
// router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete("/v1/places/images/:id", deletePlaceImage);
router.delete("/v1/places/:id", deletePlace);

//attributes
// router.post("/v1/products-attributes", verify, createProductAttribute);
// router.get("/v1/products-attributes/:id", verify, getProductAttributes);
// router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
// router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/places-images/:id", getPlaceImages);
router.post("/v1/places-images", upload.single("image"), createPlaceImage);
router.delete("/v1/places-images/:id", deletePlaceImage);

// For Customer
router.get("/v1/customer/places", getPlacesForCustomer);
router.get("/v1/customer/places/:slug", getPlaceForCustomer);
router.get(
  "/v1/customer/places-by-district-id/:id",
  getPlaceByDistrictIdForCustomer
);
router.post("/v1/customer/create-visitor", createVisitor);
router.delete("/v1/customer/delete-visitor", deleteVisitor);
router.post("/v1/customer/create-place-follower", createPlaceFollower);
router.delete("/v1/customer/delete-place-follower", deletePlaceFollower);
router.post("/v1/customer/create-place-like", createPlaceLike);
router.delete("/v1/customer/delete-place-like", deletePlaceLike);

router.post(
  "/v1/customer/create-place-review",
  upload.array("images"),
  createPlaceReview
);

router.post("/v1/customer/delete-place-review/:id", deletePlaceReview);
router.get("/v1/customer/place-reviews", getPlaceReviews);
router.get("/v1/customer/place-reviews/user/:userId", getPlaceReviewsByUser);


router.get("/v1/customer/popular-place-reviews", getPopularPlaceReviews);
router.post("/v1/customer/create-place-review-like", createPlaceReviewLike);
router.delete(
  "/v1/customer/delete-place-review-like/:id",
  deletePlaceReviewLike
);
router.get("/v1/customer/popular-places", getPopularPlaces);

router.post("/v1/customer/create-favorite-place", createFavoritePlace);
router.get("/v1/customer/favorite-places/:id", getFavoritePlaces);
router.delete("/v1/customer/delete-favorite-places/:id", deleteFavoritePlaces);
// router.get("/v1/customer/trending-products", getTrendingProductsForCustomer);
// router.get("/v1/customer/featured-products", getFeaturedProductsForCustomer);

export default router;
