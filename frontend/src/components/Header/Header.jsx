import React, { useRef, useEffect, useState } from "react";
import axios from 'axios';
import { Container } from "reactstrap";
import logo from "../../assets/images/res-logo.png";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { cartUiActions } from "../../store/shopping-cart/cartUiSlice";
import "../../styles/header.css";

const nav__links = [
  {
    display: "Home",
    path: "/home",
  },
  {
    display: "Menu",
    path: "/menu",
  },
  {
    display: "Cart",
    path: "/cart",
  },
  {
    display: "Discount",
    path: "/discount",
  },
];

const Header = () => {
  const [userName, setUserName] = useState("");
  const currentUser = useSelector((state) => state.user.currentUser);
  const [auth, setAuth] = useState(false);
 
  useEffect(() => {
    if (currentUser === null) {
      setAuth(false);
    } else {
      setAuth(true);
      setUserName(currentUser);
    }
  }, [currentUser]);

  const menuRef = useRef();
  const headerRef = useRef();
  const totalQuantity = useSelector((state) => state.cart.totalQuantity);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    if (menuRef.current) {
      menuRef.current.classList.toggle("show__menu");
    }
  }

  const closeMenu = () => {
    if (menuRef.current) {
      menuRef.current.classList.remove("show__menu");
    }
  }

  const toggleCart = () => {
    dispatch(cartUiActions.toggle());
  };

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
          headerRef.current.classList.add("header__shrink");
        } else {
          headerRef.current.classList.remove("header__shrink");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  axios.defaults.withCredentials = true;

  const handleLogout = async () => {
    try {
      const response = await axios.get('http://localhost:5001/logout');
      if (response.data.Status === 'Success') {
        setAuth(false);
        navigate('/login');
        window.location.reload();
      } else {
        console.log('Logout failed:', response.data.Error);
      }
    } catch (error) {
      console.log('Logout failed:', error);
    }
  };
  
  const handleUpdateProfile = () => {
    navigate('/Accountinfo');
  };

  const handleLogo = () => {
    navigate('/');
  }; 

  return (
    <header className="header" ref={headerRef}>
      <Container>
        <div className="nav__wrapper d-flex align-items-center justify-content-between">
          <div className="logo" onClick={handleLogo}>
            <img src={logo} alt="logo" />
            <h5>Tasty Treat</h5>
          </div>

          {/* ======= menu ======= */}
          <div className="navigation" ref={menuRef}>
            <div className="menu d-flex align-items-center gap-5" onClick={closeMenu}>
              {nav__links.map((item, index) => (
                <NavLink
                  to={item.path}
                  key={index}
                  className={(navClass) =>
                    navClass.isActive ? "active__menu" : ""
                  }
                  onClick={closeMenu}
                >
                  {item.display}
                </NavLink>
              ))}
            </div>
          </div>

          {/* ======== nav right icons ========= */}
          <div className="nav__right d-flex align-items-center gap-4">
            <span className="cart__icon" onClick={toggleCart}>
              <i className="ri-shopping-basket-line"></i>
              <span className="cart__badge">{totalQuantity}</span>
            </span>

            {auth ? (
              <span className="user">
                <i className="ri-user-line" />
                <p onClick={handleUpdateProfile}>{userName}</p>
                <button onClick={handleLogout}>Sign out</button>
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
