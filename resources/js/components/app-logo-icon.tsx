import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <>
            <img
                src="/truepost-icon-color.svg"
                alt="TruePost"
                className={`block dark:hidden ${className ?? ''}`.trim()}
                {...props}
            />
            <img
                src="/truepost-icon-inverse.svg"
                alt="TruePost"
                className={`hidden dark:block ${className ?? ''}`.trim()}
                {...props}
            />
        </>
    );
}
