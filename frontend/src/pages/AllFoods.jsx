import { useEffect, useState } from "react";
import axios from "axios";

export default function AllFoods() {
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5001/products").then(res => {
      setFoods(res.data);
    }).catch(err => {
      console.error("Failed to load food data.", err);
    });
  }, []);

  return (
    <div className="container mt-5">
      <h2>All Dishes</h2>
      <div className="row">
        {foods.map(food => (
          <div key={food.id} className="col-md-4 mb-4">
            <div className="card">
              <img src={food.image} className="card-img-top" alt={food.name} />
              <div className="card-body">
                <h5 className="card-title">{food.name}</h5>
                <p className="card-text">{food.description}</p>
                <p><strong>{food.price} VND</strong></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
