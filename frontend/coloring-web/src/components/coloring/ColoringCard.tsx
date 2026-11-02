import { Link } from "react-router-dom";
import type { ColoringPage } from "../../api/coloringPagesApi";

interface ColoringCardProps {
    page: ColoringPage;
}

function getMediaUrl(url: string | null) {
    if (!url) {
        return null;
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    return `http://localhost:5100${url.startsWith("/") ? url : `/${url}`}`;
}

function ColoringCard({
    page,
}: ColoringCardProps) {
    const imageUrl =
        getMediaUrl(page.thumbnailUrl) ||
        getMediaUrl(page.svgUrl);

    return (
        <Link
            to={`/coloring/${page.slug}`}
            className="coloring-card"
        >
            <div className="coloring-card-image">

                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={page.title}
                        loading="lazy"
                    />
                ) : (
                    <div className="coloring-card-placeholder">
                        <span>🎨</span>
                    </div>
                )}

            </div>

            <div className="coloring-card-content">

                <h3>
                    {page.title}
                </h3>

                <div className="coloring-card-meta">

                    <span>
                        ⭐{" "}
                        {page.rating > 0
                            ? page.rating.toFixed(1)
                            : "New"}
                    </span>

                    <span>
                        👁 {page.views}
                    </span>

                </div>

            </div>
        </Link>
    );
}

export default ColoringCard;