import React from 'react';
import { useDispatch } from 'react-redux';
import { cartActions } from '../../../store/shopping-cart/cartSlice';
import { Link } from 'react-router-dom';

const ProductCard = ({ item }) => {
  const dispatch = useDispatch();

  const addToCart = () => {
    dispatch(cartActions.addItem({
      id: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
    }));
  };

  return (
    <div className="product__item">
      <div className="product__img">
        <img src={require(`../../../assets/image/${item.image}`)} alt={item.name} className="w-100" />
      </div>

      <div className="product__content">
        <h5>
          <Link to="#">{item.name}</Link>
        </h5>
        <div className="d-flex align-items-center justify-content-between">
          <span className="product__price">{item.price}K</span>
          <button className="addTOCart__btn" onClick={addToCart}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
