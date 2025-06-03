import React from "react";
import { ListGroup } from "reactstrap";

import logo from "../../assets/images/res-logo.png";
import "../../styles/footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__logo">
        <img src={logo} alt="logo" />
        <h5>MyPizza</h5>
        <p>Best Pizzas in town, try it out!</p>
      </div>
      <div>
        <h5 className="footer__title mb-3">Service Time</h5>
        <ListGroup>
          <div className="delivery__time-item border-0 ps-0">
            <span>Monday - Sunday</span>
            <p>10:00am - 10:00pm</p>
          </div>
        </ListGroup>
      </div>


      <div>
        <h5 className="footer__title mb-3">Address</h5>
        <ListGroup>
          <div className="delivery__time-item border-0 ps-0">
            <p>Số 1 Đại Cồ Việt</p>
          </div>
        </ListGroup>
      </div>

      <div>
        <h5 className="footer__title mb-3">Phone number</h5>
        <ListGroup>
          <div className="delivery__time-item border-0 ps-0">
            <p>0397825923 - </p>
          </div>
        </ListGroup>
      </div>
    </footer>
  );
};

export default Footer;
