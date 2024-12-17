export const blockToDisplayName = {
    blockhutfield: "Field",
    blockhutplantationfield: "Plantation Field",
    blockhutalchemist: "Alchemist Tower",
    blockhutkitchen: "Cookery",
    blockhutgraveyard: "Graveyard",
    blockhutnetherworker: "Nether Mine",
    blockhutarchery: "Archery",
    blockhutbaker: "Bakery",
    blockhutbarracks: "Barracks",
    blockhutbarrackstower: "Barracks Tower",
    blockhutbeekeeper: "Apiary",
    blockhutblacksmith: "Blacksmith's Hut",
    blockhutbuilder: "Builder's Hut",
    blockhutchickenherder: "Chicken Farmer's Hut",
    blockhutcitizen: "Residence",
    blockhutcombatacademy: "Combat Academy",
    blockhutcomposter: "Composter's Hut",
    blockhutconcretemixer: "Concrete Mixer's Hut",
    blockhutcook: "Restaurant",
    blockhutcowboy: "Cowhand's Hut",
    blockhutcrusher: "Crusher",
    blockhutdeliveryman: "Courier's Hut",
    blockhutdyer: "Dyer's Hut",
    blockhutenchanter: "Enchanter's Tower",
    blockhutfarmer: "Farm",
    blockhutfisherman: "Fisher's Hut",
    blockhutfletcher: "Fletcher's Hut",
    blockhutflorist: "Flower Shop",
    blockhutglassblower: "Glassblower's Hut",
    blockhutguardtower: "Guard Tower",
    blockhuthospital: "Hospital",
    blockhutlibrary: "Library",
    blockhutlumberjack: "Forester's Hut",
    blockhutmechanic: "Mechanic's Hut",
    blockhutminer: "Mine",
    blockhutplantation: "Plantation",
    blockhutrabbithutch: "Rabbit Hutch",
    blockhutsawmill: "Sawmill",
    blockhutschool: "School",
    blockhutshepherd: "Shepherd's Hut",
    blockhutsifter: "Sifter",
    blockhutsmeltery: "Smeltery",
    blockhutstonemason: "Stonemason's Hut",
    blockhutstonesmeltery: "Stone Smeltery",
    blockhutswineherder: "Swineherd's Hut",
    blockhuttavern: "Tavern",
    blockhuttownhall: "Town Hall",
    blockhutuniversity: "University",
    blockhutwarehouse: "Warehouse",
    blockhutmysticalsite: "Mystical Site",
} satisfies Record<string, string>;

export type HutBlock = keyof typeof blockToDisplayName;