import React, { useState } from "react";
import "./Email.css";
import emailIcon from "../../assets/images/email.png";
import axios from "axios";

const Email = ({ onSubmit, loading, toggle, showForm }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập code

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5001/request-verification-code",
        { email },
        { withCredentials: true }
      );
      if (response.data.Status === "Code sent") {
        setStep(2);
      } else {
        alert(response.data.Error || "Failed to send verification code");
      }
    } catch (err) {
      alert("Error sending verification code");
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    onSubmit(email, code);
  };

  return (
    <div className="login">
      <center>
        <div className="loginDiv">
          {!showForm ? (
            <button className="email_btn" onClick={toggle}>
              <img src={emailIcon} alt="email icon" />
              <span>Sign in with Email</span>
            </button>
          ) : (
            <form className="email-form" onSubmit={step === 1 ? handleEmailSubmit : handleCodeSubmit}>
              {step === 1 ? (
                <>
                  <div className="form__group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="addTOCart__btn" disabled={loading}>
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                </>
              ) : (
                <>
                  <div className="form__group">
                    <label htmlFor="code">Verification Code:</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter the code sent to your email"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="addTOCart__btn" disabled={loading}>
                    {loading ? "Verifying..." : "Sign In"}
                  </button>
                </>
              )}

              <p className="text">
                <a href="#" onClick={(e) => { e.preventDefault(); toggle(); }}>Sign in with your username</a>
              </p>
            </form>
          )}
        </div>
      </center>
    </div>
  );
};

export default Email;
