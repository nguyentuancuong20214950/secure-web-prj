import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Helmet from "../../components/Helmet/Helmet";
import CommonSection from "../../components/UI/common-section/CommonSection";
import { Container, Row, Col } from "reactstrap";
import "../../styles/product-details.css";

const FoodDetails = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const { id } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get('http://localhost:5001/auth/product');
        setProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [id]);

  const productId = parseInt(id);
    const product = products.find(item => item.id === productId);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description);
    window.scrollTo(0, 0);
  }, [product]);

  const { image } = product || {};

  console.log(image)

  const handleSubmit = async (e) => {
    e.preventDefault();
  }
  
  return (
    <Helmet title="Product-details">
      <CommonSection title={name} />
      <section>
        <Container>
          <Row>
            <Col lg="4" md="4">
              <div className="product__main-img">
                <img src={require(`../../assets/image/${image}`)} alt="" className="w-100" />
              </div>
            </Col>


            <Col lg="6" md="6">
              <div className="single__product-content">
                <h2 className="product__title mb-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </h2>
                <p className="product__price">
                  Price:{" "}
                  <span>
                    <input
                      type="text"
                      placeholder="Price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </span>
                </p>
                </div>
            </Col>

                <Col lg="12">
                <div className="tabs d-flex align-items-center gap-5 py-3">
                  <h6>Description</h6>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                </Col>
       
            <Col lg="12">
              <button
                className="addTOCart__btn w-auto py-2 bg-red-600 text-white mb-10 hover:bg-red-700"
                onClick={handleSubmit}
              >
                Update Product
              </button>
            </Col>
          </Row>
        </Container>
      </section>
    </Helmet>
  );
};

export default FoodDetails;
