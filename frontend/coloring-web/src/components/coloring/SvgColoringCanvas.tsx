import { useEffect, useRef, useState } from "react";

interface SvgColoringCanvasProps {
    svgUrl: string;
}

const API_BASE_URL = "http://localhost:5100";

const COLORS = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#EAB308",
    "#84CC16",
    "#22C55E",
    "#14B8A6",
    "#06B6D4",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#EC4899",
    "#F43F5E",
    "#000000",
    "#FFFFFF",
];

const DRAWABLE_ELEMENTS =
    "path, circle, ellipse, rect, polygon, polyline";

function getFullSvgUrl(svgUrl: string): string {
    if (!svgUrl) {
        return "";
    }

    if (
        svgUrl.startsWith("http://") ||
        svgUrl.startsWith("https://")
    ) {
        return svgUrl;
    }

    return `${API_BASE_URL}/${svgUrl.replace(/^\/+/, "")}`;
}

export default function SvgColoringCanvas({
    svgUrl,
}: SvgColoringCanvasProps) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const [svgContent, setSvgContent] =
        useState("");

    const [selectedColor, setSelectedColor] =
        useState("#EF4444");

    const [history, setHistory] =
        useState<string[]>([]);

    const [historyIndex, setHistoryIndex] =
        useState(-1);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
     * =========================================
     * LOAD SVG
     * =========================================
     */

    useEffect(() => {
        let cancelled = false;

        async function loadSvg() {
            try {
                setLoading(true);
                setError("");

                const url =
                    getFullSvgUrl(svgUrl);

                if (!url) {
                    throw new Error(
                        "SVG URL is missing."
                    );
                }

                const response =
                    await fetch(url);

                if (!response.ok) {
                    throw new Error(
                        `Failed to load SVG. Status: ${response.status}`
                    );
                }

                const text =
                    await response.text();

                if (cancelled) {
                    return;
                }

                setSvgContent(text);

                setHistory([text]);

                setHistoryIndex(0);

            } catch (err) {
                console.error(
                    "SVG loading error:",
                    err
                );

                if (!cancelled) {
                    setError(
                        "Failed to load coloring image."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSvg();

        return () => {
            cancelled = true;
        };

    }, [svgUrl]);


    /*
     * =========================================
     * SVG COLORING
     * =========================================
     */

    useEffect(() => {
        const container =
            containerRef.current;

        if (
            !container ||
            !svgContent
        ) {
            return;
        }

        const svg =
            container.querySelector("svg");

        if (!svg) {
            return;
        }


        const handleClick = (
            event: Event
        ) => {

            const target =
                event.target as
                SVGElement | null;

            if (!target) {
                return;
            }

            const tagName =
                target.tagName.toLowerCase();

            const drawableElements = [
                "path",
                "circle",
                "ellipse",
                "rect",
                "polygon",
                "polyline",
            ];

            if (
                !drawableElements.includes(
                    tagName
                )
            ) {
                return;
            }


            /*
             * Clone the complete SVG.
             */
            const clonedSvg =
                svg.cloneNode(
                    true
                ) as SVGElement;


            /*
             * Find all drawable elements
             * in original SVG.
             */
            const originalElements =
                Array.from(
                    svg.querySelectorAll(
                        DRAWABLE_ELEMENTS
                    )
                );


            /*
             * Find clicked element index.
             */
            const clickedIndex =
                originalElements.indexOf(
                    target as Element
                );

            if (
                clickedIndex === -1
            ) {
                return;
            }


            /*
             * Find same element
             * inside cloned SVG.
             */
            const clonedElements =
                Array.from(
                    clonedSvg.querySelectorAll(
                        DRAWABLE_ELEMENTS
                    )
                );

            const clonedTarget =
                clonedElements[
                clickedIndex
                ] as
                SVGElement |
                undefined;

            if (!clonedTarget) {
                return;
            }


            /*
             * Apply selected color.
             */
            clonedTarget.setAttribute(
                "fill",
                selectedColor
            );

            clonedTarget.style.fill =
                selectedColor;


            /*
             * Create updated SVG.
             */
            const updatedSvg =
                clonedSvg.outerHTML;


            /*
             * Remove redo history
             * after a new action.
             */
            const newHistory =
                history.slice(
                    0,
                    historyIndex + 1
                );

            newHistory.push(
                updatedSvg
            );


            /*
             * Update state.
             */
            setSvgContent(
                updatedSvg
            );

            setHistory(
                newHistory
            );

            setHistoryIndex(
                newHistory.length - 1
            );
        };


        svg.addEventListener(
            "click",
            handleClick
        );


        return () => {
            svg.removeEventListener(
                "click",
                handleClick
            );
        };

    }, [
        svgContent,
        selectedColor,
        history,
        historyIndex,
    ]);


    /*
     * =========================================
     * UNDO
     * =========================================
     */

    function handleUndo() {
        if (
            historyIndex <= 0
        ) {
            return;
        }

        const newIndex =
            historyIndex - 1;

        setHistoryIndex(
            newIndex
        );

        setSvgContent(
            history[newIndex]
        );
    }


    /*
     * =========================================
     * REDO
     * =========================================
     */

    function handleRedo() {
        if (
            historyIndex === -1 ||
            historyIndex >=
            history.length - 1
        ) {
            return;
        }

        const newIndex =
            historyIndex + 1;

        setHistoryIndex(
            newIndex
        );

        setSvgContent(
            history[newIndex]
        );
    }


    /*
     * =========================================
     * RESET
     * =========================================
     */

    function handleReset() {
        if (
            history.length === 0
        ) {
            return;
        }

        const originalSvg =
            history[0];

        setSvgContent(
            originalSvg
        );

        setHistory([
            originalSvg,
        ]);

        setHistoryIndex(0);
    }


    /*
     * =========================================
     * DOWNLOAD
     * =========================================
     */

    function handleDownload() {
        if (!svgContent) {
            return;
        }

        const blob =
            new Blob(
                [svgContent],
                {
                    type:
                        "image/svg+xml;charset=utf-8",
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            "colored-page.svg";

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(
            url
        );
    }


    /*
     * =========================================
     * LOADING STATE
     * =========================================
     */

    if (loading) {
        return (
            <div className="coloring-state coloring-loading">
                <div className="coloring-state-spinner" />

                <p>
                    Loading coloring page...
                </p>
            </div>
        );
    }


    /*
     * =========================================
     * ERROR STATE
     * =========================================
     */

    if (error) {
        return (
            <div className="coloring-state coloring-error">
                <div className="coloring-error-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load artwork
                </h3>

                <p>
                    {error}
                </p>
            </div>
        );
    }


    /*
     * =========================================
     * MAIN COLORING EDITOR
     * =========================================
     */

    return (
        <div className="svg-coloring-editor">

            {/* =================================
                COLOR PALETTE
            ================================== */}

            <div className="coloring-palette-panel">

                <div className="coloring-palette-header">

                    <div>
                        <span className="coloring-tool-label">
                            COLOR TOOLS
                        </span>

                        <h3 className="coloring-palette-title">
                            🎨 Choose a Color
                        </h3>
                    </div>

                    <div className="selected-color-display">

                        <span>
                            Selected
                        </span>

                        <span
                            className="selected-color-swatch"
                            style={{
                                backgroundColor:
                                    selectedColor,
                            }}
                        />

                        <strong>
                            {selectedColor}
                        </strong>

                    </div>

                </div>


                <div className="coloring-palette">

                    {COLORS.map(
                        (color) => {

                            const isSelected =
                                selectedColor ===
                                color;

                            return (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        setSelectedColor(
                                            color
                                        )
                                    }
                                    title={`Select ${color}`}
                                    aria-label={`Select ${color}`}
                                    aria-pressed={
                                        isSelected
                                    }
                                    className={`color-palette-button ${isSelected
                                            ? "selected"
                                            : ""
                                        }`}
                                    style={{
                                        backgroundColor:
                                            color,
                                    }}
                                />
                            );
                        }
                    )}

                </div>

            </div>


            {/* =================================
                SVG CANVAS
            ================================== */}

            <div
                ref={containerRef}
                className="coloring-canvas"
            >

                <div
                    className="coloring-svg-wrapper"
                    dangerouslySetInnerHTML={{
                        __html:
                            svgContent,
                    }}
                />

            </div>


            {/* =================================
                CONTROLS
            ================================== */}

            <div className="coloring-controls">

                <button
                    type="button"
                    onClick={handleUndo}
                    disabled={
                        historyIndex <= 0
                    }
                    className="coloring-control-button"
                >
                    ↶ Undo
                </button>


                <button
                    type="button"
                    onClick={handleRedo}
                    disabled={
                        historyIndex >=
                        history.length - 1
                    }
                    className="coloring-control-button"
                >
                    ↷ Redo
                </button>


                <button
                    type="button"
                    onClick={handleReset}
                    className="coloring-control-button"
                >
                    🔄 Reset
                </button>


                <button
                    type="button"
                    onClick={handleDownload}
                    className="coloring-control-button coloring-download-button"
                >
                    📥 Download Artwork
                </button>

            </div>


            {/* =================================
                HELP TEXT
            ================================== */}

            <div className="coloring-help-text">

                <span>
                    💡
                </span>

                <span>
                    Select a color, then click
                    any part of the coloring
                    image to fill it.
                </span>

            </div>

        </div>
    );
}