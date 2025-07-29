import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import deleteFromCloudinary from "../../utils/deleteFromCloudinary.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import slugify from "../../utils/slugify.js";
import uploadToCLoudinary from "../../utils/uploadToCloudinary.js";
import validateInput from "../../utils/validateInput.js";
// import uploadImage from "../../utils/uploadImage.js";

const module_name = "division";

//create division
export const createDivision = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { name, isActive } = req.body;

      //   console.log(req.body);

      //validate input
      const inputValidation = validateInput([name], ["Name"]);

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

      //check if banner exists
      const division = await tx.division.findFirst({
        where: {
          name: name,
        },
      });

      if (
        division &&
        division?.name?.toLowerCase()?.trim() ===
          division?.toLowerCase()?.trim()
      )
        return res
          .status(409)
          .json(jsonResponse(false, `${division} already exists.`, null));

      //if there is no image selected
      if (!req.file) {
        // return res
        //   .status(400)
        //   .json(jsonResponse(false, "Please select an image", null));
        //create brand
        const newDivision = await prisma.division.create({
          data: {
            name,
            isActive: isActive === "true" ? true : false,
            slug: `${slugify(name)}`,
          },
        });

        if (newDivision) {
          return res
            .status(200)
            .json(jsonResponse(true, "Division has been created", newDivision));
        }
      }

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

        //create banner
        const newDivision = await prisma.division.create({
          data: {
            name,
            isActive: isActive === "true" ? true : false,
            image: result.secure_url,
            slug: `${slugify(name)}`,
          },
        });

        if (newDivision) {
          return res
            .status(200)
            .json(jsonResponse(true, "Division has been created", newDivision));
        }
      });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get all banners
