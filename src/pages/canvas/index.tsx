import cv from "@techstark/opencv-js";
import { useEffect, useRef, useState } from "react";
import "../index.less";

// @ts-ignore
window.cv = cv;

function HomographicCanvas(props: any) {
    const [imgUrl, setImgUrl] = useState<string>("");
    const [originalCorners, setOriginalCorners] = useState([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
    ]);

    const [corners, setCorners] = useState([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
    ]);

    const [inputs, setInputs] = useState([1, 0, 0, 0, 1, 0, 0, 0, 1]);

    const [mouseOnCorner, setMouseOnCorner] = useState(-1);
    const [dragCorners, setDragCorners] = useState(false);

    const canvasRef = useRef(null);
    const imgElementRef = useRef(null);

    const [redrawImage, setRedrawImage] = useState(false);

    useEffect(() => {
        try {
            drawOnCanvas();
        } catch (error) {
            console.log(error);
        }
    }, [redrawImage]);

    function drawOnCanvas(newCorners: number[][] = corners) {
        const imgElement: any = imgElementRef.current;
        const canvas: any = canvasRef.current;
        const homography = inputs;

        let homography_mat = cv.matFromArray(3, 3, cv.CV_32FC1, homography);
        const { width, height } = canvas.getBoundingClientRect();
        let size = new cv.Size(width, height);
        try {
            let src = cv.imread(imgElement);
            let dst = new cv.Mat();
            cv.warpPerspective(
                src,
                dst,
                homography_mat,
                size,
                cv.INTER_LINEAR,
                cv.BORDER_CONSTANT,
                new cv.Scalar()
            );
            cv.imshow("canvasOutput", dst);

            if (!dragCorners) {
                let cornersMat = cv.matFromArray(
                    4,
                    1,
                    cv.CV_32FC2,
                    originalCorners.flat()
                );
                let newCornersMat = new cv.Mat(4, 1, cv.CV_32FC2);

                cv.perspectiveTransform(
                    cornersMat,
                    newCornersMat,
                    homography_mat
                );
                setCornersFromMatrix(newCornersMat);

                // cornersMat.delete();
                // newCornersMat.delete();
            }
            drawCorners(newCorners);
        } catch (error) {
            console.log(error);
            return;
        }

        // src.delete();
        // dst.delete();
        // homography_mat.delete();
    }

    function setCornersFromMatrix(matrix: any) {
        corners[0][0] = matrix.floatAt(0);
        corners[0][1] = matrix.floatAt(1);
        corners[1][0] = matrix.floatAt(2);
        corners[1][1] = matrix.floatAt(3);
        corners[2][0] = matrix.floatAt(4);
        corners[2][1] = matrix.floatAt(5);
        corners[3][0] = matrix.floatAt(6);
        corners[3][1] = matrix.floatAt(7);

        setCorners([...corners]);
    }

    function setMatrixValues(matrix: any) {
        inputs[0] = matrix.doubleAt(0).toFixed(5);
        inputs[1] = matrix.doubleAt(1).toFixed(5);
        inputs[2] = matrix.doubleAt(2);
        inputs[3] = matrix.doubleAt(3).toFixed(5);
        inputs[4] = matrix.doubleAt(4).toFixed(5);
        inputs[5] = matrix.doubleAt(5);
        inputs[6] = matrix.doubleAt(6).toFixed(5);
        inputs[7] = matrix.doubleAt(7).toFixed(5);
        inputs[8] = matrix.doubleAt(8);
        setInputs([...inputs]);
    }

    function drawCorners(corners: number[][]) {
        const canvas: any = canvasRef.current;
        const context = canvas.getContext("2d");
        corners.forEach((corner) => {
            let x = corner[0];
            let y = corner[1];
            context.strokeStyle = "black";
            context.lineWidth = 3;
            context.moveTo(x, y - 2);
            context.lineTo(x, y + 2);
            context.moveTo(x - 2, y);
            context.lineTo(x + 2, y);
            context.stroke();
        });
    }

    function onMouseDown(e: MouseEvent) {
        // compute if near corner and select corner for drag and drop
        // @ts-ignore
        let clickX = e.nativeEvent.offsetX;
        // @ts-ignore
        let clickY = e.nativeEvent.offsetY;
        let closeEnough = 20;

        let clickedCorner = corners.findIndex((corner) => {
            return (
                Math.sqrt(
                    (corner[0] - clickX) ** 2 + (corner[1] - clickY) ** 2
                ) <= closeEnough
            );
        });
        // console.log("Click On Corner", clickedCorner);

        let center = corners.reduce(
            (corner, center) => [center[0] + corner[0], center[1] + corner[1]],
            [0, 0]
        );
        center = [center[0] / 4, center[1] / 4];
        let minX = Math.min(...corners.map((corner) => corner[0]));
        let maxX = Math.max(...corners.map((corner) => corner[0]));
        let minY = Math.min(...corners.map((corner) => corner[1]));
        let maxY = Math.max(...corners.map((corner) => corner[1]));
        let isOnImage =
            minX <= clickX &&
            clickX <= maxX &&
            minY <= clickY &&
            clickY <= maxY;
        if (clickedCorner === -1 && isOnImage) {
            clickedCorner = 4;
            setDragCorners(false);
        }
        if (clickedCorner !== -1) {
            setDragCorners(true);
        }
        setMouseOnCorner(clickedCorner);
    }

    function onMouseMove(e: MouseEvent) {
        // @ts-ignore
        let clickX = e.nativeEvent.offsetX;
        // @ts-ignore
        let clickY = e.nativeEvent.offsetY;

        if (mouseOnCorner > -1) {
            if (mouseOnCorner === 4) {
                setCorners(
                    corners.map((corner) => {
                        return [
                            corner[0] + e.movementX,
                            corner[1] + e.movementY,
                        ];
                    })
                );
                // setCorners([...newCorners]);
            } else {
                corners[mouseOnCorner] = [clickX, clickY];
                setCorners([...corners]);
            }
            calcMatrix();
        }
    }

    function onMouseUp(e: MouseEvent) {
        setMouseOnCorner(-1);
        setDragCorners(false);
    }

    function resetMatrix() {
        setInputs([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        setCorners([
            [0, 0],
            [200, 0],
            [0, 200],
            [200, 200],
        ]);
        drawOnCanvas();
    }

    function calcMatrix() {
        let srcPts = cv.matFromArray(4, 2, cv.CV_32FC1, originalCorners.flat());
        let dstPts = cv.matFromArray(4, 2, cv.CV_32FC1, corners.flat());

        let matrix = cv.getPerspectiveTransform(srcPts, dstPts);
        setMatrixValues(matrix);
        // srcPts.delete();
        // dstPts.delete();
        // matrix.delete();
        setRedrawImage(!redrawImage);
    }

    function onInputChange(val: number, pos: number) {
        inputs[pos] = val;
        setInputs([...inputs]);
        drawOnCanvas();
    }

    window.addEventListener("resize", (e) => {
        drawOnCanvas();
    });

    return (
        <div className='flex-container'>
            <div className='inputoutput'>
                <img
                    id='imageSrc'
                    alt='No Image'
                    src={imgUrl}
                    ref={imgElementRef}
                    style={{ display: "none" }}
                    onLoad={(e) => {
                        const imgElement: any = imgElementRef.current;

                        // let mat = cv.imread(imgElement);

                        const newCorners = [
                            [0, 0],
                            [imgElement.width, 0],
                            [0, imgElement.height],
                            [imgElement.width, imgElement.height],
                        ];
                        setCorners([...newCorners]);
                        setOriginalCorners([...newCorners]);
                        // mat.delete();
                        resetMatrix();

                        // redraw the image after uploading the image
                        setRedrawImage(!redrawImage);
                    }}
                />
                <input
                    type='file'
                    name='file'
                    accept='image/*'
                    onChange={(e: any) => {
                        if (e.target.files[0]) {
                            setImgUrl(URL.createObjectURL(e.target.files[0]));
                        }
                    }}
                />
            </div>

            <div className='inputoutput'>
                <canvas
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                    onMouseOut={onMouseUp}
                    id='canvasOutput'
                    ref={canvasRef}
                    {...props}
                />

                {/* <canvas ref={imgElementRef} /> */}
            </div>

            <div id='homography-grid'>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[0]}
                    value={inputs[0]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 0);
                    }}
                    step={0.01}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[1]}
                    value={inputs[1]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 1);
                    }}
                    step={0.01}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[2]}
                    value={inputs[2]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 2);
                    }}
                    step={1}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[3]}
                    value={inputs[3]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 3);
                    }}
                    step={0.01}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[4]}
                    value={inputs[4]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 4);
                    }}
                    step={0.01}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[5]}
                    value={inputs[5]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 5);
                    }}
                    step={1}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[6]}
                    value={inputs[6]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 6);
                    }}
                    step={0.001}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[7]}
                    value={inputs[7]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 7);
                    }}
                    step={0.001}></input>
                <input
                    type='number'
                    className='homography-input'
                    defaultValue={inputs[8]}
                    value={inputs[8]}
                    onChange={(e) => {
                        onInputChange(Number(e.target.value), 8);
                    }}
                    step={0.01}></input>
            </div>

            <button id='reset' onClick={() => {}}>
                Reset
            </button>
        </div>
    );
}

export default HomographicCanvas;
