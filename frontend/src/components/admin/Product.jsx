import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate }  from "react-router-dom";
import "../../styles/updateProduct.css"

export default function Product() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  useEffect(() => {
    // Fetch CSRF token when the component mounts
    const fetchCsrfToken = async () => {
      try {
        const response = await axios.get('http://localhost:5001/csrf-token', { withCredentials: true });
        setCsrfToken(response.data.csrfToken);
      } catch (err) {
        console.error('Error fetching CSRF token', err);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('image', image);

    try {
      const res = await axios.post('http://localhost:5001/auth/addProduct', formData, {
        headers: {
          'CSRF-Token': csrfToken,
        },
        withCredentials: true,
      });
      
      if (res.data.Status === 'Success') {
        navigate('/dashboard/product');
        setUploadSuccess(true);
      } else {
        alert(res.data.Error);
      }
    } catch (error) {
      console.error('Error during form submission:', error);
      alert('An error occurred while submitting the form. Please try again.');
    }
  };

  return (
    <div className="fixed w-full h-full bg-slate-200 bg-opacity-35 top-0 left-0 right-0 bottom-0 flex justify-center items-center">
      <div className="bg-white p-4 rounded w-full max-w-2xl h-full max-h-[80%] overflow-hidden">
        <div className="flex justify-between items-center pb-3">
          <h2 className="font-bold text-lg">Upload Product</h2>
          <div className="w-fit ml-auto text-2xl hover:text-red-600 cursor-pointer"></div>
        </div>
        <form className="m-auto grid p-4 gap-2 overflow-y-scroll h-full pb-5" onSubmit={handleSubmit}>
          <label htmlFor="productName" className="label">Product Name: </label>
          <input
            type="text"
            id="productName"
            placeholder="Enter product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="p-2 bg-slate-100 border rounded"
            required
          />

          <br></br>
          
          <label htmlFor="category" className="label">
            Category:
          </label>
          <select
            required
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 bg-slate-100 border rounded"
          >
            <option value="">Select Category</option>
            <option value="Pizza">Pizza</option>
            <option value="Dessert">Dessert</option>
            <option value="Side">Side</option>
            <option value="Drink">Drink</option>
          </select>

          <br></br>
    
          <label htmlFor="productImage" className="label">
            Product Image:
          </label>
          <label htmlFor="uploadImageInput">
            <div className="p-2 bg-slate-100 border rounded h-32 w-full flex justify-center items-center cursor-pointer">
              {/* Show selected file name */}
              {image ? (
                <span>{image.name}</span>
              ) : (
                <span>Choose an image</span>
              )}
              <input
                type="file"
                id="uploadImageInput"
                className="hidden"
                onChange={handleImageChange}
                required
              />
            </div>
          </label>

              <br></br>

          <label htmlFor="price" className="label">
            Price:
          </label>
          <input
            type="number"
            id="price"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="p-2 bg-slate-100 border rounded"
            required
          />

          <br></br>

          <label htmlFor="description" className="label">
            Description:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-28 bg-slate-100 border resize-none p-2"
            placeholder="Enter product description"
            name="description"
          ></textarea>

              <br></br>

          <button
            className="addTOCart__btn px-3 py-2 bg-red-600 text-white mb-10 hover:bg-red-700"
            onClick={handleSubmit}
          >
            Upload Product
          </button>


        </form>

        {uploadSuccess && (
            <div className="success-message">
              Product uploaded successfully!
            </div>
          )}
      </div>
    </div>
  );
}
