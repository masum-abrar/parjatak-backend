import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary.js";
import sendEmail from "../../utils/emailService.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import slugify from "../../utils/slugify.js";
import uploadToCLoudinary from "../../utils/uploadToCloudinary.js";
import validateInput from "../../utils/validateInput.js";

const module_name = "post";

//create product
export const createPost = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const {
        divisionId,
        districtId,
        placeId,
        title,
        description,
        type,
        eventStartDate,
        eventEndDate,
        isActive,
        userId,
      } = req.body;

      //validate input
      const inputValidation = validateInput([title, type], ["Title", "Type"]);

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //check image limit
      if (req.files) {
        if (req.files.length > 7) {
          return res
            .status(404)
            .json(
              jsonResponse(false, "You cannot add more than 7 images", null)
            );
        }
      }

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
      // const product = await tx.post.findFirst({
      //   where: {
      //     //   userId: req.user.parentId ? req.user.parentId : req.user.id,
      //     title: title,
      //     isActive: true,
      //   },
      // });

      // if (product && product.slug === `${slugify(req.body.title)}`)
      //   return res
      //     .status(409)
      //     .json(
      //       jsonResponse(
      //         false,
      //         `${req.body.title} already exists. Change its name.`,
      //         null
      //       )
      //     );

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
        let newProduct = await prisma.post.create({
          data: {
            // userId: req?.user?.parentId ? req.user.parentId : req.user.id,
            userId,
            divisionId: divisionId,
            districtId: districtId,
            placeId: placeId,
            title: title,
            description: description,
            eventStartDate,
            evenetEndDate: eventEndDate,
            type,
            isActive: isActive === "true" ? true : false,
            slug: `${slugify(req.body.title)}`,
            // productAttributes: {
            //   create: newProductAttributes,
            // },
          },
        });

        if (!newProduct) {
          return res
            .status(200)
            .json(
              jsonResponse(false, `${req.body.title} cannot be created`, null)
            );
        }

        // newProducts.push(newProduct);
        // }

        if (newProduct) {
          return res
            .status(200)
            .json(jsonResponse(true, "Post has been created", newProduct));
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
            let newProduct = await prisma.post.create({
              data: {
                // userId: req.user.parentId ? req.user.parentId : req.user.id,
                userId,
                divisionId: divisionId,
                districtId: districtId,
                placeId: placeId,
                title: title,
                description: description,
                eventStartDate,
                evenetEndDate: eventEndDate,
                type,
                isActive: isActive === "true" ? true : false,
                slug: `${slugify(title)}`,
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
                .json(jsonResponse(true, "Post has been created", newProduct));
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
export const getPosts = async (req, res) => {
  // if (req.user.roleName !== "super-admin") {
  //   getProductsByUser(req, res);
  // }
  // else {
  try {
    const products = await prisma.post.findMany({
      where: {
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
        district: true,
        division: true,
        place: true,
        subdistrict: true,
        images: true,
        user: true,
        like: true,
        comment: true,
        postCommentLike: true,
        postCommentReply: true,
        postCommentReplyLike: true,
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
        .json(jsonResponse(true, "No post is available", null));

    if (products) {
      return res
        .status(200)
        .json(jsonResponse(true, `${products.length} posts found`, products));
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

//get all products by user
export const getProductsByUser = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.user.parentId ? req.user.parentId : req.user.id,
        isDeleted: false,
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
      include: {
        user: true,
        category: true,
        brand: true,
        campaign: true,
        supplier: true,
        images: true,
        productAttributes: true,
        subcategory: true,
        subsubcategory: true,
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
        .json(jsonResponse(true, "No product is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} products found`, products)
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

//get single product
export const getPost = async (req, res) => {
  try {
    const product = await prisma.post.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        district: true,
        division: true,
        place: true,
        subdistrict: true,
        images: true,
        user: true,
        like: true,
        comment: true,
        postCommentLike: true,
        postCommentReply: true,
        postCommentReplyLike: true,
      },
    });

    if (product) {
      return res.status(200).json(jsonResponse(true, `1 post found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No post is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update product
export const updatePost = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const {
        divisionId,
        districtId,
        placeId,
        title,
        description,
        type,
        eventStartDate,
        eventEndDate,
        isActive,
      } = req.body;

      //validate input
      const inputValidation = validateInput([title], ["Title"]);

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //get user id from product and user name from user for slugify
      const findProduct = await tx.post.findFirst({
        where: { id: req.params.id },
      });

      if (!findProduct)
        return res
          .status(404)
          .json(jsonResponse(false, "This post does not exist", null));

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
          const existingProduct = await tx.post.findFirst({
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
                  `${name} already exists. Change its name.`,
                  null
                )
              );
          }
        }
      }

      //update product
      const product = await tx.post.update({
        where: { id: req.params.id },
        data: {
          //   userId: req.user.parentId ? req.user.parentId : req.user.id,
          divisionId: divisionId,
          districtId: districtId,
          placeId: placeId,
          title: title,
          description: description,
          eventStartDate,
          evenetEndDate: eventEndDate,
          type,
          isActive: isActive === "true" ? true : false,
          slug: title ? `${slugify(title)}` : findProduct.slug,
        },
      });

      if (product) {
        if (req.files) {
          //for inserting new images to a particular product

          //max 3 image
          const productImages = await tx.postImage.findMany({
            where: { postId: req.params.id },
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
                    await prisma.postImage.create({
                      data: {
                        postId: req.params.id,
                        image: newImages[i],
                      },
                    });
                  }
                }
                return res
                  .status(200)
                  .json(jsonResponse(true, `Post has been updated`, product));
              }
            }
          );
        } else {
          return res
            .status(200)
            .json(jsonResponse(true, `Post has been updated`, product));
        }
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Post has not been updated", null));
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
export const updatePostImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { image } = req.body;

      const findProductImage = await tx.postImage.findFirst({
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
        const productImage = await prisma.postImage.update({
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
              jsonResponse(true, `Post image has been updated`, productImage)
            );
        } else {
          return res
            .status(404)
            .json(jsonResponse(false, "Post image has not been updated", null));
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete product image
export const deletePostImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const productImage = await tx.postImage.delete({
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
            jsonResponse(true, `Post image has been deleted`, productImage)
          );
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Post image has not been deleted", null));
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
export const deletePost = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.post.delete({
        where: { id: req.params.id },
        // data: { deletedBy: req.user.id, isDeleted: true },
      });

      if (product) {
        const productImage = await prisma.postImage.findMany({
          where: { postId: req.params.id },
        });

        const productImageLength = productImage.length;

        //delete images from folder
        if (productImage) {
          for (let i = 0; i < productImageLength; i++) {
            // fs.unlinkSync(
            //   `public\\images\\${module_name}\\${
            //     productImage[i].image.split("/")[2]
            //   }`
            // );
            await deleteFromCloudinary(
              productImage[i].image,
              async (error, result) => {
                console.log("error", error);
                console.log("result", result);
              }
            );
          }
        }
        return res
          .status(200)
          .json(jsonResponse(true, `Post has been deleted`, product));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Post has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//For Customer
//get all products
export const getPostsForCustomer = async (req, res) => {
  try {
    const products = await prisma.post.findMany({
      where: {
        isActive: true,
        AND: [
          {
            title: {
              contains: req.query.title,
              mode: "insensitive",
            },
          },
          {
            divisionId: {
              contains: req.query.divisionId,
              mode: "insensitive",
            },
          },
          {
            districtId: {
              contains: req.query.districtId,
              mode: "insensitive",
            },
          },
          {
            placeId: {
              contains: req.query.placeId,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        district: true,
        division: true,
        place: true,
        subdistrict: true,
        images: true,
        user: true,
        like: true,
        comment: true,
        postCommentLike: true,
        postCommentReply: true,
        postCommentReplyLike: true,
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
        .json(jsonResponse(true, "No post is available", null));

    if (products) {
      return res
        .status(200)
        .json(jsonResponse(true, `${products.length} posts found`, products));
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
export const getPostForCustomer = async (req, res) => {
  try {
    const product = await prisma.post.findFirst({
      where: {
        slug: req.params.slug,
        isActive: true,
      },
      include: {
        district: true,
        division: true,
        place: true,
        subdistrict: true,
        images: true,
        user: true,
        like: true,
        comment: true,
        postCommentLike: true,
        postCommentReply: true,
        postCommentReplyLike: true,
      },
    });

    if (product) {
      const productUpdate = await prisma.post.update({
        where: {
          id: product?.id,
        },
        data: {
          viewCount: product?.viewCount + 1,
        },
      });

      return res.status(200).json(jsonResponse(true, `1 post found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No post is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const getPostForCustomerByPostId = async (req, res) => {
  try {
    const product = await prisma.post.findFirst({
      where: {
        id: req.params.id,
        isActive: true,
      },
      include: {
        district: { select: { name: true } },
        division: { select: { name: true } },
        place: { select: { name: true } },
        subdistrict: true,
        images: { select: { image: true } },
        user: {
          select: { name: true, image: true, address: true, city: true },
        },
        like: {
          select: {
            id: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        comment: {
          select: {
            comment: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        postCommentLike: {
          select: {
            id: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        postCommentReply: {
          select: {
            reply: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        postCommentReplyLike: {
          select: {
            id: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    // console.log({ product });

    if (product) {
      const productUpdate = await prisma.post.update({
        where: {
          id: product?.id,
        },
        data: {
          viewCount: product?.viewCount + 1,
        },
      });

      return res.status(200).json(jsonResponse(true, `1 post found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No post is available", null));
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
export const getPostImages = async (req, res) => {
  // if (req.user.roleName !== "super-admin") {
  //   getProductsByUser(req, res);
  // } else {
  try {
    const products = await prisma.postImage.findMany({
      where: {
        postId: req.params.id,
        // isDeleted: false,
        // isActive: true,
      },
      include: {
        post: true,
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
export const createPostImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([placeId], ["Post Id"]);

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
        const newProductImage = await prisma.postImage.create({
          data: {
            postId,
            image: result.secure_url,
          },
        });

        if (newProductImage) {
          return res
            .status(200)
            .json(
              jsonResponse(
                true,
                "Post image has been uploaded",
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

export const createPostLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, parentUserId, userId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([postId], ["Post"]);

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

      const newReview = await prisma.postLike.create({
        data: {
          postId,
          parentUserId,
          userId: userId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have liked this post", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePostLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, parentUserId, userId } = req.body;

      const postLikeRes = await tx.postLike.findFirst({
        where: { userId: userId, postId: postId },
      });

      console.log({ postLikeRes });

      if (postLikeRes) {
        const review = await tx.postLike.delete({
          where: { id: postLikeRes?.id },
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
              jsonResponse(true, `You have removed like from this post`, review)
            );
        } else {
          return res
            .status(404)
            .json(jsonResponse(false, "Status has not been updated", null));
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const createPostComment = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, parentUserId, userId, comment } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput(
        [postId, comment],
        ["Post", "Comment"]
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

      const newReview = await prisma.postComment.create({
        data: {
          postId,
          parentUserId,
          userId: userId,
          comment: comment,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(
            jsonResponse(true, "You have commented on this post", newReview)
          );
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePostComment = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, parentUserId, userId } = req.body;

      const review = await tx.postComment.delete({
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
          .json(
            jsonResponse(
              true,
              `You have removed comment from this post`,
              review
            )
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

export const createPostCommentLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, postCommentId, parentUserId, userId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput(
        [postId, postCommentId],
        ["Post", "Post Comment"]
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

      const newReview = await prisma.postCommentLike.create({
        data: {
          postId,
          postCommentId,
          parentUserId,
          userId: userId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have liked this comment", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePostCommentLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, postCommentId, parentUserId, userId } = req.body;

      const review = await tx.postComment.delete({
        where: { postId: postId, postCommentId, parentUserId, userId },
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
            jsonResponse(
              true,
              `You have removed like from this comment`,
              review
            )
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

export const createPostCommentReply = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, postCommentId, parentUserId, userId, reply } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput(
        [postId, postCommentId, reply],
        ["Post", "Post Comment", "Reply"]
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

      const newReview = await prisma.postCommentReply.create({
        data: {
          postId,
          postCommentId,
          parentUserId,
          userId: userId,
          reply,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(
            jsonResponse(true, "You have replied to this comment", newReview)
          );
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePostCommentReply = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, postCommentId, parentUserId, userId } = req.body;

      const review = await tx.postCommentReply.delete({
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
          .json(
            jsonResponse(
              true,
              `You have removed reply from this comment`,
              review
            )
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

export const createPostCommentReplyLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, postCommentId, postCommentReplyId, parentUserId, userId } =
        req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput(
        [postId, postCommentId, postCommentReplyId],
        ["Post", "Post Comment", "Comment Reply"]
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

      const newReview = await prisma.postCommentReplyLike.create({
        data: {
          postId,
          postCommentId,
          postCommentReplyId,
          parentUserId,
          userId: userId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(jsonResponse(true, "You have liked this reply", newReview));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deletePostCommentReplyLike = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { postId, postCommentId, postCommentReplyId, parentUserId, userId } =
        req.body;

      const review = await tx.postCommentReply.delete({
        where: {
          postId,
          postCommentId,
          postCommentReplyId,
          parentUserId,
          userId,
        },
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
            jsonResponse(true, `You have removed like from this reply`, review)
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

export const getPostComments = async (req, res) => {
  try {
    const products = await prisma.postComment.findMany({
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
        post: true,
        parentUser: true,
        user: true,
        like: true,
        reply: true,
        postCommentReplyLike: true,
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
        .json(jsonResponse(true, "No post comment is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} post comments found`, products)
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

export const getNewPostsFromFriends = async (req, res) => {
  try {
    const users = await prisma.user.findFirst({
      where: { id: req.query.userId },
      include: {
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
        // diary: true,
        // bucketList: true,
        // parentUserBucketListLike: true,
        // userBucketListLike: true,
        follower: true,
        following: true,
      },
    });

    const products = await prisma.post.findMany({
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
        // division: true,
        district: { select: { name: true } },
        // place: true,
        user: { select: { id: true, name: true, image: true } },
        images: true,
        like: {
          select: {
            id: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        comment: { select: { id: true, comment: true } },
        // postCommentLike: true,
        // postCommentReply: true,
        // postCommentReplyLike: true,
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
        .json(jsonResponse(true, "No post from friend is available", null));

    // Step 1: Get a list of followed userIds
    const followingIds = users?.following
      ?.filter((fol) => fol?.parentUserId == req.query.userId)
      ?.map((f) => f?.userId);

    // Step 2: Filter posts where post.userId is in followingIds
    const followingPosts = products.filter((post) =>
      followingIds.includes(post.userId)
    );

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(
            true,
            `${followingPosts.length} posts from friends found`,
            followingPosts
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

export const getNewPostsFromUsers = async (req, res) => {
  try {
    const users = await prisma.user.findFirst({
      where: { id: req.query.userId },
      include: {
        disctrict: { select: { id: true, name: true } },
        // districtFollower: true,
        place: { select: { id: true, name: true } },
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
        // diary: true,
        // bucketList: true,
        // parentUserBucketListLike: true,
        // userBucketListLike: true,
        // follower: true,
        // following: true,
      },
    });

    const products = await prisma.post.findMany({
      where: {
        isActive: true,
        districtId: users?.districtId,
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
        division: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, fullname: true, image: true } },
        images: { select: { id: true, image: true } },
        like: {
          select: {
            id: true,
            user: {
              select: { id: true, name: true, fullname: true, image: true },
            },
          },
        },
        comment: { select: { id: true } },
        // postCommentLike: {select: {}},
        // postCommentReply: true,
        // postCommentReplyLike: true,
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
        .json(jsonResponse(true, "No new post is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} new posts found`, products)
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
