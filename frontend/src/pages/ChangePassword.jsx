import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col } from 'reactstrap';
import "../styles/register.css";

const RECAPTCHA_SITEKEY = process.env.REACT_APP_CLIENT_SITE_KEY;

const ChangePassword = () => {
  const [csrfToken, setCsrfToken] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@$&*()]).{8,24}$/;

    const v2 = PWD_REGEX.test(newPassword);
    if (!v2) {
      setMessage("Invalid Entry");
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log(csrfToken, currentPassword, newPassword)
    try {
      const response = await axios.post('http://localhost:5001/change_password', {
        currentPassword,newPassword},
        {
          headers: {
            'CSRF-Token': csrfToken
          },
          withCredentials: true,
        });

      if (response.data.Status === 'Password updated successfully') {
        setMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(response.data.Error || 'Error updating password.');
      }
    } catch (error) {
      setMessage('Error updating password.');
      console.error('Error updating password:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-md mx-auto py-3 py-md-4 flex flex-col justify-center items-center h-screen'>
      <div className="title flex flex-col items-center text-center mb-3">
        <h4 className='text-5xl font-bold'>Change password</h4>
      </div>
      <Row>
        <Col lg="6" md="6" sm="12" className="m-auto text-center">
          <form className="form__group mb-5" onSubmit={handleSubmit}>
            <div className="form__group">
              <input 
                type="password" 
                placeholder='Current password' 
                className='items-center border-2 p-2 rounded-md w-full' 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder='New password' 
                className='border-2 p-2 rounded-md w-full' 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder='Confirm password' 
                className='border-2 p-2 rounded-md w-full' 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                className='addTOCart__btn w-full py-2 mt-3' 
                type='submit'
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              {message && <p className='mt-3'>{message}</p>}
            </div>
          </form>
        </Col>
      </Row>
    </div>
  );
};

export default ChangePassword;
