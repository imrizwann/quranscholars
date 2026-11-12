import { useEffect } from "react";
import { useRef, useState } from "react";
import Canvas_1 from "@/sketches/p5/test-code/Canvas_1.jsx";
const TestPage = () => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const elemRef = useRef();

  useEffect(() => {
    if (elemRef.current) {
      setWidth(elemRef.current.offsetWidth);
      setHeight(elemRef.current.offsetHeight);
    }
    const handleWindowResize = () => {
      if (elemRef.current) {
        setWidth(elemRef.current.offsetWidth);
        setHeight(elemRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <>
      <div ref={elemRef}>
        <Canvas_1 dimensions={{ width, height }} />
        <div>
          <div>
            <div>
              <h5>Card title</h5>
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores
                dolorum aut quasi. Distinctio nam ad molestiae excepturi minima
                dolorem laborum.
              </p>
              <button>
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>);

};

export default TestPage;
