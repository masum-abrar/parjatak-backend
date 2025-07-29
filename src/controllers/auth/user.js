import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import slugify from "../../utils/slugify.js";
import uploadToCLoudinary from "../../utils/uploadToCloudinary.js";
import validateInput from "../../utils/validateInput.js";

const module_name = "user";

//get all users
export const getUsers = async (req, res) => {
  if (req.user.roleName !== "super-admin") {
    getUsersByUser(req, res);
  } else {
    try {
      const users = await prisma.user.findMany({
        where: {
          isDeleted: false,
          AND: [
            {
              name: {
                contains: req.query.name,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: req.query.email,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: req.query.phone,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: req.query.address,
                mode: "insensitive",
              },
            },
            // {
            //   isActive: req.query.active
            //     ? req.query.active.toLowerCase() === "active"
            //       ? true
            //       : false
            //     : true,
            // },
          ],
        },
        // include: {
        //   role: { include: { roleModules: true } },
        //   products: true,
        //   campaigns: true,
        //   suppliers: true,
        // },
        include: {
          // follower: true,
          // following: true,
          division: true,
          disctrict: true,
          // districtFollower: true,
          // place: true,
          // placeFollower: true,
          // placeReview: true,
          // parentUserPlaceReviewLike: true,
          // userPlaceReviewLike: true,
          // parentUserPlaceReviewReply: true,
          // userPlaceReviewReply: true,
          // post: true,
          // parentUserPostLike: true,
          // userPostLike: true,
          // parentUserPostComment: true,
          // userPostComment: true,
          // parentUserPostCommentLike: true,
          // userPostCommentLike: true,
          // parentUserPostCommentReply: true,
          // userPostCommentReply: true,
          // parentUserPostCommentReplyLike: true,
          // userPostCommentReplyLike: true,
          // placeLike: true,
          // placeVisitor: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip:
          req.query.limit && req.query.page
            ? parseInt(req.query.limit * (req.query.page - 1))
            : parseInt(defaultLimit() * (defaultPage() - 1)),
        take: req.query.limit
          ? parseInt(req.query.limit)
          : parseInt(defaultLimit()),
      });

      if (users.length === 0)
        return res
          .status(200)
          .json(jsonResponse(true, "No user is available", null));

      if (users) {
        return res
          .status(200)
          .json(jsonResponse(true, `${users.length} users found`, users));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Something went wrong. Try again", null));
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(false, error, null));
    }
  }
};

//get all users by user
export const getUsersByUser = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        parentId: req.user.id,
        isDeleted: false,
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: req.query.email,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: req.query.phone,
            },
          },
          {
            address: {
              contains: req.query.address,
              mode: "insensitive",
            },
          },
          {
            isActive: req.query.active
              ? req.query.active.toLowerCase() === "active"
                ? true
                : false
              : true,
          },
        ],
      },
      include: {
        role: { include: { roleModules: true } },
        products: true,
        campaigns: true,
        suppliers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip:
        req.query.limit && req.query.page
          ? parseInt(req.query.limit * (req.query.page - 1))
          : parseInt(defaultLimit() * (defaultPage() - 1)),
      take: req.query.limit
        ? parseInt(req.query.limit)
        : parseInt(defaultLimit()),
    });

    if (users.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No user is available", null));

    if (users) {
      return res
        .status(200)
        .json(jsonResponse(true, `${users.length} users found`, users));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "Something went wrong. Try again", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get single user
export const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id },
      include: {
        follower: {
          select: {
            meUser: { select: { name: true, fullname: true, image: true } },
          },
        },
        following: {
          select: {
            otherUser: { select: { name: true, fullname: true, image: true } },
          },
        },
        division: true,
        disctrict: true,
        // districtFollower: true,
        place: true,
        // placeFollower: true,
        placeReview: true,
        // parentUserPlaceReviewLike: true,
        // userPlaceReviewLike: true,
        // parentUserPlaceReviewReply: true,
        // userPlaceReviewReply: true,
        post: true,
        // parentUserPostLike: true,
        userPostLike: true,
        // parentUserPostComment: true,
        userPostComment: true,
        // parentUserPostCommentLike: true,
        userPostCommentLike: true,
        // parentUserPostCommentReply: true,
        userPostCommentReply: true,
        // parentUserPostCommentReplyLike: true,
        // userPostCommentReplyLike: true,
        placeLike: true,
        placeVisitor: true,
      },
    });

    if (user) {
      return res.status(200).json(jsonResponse(true, `1 user found`, user));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No user is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update user
export const updateUser = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const {
        roleId,
        name,
        fullname,
        email,
        phone,
        address,
        billingAddress,
        city,
        districtId,
        divisionId,
        country,
        postalCode,
        image,
        password,
        initialPaymentAmount,
        initialPaymentDue,
        installmentTime,
        isActive,
      } = req.body;

      const findBanner = await prisma.user.findFirst({
        where: { id: req.params.id },
      });

      if (!findBanner)
        return res
          .status(404)
          .json(jsonResponse(false, "This user does not exist", null));

      //validate input
      // const inputValidation = validateInput(
      //   [name, email, phone, address, billingAddress],
      //   ["Name", "Email", "Phone", "Address", "Billing Address"]
      // );

      // if (inputValidation) {
      //   return res.status(400).json(jsonResponse(false, inputValidation, null));
      // }

      //Check user if exists
      // const user = await tx.user.findFirst({
      //   where: {
      //     NOT: [{ id: req.params.id }],
      //     OR: [{ email: req.body.email }, { phone: req.body.phone }],
      //     isDeleted: false,
      //   },
      // });

      // if (user) {
      //   return res
      //     .status(409)
      //     .json(jsonResponse(false, "User already exists", null));
      // }

      //Hash the password
      // const hashedPassword = hashPassword(password);

      if (req.file) {
        // imageUpload = await uploadImage(req.file);
        await uploadToCLoudinary(req.file, "users", async (error, result) => {
          if (error) {
            console.error("error", error);
            return res.status(404).json(jsonResponse(false, error, null));
          }

          if (!result.secure_url) {
            return res
              .status(404)
              .json(
                jsonResponse(
                  false,
                  "Something went wrong while uploading image. Try again",
                  null
                )
              );
          }

          //update banner
          const updateUser = await prisma.user.update({
            where: { id: req.params.id },
            data: {
              isActive,
              // roleId,
              // name,
              email,
              phone,
              fullname,
              name,
              // address,
              // billingAddress,
              city,
              password,
              divisionId,
              districtId,
              billingAddress,
              ...(name && { slug: `${slugify(name)}` }),
              image: result.secure_url,
              // country,
              // postalCode,
              // image,
              // password: hashedPassword,
              // initialPaymentAmount,
              // initialPaymentDue,
              // installmentTime,
              // updatedBy: req.user.id,
            },
          });

          //delete previous uploaded image
          // await deleteFromCloudinary(
          //   findBanner.image,
          //   async (error, result) => {
          //     console.log("error", error);
          //     console.log("result", result);
          //   }
          // );

          if (updateUser) {
            return res
              .status(200)
              .json(
                jsonResponse(true, `Profile has been updated.`, updateUser)
              );
          } else {
            return res
              .status(404)
              .json(jsonResponse(false, "Profile has not been updated", null));
          }
        });

        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${findCategory.image.split("/")[2]}`
        // );
      } else {
        //if there is no image selected
        //update category
        const updateUser = await prisma.user.update({
          where: { id: req.params.id },
          data: {
            isActive,
            // roleId,
            // name,
            email,
            phone,
            fullname,
            name,
            // address,
            // billingAddress,
            city,
            password,
            divisionId,
            districtId,
            ...(name && { slug: `${slugify(name)}` }),
            image: findBanner.image,
            billingAddress,
            // country,
            // postalCode,
            // image,
            // password: hashedPassword,
            // initialPaymentAmount,
            // initialPaymentDue,
            // installmentTime,
            // updatedBy: req.user.id,
          },
        });

        if (updateUser) {
          return res
            .status(200)
            .json(jsonResponse(true, `Profile has been updated.`, updateUser));
        } else {
          return res
            .status(404)
            .json(jsonResponse(false, "Profile has not been updated", null));
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//ban user
export const banUser = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      //ban user
      const getUser = await tx.user.findFirst({
        where: { id: req.params.id },
      });

      const user = await tx.user.update({
        where: { id: req.params.id },
        data: {
          isActive: getUser.isActive === true ? false : true,
        },
      });

      if (user) {
        return res
          .status(200)
          .json(jsonResponse(true, `User has been banned`, user));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "User has not been banned", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete user
export const deleteUser = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.params.id },
        data: { deletedBy: req.user.id, isDeleted: true },
      });

      if (user) {
        return res
          .status(200)
          .json(jsonResponse(true, `User has been deleted`, user));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "User has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await prisma.follower.findMany({
      where: { userId: req.params.id },
      include: {
        otherUser: true,
        meUser: true,
      },
    });

    if (user) {
      return res
        .status(200)
        .json(jsonResponse(true, `${user?.length} followers found`, user));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No follower is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const getFollowings = async (req, res) => {
  try {
    const user = await prisma.follower.findMany({
      where: { parentUserId: req.params.id },
      include: {
        otherUser: true,
        meUser: true,
      },
    });

    if (user) {
      return res
        .status(200)
        .json(jsonResponse(true, `${user?.length} followings found`, user));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No followings is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const createFollowers = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { userId, parentUserId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([userId], ["User"]);

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //check if preorder exists
      // const review = await tx.review.findFirst({
      //   where: {
      //     productId: productId,
      //     userId: userId,
      //   },
      // });
      const followerRes = await prisma.follower.findFirst({
        where: { parentUserId, userId },
      });

      let newReview;
      let message = "";

      if (followerRes) {
        const userRes = await prisma.follower.findFirst({
          where: { parentUserId, userId },
        });

        if (userRes) {
          newReview = await prisma.follower.delete({
            where: { id: userRes?.id },
          });

          message = "You have unfollowed this user";
        }
      } else {
        newReview = await prisma.follower.create({
          data: {
            parentUserId,
            userId,
          },
        });

        message = "You have followed this user";
      }

      if (newReview) {
        return res.status(200).json(jsonResponse(true, message, newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};
