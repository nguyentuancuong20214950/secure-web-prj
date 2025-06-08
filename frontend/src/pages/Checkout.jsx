import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col } from 'reactstrap';
import axios from 'axios';
import Helmet from '../components/Helmet/Helmet';
import CommonSection from '../components/UI/common-section/CommonSection';
import "../styles/checkout.css";
import { AiFillCheckCircle } from "react-icons/ai";

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const currentUser = useSelector((state) => state.user.currentUser);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(totalAmount);
  const [applyLoading, setApplyLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5001/csrf-token')
      .then(response => {
        setCsrfToken(response.data.csrfToken);
      })
      .catch(error => {
        console.error('Error fetching CSRF token:', error);
      });
  }, []);

  const applyCoupon = (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setCouponMessage('');
    setError(false);

    axios.post('http://localhost:5001/auth/checkout', {
      username: currentUser?.username,
      cartItems,
      totalAmount,
      couponCode,
      _csrf: csrfToken,
    },{
      withCredentials: true
    })
      .then(response => {
        if (response.data.status === 'Success') {
          setDiscount(response.data.discount);
          setFinalAmount(response.data.finalAmount);
          setCouponMessage(`Áp dụng mã thành công! Giảm ${response.data.discount}K`);
        } else {
          setCouponMessage('Không áp dụng được mã.');
          setFinalAmount(totalAmount);
          setDiscount(0);
        }
      })
      .catch(error => {
        setCouponMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        setFinalAmount(totalAmount);
        setDiscount(0);
        console.error('Error applying coupon:', error);
      })
      .finally(() => {
        setApplyLoading(false);
      });
  };

  const handleCheckout = (e) => {
    e.preventDefault();
    setLoading(true);

    axios.post('http://localhost:5001/auth/checkout', {
      username: currentUser?.username,
      cartItems,
      totalAmount,
      couponCode,
      _csrf: csrfToken,
    },{
      withCredentials: true
    })
      .then(response => {
        if (response.data.status === 'Success') {
          setOrderSuccess(true);
        } else {
          setError(true);
        }
      })
      .catch(error => {
        console.error('Error during checkout:', error);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (orderSuccess) {
    return (
      <div className="checkoutMessage">
        <div className="checkoutTitleContainer">
          <AiFillCheckCircle className="checkoutIcon" />
          <h3>Thank you for your order!</h3>
        </div>
        <h4>We have sent order confirmation to your email.</h4>
        <span>Your order is being processed and will be served soon.</span><br />
        <span>You can check your order status in your order history.</span>
      </div>
    );
  }

  return (
    <Helmet title="Checkout">
      <CommonSection title="Checkout" />
      <section>
        <Container>
          <Row>
            <Col lg="12">
              <h5 className="mb-5">Order Confirmation</h5>
              <table className="table table-borderless mb-5 align-middle">
                <tbody>
                  {cartItems.map((item) => (
                    <Tr item={item} key={item.id} />
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <h6>Tổng ban đầu: <span className="cart__subtotal">{totalAmount}</span>K</h6>
                <div className="d-flex mb-3">
                  <input
                    className="form-control me-2"
                    type="text"
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button onClick={applyCoupon} className="btn btn-secondary" disabled={applyLoading}>
                    {applyLoading ? 'Đang áp dụng...' : 'Áp dụng mã'}
                  </button>
                </div>
                {couponMessage && <p className="text-success">{couponMessage}</p>}
                {discount > 0 && (
                  <p>Giảm giá: <strong>{discount}K</strong></p>
                )}
                <h6>
                  Tổng phải thanh toán: <span className="cart__subtotal">{finalAmount}</span>K
                </h6>
                <p>Taxes already included</p>
                <button className="addTOCart__btn mt-4" onClick={handleCheckout} disabled={loading}>
                  {loading ? 'Processing...' : 'Thanh toán khi nhận hàng'}
                </button>
                {error && <p className='text-danger mt-4'>Đã xảy ra lỗi khi đặt hàng.</p>}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

const Tr = ({ item }) => {
  const { image, name, price, quantity } = item;
  return (
    <tr>
      <td className="text-center cart__img-box">
        <img src={`http://localhost:5001/images/${image}`} alt={name} width="50" />
      </td>
      <td className="text-center">{name}</td>
      <td className="text-center">{price}K</td>
      <td className="text-center">{quantity}px</td>
    </tr>
  );
};

export default Checkout;