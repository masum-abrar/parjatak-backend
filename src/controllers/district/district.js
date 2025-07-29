import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary.js";
import sendEmail from "../../utils/emailService.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import slugify from "../../utils/slugify.js";
import uploadToCLoudinary from "../../utils/uploadToCloudinary.js";
import validateInput from "../../utils/validateInput.js";

const module_name = "district";

//create product
export const createDistrict = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { name, divisionId, isActive } = req.body;

      //validate input
      const inputValidation = validateInput(
        [name, divisionId],
        ["Name", "Division"]
      );

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
      const product = await tx.district.findFirst({
        where: {
          //   userId: req.user.parentId ? req.user.parentId : req.user.id,
          name: name,
          isActive: true,
        },
      });

      if (product && product.slug === `${slugify(req.body.name)}`)
        return res
          .status(409)
          .json(
            jsonResponse(
              false,
              `${req.body.name} already exists. Change its name.`,
              null
            )
          );

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
        let newProduct = await prisma.district.create({
          data: {
            // userId: req.user.parentId ? req.user.parentId : req.user.id,
            divisionId: divisionId,
            name: name,
            isActive: isActive === "true" ? true : false,
            slug: `${slugify(req.body.name)}`,
            // productAttributes: {
            //   create: newProductAttributes,
            // },
          },
        });

        if (!newProduct) {
          return res
            .status(200)
            .json(
              jsonResponse(false, `${req.body.name} cannot be created`, null)
            );
        }

        // newProducts.push(newProduct);
        // }

        if (newProduct) {
          return res
            .status(200)
            .json(jsonResponse(true, "Community has been created", newProduct));
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
            let newProduct = await prisma.district.create({
              data: {
                // userId: req.user.parentId ? req.user.parentId : req.user.id,
                divisionId: divisionId,
                name: name,
                isActive: isActive === "true" ? true : false,
                // createdBy: req.user.id,
                slug: `${slugify(req.body.name)}`,
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
                    `${req.body.name} cannot be created`,
                    null
                  )
                );
            }

            // newProducts.push(newProduct);
            // }

            if (newProduct) {
              return res
                .status(200)
                .json(
                  jsonResponse(true, "Community has been created", newProduct)
                );
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
export const getDistricts = async (req, res) => {
  if (req.user.roleName !== "super-admin") {
    getProductsByUser(req, res);
  } else {
    try {
      const products = await prisma.district.findMany({
        where: {
          //   isActive: true,
          AND: [
            {
              name: {
                contains: req.query.name,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          user: true,
          division: true,
          follower: true,
          subdistrict: true,
          images: true,
          place: true,
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
          .json(jsonResponse(true, "No community is available", null));

      if (products) {
        return res
          .status(200)
          .json(
            jsonResponse(true, `${products.length} communities found`, products)
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
export const getDistrict = async (req, res) => {
  try {
    const product = await prisma.district.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        user: true,
        division: true,
        follower: true,
        subdistrict: true,
        images: true,
        place: true,
        post: true,
      },
    });

    if (product) {
      return res
        .status(200)
        .json(jsonResponse(true, `1 community found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No community is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update product
export const updateDistrict = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { divisionId, name, isActive } = req.body;

      //validate input
      const inputValidation = validateInput(
        [name, divisionId],
        ["Name", "Division"]
      );

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //get user id from product and user name from user for slugify
      const findProduct = await tx.district.findFirst({
        where: { id: req.params.id },
      });

      if (!findProduct)
        return res
          .status(404)
          .json(jsonResponse(false, "This community does not exist", null));

      //   const user = await tx.user.findFirst({
      //     where: { id: findProduct.userId },
      //   });

      //   if (!user)
      //     return res
      //       .status(404)
      //       .json(jsonResponse(false, "This user does not exist", null));

      //check if slug already exists
      if (name) {
        if (name !== findProduct.name) {
          const existingProduct = await tx.district.findFirst({
            where: {
              //   userId: req.user.parentId ? req.user.parentId : req.user.id,
              name: name,
              isActive: true,
            },
          });

          if (existingProduct && existingProduct.slug === `${slugify(name)}`) {
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
      const product = await tx.district.update({
        where: { id: req.params.id },
        data: {
          //   userId: req.user.parentId ? req.user.parentId : req.user.id,
          divisionId,
          name,
          isActive: isActive === "true" ? true : false,
          slug: name ? `${slugify(name)}` : findProduct.slug,
        },
      });

      if (product) {
        if (req.files) {
          //for inserting new images to a particular product

          //max 3 image
          const productImages = await tx.districtImage.findMany({
            where: { districtId: req.params.id },
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
                    await prisma.districtImage.create({
                      data: {
                        districtId: req.params.id,
                        image: newImages[i],
                      },
                    });
                  }
                }
                return res
                  .status(200)
                  .json(
                    jsonResponse(true, `Community has been updated`, product)
                  );
              }
            }
          );
        } else {
          return res
            .status(200)
            .json(jsonResponse(true, `Community has been updated`, product));
        }
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Community has not been updated", null));
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
export const updateDistrictImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { image } = req.body;

      const findProductImage = await tx.districtImage.findFirst({
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
        const productImage = await prisma.districtImage.update({
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
              jsonResponse(
                true,
                `Community image has been updated`,
                productImage
              )
            );
        } else {
          return res
            .status(404)
            .json(
              jsonResponse(false, "Community image has not been updated", null)
            );
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete product image
export const deleteDistrictImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const productImage = await tx.districtImage.delete({
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
            jsonResponse(true, `Community image has been deleted`, productImage)
          );
      } else {
        return res
          .status(404)
          .json(
            jsonResponse(false, "Community image has not been deleted", null)
          );
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
export const deleteDistrict = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.district.delete({
        where: { id: req.params.id },
        // data: { deletedBy: req.user.id, isDeleted: true },
      });

      if (product) {
        const productImage = await prisma.districtImage.findMany({
          where: { districtId: req.params.id },
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
          .json(jsonResponse(true, `Community has been deleted`, product));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Community has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//For Customer
//get all products
export const getDistrictsForCustomer = async (req, res) => {
  try {
    const products = await prisma.district.findMany({
      where: {
        isActive: true,
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        user: true,
        division: true,
        follower: true,
        subdistrict: true,
        images: true,
        place: { include: { images: true } },
        post: { include: { images: true } },
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
        .json(jsonResponse(true, "No community is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} communities found`, products)
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

export const getDistrictByDivisionIdForCustomer = async (req, res) => {
  try {
    const products = await prisma.district.findMany({
      where: {
        isActive: true,
        divisionId: req.params.id,
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        user: true,
        division: true,
        follower: true,
        subdistrict: true,
        images: true,
        place: { include: { images: true } },
        post: { include: { images: true } },
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
        .json(jsonResponse(true, "No community is available", null));

    if (products) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${products.length} communities found`, products)
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
export const getDistrictForCustomer = async (req, res) => {
  try {
    const product = await prisma.district.findFirst({
      where: {
        slug: req.params.slug,
        isActive: true,
      },
      select: {
        id: true,
        divisionId: true,
        name: true,
        viewCount: true,
        user: {
          select: { id: true, name: true, fullname: true, image: true },
        },
        division: { select: { id: true, name: true } },
        follower: {
          select: {
            id: true,
            user: {
              select: { id: true, name: true, fullname: true, image: true },
            },
          },
        },
        // subdistrict: true,
        images: true,
      },
    });

    if (product) {
      const productUpdate = await prisma.district.update({
        where: {
          id: product?.id,
        },
        data: {
          viewCount: product?.viewCount + 1,
        },
      });

      return res
        .status(200)
        .json(jsonResponse(true, `1 community found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No community is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const getDistrictPostDiscussionForCustomer = async (req, res) => {
  try {
    const product = await prisma.post.findMany({
      where: {
        districtId: req.params.id,
        type: "discussion",
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        districtId: true,
        placeId: true,
        title: true,
        type: true,
        eventStartDate: true,
        evenetEndDate: true,
        description: true,
        createdAt: true,
        images: { select: { image: true } },
        user: {
          select: { id: true, name: true, fullname: true, image: true },
        },
        like: {
          select: {
            id: true,
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
          },
        },
        comment: {
          select: {
            id: true,
            comment: true,
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            like: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
                parentUser: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
              },
            },
            reply: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
                parentUser: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        postCommentLike: {
          select: {
            id: true,
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
          },
        },
        postCommentReply: {
          select: {
            id: true,
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
          },
        },
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

    if (product) {
      // const productUpdate = await prisma.district.update({
      //   where: {
      //     id: product?.id,
      //   },
      //   data: {
      //     viewCount: product?.viewCount + 1,
      //   },
      // });

      return res
        .status(200)
        .json(jsonResponse(true, `${product?.length} posts found`, product));
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

export const getDistrictPostEventForCustomer = async (req, res) => {
  try {
    const product = await prisma.post.findMany({
      where: {
        districtId: req.params.id,
        type: "event",
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        districtId: true,
        placeId: true,
        title: true,
        type: true,
        eventStartDate: true,
        evenetEndDate: true,
        description: true,
        createdAt: true,
        images: { select: { image: true } },
        user: {
          select: { id: true, name: true, fullname: true, image: true },
        },
        like: {
          select: {
            id: true,
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
          },
        },
        comment: {
          select: {
            id: true,
            comment: true,
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            like: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
                parentUser: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
              },
            },
            reply: {
              include: {
                user: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
                parentUser: {
                  select: {
                    name: true,
                    id: true,
                    fullname: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        postCommentLike: {
          select: {
            id: true,
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
          },
        },
        postCommentReply: {
          select: {
            id: true,
            user: {
              select: { name: true, id: true, fullname: true, image: true },
            },
            parentUser: {
              select: { name: true, id: true, fullname: true, image: true },
            },
          },
        },
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

    if (product) {
      // const productUpdate = await prisma.district.update({
      //   where: {
      //     id: product?.id,
      //   },
      //   data: {
      //     viewCount: product?.viewCount + 1,
      //   },
      // });

      return res
        .status(200)
        .json(jsonResponse(true, `${product?.length} posts found`, product));
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

export const getDistrictPlacesForCustomer = async (req, res) => {
  try {
    const product = await prisma.place.findMany({
      where: {
        districtId: req.params.id,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        districtId: true,
        images: { select: { image: true } },
        description: true,
        address: true,
        name: true,
        priceRange: true,
        slug: true,
        category: { select: { name: true } },
        user: {
          select: { id: true, name: true, fullname: true, image: true },
        },
        review: { select: { rating: true } },
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

    if (product) {
      // const productUpdate = await prisma.district.update({
      //   where: {
      //     id: product?.id,
      //   },
      //   data: {
      //     viewCount: product?.viewCount + 1,
      //   },
      // });

      return res
        .status(200)
        .json(jsonResponse(true, `${product?.length} places found`, product));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No place is available", null));
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
export const getDistrictImages = async (req, res) => {
  // if (req.user.roleName !== "super-admin") {
  //   getProductsByUser(req, res);
  // } else {
  try {
    const products = await prisma.districtImage.findMany({
      where: {
        districtId: req.params.id,
        // isDeleted: false,
        // isActive: true,
      },
      include: {
        district: true,
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
export const createDistrictImage = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { districtId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([districtId], ["District Id"]);

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
        const newProductImage = await prisma.districtImage.create({
          data: {
            districtId,
            image: result.secure_url,
          },
        });

        if (newProductImage) {
          return res
            .status(200)
            .json(
              jsonResponse(
                true,
                "Community image has been uploaded",
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

export const createDistrictFollower = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { districtId, userId } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([districtId], ["District"]);

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

      const newReview = await prisma.districtFollower.create({
        data: {
          districtId,
          userId: userId,
        },
      });

      if (newReview) {
        return res
          .status(200)
          .json(
            jsonResponse(true, "You have followed this community", newReview)
          );
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

export const deleteDistrictFollower = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { districtId, userId } = req.body;

      const disRes = await tx.districtFollower.findFirst({
        where: { userId: userId, districtId: districtId },
      });

      if (disRes) {
        const review = await tx.districtFollower.delete({
          where: { id: disRes?.id },
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
              jsonResponse(true, `You have unfollowed this community`, review)
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
