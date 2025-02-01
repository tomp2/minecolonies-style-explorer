import { useRef } from "react";

export function useTitle() {
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

    return { setTitle, resetTitle };
}
