import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../../styles/addcoupon.css";

const AddCoupon = () => {
  const [formData, setFormData] = useState({
    username: "",
    code: "",
    discount_type: "percent",
    discount_value: "",
    expiry_date: ""
  });
  const [csrfToken, setCsrfToken] = useState("");
  const [message, setMessage] = useState(null);
  const currentUser = useSelector((state) => state.user.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role !== "admin") {
      navigate("/");
    }
    axios.get("http://localhost:5001/csrf-token", { withCredentials: true })
      .then(res => setCsrfToken(res.data.csrfToken))
      .catch(err => console.error("Failed to fetch CSRF token", err));
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5001/auth/addCoupon", {
      ...formData,
      _csrf: csrfToken
    }, { withCredentials: true })
      .then(res => {
        if (res.data.Status === "Coupon added") {
          setMessage("Coupon successfully added.");
        } else {
          setMessage("Failed to add coupon: " + (res.data.Error || "Unknown error"));
        }
      })
      .catch(err => {
        setMessage("Server error occurred.");
        console.error(err);
      });
  };

  return (
    <div className="add-coupon-container">
      <h2>Add Coupon</h2>
      <form onSubmit={handleSubmit} className="add-coupon-form">
        <label>Username</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} required />

        <label>Coupon Code</label>
        <input type="text" name="code" value={formData.code} onChange={handleChange} required />

        <label>Discount Type</label>
        <select name="discount_type" value={formData.discount_type} onChange={handleChange}>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed</option>
        </select>

        <label>Discount Value</label>
        <input type="number" name="discount_value" value={formData.discount_value} onChange={handleChange} required />

        <label>Expiry Date</label>
        <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} required />

        <button type="submit">Add Coupon</button>
        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
};

export default AddCoupon;

