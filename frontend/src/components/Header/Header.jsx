import React, { useRef, useEffect, useState } from "react";
import axios from 'axios';
import { Container } from "reactstrap";
import logo from "../../assets/images/res-logo.png";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { cartUiActions } from "../../store/shopping-cart/cartUiSlice";
import { signOut } from "../../store/user/userSlice";
import "../../styles/header.css";

const nav__links = [
  { display: "Home", path: "/home" },
  { display: "Menu", path: "/menu" },
  { display: "Cart", path: "/cart" },
  { display: "Discount", path: "/discount" },
];

const Header = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [auth, setAuth] = useState(false);
  const [userName, setUserName] = useState("");
  const menuRef = useRef();
  const headerRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);

  // Lấy user từ Redux hoặc localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (currentUser || storedUser) {
      setAuth(true);
      setUserName(currentUser?.username || storedUser);
    } else {
      setAuth(false);
      setUserName('');
    }
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const shrink = document.body.scrollTop > 80 || document.documentElement.scrollTop > 80;
        headerRef.current.classList.toggle("header__shrink", shrink);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => menuRef.current?.classList.toggle("show__menu");
  const closeMenu = () => menuRef.current?.classList.remove("show__menu");
  const toggleCart = () => dispatch(cartUiActions.toggle());

  const handleLogout = async () => {
    try {
      const res = await axios.get('http://localhost:5001/logout', { withCredentials: true });
      if (res.data.Status === 'Success') {
        localStorage.removeItem('currentUser');  // xóa localStorage
        dispatch(signOut()); // reset Redux
        setAuth(false);
        setUserName('');
        navigate('/login');
        window.location.reload();
      } else {
        console.log('Logout failed:', res.data.Error);
      }
    } catch (err) {
      console.log('Logout failed:', err);
    }
  };

  const handleLogo = () => navigate('/');
  const goToAccount = () => navigate('/Accountinfo');

  return (
    <header className="header" ref={headerRef}>
      <Container>
        <div className="nav__wrapper d-flex align-items-center justify-content-between">
          <div className="logo" onClick={handleLogo}>
            <img src={logo} alt="logo" />
            <h5>Tasty Treat</h5>
          </div>

          <div className="navigation" ref={menuRef}>
            <div className="menu d-flex align-items-center gap-5" onClick={closeMenu}>
              {nav__links.map((item, index) => (
                <NavLink
                  to={item.path}
                  key={index}
                  className={(navClass) => navClass.isActive ? "active__menu" : ""}
                >
                  {item.display}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="nav__right d-flex align-items-center gap-4">
            <span className="cart__icon" onClick={toggleCart}>
              <i className="ri-shopping-basket-line"></i>
              <span className="cart__badge">{totalQuantity}</span>
            </span>

            <span className="user d-flex align-items-center gap-2">
              {auth ? (
                <>
                  <i className="ri-user-line" onClick={goToAccount} style={{ cursor: "pointer" }} />
                  <p className="m-0" style={{ cursor: "pointer" }} onClick={goToAccount}>
                    {userName}
                  </p>
                  <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Sign out</button>
                </>
              ) : (
                <Link to="/login">
                  <i className="ri-user-line" />
                </Link>
              )}
            </span>

            <span className="mobile__menu" onClick={toggleMenu}>
              <i className="ri-menu-line"></i>
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
