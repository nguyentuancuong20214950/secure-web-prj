import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from "react-router-dom";
import axios from "../utils/axiosInstance";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/common-section/CommonSection";
import { Container, Row, Col } from "reactstrap";

import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../store/user/userSlice';
import { cartActions } from '../store/shopping-cart/cartSlice';

const Login = () => {
  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('login');
  const [csrfToken, setCsrfToken] = useState('');
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const { loading } = useSelector((state) => state.user);
  const [loginStatus, setLoginStatus] = useState('');
  const [statusHolder, setStatusHolder] = useState('message');

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get('/csrf-token', { withCredentials: true });
        setCsrfToken(response.data.csrfToken);
      } catch (err) {
        setLoginStatus('Invalid access');
      }
    };
    fetchCsrfToken();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(signInStart());
    try {
      const res = await axios.post('/login', {
        username: user,
        password: pwd,
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true,
      });

      if (res.data.Status === 'Success') {
        const userObj = {
          username: user,
          role: res.data.Role?.role || 'user'   
        }; 
        localStorage.setItem('currentUser', JSON.stringify(userObj));
        dispatch(cartActions.clearCart());
        dispatch(signInSuccess(userObj));
        navigateTo(userObj.role === "user" ? '/home' : '/dashboard');
        // window.location.reload(true);
      } else if (res.data.Status === '2FA required' && res.data.step === 'verify') {
        setStep('verify');
        setLoginStatus("Code is sent to your email. Please enter your code!");
        dispatch(signInFailure({}));
      } else {
        dispatch(signInFailure(res.data));
        setLoginStatus('Invalid username or password!');
      }
    } catch (err) {
      dispatch(signInFailure(err));
      setLoginStatus('Invalid username or password!');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    dispatch(signInStart());
    setLoginStatus('');
    setStatusHolder('message');

    try {
      const res = await axios.post('/verify-2fa', {
        username: user,
        code: code,
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true,
      });

      if (res.data.Status === '2FA success') {
        const userObj = {
          username: user,
          role: res.data.Role?.role || 'user'   
        };
        dispatch(signInSuccess(userObj));
        localStorage.setItem('currentUser', JSON.stringify(userObj));
        navigateTo(userObj.role === "user" ? '/home' : '/dashboard');
        // window.location.reload(true);
      } else {
        dispatch(signInFailure(res.data));
        setLoginStatus('Invalid or expired code');
      }
    } catch (err) {
      dispatch(signInFailure(err));
      setLoginStatus('Invalid or expired code');
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
            <form className="form" onSubmit={step === 'login' ? handleLogin : handleVerify}>
              <span className={statusHolder}>{loginStatus}</span>

              <div className="form__group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  placeholder="Input username"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  required
                  disabled={step === 'verify'}
                />
              </div>

              {step === 'login' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="form__group">
                    <label htmlFor="code">Enter verification code (email):</label>
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="addTOCart__btn" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </>
              )}
            </form>
            <p><Link to="/forgot-password">Forgot your password?</Link></p>
            <Link to="/register">Can't sign in? Create account</Link>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default Login;
