import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col } from "reactstrap";
import ProductCard from "../components/UI/product-card/ProductCard";

import "../styles/all-foods.css";
import "../styles/pagination.css";

const AllFoods = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [category, setCategory] = useState("Pizza");
  const [sortOption, setSortOption] = useState("Default");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/auth/product');
        setAllProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let products = allProducts;

    if (searchTerm) {
      products = products.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category !== "All") {
      products = products.filter((item) => item.category === category);
    }

    switch (sortOption) {
      case "ascending":
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "descending":
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "high-price":
        products.sort((a, b) => b.price - a.price);
        break;
      case "low-price":
        products.sort((a, b) => a.price - b.price);
        break;
      default:
        break;
    }

    setFilteredProducts(products);
  }, [searchTerm, category, sortOption, allProducts]);

  useEffect(() => {
    if (category === "Discount") {
      navigate("/contact");
    }
  }, [category, navigate]);

  return (
    <section>
      <Container>
        <Col lg="12">
          <div className="food__category d-flex align-items-center justify-content-center gap-4">
            <button
              className={`all__btn ${category === "Discount" ? "foodBtnActive" : ""}`}
              onClick={() => setCategory("Discount")}
            >
              Promotion 
            </button>
            <button
              className={`d-flex align-items-center gap-2 ${category === "Pizza" ? "foodBtnActive" : ""}`}
              onClick={() => setCategory("Pizza")}
            >
              Pizza
            </button>
            <button
              className={`d-flex align-items-center gap-2 ${category === "Side" ? "foodBtnActive" : ""}`}
              onClick={() => setCategory("Side")}
            >
              Side
            </button>
            <button
              className={`d-flex align-items-center gap-2 ${category === "Dessert" ? "foodBtnActive" : ""}`}
              onClick={() => setCategory("Dessert")}
            >
              Dessert
            </button>
            <button
              className={`d-flex align-items-center gap-2 ${category === "Drink" ? "foodBtnActive" : ""}`}
              onClick={() => setCategory("Drink")}
            >
              Drink
            </button>
          </div>
        </Col>
        <Row>
          <Col lg="6" md="6" sm="6" xs="12" className="mb-2">
            <div className="search__widget d-flex justify-content-start">
              <input
                type="text"
                placeholder="I'm looking for...."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span>
                <i className="ri-search-line"></i>
              </span>
            </div>
          </Col>
          <Col lg="6" md="6" sm="6" xs="12" className="mb-3 d-flex justify-content-end">
            <div className="sorting__widget">
              <select
                className="w-50"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="Default">Default</option>
                <option value="ascending">Alphabet A-Z</option>
                <option value="descending">Alphabet Z-A</option>
                <option value="high-price">High Price</option>
                <option value="low-price">Low Price</option>
              </select>
            </div>
          </Col>
        </Row>
        <Row>
          {filteredProducts.map((item) => (
            <Col lg="3" md="4" sm="6" xs="6" key={item.id} className="mb-4">
              <ProductCard item={item} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default AllFoods;
