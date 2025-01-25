import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-primary text-white py-4">
      <div className="container mx-auto px-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img
            src="/lovable-uploads/b9120193-99d9-4dc1-9d16-3b8f68d943e7.png"
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