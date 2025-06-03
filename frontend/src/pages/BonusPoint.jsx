import React, { useState, useEffect } from "react";
import axios from "axios";

const TabsComponent = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [point, setPoint] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5001/order');
        setOrders(response.data.orders);
        setPoint(response.data.orders.length); // Set points based on order length
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Error fetching orders');
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h1>You have {point} points</h1>
      <p>We do not have any discounts for that yet, but please keep it for more discounts in the future.</p>
      {error && <p>{error}</p>}
    </div>
  );
};

export default TabsComponent;
