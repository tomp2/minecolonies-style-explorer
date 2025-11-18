import { styleInfoMap } from "@/lib/theme-data.ts";

export const DEFAULT_TITLE = "Minecolonies Style Explorer";
export const DEFAULT_DESC =
    "Browse pictures of the Minecolonies buildings and styles. Search, filter, save favorites and compare styles!";

export function createPageTitleAndDescription(styles: string[]) {
    const defaultMeta = {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
    };
    if (styles.length === 0) {
        return defaultMeta;
    }
    if (styles.length === 1) {
        const styleId = styles[0];
        const styleInfo = styleInfoMap.get(styleId);
        if (!styleInfo) {
            return defaultMeta;
        }
        return {
            title: `All ${styleInfo.displayName} buildings`,
            description: `Pictures of all ${styleInfo.displayName} buildings in Minecolonies. Search, filter, save favorites and compare styles!`,
        };
    }

    const styleDisplayNames = styles.map(styleId => {
        const styleInfo = styleInfoMap.get(styleId);
        return styleInfo?.displayName || styleId;
    });

    let stylesString = "";
    if (styleDisplayNames.length === 2) {
        stylesString = styleDisplayNames.join(" and ");
    } else {
        stylesString = styleDisplayNames.slice(0, -1).join(", ") + ", and " + styleDisplayNames.at(-1);
    }

    return {
        title: `All buildings from ${stylesString} styles`,
        description: `Pictures of all ${stylesString} buildings in Minecolonies. Search, filter, save favorites and compare styles!`,
    };
}

export function setTitle(title: string) {
    if (typeof document === "undefined") return;
    if (document.title !== title) document.title = title;
}

export function setDescription(description: string) {
    if (typeof document === "undefined") return;
    const meta = document.querySelector("meta[name=description]");
    if (meta) meta.setAttribute("content", description);
}


export function setTitleAndDescriptionFrom(styles: string[]) {
    const { title, description } = createPageTitleAndDescription(styles);
    setTitle(title);
    setDescription(description);
}
