import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AllFoods from "./pages/AllFoods";
import Cart from "./pages/Cart";
import YourOrder from "./pages/YourOrder";

const App = () => {
  const username = useSelector((state) => state.user.username);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={username ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/menu"
          element={username ? <AllFoods /> : <Navigate to="/login" />} />
        <Route
          path="/cart"
          element={username ? <Cart /> : <Navigate to="/login" />} />
        <Route
          path="/orders"
          element={username ? <YourOrder /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
