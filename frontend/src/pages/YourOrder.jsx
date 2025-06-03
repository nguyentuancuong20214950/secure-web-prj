import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/yourorder.css"

const TabsComponent = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5001/order');
        setOrders(response.data.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Error fetching orders');
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      {error && <p>{error}</p>}
      {orders.length > 0 ? (
        orders.map(order => (
          <div key={order.id}>
            <h3>Order ID: {order.id}</h3>
            <p>Method payment: {order.method}</p>
            <p>Total Amount: {order.total},000đ</p>
            <p>Order Time: {order.timestamp}</p>
            {order.confirm === 0 && (
              <h4>Your order is processing</h4>
            )}
            {order.confirm === 1 && (
              <h4>Your order is served</h4>
            )}
            <table className="order-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th></th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                </tr>
              </thead>

              <tbody>
                {JSON.parse(order.products).map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td><img src={require(`../assets/image/${product.image}`)} alt={product.name} width="50" /></td>
                    <td>{product.price}K</td>
                    <td>{product.quantity}</td>
                    <td>{product.totalPrice}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default TabsComponent;
