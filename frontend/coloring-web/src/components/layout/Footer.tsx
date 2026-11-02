import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="site-footer">

            <div className="footer-container">

                <div className="footer-brand">
                    <Link
                        to="/"
                        className="footer-logo"
                    >
                        <span>🎨</span>
                        TheColorClone
                    </Link>

                    <p>
                        Discover fun and creative coloring pages
                        for kids, families, students and everyone
                        who loves coloring.
                    </p>
                </div>

                <div className="footer-column">
                    <h3>Explore</h3>

                    <Link to="/">
                        Home
                    </Link>

                    <a href="#popular">
                        Popular Pages
                    </a>

                    <a href="#latest">
                        Latest Pages
                    </a>

                    <a href="#categories">
                        Categories
                    </a>
                </div>

                <div className="footer-column">
                    <h3>Categories</h3>

                    <a href="#categories">
                        Animals
                    </a>

                    <a href="#categories">
                        Kids
                    </a>

                    <a href="#categories">
                        Nature
                    </a>

                    <a href="#categories">
                        Holidays
                    </a>
                </div>

                <div className="footer-column">
                    <h3>Website</h3>

                    <a href="#">
                        About Us
                    </a>

                    <a href="#">
                        Contact
                    </a>

                    <a href="#">
                        Privacy Policy
                    </a>

                    <a href="#">
                        Terms
                    </a>
                </div>

            </div>

            <div className="footer-bottom">
                <p>
                    © {new Date().getFullYear()} TheColorClone.
                    All rights reserved.
                </p>
            </div>

        </footer>
    );
}

export default Footer;