import React, { useState } from "react";
import "./Email.css";
import emailIcon from "../../assets/images/email.png";

const Email = ({ onSubmit, loading, toggle, showForm }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="login">
      <center>
        <div className="loginDiv">
          {!showForm ? (
            <button className="google_btn" onClick={toggle}>
              <img src={emailIcon} alt="email icon" />
              <span>Sign in with Email</span>
            </button>
          ) : (
            <form className="email-form" onSubmit={handleSubmit}>
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

              <div className="form__group">
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    className="input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </div>

              <button type="submit" className="addTOCart__btn" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>

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
