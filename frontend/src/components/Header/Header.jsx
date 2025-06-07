import React, { useRef, useEffect } from "react";
import axios from "../../utils/axiosInstance";
import { Container } from "reactstrap";
import logo from "../../assets/images/res-logo.png";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { cartUiActions } from "../../store/shopping-cart/cartUiSlice";
import { signOut, signInSuccess } from "../../store/user/userSlice";
import "../../styles/header.css";

const nav__links = [
  { display: "Home", path: "/home" },
  { display: "Menu", path: "/menu" },
  { display: "Cart", path: "/cart" },
  { display: "Discount", path: "/discount" },
];

const Header = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const menuRef = useRef();
  const headerRef = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);

  // 👇 Auto load currentUser from localStorage (if Redux is empty)
  useEffect(() => {
    if (!currentUser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          dispatch(signInSuccess(parsedUser));
        } catch (err) {
          console.error("Failed to parse user from localStorage", err);
        }
      }
    }
  }, [currentUser, dispatch]);

  const toggleMenu = () => menuRef.current?.classList.toggle("show__menu");
  const closeMenu = () => menuRef.current?.classList.remove("show__menu");
  const toggleCart = () => dispatch(cartUiActions.toggle());

  const handleLogout = async () => {
    try {
      const res = await axios.get('http://localhost:5001/logout', { withCredentials: true });
      if (res.data.Status === 'Success') {
        localStorage.removeItem('currentUser');
        dispatch(signOut());
        navigate('/login');
      } else {
        console.log('Logout failed:', res.data.Error);
      }
    } catch (err) {
      console.log('Logout failed:', err);
    }
  };

  const handleLogo = () => navigate('/');
  const goToAccount = () => navigate('/Accountinfo');

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

            {currentUser ? (
              <span className="user d-flex align-items-center gap-2">
                <i className="ri-user-line" onClick={goToAccount} style={{ cursor: "pointer" }} />
                <p className="m-0" onClick={goToAccount} style={{ cursor: "pointer" }}>
                  {currentUser.username}
                </p>
                <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Sign out</button>
              </span>
            ) : (
              <span className="user">
                <Link to="/login">
                  <i className="ri-user-line" />
                </Link>
              </span>
            )}

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
