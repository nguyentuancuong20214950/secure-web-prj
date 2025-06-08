// AdminLayout.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import Dashboard from "../admin/Dashboard.jsx";

const AdminLayout = () => {
  const user = useSelector((state) => state.user.currentUser);

  // Nếu chưa đăng nhập hoặc không phải admin thì chuyển hướng về trang chủ
  if (!user || user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return (
    <Dashboard>
      <Outlet />
    </Dashboard>
  );
};

export default AdminLayout;
