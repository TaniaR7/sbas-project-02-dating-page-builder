import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-primary text-white py-4">
      <div className="container mx-auto px-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img
            src="/placeholder.svg"
            alt="Singlebörsen-Aktuell Logo"
            className="h-8 w-8"
          />
          <span className="text-xl font-semibold">Singlebörsen-Aktuell</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;