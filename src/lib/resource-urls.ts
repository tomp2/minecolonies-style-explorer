export const urlPrefix = process.env.NODE_ENV === "production" ? "/minecolonies-style-explorer" : "";

export function getStyleIconUrl(styleName: string): string {
    return `${urlPrefix}/minecolonies/${styleName}/icon.png`;
}

export function getStyleJsonUrl(styleName: string): string {
    return `${urlPrefix}/minecolonies/${styleName}/style.json`;
}
