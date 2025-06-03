import React from "react";
import { Routes, Route} from "react-router-dom";
import Home from "../pages/Home";
import AllFoods from "../pages/AllFoods";
import FoodDetails from "../pages/FoodDetails";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Discount from "../pages/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import AccountInfo from "../pages/AccountInfo";
import Dashboard from "../components/admin/Dashboard";
import Product from "../components/admin/Product";
import Order from "../components/admin/Order";
import Products from "../components/admin/Products";
import ProductDetails from "../components/admin/ProductDetails";
import Layout from "../components/Layout/Layout";

const Routers = () => {
  return (
    <Routes>

      {/* Add (find) suitable routes under Root layout if needed */}
      <Route path="/" element={<Home />} />

      {/* Add other routes under User layout if needed */} 
      <Route path="/home" element={<Home />} />
      <Route path="/menu" element={<AllFoods />} />
      <Route path="/foods/:id" element={<FoodDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/discount" element={<Discount />} />
      <Route path="/AccountInfo" element={<AccountInfo />} />


      {/* Add other routes under Admin layout if needed */}
      <Route path="/dashboard/product" element={<Product />} />
      <Route path="/dashboard/order" element={<Order />} />
      <Route path="/dashboard/products" element={<Products />} />
      <Route path="/dashboard/foods/:id" element={<ProductDetails />} />
        {/* Add other nested routes under Dashboard if needed */}
     
    </Routes>
  );
};

export default Routers;