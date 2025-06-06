// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from 'react-redux';
// import { Link, useNavigate } from "react-router-dom";
// import axios from 'axios';
// import Helmet from "../components/Helmet/Helmet";
// import CommonSection from "../components/UI/common-section/CommonSection";
// import { Container, Row, Col } from "reactstrap";

// import {
//   signInStart,
//   signInSuccess,
//   signInFailure,
// } from '../store/user/userSlice';
// import { cartActions } from '../store/shopping-cart/cartSlice';

// const Login = () => {
//   const [user, setUser] = useState('');
//   const [pwd, setPwd] = useState('');
//   const [csrfToken, setCsrfToken] = useState('');
//   const dispatch = useDispatch();
//   const navigateTo = useNavigate();
//   const { loading } = useSelector((state) => state.user);
//   const [loginStatus, setLoginStatus] = useState('');
//   const [statusHolder, setStatusHolder] = useState('message');
//   const [showEmailForm, setShowEmailForm] = useState(false); 

//   useEffect(() => {
//     const fetchCsrfToken = async () => {
//       try {
//         const response = await axios.get('http://localhost:5001/csrf-token', { withCredentials: true });
//         setCsrfToken(response.data.csrfToken);
//       } catch (err) {
//         setLoginStatus('Invalid access');
//       }
//     };
//     fetchCsrfToken();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     dispatch(signInStart());
//     try {
//       const res = await axios.post('http://localhost:5001/auth/login', {
//         username: user,
//         password: pwd,
//       }, {
//         headers: { 'CSRF-Token': csrfToken },
//         withCredentials: true,
//       });

//       if (res.data.Status === 'Success') {
//         const userData = {
//           username: user,
//           role: res.data.Role.role,
//           token: res.data.token,
//           refreshToken: res.data.refreshToken
//         };

//         dispatch(cartActions.clearCart());
//         dispatch(signInSuccess(userData.username));

//         navigateTo(res.data.Role.role === "user" ? '/' : '/dashboard');
//         window.location.reload(true);
//       } else {
//         dispatch(signInFailure(res.data));
//         setLoginStatus('Invalid username or password!');
//       }
//     } catch (err) {
//       dispatch(signInFailure(err));
//       setLoginStatus('Invalid username or password!');
//     }
//   };

//   useEffect(() => {
//     if (loginStatus !== '') {
//       setStatusHolder('showMessage');
//       const timer = setTimeout(() => {
//         setStatusHolder('message');
//         setLoginStatus('');
//       }, 4000);
//       return () => clearTimeout(timer);
//     }
//   }, [loginStatus]);

//   return (
//     <Helmet title="Login">
//       <CommonSection title="Login" />
//       <Container>
//         <Row>
//           <Col lg="6" md="6" sm="12" className="m-auto text-center">
//             {!showEmailForm && (
//               <form className="form" onSubmit={handleSubmit}>
//                 <span className={statusHolder}>{loginStatus}</span>
//                 <div className="form__group">
//                   <label htmlFor="username">Username:</label>
//                   <input
//                     type="text"
//                     placeholder="Input username"
//                     onChange={(e) => setUser(e.target.value)}
//                     required
//                   />
//                 </div>

//                 <div className="form__group">
//                   <label htmlFor="password">Password:</label>
//                   <input
//                     type="password"
//                     id="password"
//                     placeholder="password"
//                     onChange={(e) => setPwd(e.target.value)}
//                     required
//                   />
//                 </div>

//                 <button type="submit" className="addTOCart__btn" disabled={loading}>
//                   {loading ? 'Signing In...' : 'Sign In'}
//                 </button>
//               </form>
//             )}
          

//             <Link to="/register">Can't sign in? Create account</Link>
//           </Col>
//         </Row>
//       </Container>
//     </Helmet>
//   );
// };

// export default Login;

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
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
  const [step, setStep] = useState('login'); // login | verify
  const [csrfToken, setCsrfToken] = useState('');
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const { loading } = useSelector((state) => state.user);
  const [loginStatus, setLoginStatus] = useState('');
  const [statusHolder, setStatusHolder] = useState('message');

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

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(signInStart());
    try {
      const res = await axios.post('http://localhost:5001/login', {
        username: user,
        password: pwd,
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true,
      });

      if (res.data.Status === 'Success') {
        dispatch(cartActions.clearCart());
        dispatch(signInSuccess(user));
        navigateTo(res.data.Role?.role === "user" ? '/' : '/dashboard');
        window.location.reload(true);
      } else if (res.data.Status === '2FA required' && res.data.step === 'verify') {
        setStep('verify');
        setLoginStatus("Code is sent to your email. Please enter your code!");
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
    try {
      const res = await axios.post('http://localhost:5001/verify-ip', {
        username: user,
        code: code,
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true,
      });

      if (res.data.Status === 'Success') {
        dispatch(signInSuccess(user));
        navigateTo('/');
        window.location.reload(true);
      } else {
        dispatch(signInFailure(res.data));
        setLoginStatus('Invalid or expired code!');
      }
    } catch (err) {
      dispatch(signInFailure(err));
      setLoginStatus('Invalid or expired code!');
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
            <Link to="/register">Can't sign in? Create account</Link>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default Login;
