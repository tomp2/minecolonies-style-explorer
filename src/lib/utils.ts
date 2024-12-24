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
    return building.searchString.includes(searchTerm.toLowerCase());
}
