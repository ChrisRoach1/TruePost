import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
    values: string[];
    onChange: (next: string[]) => void;
    max?: number;
    placeholder?: string;
    label?: string;
};

export function TagInput({
    values,
    onChange,
    max = 3,
    placeholder,
    label,
}: Props) {
    const [draft, setDraft] = useState('');
    const atMax = values.length >= max;

    function addValue(raw: string) {
        const value = raw.trim();

        if (!value || atMax || values.includes(value)) {
            return;
        }

        onChange([...values, value]);
        setDraft('');
    }

    function removeValue(value: string) {
        onChange(values.filter((v) => v !== value));
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addValue(draft);
        } else if (
            e.key === 'Backspace' &&
            draft.length === 0 &&
            values.length > 0
        ) {
            removeValue(values[values.length - 1]);
        }
    }

    return (
        <div className="space-y-1.5">
            {label && (
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                        {label}
                    </span>
                    <span className="text-[11px] tabular-nums text-muted-foreground/70">
                        {values.length}/{max}
                    </span>
                </div>
            )}
            {values.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {values.map((value) => (
                        <Badge
                            key={value}
                            variant="secondary"
                            className="gap-1 py-1 pr-1 pl-2.5 text-[13px]"
                        >
                            {value}
                            <button
                                type="button"
                                onClick={() => removeValue(value)}
                                className="grid size-4 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                                aria-label={`Remove ${value}`}
                            >
                                <X size={12} />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
            {!atMax && (
                <div className="flex items-center gap-2">
                    <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="h-9 flex-1 text-[13px]"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addValue(draft)}
                        disabled={draft.trim().length === 0}
                        className="h-9"
                    >
                        <Plus className="size-3.5" />
                        Add
                    </Button>
                </div>
            )}
        </div>
    );
}

export default TagInput;
