import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import AllFoods from "../pages/AllFoods";
import FoodDetails from "../pages/FoodDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Discount from "../pages/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AccountInfo from "../pages/AccountInfo";
import ForgotPassword from "../pages/ForgotPassword";

import AdminLayout from "../components/Layout/AdminLayout"; 
import Product from "../components/admin/Product";
import Order from "../components/admin/Order";
import Products from "../components/admin/Products";
import AddCoupon from "../components/admin/AddCoupon";
import ProductDetails from "../components/admin/ProductDetails";

const DashboardHome = () => <div>Welcome, admin!</div>;

const Routers = () => {
  return (
    <Routes>
      {/* User routes */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/menu" element={<AllFoods />} />
      <Route path="/foods/:id" element={<FoodDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/discount" element={<Discount />} />
      <Route path="/AccountInfo" element={<AccountInfo />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Admin routes với layout kiểm tra role */}
      <Route path="/dashboard" element={<AdminLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="product" element={<Product />} />
        <Route path="order" element={<Order />} />
        <Route path="products" element={<Products />} />
        <Route path="addcoupon" element={<AddCoupon />} />
        <Route path="foods/:id" element={<ProductDetails />} />
      </Route>
    </Routes>
  );
};

export default Routers;
