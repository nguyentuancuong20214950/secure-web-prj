import React from "react";
import { useNavigate } from "react-router-dom";
//import './Contact.css'; // Assuming you have a CSS file for additional styles

const Contact = () => {
  const navigate = useNavigate();

  const buy = () => {
    navigate('/menu');
  }

  return (
    <div className="row no-gutters">
      <div className="col-md-3 org-card-promotion-img overflow-hidden border-grey-lighter px-2">
        <img 
          className="card-img" 
          src="https://img.dominos.vn/BANNER+-+SUMMER+DEAL+2+(1).png" 
          alt="SUMMER DEAL - GIẢM 50% TỔNG HÓA ĐƠN"
        />
      </div>
      <div className="col-md-9 org-card-promotion-ctx border-grey-lighter">
        <div className="card-body border-right border-coke border-none border-md-right-solid bg-white px-0 px-md-2 px-md-4">

          <div 
            className="wrapper bg-pos-rb bg-img-sm-none pr-lg-18 p-2" 
            style={{ backgroundImage: 'none' }}
          >
            <h2 className="card-title text-armchair mb-3">HOT DEAL - GIẢM 50% TỔNG HÓA ĐƠN</h2>
            <hr className="title-hr mt-0 mb-2" />
            <div className="nomal text-grey-darker mb-2 mb-md-4 font-weight-light" style={{ whiteSpace: 'pre-line' }}>
              <p>* Giảm 50% tổng hóa đơn khi mua từ 2 Pizza size M/L.</p>
              <p>
                * Áp dụng giảm cho pizza, món phụ và thức uống (Trừ các sản phẩm sau: Pizza Pesto; Mayonnaise
                <span style={{ color: 'rgb(36, 36, 36)' }}>, Viền phô mai, Extra Cheese,</span> 
                Mỳ Ý Dăm Bông &amp; Nấm Xốt Kem, Bánh Sô-Cô-La Đút Lò).
              </p>
              <p>* Áp dụng từ 15/5 đến 21/5/2024 khi mua qua website với hình thức Mua mang về hoặc Giao hàng tận nơi.</p>
            </div>
            <div className="d-flex justify-content-start flex-wrap">
              <button 
                className="order__btn" 
                onClick={buy}
              >
                <span>BUY NOW</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
