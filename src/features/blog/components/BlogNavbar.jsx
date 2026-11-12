import Logo from "/blog_logo.svg";
import { Link } from "react-router-dom";
const Navbar = () => {
  return (
    <div>
      <nav>
        <Link>
          <img src={Logo} alt="" />
        </Link>
        <ul>
          <li>
            <Link to="/blog">Blogs</Link>
          </li>
          <li>
            <Link to="/blog/feature">Features</Link>
          </li>
          <li>
            <Link to={"/blog/about"}>About</Link>
          </li>
          <li>
            <Link to={"/blog/contact"}>Contact</Link>
          </li>
        </ul>
      </nav>
    </div>);

};

export default Navbar;
