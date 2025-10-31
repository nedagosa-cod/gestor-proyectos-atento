import { Route, Routes } from "react-router-dom";
import Home from "@/components/app/Home";
import Simulator from "@/components/app/simulator/Simulator";
import Navbar from "@/components/web/Navbar";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulator" element={<Simulator />} />
      </Routes>
    </div>
  );
}

export default App;
