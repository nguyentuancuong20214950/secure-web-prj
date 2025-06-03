import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/common-section/CommonSection";
import { Container, Row, Col } from "reactstrap";
import { useDispatch } from "react-redux";
import { cartActions } from "../store/shopping-cart/cartSlice";
import "../styles/product-details.css";
import ProductCard from "../components/UI/product-card/ProductCard";
import ExtraIngredient from '../components/ExtraIngredient/ExtraIngredient.jsx'

const ExtraIngredients = {
  HAM :"Ham",
  BACON : "Bacon",
  PEPPERONI: "Pepperoni",
	MUSHROOMS: "Mushrooms",
	ONION: "Onion",
	PINAPPLE: "Pinapple",  
  CHEESE: "Cheese", 
  CORN: "Corn",
}

const FoodDetails = () => {
  const [tab, setTab] = useState("desc");
  const [enteredName, setEnteredName] = useState("");
  const [enteredEmail, setEnteredEmail] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const dispatch = useDispatch();
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [extraIngredients, setExtraIngredients] = useState([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/auth/product');
        setProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [id]); 

  const productId = parseInt(id);
  const product = products.find(item => item.id === productId);

  useEffect(() => {
    if (!product) return; // Wait until product is fetched
    window.scrollTo(0, 0);
  }, [product]);

  const { name, price, category, description, image } = product || {};

  const relatedProduct = products.filter((item) => category === item.category);

  const addItem = () => {
    dispatch(
      cartActions.addItem({
        id,
        name,
        price,
        image,
      })
    );
  };

  function updateExtraIngredients(ingredient) {
    if(extraIngredients.includes(ingredient)) {
      setExtraIngredients(extraIngredients.filter(item => item !== ingredient));
    } else {
      setExtraIngredients(previousState => [...previousState, ingredient]);
    }
  }

  //for newletter
  const submitHandler = (e) => {
    e.preventDefault();

    console.log(enteredName, enteredEmail, reviewMsg);
  };

  return (
    <Helmet title="Product-details">
      <CommonSection title={name} />

      <section>
        <Container>
          {product && (
            <Row>

              <Col lg="4" md="4">
                <div className="product__main-img">
                  <img src={require(`../assets/image/${image}`)} alt="product-image" className="w-100" />
                </div>
              </Col>

              <Col lg="6" md="6">
                <div className="single__product-content">
                  <h2 className="product__title mb-3">{name}</h2>
                  <p className="product__price">
                    {" "}
                    Price: <span>{price}</span>K
                  </p>

                  <button onClick={addItem} className="addTOCart__btn">
                    Add to Cart
                  </button>
                </div>
              </Col>
              <Col lg='12'>

              <div className="tabs d-flex align-items-center gap-5 py-3">
              <h6>Extra ingredients: 15K</h6>
                </div>

              <div className="extraIngredientsGrid">
                {(Object.values(ExtraIngredients)).map((ingredient) => {
                  return (
                    <ExtraIngredient isChecked={extraIngredients.includes(ingredient)}  key={ingredient} onSelect={ingredient => updateExtraIngredients(ingredient)} ingredient={ingredient}></ExtraIngredient>
                  )
                })}
              </div>
            </Col>

              <Col lg="12">
                <div className="tabs d-flex align-items-center gap-5 py-3">
                  <h6>Description</h6>
                </div>

                <div className="tab__content">
                  <p>{description}</p>
                </div>
              </Col>

              <Col lg="12" className="mb-5 mt-4">
                <h2 className="related__Product-title">You might also like</h2>
              </Col>

              {relatedProduct.map((item) => (
                <Col lg="3" md="4" sm="6" xs="6" className="mb-4" key={item.id}>
                  <ProductCard item={item} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>
    </Helmet>
  );
};

export default FoodDetails;
