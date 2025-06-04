import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/common-section/CommonSection";
import { Container, Row, Col } from "reactstrap";
import Email from '../components/email/Email';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../store/user/userSlice';
import { cartActions } from '../store/shopping-cart/cartSlice';

const Login = () => {
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const { loading } = useSelector((state) => state.user);
  const [loginStatus, setLoginStatus] = useState('');
  const [statusHolder, setStatusHolder] = useState('message');
  const [showEmailForm, setShowEmailForm] = useState(false); 

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get('http://localhost:5001/csrf-token', { withCredentials: true });
        setCsrfToken(response.data.csrfToken);
      } catch (err) {
        setLoginStatus('Invalid access');
      }
    };
    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(signInStart());
    try {
      const res = await axios.post('http://localhost:5001/auth/login', {
        username: user,
        password: pwd,
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true,
      });

      if (res.data.Status === 'Success') {
        const userData = {
          username: user,
          role: res.data.Role.role,
          token: res.data.token,
          refreshToken: res.data.refreshToken
        };

        dispatch(cartActions.clearCart());
        dispatch(signInSuccess(userData.username));

        navigateTo(res.data.Role.role === "user" ? '/' : '/dashboard');
        window.location.reload(true);
      } else {
        dispatch(signInFailure(res.data));
        setLoginStatus('Invalid username or password!');
      }
    } catch (err) {
      dispatch(signInFailure(err));
      setLoginStatus('Invalid username or password!');
    }
  };

  const handleEmailLogin = async (email, password) => {
    dispatch(signInStart());
    try {
      const res = await axios.post('http://localhost:5001/auth/login', {
        username: email, // xử lý như username
        password: password,
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true,
      });

      if (res.data.Status === 'Success') {
        const userData = {
          username: email,
          role: res.data.Role.role,
          token: res.data.token,
          refreshToken: res.data.refreshToken
        };

        dispatch(cartActions.clearCart());
        dispatch(signInSuccess(userData.username));

        navigateTo(res.data.Role.role === "user" ? '/' : '/dashboard');
        window.location.reload(true);
      } else {
        dispatch(signInFailure(res.data));
        setLoginStatus('Invalid email or password!');
      }
    } catch (err) {
      dispatch(signInFailure(err));
      setLoginStatus('Invalid email or password!');
    }
  };

  useEffect(() => {
    if (loginStatus !== '') {
      setStatusHolder('showMessage');
      const timer = setTimeout(() => {
        setStatusHolder('message');
        setLoginStatus('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loginStatus]);

  return (
    <Helmet title="Login">
      <CommonSection title="Login" />
      <Container>
        <Row>
          <Col lg="6" md="6" sm="12" className="m-auto text-center">
            {!showEmailForm && (
              <form className="form" onSubmit={handleSubmit}>
                <span className={statusHolder}>{loginStatus}</span>
                <div className="form__group">
                  <label htmlFor="username">Username:</label>
                  <input
                    type="text"
                    placeholder="Input username"
                    onChange={(e) => setUser(e.target.value)}
                    required
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="password">Password:</label>
                  <input
                    type="password"
                    id="password"
                    placeholder="password"
                    onChange={(e) => setPwd(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="addTOCart__btn" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}
          

            <Link to="/register">Can't sign in? Create account</Link>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default Login;
