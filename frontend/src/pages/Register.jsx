import React, { useState, useEffect, useRef } from "react";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/common-section/CommonSection";
import { Container, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import '../styles/register.css';

const USER_REGEX = /^[a-z0-9]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@$&*()]).{8,24}$/;

const Register = () => {
  const [user, setUser] = useState('');
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCodeField, setShowCodeField] = useState(false);

  const [pwd, setPwd] = useState('');
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState('');
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const userRef = useRef();
  const errRef = useRef();

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrMsg('');
  }, [user, pwd, matchPwd]);

  useEffect(() => {
    axios.get('http://localhost:5001/csrf-token', { withCredentials: true })
      .then(response => {
        setCsrfToken(response.data.csrfToken);
      })
      .catch(error => {
        console.error('Error fetching CSRF token', error);
      });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const v1 = USER_REGEX.test(user);
    const v2 = PWD_REGEX.test(pwd);
    if (!v1 || !v2 || pwd !== matchPwd) {
      setErrMsg("Invalid input");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5001/register', {
        username: user,
        email,
        password: pwd
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true
      });

      if (res.data.Status === "Success") {
        setShowCodeField(true);
      } else {
        setErrMsg(res.data.Error || 'Registration failed');
      }
    } catch (err) {
      console.error("Error during registration:", err.response?.data || err.message);
      setErrMsg('Registration failed');
    }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Verifying with data:", { username: user, code });
    try {
      const res = await axios.post('http://localhost:5001/verify-email', {
        username: user,
        code
      }, {
        headers: { 'CSRF-Token': csrfToken },
        withCredentials: true
      });

      if (res.data.Status === "Email verified successfully") {
        alert("Registration complete. Please login.");
        window.location.href = "/login";
      } else {
        setErrMsg(res.data.Error || 'Verification failed');
      }
    } catch (err) {
      setErrMsg('Verification failed');
    }
    setLoading(false);
  };

  return (
    <Helmet title="Signup">
      <CommonSection title="Signup" />
      <Container>
        <Row>
          <Col lg="6" md="6" sm="12" className="m-auto text-center">
            <form className="form mb-5" onSubmit={showCodeField ? handleVerify : handleRegister}>
              {!showCodeField ? (
                <>
                  <div className="form__group">
                    <label htmlFor="username">
                      Username:
                      <FontAwesomeIcon icon={faCheck} className={validName ? "valid" : "hide"} />
                      <FontAwesomeIcon icon={faTimes} className={validName || !user ? "hide" : "invalid"} />
                    </label>
                    <input
                      type="text"
                      id="username"
                      ref={userRef}
                      autoComplete="off"
                      onChange={(e) => setUser(e.target.value)}
                      value={user}
                      placeholder="Enter username"
                      required
                      aria-invalid={validName ? "false" : "true"}
                      aria-describedby="uidnote"
                      onFocus={() => setUserFocus(true)}
                      onBlur={() => setUserFocus(false)}
                      className="input"
                    />
                    <p id="uidnote" className={userFocus && user && !validName ? "instructions" : "offscreen"}>
                      <FontAwesomeIcon icon={faInfoCircle} /> 3 to 23 characters. Letters and numbers.
                    </p>
                  </div>

                  <div className="form__group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input"
                    />
                  </div>

                  <div className="form__group">
                    <label htmlFor="password">
                      Password:
                      <FontAwesomeIcon icon={faCheck} className={validPwd ? "valid" : "hide"} />
                      <FontAwesomeIcon icon={faTimes} className={validPwd || !pwd ? "hide" : "invalid"} />
                    </label>
                    <input
                      type="password"
                      id="password"
                      onChange={(e) => setPwd(e.target.value)}
                      value={pwd}
                      placeholder="Enter password"
                      required
                      aria-invalid={validPwd ? "false" : "true"}
                      aria-describedby="pwdnote"
                      onFocus={() => setPwdFocus(true)}
                      onBlur={() => setPwdFocus(false)}
                      className="input"
                    />
                    <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                      <FontAwesomeIcon icon={faInfoCircle} /> 8 to 24 characters. Must include letters, numbers and special characters.
                    </p>
                  </div>

                  <div className="form__group">
                    <label htmlFor="confirm_pwd">
                      Confirm Password:
                      <FontAwesomeIcon icon={faCheck} className={validMatch && matchPwd ? "valid" : "hide"} />
                      <FontAwesomeIcon icon={faTimes} className={validMatch || !matchPwd ? "hide" : "invalid"} />
                    </label>
                    <input
                      type="password"
                      id="confirm_pwd"
                      placeholder="Confirm password"
                      onChange={(e) => setMatchPwd(e.target.value)}
                      value={matchPwd}
                      required
                      aria-invalid={validMatch ? "false" : "true"}
                      aria-describedby="confirmnote"
                      onFocus={() => setMatchFocus(true)}
                      onBlur={() => setMatchFocus(false)}
                      className="input"
                    />
                    <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                      <FontAwesomeIcon icon={faInfoCircle} /> Must match the first password field.
                    </p>
                  </div>

                  <button className="addTOCart__btn" disabled={loading || !validName || !validPwd || !validMatch}>
                    {loading ? 'Processing...' : 'Sign Up'}
                  </button>
                </>
              ) : (
                <>
                  <div className="form__group">
                    <label htmlFor="code">Enter Verification Code:</label>
                    <input
                      type="text"
                      id="code"
                      placeholder="Enter code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      className="input"
                    />
                  </div>
                  <button className="addTOCart__btn" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </>
              )}
              {errMsg && <p ref={errRef} className="errmsg" aria-live="assertive">{errMsg}</p>}
            </form>
            <Link to="/login">Already have an account? Login</Link>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default Register;
