import React from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import logo from "../../assets/images/res-logo.png";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useDispatch } from "react-redux";
import { signOut } from '../../store/user/userSlice.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  axios.defaults.withCredentials = true;

  const handleLogout = () => {
    axios.get('http://localhost:5001/auth/logout')
      .then(result => {
        if (result.data.Status === 'Success') {
          dispatch(signOut());
          navigate("/")              
        }
      })
      .catch(error => {
        console.error('Error during logout:', error);
      });
  };

  return (
    <div className="container-fluid">
      <div className="row flex-nowrap">
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-white border-end">
          <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 min-vh-100">
            <Link
              to="/dashboard"
              className="d-flex align-items-center pb-3 mb-md-1 mt-md-3 me-md-auto text-decoration-none"
            >
              <div className="logo d-flex flex-column align-items-center">
                <img src={logo} alt="logo" width="40" height="40" />
                <h6 className="mt-2">POS System</h6>
              </div>
            </Link>
            <ul
              className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start w-100"
              id="menu"
            >
              <li className="w-100">
                <Link
                  to="/dashboard"
                  className="nav-link px-0 align-middle"
                >
                  <i className="fs-5 bi-speedometer2 ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Dashboard</span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/products"
                  className="nav-link px-0 align-middle"
                >
                  <i className="fs-5 bi-people ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">
                    Manage products
                  </span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/product"
                  className="nav-link px-0 align-middle"
                >
                  <i className="fs-5 bi-columns ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Product</span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/order"
                  className="nav-link px-0 align-middle"
                >
                  <i className="fs-5 bi-person ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Order</span>
                </Link>
              </li>
              <li className="w-100">
                <Link
                  to="/dashboard/addcoupon"
                  className="nav-link px-0 align-middle"
                >
                  <i className="fs-5 bi-person ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Add Coupon</span>
                </Link>
              </li>
              <li className="w-100">
                <button
                  onClick={handleLogout}
                  className="nav-link px-0 align-middle btn btn-link text-start"
                >
                  <i className="fs-5 bi-power ms-2"></i>
                  <span className="ms-2 d-none d-sm-inline">Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Content area */}
        <div className="col p-0 m-0">
          <div className="p-2 d-flex justify-content-center shadow bg-light">
            <h4 className="my-2">Admin Management System</h4>
          </div>

          <div className="p-4">
            <Outlet /> {/* Render route con của dashboard tại đây */}
          </div>
        </div>
      </div>
    </div>
  );
}
