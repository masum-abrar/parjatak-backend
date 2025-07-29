import authRoutes from "./auth/index.js";
import bannerRoutes from "./banner/index.js";
import brandRoutes from "./brand/index.js";
import bucketListRoutes from "./bucketList/index.js";
import campaignRoutes from "./campaign/index.js";
import categoryRoutes from "./category/index.js";
import contactRoutes from "./contact/index.js";
import couponRoutes from "./coupon/index.js";
import dashboardRoutes from "./dashboard/index.js";
import diaryRoutes from "./diary/index.js";
import districtRoutes from "./district/index.js";
import divisionRoutes from "./division/index.js";
import listRoutes from "./list/index.js";
import newsletterRoutes from "./newsletter/index.js";
import notificationRoutes from "./notification/index.js";
import orderRoutes from "./order/index.js";
import monthlyPaymentRoutes from "./payment/index.js";
import placeRoutes from "./place/index.js";
import placeCategoryRoutes from "./placeCategory/index.js";
import postRoutes from "./post/index.js";
import preorderRoutes from "./preorder/index.js";
import productRoutes from "./product/index.js";
import reviewRoutes from "./review/index.js";
import subcategoryRoutes from "./subcategory/index.js";
import subsubcategoryRoutes from "./subsubcategory/index.js";
import supplierRoutes from "./supplier/index.js";

const allRoutes = [
  ...authRoutes,
  ...monthlyPaymentRoutes,
  ...categoryRoutes,
  ...campaignRoutes,
  ...supplierRoutes,
  ...productRoutes,
  ...orderRoutes,
  ...dashboardRoutes,
  ...bannerRoutes,
  ...brandRoutes,
  ...subcategoryRoutes,
  ...subsubcategoryRoutes,
  ...couponRoutes,
  ...preorderRoutes,
  ...reviewRoutes,
  ...newsletterRoutes,
  ...contactRoutes,
  ...divisionRoutes,
  ...districtRoutes,
  ...placeCategoryRoutes,
  ...placeRoutes,
  ...postRoutes,
  ...diaryRoutes,
  ...bucketListRoutes,
  ...listRoutes,
  ...notificationRoutes,
];

export default allRoutes;
