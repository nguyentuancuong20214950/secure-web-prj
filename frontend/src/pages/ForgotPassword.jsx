import React, { useState } from 'react';
import axios from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import Helmet from '../components/Helmet/Helmet';
import CommonSection from '../components/UI/common-section/CommonSection';

const ForgotPassword = () => {
  const [step, setStep] = useState('request');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  // Hàm lấy CSRF token mới mỗi lần gọi API cần bảo vệ
  const getCsrfToken = async () => {
    try {
      const res = await axios.get('http://localhost:5001/csrf-token', {
        withCredentials: true,
      });
      return res.data.csrfToken;
    } catch {
      setStatus('Error fetching CSRF token');
      return null;
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setStatus('');
    const token = await getCsrfToken();
    if (!token) return;

    try {
      const res = await axios.post(
        'http://localhost:5001/request_password_reset',
        { username },
        {
          headers: { 'CSRF-Token': token },
          withCredentials: true,
        }
      );
      if (res.data.Status === 'OTP sent to email') {
        setStep('reset');
        setStatus('A reset code has been sent to your email.');
      } else {
        setStatus(res.data.Error || 'Unknown error');
      }
    } catch (err) {
        const msg = err?.response?.data?.Error || 'Failed to send OTP.';
        setStatus(msg);
      }      
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus('');
    const token = await getCsrfToken();
    if (!token) return;

    try {
      const res = await axios.post(
        'http://localhost:5001/reset_password_after_otp',
        {
          username,
          otp,
          newPassword,
        },
        {
          headers: { 'CSRF-Token': token },
          withCredentials: true,
        }
      );
      if (res.data.Status === 'Password reset successfully') {
        setStatus('Password changed. You can now log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setStatus(res.data.Error || 'Failed to reset password');
      }
    } catch (err) {
      setStatus('Server error during password reset');
    }
  };

  return (
    <Helmet title="Forgot Password">
      <CommonSection title="Forgot Password" />
      <Container>
        <Row>
          <Col lg="6" className="m-auto text-center">
            <form className="form" onSubmit={step === 'request' ? handleRequest : handleReset}>
              {status && <p className="text-danger mb-3">{status}</p>}

              <div className="form__group">
                <label>Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={step === 'reset'}
                />
              </div>

              {step === 'reset' && (
                <>
                  <div className="form__group">
                    <label>OTP Code</label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <div className="form__group">
                    <label>New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="addTOCart__btn mt-3">
                {step === 'request' ? 'Send Reset Code' : 'Reset Password'}
              </button>
            </form>
          </Col>
        </Row>
      </Container>
    </Helmet>
  );
};

export default ForgotPassword;
