import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MainScene } from "../web/main-scene";
import { Link } from "react-router-dom";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative w-full h-[calc(100vh-66px)] overflow-hidden bg-linear-to-r ">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-white">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-orange-500 animate-spin mb-4"></div>
          <h1 className="text-2xl font-bold text-black">
            Cargando Admin Training<span className="animate-pulse">...</span>
          </h1>
        </div>
      ) : (
        <div className="h-full">
          <div className="absolute inset-0 z-10 h-full bg-linear-to-r from-gray-100 to-gray-300">
            <MainScene />
          </div>

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 pointer-events-none">
            <div className="max-w-3xl text-center mb-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto mt-20">
                <Link to="/simulator">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-lg w-full sm:w-auto shadow-lg">
                    Simulator
                  </Button>
                </Link>
                <Link to="/web-training">
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-400 hover:bg-orange-900/20 px-8 py-6 text-lg w-full sm:w-auto shadow-lg"
                  >
                    Web Training
                  </Button>
                </Link>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex flex-wrap justify-center gap-4 md:gap-8 text-white px-4">
              <Link to="/simulator" className="pointer-events-auto">
                <Button
                  variant="link"
                  className="text-white hover:text-orange-400"
                >
                  Simulador
                </Button>
              </Link>
              <Link to="/web-training" className="pointer-events-auto">
                <Button
                  variant="link"
                  className="text-white hover:text-orange-400"
                >
                  Web Training
                </Button>
              </Link>
              <Link to="/metaverso" className="pointer-events-auto">
                <Button
                  variant="link"
                  className="text-white hover:text-orange-400"
                >
                  Metaverso
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
