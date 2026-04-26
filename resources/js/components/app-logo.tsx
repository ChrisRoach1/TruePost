import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-8 rounded-md" />
            <div className="ml-1 grid flex-1 text-left">
                <span
                    className="truncate text-lg leading-none font-semibold tracking-tight"
                    style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
                >
                    <span className="text-foreground">True</span>
                    <span className="text-[#3FB582]">Post</span>
                </span>
            </div>
        </>
    );
}
