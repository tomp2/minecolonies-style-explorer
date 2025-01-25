import { BuildingData } from "@/lib/theme-data.ts";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function buildingMatchesStringSearchTerm(searchTerm: string, building: BuildingData) {
    if (searchTerm === "") {
        return true;
    }
    return building.searchString.includes(searchTerm.toLowerCase());
}

export function buildingMatchesRegExpSearchTerm(searchTerm: RegExp, building: BuildingData) {
    return searchTerm.test(building.searchString);
}
