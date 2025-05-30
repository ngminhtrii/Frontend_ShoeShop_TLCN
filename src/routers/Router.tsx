import { Route, Routes } from "react-router-dom";
import OrderConfirmationPage from "../pages/OrderConfirmationPage/OrderConfirmationPage";
import ProductDetailPage from "../pages/ProductDetailPage/ProductDetailPage";
import ProductListPage from "../pages/MainPages/ProductListPage";
import LoginPage from "../pages/AuthPages/LoginPage";
import RegisterPage from "../pages/AuthPages/RegisterPage";
import OTPVerificationPage from "../pages/AuthPages/OTPVerificationPage";
import ForgotPasswordPage from "../pages/AuthPages/ForgotPasswordPage";
import AdminLayout from "./layout/AdminLayout";
import LandingPage from "../pages/MainPages/LandingPage/LandingPage";
import MainLayout from "./layout/MainLayout";
import Dashboard from "../pages/AdminPages/DashboardPage/Dashboard";
import ListCustomerPage from "../pages/AdminPages/AdminUser/CustomerPage";
import ListCategoriesPage from "../pages/AdminPages/AdminCategories/CategoriesPage";
import ListOrderPage from "../pages/AdminPages/AdminOrders/OrderPage";
import CartPage from "../pages/MainPages/CartPage/CartPage";
import UserInformationPage from "../pages/MainPages/UserPage/UserInformationPage";
import UserManageOrderPage from "../pages/MainPages/UserPage/UserManageOrderPage";
import LikePage from "../pages/MainPages/LikePage/LikePage";
import ProductPage from "../pages/AdminPages/ProductPage/ProductPage";
import DiscountPage from "../pages/AdminPages/DiscountPage/DiscountPage";
import BrandPage from "../pages/AdminPages/BrandPage/BrandPage";
import ColorPage from "../pages/AdminPages/ColorPage/ColorPage";
import SizePage from "../pages/AdminPages/SizePage/SizePage";
import PaymentStatusPage from "../pages/OrderConfirmationPage/PaymentStatusPage";
import VariantPage from "../pages/AdminPages/VariantPage/VariantPage";
import AuthGuard from "../components/Auth/AuthGuard";

const AppRouter = () => {
  return (
    <Routes>
      {/* Auth routes - không cần layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/otp-verification" element={<OTPVerificationPage />} />
      <Route path="/forgotpassword" element={<ForgotPasswordPage />} />

      {/* Admin routes - sử dụng AdminLayout */}
      <Route
        path="/admin/*"
        element={
          <AuthGuard adminOnly>
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route path="" element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductPage />} />
        <Route path="products/discount" element={<DiscountPage />} />
        <Route path="products/variants" element={<VariantPage />} />
        <Route path="users" element={<ListCustomerPage />} />
        <Route path="categories" element={<ListCategoriesPage />} />
        <Route path="brand" element={<BrandPage />} />
        <Route path="color" element={<ColorPage />} />
        <Route path="size" element={<SizePage />} />
        <Route path="orders" element={<ListOrderPage />} />
      </Route>

      {/* Main layout routes - sử dụng MainLayout với MainNavbar */}
      <Route path="/" element={<MainLayout />}>
        <Route path="" element={<LandingPage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route
          path="cart"
          element={
            <AuthGuard>
              <CartPage />
            </AuthGuard>
          }
        />
        <Route
          path="user-information"
          element={
            <AuthGuard>
              <UserInformationPage />
            </AuthGuard>
          }
        />
        <Route
          path="user-manage-order"
          element={
            <AuthGuard>
              <UserManageOrderPage />
            </AuthGuard>
          }
        />
        <Route
          path="like-page"
          element={
            <AuthGuard>
              <LikePage />
            </AuthGuard>
          }
        />
        <Route
          path="order-confirmation"
          element={
            <AuthGuard>
              <OrderConfirmationPage />
            </AuthGuard>
          }
        />
        <Route path="payment/status" element={<PaymentStatusPage />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
