import cv from "@techstark/opencv-js";
import HomographicCanvas from "./canvas";
import "./index.less";

// @ts-ignore
window.cv = cv;

function HomePage(props: any) {
    return (
        <div>
            <div>
                <HomographicCanvas />
            </div>
        </div>
    );
}

export default HomePage;
