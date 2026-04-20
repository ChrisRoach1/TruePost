import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { System } from '@/types';

type Props = {
    platform: System;
    onConnect?: (platform: System) => void;
    onDisconnect?: (platform: System) => void;
    isConnected: boolean;
};

export function SocialPlatformCard({ platform, onConnect, onDisconnect, isConnected }: Props) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4">
                <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${platform.background_color}15` }}
                >
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: platform.icon_color }}>
                        <path d={platform.icon} />
                    </svg>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{platform.name}</span>
                        {isConnected && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
                                Connected
                            </Badge>
                        )}
                    </div>
                    {!isConnected ? (
                        <span className="text-xs text-muted-foreground">
                        Not connected
                    </span>
                    ) : ( <></> )}
                </div>

                {isConnected ? (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDisconnect?.(platform)}
                    >
                        Disconnect
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onConnect?.(platform)}
                    >
                        Connect
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
