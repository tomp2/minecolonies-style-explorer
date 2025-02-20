import { styleInfoMap } from "@/lib/theme-data.ts";
import { useRef } from "react";

export function usePageMeta() {
    const documentDefined = typeof document !== "undefined";

    const originalTitle = useRef(documentDefined ? document.title : "");

    const setTitle = (title: string) => {
        if (!documentDefined) return;
        if (document.title !== title) document.title = title;
    };

    const resetTitle = () => {
        if (!documentDefined) return;
        document.title = originalTitle.current;
    };

    const originalDescription = useRef(
        documentDefined ? document.querySelector("meta[name=description]")?.getAttribute("content") : "",
    );

    const setDescription = (description: string) => {
        if (!documentDefined) return;
        if (!originalDescription.current) return; // No original description to reset to later
        const meta = document.querySelector("meta[name=description]");
        if (meta) meta.setAttribute("content", description);
    };

    const resetDescription = () => {
        if (!documentDefined) return;
        if (!originalDescription.current) return;
        const meta = document.querySelector("meta[name=description]");
        if (meta) meta.setAttribute("content", originalDescription.current);
    };

    const setStyles = (styleIds: string[]) => {
        if (!documentDefined) return;
        if (!originalDescription.current || !originalDescription.current) return;

        if (styleIds.length === 0) {
            resetTitle();
            resetDescription();
            return;
        }
        if (styleIds.length === 1) {
            const styleId = styleIds[0];
            const styleInfo = styleInfoMap.get(styleId);
            if (!styleInfo) return;

            const title = `All ${styleInfo.displayName} buildings`;
            const description = `Pictures of all ${styleInfo.displayName} buildings in Minecolonies. Search, filter, save favorites and compare styles!`;
            setTitle(title);
            setDescription(description);
            return;
        }

        const styleDisplayNames = styleIds.map(styleId => {
            const styleInfo = styleInfoMap.get(styleId);
            return styleInfo?.displayName || styleId;
        });

        let stylesString = "";
        if (styleDisplayNames.length === 2) {
            stylesString = styleDisplayNames.join(" and ");
        } else {
            stylesString = styleDisplayNames.slice(0, -1).join(", ") + ", and " + styleDisplayNames.at(-1);
        }

        const title = `All buildings from ${stylesString} styles`;
        const description = `Pictures of all ${stylesString} buildings in Minecolonies. Search, filter, save favorites and compare styles!`;
        setTitle(title);
        setDescription(description);
    };

    return { setTitle, resetTitle, setDescription, resetDescription, setStyles };
}
