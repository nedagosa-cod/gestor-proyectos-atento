import { Route, Routes } from "react-router-dom";
import Home from "@/components/app/Home";
import Simulator from "@/components/app/simulator/Simulator";
import Navbar from "@/components/web/Navbar";
import WebTraining from "./components/app/web_training/WebTraining";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/web-training" element={<WebTraining />} />
      </Routes>
    </div>
  );
}

export default App;
