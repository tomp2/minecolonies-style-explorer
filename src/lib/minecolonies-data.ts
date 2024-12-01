type BuildingBaseData = {
    size: { x: number, y: number, z: number };
    hutBlocks: string[];
}

export type BuildingData = BuildingBaseData & ({
    levels: false;
    images: {
        frontExists: boolean;
        backExists: boolean;
    }
} | {
    levels: number;
    images: {
        [key: string]: {
            frontExists: boolean;
            backExists: boolean;
        }
    }
}
    )
export type Category = {
    blueprints: { [key: string]: BuildingData };
    categories: { [key: string]: Category };
}

export type Theme = {
    displayName: string;
    authors: string[];
    buildingData: Category;
}


export function flattenCategories(category: Category, path: string[] = []): string[] {
    const result: string[] = [];

    Object.entries(category.categories).forEach(([name, subCategory]) => {
        const newPath = [...path, name];
        result.push(newPath.join('/'));
        result.push(...flattenCategories(subCategory, newPath));
    });

    return result;
}

export function getBuildings(category: Category, path: string[] = []): {
    name: string;
    path: string[];
    data: BuildingData
}[] {
    const result: { name: string; path: string[]; data: BuildingData }[] = [];

    Object.entries(category.blueprints).forEach(([name, data]) => {
        result.push({name, path, data});
    });

    Object.entries(category.categories).forEach(([name, subCategory]) => {
        const subBuildings = getBuildings(subCategory, [...path, name]);
        result.push(...subBuildings);
    });

    return result;
}

export function getCategoryByPath(theme: Theme, path: string[]): Category | null {
    let current: Category = theme.buildingData;
    for (const segment of path) {
        if (current.categories[segment]) {
            current = current.categories[segment];
        } else {
            return null;
        }
    }
    return current;
}
