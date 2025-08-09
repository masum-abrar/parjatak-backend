import express from "express";
import multer from "multer";
import {
  //   banProduct,
  createPost,
  createPostComment,
  createPostCommentLike,
  createPostCommentReply,
  createPostCommentReplyLike,
  //   createProductAttribute,
  createPostImage,
  createPostLike,
  deletePost,
  deletePostComment,
  deletePostCommentLike,
  deletePostCommentReply,
  deletePostCommentReplyLike,
  //   deleteProductAttribute,
  deletePostImage,
  deletePostLike,
  getNewPostsFromFriends,
  getNewPostsFromUsers,
  getPlacesForCustomer,
  //   getFeaturedProductsForCustomer,
  getPost,
  getPostComments,
  //   getProductAttributes,
  getPostForCustomer,
  getPostForCustomerByPostId,
  getPostImages,
  getPosts,
  //   getDistrictsByUser,
  getPostsForCustomer,
  //   getTrendingProductsForCustomer,
  //   increaseProductViewCount,
  //   sendProductEmail,
  updatePost,
  //   updateProductAttribute,
  updatePostImage,
} from "../../controllers/post/post.js";
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

router.post("/v1/posts", upload.array("images"), createPost);
// router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/posts", getPosts);
// router.get("/v1/user/products/", productUserList, verify, getProductsByUser);
router.get("/v1/posts/:slug", getPost);
router.put("/v1/posts/:id", upload.array("images"), updatePost);
// router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put("/v1/posts/images/:id", upload.single("image"), updatePostImage);
// router.put("/v1/products/:id/viewCount", increaseProductViewCount);
// router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete("/v1/posts/images/:id", deletePostImage);
router.delete("/v1/posts/:id", deletePost);

//attributes
// router.post("/v1/products-attributes", verify, createProductAttribute);
// router.get("/v1/products-attributes/:id", verify, getProductAttributes);
// router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
// router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/posts-images/:id", getPostImages);
router.post("/v1/posts-images", upload.single("image"), createPostImage);
router.delete("/v1/posts-images/:id", deletePostImage);

// For Customer
router.get("/v1/customer/posts", getPostsForCustomer);
router.get("/v1/customer/posts/:slug", getPostForCustomer);
router.get("/v1/customer/posts-by-id/:id", getPostForCustomerByPostId);
router.post("/v1/customer/create-post-like", createPostLike);
router.delete("/v1/customer/delete-post-like", deletePostLike);
router.post("/v1/customer/create-post-comment", createPostComment);
router.delete("/v1/customer/delete-post-comment/:id", deletePostComment);
router.post("/v1/customer/create-post-comment-like", createPostCommentLike);
router.delete("/v1/customer/delete-post-comment-like", deletePostCommentLike);
router.post("/v1/customer/create-post-comment-reply", createPostCommentReply);
router.delete(
  "/v1/customer/delete-post-comment-reply/:id",
  deletePostCommentReply
);
router.post(
  "/v1/customer/create-post-comment-reply-like",
  createPostCommentReplyLike
);
router.delete(
  "/v1/customer/delete-post-comment-reply-like",
  deletePostCommentReplyLike
);
router.get("/v1/customer/post-comments", getPostComments);
router.get("/v1/customer/new-posts-from-friends", getNewPostsFromFriends);
router.get("/v1/customer/new-posts-from-users", getNewPostsFromUsers);
// router.get("/v1/customer/trending-products", getTrendingProductsForCustomer);
// router.get("/v1/customer/featured-products", getFeaturedProductsForCustomer);
router.get("/v1/customer/category-places", getPlacesForCustomer);

export default router;
