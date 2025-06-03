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
        image
      })
    );
  };

  return (
    <div className="product__item d-flex flex-column justify-content-between">
      <div className="product__content">
        <h5>

        {user !== 'admin' ? ( // Check if user is not an admin
          <Link to={`/foods/${id}`}>
            <img className="product__img w-50" src={require(`../../../assets/image/${image}`)} alt={name} />
            <div>{name}</div>
          </Link>
        ) : 
            <Link to={`../dashboard/foods/${id}`}>
            <img className="product__img w-50" src={require(`../../../assets/image/${image}`)} alt={name} />
            <div>{name}</div>
          </Link>
      }
        </h5>
      </div>
      <div className="d-flex flex-column align-items-center justify-content-between">
        <span className="product__price mb-2">{price} K </span>
        {user !== 'admin' ? ( // Check if user is not an admin
          <button className="addTOCART__btn" onClick={addToCart}>
            Add to Cart
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ProductCard;
