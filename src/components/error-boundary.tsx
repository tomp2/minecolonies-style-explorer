import posthog from "posthog-js";
import * as React from "react";

export class CustomErrorBoundary extends React.Component<React.ComponentPropsWithoutRef<"div">> {
    state: { hasError: boolean };

    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        posthog.captureException(error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <div className="mx-auto flex max-w-screen-sm flex-col items-center justify-center gap-4 p-4">
                        <h1 className="text-2xl font-bold text-red-500">Something went wrong.</h1>
                        <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
                        <p className="text-sm text-muted-foreground">
                            If the problem persists, contact me or send feedback
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
