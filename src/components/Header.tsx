import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-transparent text-white py-4">
      <div className="container mx-auto px-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img
            src="https://storage.googleapis.com/gpt-engineer-file-uploads/4i4bv71mVYNtuYbHioyA5ViKOhz2/c8923569-7ef6-436d-ba2a-8550360be420"
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