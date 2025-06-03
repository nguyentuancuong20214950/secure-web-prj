import React, { useState } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import Profile from "./Profile";
import ChangePassword from "./ChangePassword";
import YourOrder from "./YourOrder";
import BonusPoint from "./BonusPoint";
import "../styles/all-foods.css";
import "../styles/pagination.css";

const AccountInfo = () => {
  const [category, setCategory] = useState("Profile");

  return (
    <Helmet title="Account Info">
      <section>
        <Container>
          <Col lg="12">
            <div className="food__category d-flex align-items-center justify-content-center ">
              <button
                className={`all__btn ${category === "Profile" ? "foodBtnActive" : ""}`}
                onClick={() => setCategory("Profile")}
              >
                Profile
              </button>
              <button
                className={`d-flex align-items-center gap-2 ${category === "ChangePassword" ? "foodBtnActive" : ""}`}
                onClick={() => setCategory("ChangePassword")}
              >
                Change Password
              </button>
              <button
                className={`d-flex align-items-center gap-2 ${category === "YourOrder" ? "foodBtnActive" : ""}`}
                onClick={() => setCategory("YourOrder")}
              >
                Your Order
              </button>
              <button
                className={`d-flex align-items-center gap-2 ${category === "BonusPoint" ? "foodBtnActive" : ""}`}
                onClick={() => setCategory("BonusPoint")}
              >
                Bonus Point
              </button>
            </div>
          </Col>

          <Row>
            {category === "Profile" && <Profile />}
            {category === "ChangePassword" && <ChangePassword />}
            {category === "YourOrder" && <YourOrder />}
            {category === "BonusPoint" && <BonusPoint />}
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default AccountInfo;
