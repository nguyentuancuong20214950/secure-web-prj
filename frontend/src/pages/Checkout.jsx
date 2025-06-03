import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Row, Col } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Helmet from '../components/Helmet/Helmet';
import CommonSection from '../components/UI/common-section/CommonSection';
import "../styles/checkout.css";
import { AiFillCheckCircle } from "react-icons/ai";

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const [csrfToken, setCsrfToken] = useState('');
  const userId = useSelector((state) => state.user.currentUser);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCash, setLoadingCash] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5001/csrf-token')
      .then(response => {
        setCsrfToken(response.data.csrfToken);
      })
      .catch(error => {
        console.error('Error fetching CSRF token:', error);
      });
  }, []);


  const handleCheckout = (e) => {
    e.preventDefault();
    setLoading(true);
    
    axios.post('http://localhost:5001/auth/checkout', {
      userId,
      cartItems,
      totalAmount,
      _csrf: csrfToken,
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

  const handleCash = (e) => {
    e.preventDefault();
    setLoadingCash(true);

    axios.post('http://localhost:5001/auth/checkoutCash', {
      userId,
      cartItems,
      totalAmount,
      _csrf: csrfToken,
    })
      .then(response => {
        console.log(response.data.status
        )
        if (response.data.Status === 'Success') {
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
        setLoadingCash(false);
      });
    
    setTimeout(() => {
      setLoadingCash(false);
    }, 1000); // 1 second delay
  }

  if (orderSuccess) {
    return (
      <div className="checkoutMessage">
        <div className="checkoutTitleContainer">
          <AiFillCheckCircle className="checkoutIcon" />
          <h3>Thank you for your order!</h3>
          
          
        </div>
        <h4>We are already sent order payment to your email. PLease verify!</h4>
        <span>
          Your order is being processing and will be served as fast as possible.
        </span>
        <br></br>
        <span>
          You can see order status detail in order history.
        </span>

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
              <h5 className="mb-5">Confirmation of your order</h5>
              <table className="table table-borderless mb-5 align-middle">
                <tbody>
                  {cartItems.map((item) => (
                    <Tr item={item} key={item.id} />
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <h6>
                  Total: 
                  <span className="cart__subtotal">{totalAmount}</span>K
                </h6>
                <p>Taxes already included</p>
              
                  <button className="addTOCart__btn mt-4" onClick={handleCash} disabled={loadingCash}>
                    {loadingCash ? 'Processing...' : 'Thanh toán khi nhận hàng'}
                  </button>
                  
                  <button className="addTOCart__btn mt-4" onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Processing...' : 'VNPay'}
                  </button>
                  
                {error && <p className='text-red-700 mt-5'>Something went wrong!</p>}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

const Tr = ({ item }) => {
  const { id, image, name, price, quantity } = item;
  return (
    <tr>
      <td className="text-center cart__img-box">
        <img src={require(`../assets/image/${image}`)} alt=""  />
      </td>
      <td className="text-center">{name}</td>
      <td className="text-center">{price}K</td>
      <td className="text-center">{quantity}px</td>
    </tr>
  );
};

export default Checkout;
