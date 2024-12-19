import { BuildingData } from "@/lib/theme-data.ts";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function buildingMatchesSearchTerm(searchTerm: string, building: BuildingData) {
    if (searchTerm === "") {
        return true;
    }
    const searchTermLower = searchTerm.toLowerCase();

    return (
        (building.displayName && building.displayName.toLowerCase().includes(searchTermLower)) ||
        building.name.toLowerCase().includes(searchTermLower) ||
        (building.json.hutBlocks &&
            building.json.hutBlocks.some(block =>
                block.toLowerCase().replace("blockhut", "").includes(searchTermLower),
            )) ||
        building.path.join("/").toLowerCase().includes(searchTermLower)
    );
}
