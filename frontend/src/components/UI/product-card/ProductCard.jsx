import React from "react";
import "../../../styles/product-card.css";
import { useDispatch, useSelector } from "react-redux";
import { cartActions } from "../../../store/shopping-cart/cartSlice";
import { Link } from "react-router-dom";

const ProductCard = (props) => {
  const { id, name, price, image } = props.item;
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);

  const addToCart = () => {
    dispatch(
      cartActions.addItem({
        id,
        name,
        price,
        image,
      })
    );
  };

  // Xác định đường dẫn đúng đến trang chi tiết sản phẩm
  const detailLink = user?.role === "admin" ? `/dashboard/foods/${id}` : `/foods/${id}`;

  return (
    <div className="product__item d-flex flex-column justify-content-between">
      <div className="product__content">
        <h5>
          <Link to={detailLink}>
          <img src={`http://localhost:5001/images/${image}`} alt={name} className="product__img w-50" />
            <div>{name}</div>
          </Link>
        </h5>
      </div>
      <div className="d-flex flex-column align-items-center justify-content-between">
        <span className="product__price mb-2">{price} K</span>
        {user?.role !== "admin" && (
          <button className="addTOCART__btn" onClick={addToCart}>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
