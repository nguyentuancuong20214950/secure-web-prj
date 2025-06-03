import React from 'react';
import "./OAuth.css";
import google from "../../assets/images/google.png"

function OAuth() {
    const handleLogin =  () => {
		window.open(
			`http://localhost:5001/auth/google`,
			"_self"
		);
	};

    return (
        <div className="login">
            <center>
                <div className="loginDiv">
                    <button className="google_btn" onClick={handleLogin}>
                        <img src={google} alt="google" />
                        <span>Sign in with Google</span>
                    </button>               
                </div>
            </center>
        </div>
    );
}

export default OAuth;
