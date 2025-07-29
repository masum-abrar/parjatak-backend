import express from "express";
import multer from "multer";
import {
  banUser,
  createFollowers,
  deleteUser,
  getFollowers,
  getFollowings,
  getUser,
  getUsers,
  getUsersByUser,
  updateUser,
} from "../../controllers/auth/user.js";
import {
  usersBan,
  usersEdit,
  usersList,
  usersRemove,
  // usersSingle,
  usersUserList,
} from "../../utils/modules.js";
import verify from "../../utils/verifyToken.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get("/v1/auth/users", usersList, verify, getUsers);
router.get("/v1/auth/user/users", usersUserList, verify, getUsersByUser);
router.get("/v1/auth/users/:id", getUser);
router.put("/v1/auth/users/:id", usersEdit, verify, updateUser);
router.put("/v1/users/:id/ban", usersBan, verify, banUser);
router.delete("/v1/auth/users/:id", usersRemove, verify, deleteUser);

//For customer
// router.get("/v1/customer/all-users", getUsers);
router.get("/v1/customer/users/:id", getUser);
router.put("/v1/customer/users/:id", upload.single("image"), updateUser);
router.get("/v1/customer/followers/:id", getFollowers);
router.get("/v1/customer/followings/:id", getFollowings);
router.post("/v1/customer/create-followers", createFollowers);

export default router;
