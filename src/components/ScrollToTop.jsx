import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll the window to the top
        window.scrollTo(0, 0);

        // Also handle cases where a specific internal container might be scrolling
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.scrollTop = 0;
        }
    }, [pathname]);

    return null;
}