export const getDivisions = async (req, res) => {
  //   if (req.user.roleName !== "super-admin") {
  //     getCategoriesByUser(req, res);
  //   } else {
  try {
    const divisions = await prisma.division.findMany({
      where: {
        AND: [
          {
            name: {
              contains: req.query.name,
              mode: "insensitive",
            },
          },
        ],
      },
      //   include: {
      //     serviceItem: true,
      //     serviceManufacturer: true,
      //     serviceModel: true,
      //   },
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

    if (divisions.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No division is available", null));

    if (divisions) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${divisions.length} divisions found`, divisions)
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
  //   }
};

//get all manufacturers by user
// export const getManufacturersByUser = async (req, res) => {
//   try {
//     const categories = await prisma.category.findMany({
//       where: {
//         userId: req.user.parentId ? req.user.parentId : req.user.id,
//         isDeleted: false,
//         AND: [
//           {
//             name: {
//               contains: req.query.name,
//               mode: "insensitive",
//             },
//           },
//         ],
//       },
//       include: { user: true },
//       orderBy: {
//         createdAt: "desc",
//       },
//       skip:
//         req.query.limit && req.query.page
//           ? parseInt(req.query.limit * (req.query.page - 1))
//           : parseInt(defaultLimit() * (defaultPage() - 1)),
//       take: req.query.limit
//         ? parseInt(req.query.limit)
//         : parseInt(defaultLimit()),
//     });

//     if (categories.length === 0)
//       return res
//         .status(200)
//         .json(jsonResponse(true, "No category is available", null));

//     if (categories) {
//       return res
//         .status(200)
//         .json(
//           jsonResponse(
//             true,
//             `${categories.length} categories found`,
//             categories
//           )
//         );
//     } else {
//       return res
//         .status(404)
//         .json(jsonResponse(false, "Something went wrong. Try again", null));
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json(jsonResponse(false, error, null));
//   }
// };

//get single banner
export const getDivision = async (req, res) => {
  try {
    const division = await prisma.division.findFirst({
      //   where: { slug: req.params.slug },
      where: { id: req.params.id },
      //   include: {
      //     serviceItem: true,
      //     serviceManufacturer: true,
      //     serviceModel: true,
      //   },
    });

    if (division) {
      return res
        .status(200)
        .json(jsonResponse(true, `1 division found`, division));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No division is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update banner
export const updateDivision = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      let { name, isActive } = req.body;

      //validate input
      const inputValidation = validateInput([name], ["Name"]);

      if (inputValidation) {
        return res.status(400).json(jsonResponse(false, inputValidation, null));
      }

      //   if (serviceManufacturerId) {
      //     if (
      //       serviceManufacturerId.trim() === "" ||
      //       serviceManufacturerId === "null"
      //     ) {
      //       serviceManufacturerId = undefined;
      //     }
      //   } else {
      //     serviceManufacturerId = undefined;
      //   }

      //   if (serviceModelId) {
      //     if (serviceModelId.trim() === "" || serviceModelId === "null") {
      //       serviceModelId = undefined;
      //     }
      //   } else {
      //     serviceModelId = undefined;
      //   }

      //get user id from brand and user name from user for slugify
      const findDivision = await tx.division.findFirst({
        where: { id: req.params.id },
      });

      if (!findDivision)
        return res
          .status(404)
          .json(jsonResponse(false, "This division does not exist", null));

      //   const user = await tx.user.findFirst({
      //     where: { id: findCategory.userId },
      //   });

      //   if (!user)
      //     return res
      //       .status(404)
      //       .json(jsonResponse(false, "This user does not exist", null));

      //check if slug already exists
      if (name) {
        if (
          name?.toLowerCase()?.trim() !==
          findDivision?.name?.toLowerCase()?.trim()
        ) {
          const existingDivision = await tx.division.findFirst({
            where: {
              id: req.params.id,
            },
          });

          //   if (existingBanner && existingBanner.slug === `${slugify(name)}`) {
          if (
            existingDivision &&
            existingDivision.name?.toLowerCase()?.trim() ===
              name?.toLowerCase()?.trim()
          ) {
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

      //upload image
      // let imageUpload;
      if (req.file) {
        // imageUpload = await uploadImage(req.file);
        await uploadToCLoudinary(
          req.file,
          module_name,
          async (error, result) => {
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
            const division = await prisma.division.update({
              where: { id: req.params.id },
              data: {
                name,
                isActive: isActive === "true" ? true : false,
                image: result.secure_url,
                slug: name ? `${slugify(name)}` : findDivision.slug,
              },
            });

            //delete previous uploaded image
            await deleteFromCloudinary(
              findDivision.image,
              async (error, result) => {
                console.log("error", error);
                console.log("result", result);
              }
            );

            if (division) {
              return res
                .status(200)
                .json(
                  jsonResponse(true, `Division has been updated`, division)
                );
            } else {
              return res
                .status(404)
                .json(
                  jsonResponse(false, "Division has not been updated", null)
                );
            }
          }
        );

        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${findCategory.image.split("/")[2]}`
        // );
      } else {
        //if there is no image selected
        //update category
        const division = await prisma.division.update({
          where: { id: req.params.id },
          data: {
            name,
            isActive: isActive === "true" ? true : false,
            image: findDivision.image,
            slug: name ? `${slugify(name)}` : findDivision.slug,
          },
        });

        if (division) {
          return res
            .status(200)
            .json(jsonResponse(true, `Division has been updated`, division));
        } else {
          return res
            .status(404)
            .json(jsonResponse(false, "Division has not been updated", null));
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//ban category
// export const banCategory = async (req, res) => {
//   try {
//     return await prisma.$transaction(async (tx) => {
//       //ban category
//       const getCategory = await tx.category.findFirst({
//         where: { id: req.params.id },
//       });

//       const category = await tx.category.update({
//         where: { id: req.params.id },
//         data: {
//           isActive: getCategory.isActive === true ? false : true,
//         },
//       });

//       if (category) {
//         return res
//           .status(200)
//           .json(jsonResponse(true, `Category has been banned`, category));
//       } else {
//         return res
//           .status(404)
//           .json(jsonResponse(false, "Category has not been banned", null));
//       }
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json(jsonResponse(false, error, null));
//   }
// };

//delete banner
export const deleteDivision = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const division = await tx.division.delete({
        where: { id: req.params.id },
      });

      if (division) {
        // fs.unlinkSync(
        //   `public\\images\\${module_name}\\${category.image.split("/")[2]}`
        // );
        await deleteFromCloudinary(division.image, async (error, result) => {
          console.log("error", error);
          console.log("result", result);
        });

        return res
          .status(200)
          .json(jsonResponse(true, `Division has been deleted`, division));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Division has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//For Customer

//get all banners for customer
export const getDivisionsForCustomer = async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
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
      //   include: {
      //     serviceItem: true,
      //     serviceManufacturer: true,
      //     serviceModel: true,
      //   },
      //   select: {
      //     user: { select: { name: true, image: true } },
      //     id: true,
      //     name: true,
      //     image: true,
      //     slug: true,
      //     createdAt: true,
      //   },
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

    if (divisions.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No division is available", null));

    if (divisions) {
      return res
        .status(200)
        .json(
          jsonResponse(true, `${divisions.length} banners found`, divisions)
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

//get single banner for customer
export const getDivisionForCustomer = async (req, res) => {
  try {
    const division = await prisma.division.findFirst({
      where: {
        // slug: req.params.slug,
        id: req.params.id,
      },
      //   include: {
      //     serviceItem: true,
      //     serviceManufacturer: true,
      //     serviceModel: true,
      //   },
      //   select: {
      //     user: { select: { name: true, image: true } },
      //     id: true,
      //     name: true,
      //     image: true,
      //     slug: true,
      //     createdAt: true,
      //   },
    });

    if (division) {
      return res
        .status(200)
        .json(jsonResponse(true, `1 division found`, division));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No division is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};
