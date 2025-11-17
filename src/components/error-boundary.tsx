import * as Sentry from "@sentry/react";
import React from "react";

export default function ErrorBoundary({ children, ...props }: React.ComponentPropsWithoutRef<"div">) {
    return (
        <Sentry.ErrorBoundary
            fallback={
                <div className="flex size-full items-center justify-center" {...props}>
                    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 p-4">
                        <h1 className="text-2xl font-bold text-red-500">Something went wrong.</h1>
                        <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
                        <p className="text-sm text-muted-foreground">
                            If the problem persists, contact me or send feedback
                        </p>
                    </div>
                </div>
            }
        >
            {children}
        </Sentry.ErrorBoundary>
    );
}
