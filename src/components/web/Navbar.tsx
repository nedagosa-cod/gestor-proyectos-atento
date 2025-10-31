import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex gap-6">
        <li>
          <Link to="/" className="text-white hover:text-gray-300">
            Home
          </Link>
        </li>
        <li>
          <Link to="/simulator" className="text-white hover:text-gray-300">
            Simulator
          </Link>
        </li>
      </ul>
    </nav>
  );
}
