export function HomeArticle() {
    return (
        <article className="prose prose-xl dark:prose-invert mx-auto mt-5 p-2 pb-14">
            <h1 className="text-4xl">
                Welcome to the <em>unofficial</em> MineColonies Style Explorer!
            </h1>
            <h3>Introduction</h3>
            <p>
                This is an <em>unofficial</em> site for browsing the styles and buildings for the{" "}
                <a className="text-blue-500" href="https://minecolonies.com/">
                    MineColonies
                </a>{" "}
                mod. I created this site to make it easy to visually explore buildings by style and category.
            </p>
            <p>
                Start by selecting styles from the sidebar or searching for buildings. Click images to see
                alternative angles, and use the heart icon to save favorites.{" "}
                <strong className="hidden rounded bg-blue-200 px-1 pb-1 sm:inline">Right clicking</strong>
                <strong className="inline rounded bg-blue-200 px-1 pb-1 sm:hidden">Holding down on</strong> a
                style on the sidebar will deselect all other styles.
            </p>
            <h3>Support MineColonies</h3>
            <p>
                Style-pack authors are next to the style name. If you want to browse the buildings in-game,
                Minecolonies has a Patreon where you can get access to their official <b>schematics server</b>
                . Read more about it on their{" "}
                <a className="text-blue-500" href="https://www.patreon.com/minecolonies">
                    Patreon page
                </a>
            </p>

            <h3>FAQ & Missing Stuff</h3>
            <p>
                <strong>Vote</strong> for the next stylepack in the sidebar! Screenshotting styles takes some
                time, so new styles may take a while to be added. If you notice outdated/missing buildings, or
                have any other suggestions (like new features), send feedback using the button at the top
                right.
            </p>
            <p>
                Currently the screenshots are of the maximum level of the building. Taking screenshots of
                different levels would take too much time.
            </p>
        </article>
    );
}
