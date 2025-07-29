import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary.js";
import sendEmail from "../../utils/emailService.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import slugify from "../../utils/slugify.js";
import uploadToCLoudinary from "../../utils/uploadToCloudinary.js";
import validateInput from "../../utils/validateInput.js";

const module_name = "notification";

//create product
export const createNotification = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const {
        parentUserId,
        userId,
        placeId,
        districtId,
        listId,
        bucketListId,
        postId,
        reviewId,
        diaryId,
        link,
        message,
        type,
      } = req.body;

      //validate input
      const inputValidation = validateInput([type], ["Type"]);

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //check image limit
      //   if (req.files) {
      //     if (req.files.length > 7) {
      //       return res
      //         .status(404)
      //         .json(
      //           jsonResponse(false, "You cannot add more than 7 images", null)
      //         );
      //     }
      //   }

      //get user name for slugify
      //   const user = await tx.user.findFirst({
      //     where: { id: req.user.parentId ? req.user.parentId : req.user.id },
      //   });

      //   if (!user)
      //     return res
      //       .status(404)
      //       .json(jsonResponse(false, "This user does not exist", null));

      //create multiple products
      let newProducts = [];
      // let requestBodyLength = req.body.length;

      //loop through request body array to upload multiple products at a time
      // for (let i = 0; i < requestBodyLength; i++) {
      //check if product exists
      //   const product = await tx.notifiaction.findFirst({
      //     where: {
      //       //   userId: req.user.parentId ? req.user.parentId : req.user.id,
      //       title: title,
      //       isActive: true,
      //     },
      //   });

      //   if (product && product.slug === `${slugify(req.body.title)}`)
      //     return res
      //       .status(409)
      //       .json(
      //         jsonResponse(
      //           false,
      //           `${req.body.title} already exists. Change its name.`,
      //           null
      //         )
      //       );

      //calculation for discount prices
      //   let newProductAttributes = [];
      //   const productAttributeLength = req.body.productAttributes.length;
      //   for (let j = 0; j < productAttributeLength; j++) {
      //     newProductAttributes.push({
      //       ...req.body.productAttributes[j],
      //       costPrice: Number(req.body.productAttributes[j].costPrice),
      //       retailPrice: Number(req.body.productAttributes[j].retailPrice),
      //       stockAmount: Number(req.body.productAttributes[j].stockAmount),
      //       discountPercent: req.body.productAttributes[j].discountPercent
      //         ? Number(req.body.productAttributes[j].discountPercent)
      //         : 0,
      //       discountPrice:
      //         req.body.productAttributes[j].retailPrice *
      //         (req.body.productAttributes[j].discountPercent / 100),
      //       discountedRetailPrice:
      //         req.body.productAttributes[j].retailPrice -
      //         req.body.productAttributes[j].retailPrice *
      //           (req.body.productAttributes[j].discountPercent / 100),
      //     });
      //   }

      //if there is no image selected
      if (!req.files || req.files.length === 0) {
        //create products
        let newProduct = await prisma.notification.create({
          data: {
            userId: userId,
            parentUserId,
            placeId,
            districtId,
            listId,
            bucketListId,
            postId,
            diaryId,
            link,
            message,
            type,
            reviewId,
            // description,
            // title,
            // targetDate,
            // isActive: isActive === "true" ? true : false,
            // slug: `${slugify(req.body.title)}`,
            // productAttributes: {
            //   create: newProductAttributes,
            // },
          },
        });

        if (!newProduct) {
          return res.status(200).json(jsonResponse(false, `Failed`, null));
        }

        // newProducts.push(newProduct);
        // }

        if (newProduct) {
          return res
            .status(200)
            .json(jsonResponse(true, "Success", newProduct));
        }
      }

      //upload image
      // const imageUpload = await uploadImage(req.files);
      const newImages = [];
      await uploadToCLoudinary(
        req.files,
        module_name,
        async (error, result) => {
          if (error) {
            console.error("error", error);
            return res.status(404).json(jsonResponse(false, error, null));
          }

          newImages.push({ image: result.secure_url });

          if (!result.secure_url) {
            return res
              .status(404)
              .json(
                jsonResponse(
                  false,
                  "Something went wrong while uploading image and you cannot upload more than 7 images.",
                  null
                )
              );
          }

          if (req.files.length === newImages.length) {
            //create products
            console.log({ newImages });
            let newProduct = await prisma.list.create({
              data: {
                // userId: req.user.parentId ? req.user.parentId : req.user.id,
                userId: userId,
                placeId,
                description,
                title,
                // targetDate,
                isActive: isActive === "true" ? true : false,
                slug: `${slugify(req.body.title)}`,
                // productAttributes: {
                //   create: newProductAttributes,
                // },
                images: {
                  create: newImages,
                },
              },
            });

            if (!newProduct) {
              return res
                .status(200)
                .json(
                  jsonResponse(
                    false,
                    `${req.body.title} cannot be created`,
                    null
                  )
                );
            }

            // newProducts.push(newProduct);
            // }

            if (newProduct) {
              return res
                .status(200)
                .json(jsonResponse(true, "List has been created", newProduct));
            }
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//send product email
export const sendProductEmail = async (req, res) => {
  try {
    const products = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        isDeleted: false,
        isActive: true,
      },
      include: {
        user: true,
        category: true,
        campaign: true,
        supplier: true,
        images: true,
        productAttributes: true,
        subcategory: true,
        subsubcategory: true,
        brand: true,
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // if (products.length === 0)
    //   return res
    //     .status(200)
    //     .json(jsonResponse(true, "No product is available", null));

    if (products) {
      const emailList = await prisma.newsletter.findMany({
        where: { isActive: true },
      });

      console.log({ emailList });

      if (emailList) {
        for (let i = 0; i < emailList?.length; i++) {
          const emailGenerate = await sendEmail(
            emailList[i]?.email,
            `🌟 Just In! New Product Now Available! 🛍️`,
            `<h2>New Arrival Alert! Find Your Perfect Match 🎉</h2><br/>
    
              <p>Exciting news! A brand-new product has just landed on our store, and it’s available in multiple variants to match your style and needs!</p><br/>

              <p>✨ <b>${products?.name} – Now in Different Variants & Styles!</b></p>
              <p><b>🛍️ Choose from a variety of options to find your perfect fit.<b/></p>
              <p><b>🚀 Limited Stock – Get Yours Before It’s Gone!<b/></p>
              <br/>
              <p>Be among the first to explore and grab this latest addition!</p>

              <p>👉 <a href="https://ecommerce-web-one-brown.vercel.app/product-details/${products?.slug}">Shop Now</a></p>
    
              <br/>
              <p><b>Happy Shopping!</b></p>
              <h4><b>Parjatak</b></h4>
            `
          );
        }
      }

      return res
        .status(200)
        .json(jsonResponse(true, `Email is sent to the subscribers`, products));
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

//get all products
export const getNotifications = async (req, res) => {
  if (req.user.roleName !== "super-admin") {
    getProductsByUser(req, res);
  } else {
    try {
      const products = await prisma.notification.findMany({
        where: {
          parentUserId: req.params.id,
          //   isActive: true,
          //   AND: [
          //     {
          //       title: {
          //         contains: req.query.title,
          //         mode: "insensitive",
          //       },
          //     },
          //   ],
        },
        include: {
          place: true,
          list: true,
          district: true,
          bucketList: true,
          post: true,
          diary: true,
          parentUser: true,
          user: true,
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

      if (products.length === 0)
        return res
          .status(200)
          .json(jsonResponse(true, "No notification is available", null));

      if (products) {
        return res
          .status(200)
          .json(
            jsonResponse(
              true,
              `${products.length} notification found`,
              products
            )
          );
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

export const getActivities = async (req, res) => {
  if (req.user.roleName !== "super-admin") {
    getProductsByUser(req, res);
  } else {
    try {
      const products = await prisma.notification.findMany({
        where: {
          userId: req.params.id,
          //   isActive: true,
          //   AND: [
          //     {
          //       title: {
          //         contains: req.query.title,
          //         mode: "insensitive",
          //       },
          //     },
          //   ],
        },
        include: {
          place: true,
          list: true,
          district: true,
          bucketList: true,
          post: true,
          diary: true,
          parentUser: true,
          user: true,
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

      if (products.length === 0)
        return res
          .status(200)
          .json(jsonResponse(true, "No notification is available", null));

      if (products) {
        return res
          .status(200)
          .json(
            jsonResponse(
              true,
              `${products.length} notification found`,
              products
            )
          );
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

//get all products by user
export const getListsByUser = async (req, res) => {
  try {
    const products = await prisma.list.findMany({
      where: {
        userId: req.user.parentId ? req.user.parentId : req.user.id,
        isDeleted: false,
        isActive: true,
        AND: [
          {
            title: {
              contains: req.query.title,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        place: true,
        user: true,
        images: true,
        like: true,
        review: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No list is available", null));

    if (products) {
      return res
        .status(200)
        .json(jsonResponse(true, `${products.length} list found`, products));
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

//get single product
export const getList = async (req, res) => {
  try {
    const product = await prisma.list.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        place: true,
        user: true,
        images: true,
        like: true,
        review: true,
      },
    });

    if (product) {
      return res.status(200).json(jsonResponse(true, `1 list found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No list is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update product
export const updateList = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { userId, placeId, description, title, isActive } = req.body;

      //validate input
      const inputValidation = validateInput(
        [title, userId, placeId],
        ["Title", "User", "Place"]
      );

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //get user id from product and user name from user for slugify
      const findProduct = await tx.list.findFirst({
        where: { id: req.params.id },
      });

      if (!findProduct)
        return res
          .status(404)
          .json(jsonResponse(false, "This list does not exist", null));

      //   const user = await tx.user.findFirst({
      //     where: { id: findProduct.userId },
      //   });

      //   if (!user)
      //     return res
      //       .status(404)
      //       .json(jsonResponse(false, "This user does not exist", null));

      //check if slug already exists
      if (title) {
        if (title !== findProduct.title) {
          const existingProduct = await tx.list.findFirst({
            where: {
              //   userId: req.user.parentId ? req.user.parentId : req.user.id,
              title: title,
              isActive: true,
            },
          });

          if (existingProduct && existingProduct.slug === `${slugify(title)}`) {
            return res
              .status(409)
              .json(
                jsonResponse(
                  false,
                  `${title} already exists. Change its name.`,
                  null
                )
              );
          }
        }
      }

      //update product
      const product = await tx.list.update({
        where: { id: req.params.id },
        data: {
          //   userId: req.user.parentId ? req.user.parentId : req.user.id,
          //   userId,
          placeId,
          description,
          title,
          //   targetDate,
          isActive: isActive === "true" ? true : false,
          slug: title ? `${slugify(title)}` : findProduct.slug,
        },
      });

      if (product) {
        if (req.files) {
          //for inserting new images to a particular product

          //max 3 image
          const productImages = await tx.listImage.findMany({
            where: { listId: req.params.id },
          });

          if (req.files.length + productImages.length > 7) {
            return res
              .status(404)
              .json(
                jsonResponse(false, "You cannot add more than 7 images", null)
              );
          }

          let newImages = [];
          //upload image
          // const imageUpload = await uploadImage(req.files);
          await uploadToCLoudinary(
            req.files,
            module_name,
            async (error, result) => {
              if (error) {
                console.error("error", error);
                return res.status(404).json(jsonResponse(false, error, null));
              }

              newImages.push({ image: result.secure_url });

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

              const imagesLength = req.files.length;
              if (imagesLength === newImages.length) {
                if (Array.isArray(imagesLength) && imagesLength > 0) {
                  for (let i = 0; i < imagesLength; i++) {
                    await prisma.listImage.create({
                      data: {
                        listId: req.params.id,
                        image: newImages[i],
                      },
                    });
                  }
                }
                return res
                  .status(200)
                  .json(jsonResponse(true, `List has been updated`, product));
              }
            }
          );
        } else {
          return res
            .status(200)
            .json(jsonResponse(true, `List has been updated`, product));
        }
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "List has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update product attribute
export const updateProductAttribute = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { size, costPrice, retailPrice, discountPercent, stockAmount } =
        req.body;

      //get particular product attribute for calculating discount prices
      const particularProductAttribute = await tx.productAttribute.findFirst({
        where: { id: req.params.id },
      });

      if (!particularProductAttribute) {
        return res
          .status(404)
          .json(
            jsonResponse(false, "This product attribute does not exist", null)
          );
      }

      //calculation for discount prices
      let dPercent = particularProductAttribute.discountPercent;
      let dPrice = particularProductAttribute.discountPrice;
      let dRetailPrice = particularProductAttribute.discountedRetailPrice;
      let newRetailPrice = particularProductAttribute.retailPrice;

      if (discountPercent && retailPrice) {
        dPrice = retailPrice * (discountPercent / 100);
        dRetailPrice = retailPrice - dPrice;
      } else if (discountPercent) {
        dPrice = newRetailPrice * (discountPercent / 100);
        dRetailPrice = newRetailPrice - dPrice;
      } else if (retailPrice) {
        dPrice = retailPrice * (dPercent / 100);
        dRetailPrice = retailPrice - dPrice;
      }

      //update product attribute
      const productAttribute = await tx.productAttribute.update({
        where: { id: req.params.id },
        data: {
          size: size,
          costPrice: Number(costPrice),
          retailPrice: Number(retailPrice),
          discountPercent: Number(discountPercent) ?? 0,
          discountPrice: Number(retailPrice) * (Number(discountPercent) / 100),
          discountedRetailPrice:
            Number(retailPrice) -
            Number(retailPrice) * (Number(discountPercent) / 100),
          stockAmount: Number(stockAmount),
          // updatedBy: req.user.id,
        },
      });

      if (productAttribute) {
        return res
          .status(200)
          .json(
            jsonResponse(
              true,
              `Product attribute has been updated`,
              productAttribute
            )
          );
      } else {
        return res
          .status(404)
          .json(
            jsonResponse(false, "Product attribute has not been updated", null)
          );
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update product image
export const updateListImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { image } = req.body;

      const findProductImage = await tx.listImage.findFirst({
        where: { id: req.params.id },
      });
      //upload image
      // const imageUpload = await uploadImage(req.file);
      await uploadToCLoudinary(req.file, module_name, async (error, result) => {
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

        //update product image
        const productImage = await prisma.listImage.update({
          where: { id: req.params.id },
          data: {
            image: result.secure_url,
            // updatedBy: req.user.id,
          },
        });

        if (productImage) {
          // fs.unlinkSync(
          //   `public\\images\\${module_name}\\${productImage.image.split("/")[2]}`
          // );
          await deleteFromCloudinary(
            findProductImage.image,
            async (error, result) => {
              console.log("error", error);
              console.log("result", result);
            }
          );

          return res
            .status(200)
            .json(
              jsonResponse(true, `List image has been updated`, productImage)
            );
        } else {
          return res
            .status(404)
            .json(jsonResponse(false, "List image has not been updated", null));
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete product image
export const deleteListImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const productImage = await tx.listImage.delete({
        where: { id: req.params.id },
        // data: { deletedBy: req.user.id },
      });

      if (productImage) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${productImage.image.split("/")[2]}`
        // );

        await deleteFromCloudinary(
          productImage.image,
          async (error, result) => {
            console.log("error", error);
            console.log("result", result);
          }
        );

        return res
          .status(200)
          .json(
            jsonResponse(true, `List image has been deleted`, productImage)
          );
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "List image has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//increase view count
export const increaseProductViewCount = async (req, res) => {
  try {
    //get user id from product and user name from user for increasing view count
    const findProduct = await prisma.product.findFirst({
      where: { id: req.params.id, isActive: true, isDeleted: false },
    });

    if (!findProduct)
      return res
        .status(404)
        .json(jsonResponse(false, "This product does not exist", null));

    const user = await prisma.user.findFirst({
      where: { id: findProduct.userId, isActive: true, isDeleted: false },
    });

    if (!user)
      return res
        .status(404)
        .json(jsonResponse(false, "This product does not exist", null));

    //increase view count
    const product = await prisma.product.update({
      where: { id: req.params.id, isActive: true, isDeleted: false },
      data: {
        viewCount: findProduct.viewCount + 1,
      },
    });

    if (product) {
      return res
        .status(200)
        .json(
          jsonResponse(
            true,
            `A user has viewed your ${findProduct.name} product`,
            product
          )
        );
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "Something went wrong!", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//ban product
export const banProduct = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      //ban product
      const getProduct = await tx.product.findFirst({
        where: { id: req.params.id },
      });

      const product = await tx.product.update({
        where: { id: req.params.id },
        data: {
          isActive: getProduct.isActive === true ? false : true,
          updatedBy: req.user.id,
        },
      });

      if (product) {
        return res
          .status(200)
          .json(jsonResponse(true, `Product has been banned`, product));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Product has not been banned", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete product
export const deleteNotification = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.notification.delete({
        where: { id: req.params.id },
        // data: { deletedBy: req.user.id, isDeleted: true },
      });

      if (product) {
        return res
          .status(200)
          .json(jsonResponse(true, `Notification has been deleted`, product));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Notification has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//For Customer
//get all products
export const getNotificationsForCustomer = async (req, res) => {
  try {
    const products = await prisma.notification.findMany({
      where: {
        parentUserId: req.params.id,
        // AND: [
        //   {
        //     title: {
        //       contains: req.query.title,
        //       mode: "insensitive",
        //     },
        //   },
        // ],
      },
      include: {
        place: true,
        list: true,
        district: true,
        bucketList: true,
        post: true,
        diary: true,
        parentUser: true,
        user: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No notification is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} notifications found`, products)
        );
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

export const getActivitiesForCustomer = async (req, res) => {
  try {
    const products = await prisma.notification.findMany({
      where: {
        userId: req.params.id,
        // AND: [
        //   {
        //     title: {
        //       contains: req.query.title,
        //       mode: "insensitive",
        //     },
        //   },
        // ],
      },
      include: {
        place: true,
        list: true,
        district: true,
        bucketList: true,
        post: true,
        diary: true,
        parentUser: true,
        user: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No notification is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} notifications found`, products)
        );
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

//get all trending products
export const getTrendingProductsForCustomer = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        isTrending: true,
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
          {
            productCode: {
              contains: req.query.product_code,
              mode: "insensitive",
            },
          },
          {
            barcode: {
              contains: req.query.barcode,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        user: { select: { name: true, image: true } },
        productCode: true,
        barcode: true,
        name: true,
        shortDescription: true,
        longDescription: true,
        sku: true,
        viewCount: true,
        slug: true,
        review: { include: { user: true, product: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        subsubcategory: { select: { name: true } },
        brand: { select: { name: true } },
        campaign: { select: { name: true } },
        images: { select: { image: true } },
        productAttributes: {
          select: {
            id: true,
            size: true,
            costPrice: true,
            retailPrice: true,
            discountPercent: true,
            discountPrice: true,
            discountedRetailPrice: true,
            stockAmount: true,
          },
        },
        createdAt: true,
        isActive: true,
        isTrending: true,
        isFeatured: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No trending product is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(
            true,
            `${products.length} trending products found`,
            products
          )
        );
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

//get all featured products
export const getFeaturedProductsForCustomer = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        isFeatured: true,
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
          {
            productCode: {
              contains: req.query.product_code,
              mode: "insensitive",
            },
          },
          {
            barcode: {
              contains: req.query.barcode,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        user: { select: { name: true, image: true } },
        productCode: true,
        barcode: true,
        name: true,
        shortDescription: true,
        longDescription: true,
        sku: true,
        viewCount: true,
        slug: true,
        review: { include: { user: true, product: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
        subsubcategory: { select: { name: true } },
        brand: { select: { name: true } },
        campaign: { select: { name: true } },
        images: { select: { image: true } },
        productAttributes: {
          select: {
            id: true,
            size: true,
            costPrice: true,
            retailPrice: true,
            discountPercent: true,
            discountPrice: true,
            discountedRetailPrice: true,
            stockAmount: true,
          },
        },
        createdAt: true,
        isActive: true,
        isTrending: true,
        isFeatured: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No featured product is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(
            true,
            `${products.length} featured products found`,
            products
          )
        );
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

//get single product for customer
export const getListForCustomer = async (req, res) => {
  try {
    const product = await prisma.list.findFirst({
      where: {
        slug: req.params.slug,
        isActive: true,
      },
      include: {
        place: true,
        user: true,
        images: true,
        like: true,
        review: true,
      },
    });

    if (product) {
      const productUpdate = await prisma.list.update({
        where: {
          id: product?.id,
        },
        data: {
          viewCount: product?.viewCount + 1,
        },
      });

      return res.status(200).json(jsonResponse(true, `1 list found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No list is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//create product attribute
export const createProductAttribute = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const {
        productId,
        size,
        costPrice,
        retailPrice,
        discountPercent,
        stockAmount,
      } = req.body;

      //validate input
      const inputValidation = validateInput(
        [size, costPrice, retailPrice, stockAmount],
        ["Variant", "Cost Price", "Retail Price", "Discount Percent"]
      );

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //create multiple products
      let newProducts = [];
      // let requestBodyLength = req.body.length;

      //loop through request body array to upload multiple products at a time
      // for (let i = 0; i < requestBodyLength; i++) {
      //check if product exists
      const product = await tx.product.findFirst({
        where: {
          id: productId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!product)
        return res
          .status(409)
          .json(jsonResponse(false, `There is no product.`, null));

      //if there is no image selected
      // if (!req.files || req.files.length === 0) {
      //create products
      let newAttribute = await prisma.productAttribute.create({
        data: {
          productId: product?.id,
          size: size,
          costPrice: Number(costPrice),
          retailPrice: Number(retailPrice),
          discountPercent: Number(discountPercent) ?? 0,
          discountPrice: Number(retailPrice) * (Number(discountPercent) / 100),
          discountedRetailPrice:
            Number(retailPrice) -
            Number(retailPrice) * (Number(discountPercent) / 100),
          stockAmount: Number(stockAmount),
        },
      });

      if (!newAttribute) {
        return res
          .status(200)
          .json(
            jsonResponse(false, `Attribute ${variant} cannot be created`, null)
          );
      }

      // newProducts.push(newProduct);
      // }

      if (newAttribute) {
        return res
          .status(200)
          .json(jsonResponse(true, "Attribute has been created", newAttribute));
      }
      // }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get all attributes
export const getProductAttributes = async (req, res) => {
  // if (req.user.roleName !== "super-admin") {
  //   getProductsByUser(req, res);
  // } else {
  try {
    const products = await prisma.productAttribute.findMany({
      where: {
        productId: req.params.id,
        isDeleted: false,
        // isActive: true,
        AND: [
          {
            size: {
              contains: req.query.size,
              mode: "insensitive",
            },
          },
          // {
          //   productCode: {
          //     contains: req.query.product_code,
          //     mode: "insensitive",
          //   },
          // },
          // {
          //   barcode: {
          //     contains: req.query.barcode,
          //     mode: "insensitive",
          //   },
          // },
        ],
      },
      include: {
        product: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No attribute is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} attributes found`, products)
        );
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "Something went wrong. Try again", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
  // }
};

//delete product attribute
export const deleteProductAttribute = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.productAttribute.delete({
        where: { id: req.params.id },
      });

      if (product) {
        return res
          .status(200)
          .json(
            jsonResponse(true, `Product Attribute has been deleted`, product)
          );
      } else {
        return res
          .status(404)
          .json(
            jsonResponse(false, "Product Attribute has not been deleted", null)
          );
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get all images
export const getListImages = async (req, res) => {
  // if (req.user.roleName !== "super-admin") {
  //   getProductsByUser(req, res);
  // } else {
  try {
    const products = await prisma.listImage.findMany({
      where: {
        listId: req.params.id,
        // isDeleted: false,
        // isActive: true,
      },
      include: {
        list: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No image is available", null));

    if (products) {
      return res
        .status(200)
        .json(jsonResponse(true, `${products.length} images found`, products));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "Something went wrong. Try again", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
  // }
};

//create an image
export const createListImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { listId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([listId], ["List Id"]);

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //   if (serviceManufacturerId) {
      //     if (serviceManufacturerId.trim() === "") {
      //       serviceManufacturerId = undefined;
      //     }
      //   } else {
      //     serviceManufacturerId = undefined;
      //   }

      //   if (serviceModelId) {
      //     if (serviceModelId.trim() === "") {
      //       serviceModelId = undefined;
      //     }
      //   } else {
      //     serviceModelId = undefined;
      //   }

      //get user name for slugify
      //   const user = await tx.inspectionUser.findFirst({
      //     where: { id: req.user.parentId ? req.user.parentId : req.user.id },
      //   });

      //   if (!user)
      //     return res
      //       .status(404)
      //       .json(jsonResponse(false, "This user does not exist", null));

      //check if brand exists
      // const productImage = await tx.productImage.findFirst({
      //   where: {
      //     productId: productId,
      //   },
      // });

      //upload image
      // const imageUpload = await uploadImage(req.file);
      await uploadToCLoudinary(req.file, module_name, async (error, result) => {
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

        //create brand
        const newProductImage = await prisma.listImage.create({
          data: {
            listId,
            image: result.secure_url,
          },
        });

        if (newProductImage) {
          return res
            .status(200)
            .json(
              jsonResponse(
                true,
                "List image has been uploaded",
                newProductImage
              )
            );
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const createVisitor = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { placeId, userId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([placeId], ["Place"]);

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

      const newReview = await prisma.placeVisitor.create({
        data: {
          placeId,
          userId: req.user.id ?? userId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have visited this place", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deleteVisitor = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { placeId, userId } = req.body;

      const review = await tx.placeVisitor.delete({
        where: { userId: req.user.id ?? userId, placeId: placeId },
      });

      if (review) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${category.image.split("/")[2]}`
        // );
        // await deleteFromCloudinary(banner.image, async (error, result) => {
        //   console.log("error", error);
        //   console.log("result", result);
        // });

        return res
          .status(200)
          .json(jsonResponse(true, `You have not visited this place`, review));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Status has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const createPlaceFollower = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { placeId, userId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([placeId], ["Place"]);

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

      const newReview = await prisma.placeFollower.create({
        data: {
          placeId,
          userId: req.user.id ?? userId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have followed this place", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePlaceFollower = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { placeId, userId } = req.body;

      const review = await tx.placeFollower.delete({
        where: { userId: req.user.id ?? userId, placeId: placeId },
      });

      if (review) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${category.image.split("/")[2]}`
        // );
        // await deleteFromCloudinary(banner.image, async (error, result) => {
        //   console.log("error", error);
        //   console.log("result", result);
        // });

        return res
          .status(200)
          .json(jsonResponse(true, `You have unfollowed this place`, review));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Status has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const createListLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { listId, userId, parentUserId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([listId], ["List"]);

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

      const newReview = await prisma.listLike.create({
        data: {
          listId,
          userId: userId,
          parentUserId: parentUserId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have liked this list", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deleteListLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { bucketListId, userId, parentUserId } = req.body;

      const review = await tx.listLike.delete({
        where: { userId: userId, bucketListId: bucketListId, parentUserId },
      });

      if (review) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${category.image.split("/")[2]}`
        // );
        // await deleteFromCloudinary(banner.image, async (error, result) => {
        //   console.log("error", error);
        //   console.log("result", result);
        // });

        return res
          .status(200)
          .json(
            jsonResponse(true, `You have removed like from this list`, review)
          );
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Status has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const createListReview = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { listId, userId, rating, comment } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput(
        [listId, rating],
        ["List", "Rating"]
      );

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

      const newReview = await prisma.listReview.create({
        data: {
          listId,
          userId: userId,
          rating,
          comment,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have reviewed this list", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deleteListReview = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      //   let { listId, userId } = req.body;

      const review = await tx.listReview.delete({
        where: { id: req.params.id },
      });

      if (review) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${category.image.split("/")[2]}`
        // );
        // await deleteFromCloudinary(banner.image, async (error, result) => {
        //   console.log("error", error);
        //   console.log("result", result);
        // });

        return res
          .status(200)
          .json(jsonResponse(true, `You have deleted review`, review));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Status has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const getPlaceReviews = async (req, res) => {
  try {
    const products = await prisma.placeReview.findMany({
      where: {
        isActive: true,
        // AND: [
        //   {
        //     name: {
        //       contains: req.query.name,
        //       mode: "insensitive",
        //     },
        //   },
        // ],
      },
      include: {
        place: true,
        user: true,
        like: true,
        reply: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No place review is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} place reviews found`, products)
        );
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

export const createPlaceReviewLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { reviewId, parentUserId, userId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([reviewId], ["Review"]);

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

      const newReview = await prisma.placeReviewLike.create({
        data: {
          reviewId,
          userId: userId,
          parentUserId: parentUserId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have liked this review", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePlaceReviewLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { reviewId, userId, parentUserId } = req.body;

      const review = await tx.placeReview.delete({
        where: { id: req.params.id },
      });

      if (review) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${category.image.split("/")[2]}`
        // );
        // await deleteFromCloudinary(banner.image, async (error, result) => {
        //   console.log("error", error);
        //   console.log("result", result);
        // });

        return res
          .status(200)
          .json(jsonResponse(true, `You have removed like`, review));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Status has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const getPopularPlaces = async (req, res) => {
  try {
    const products = await prisma.place.findMany({
      where: {
        isActive: true,
        // AND: [
        //   {
        //     name: {
        //       contains: req.query.name,
        //       mode: "insensitive",
        //     },
        //   },
        // ],
      },
      include: {
        place: true,
        user: true,
        like: true,
        reply: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No popular place is available", null));

    // let popularPlaces = [];

    const sortedPopularPlaces = products.sort((a, b) => {
      const totalA = a.like.length + a.review.length;
      const totalB = b.like.length + b.review.length;
      return totalB - totalA; // descending order
    });

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(
            true,
            `${sortedPopularPlaces.length} popular places found`,
            sortedPopularPlaces
          )
        );
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

export const getPopularPlaceReviews = async (req, res) => {
  try {
    const products = await prisma.placeReview.findMany({
      where: {
        isActive: true,
        // AND: [
        //   {
        //     name: {
        //       contains: req.query.name,
        //       mode: "insensitive",
        //     },
        //   },
        // ],
      },
      include: {
        place: true,
        user: true,
        like: true,
        reply: true,
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

    if (products.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No popular review is available", null));

    const sortedPopularReviews = products.sort((a, b) => {
      const totalA = a.like.length;
      const totalB = b.like.length;
      return totalB - totalA; // descending order
    });

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(
            true,
            `${sortedPopularReviews.length} popular reviews found`,
            sortedPopularReviews
          )
        );
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
