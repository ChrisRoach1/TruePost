import { useMemo } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getTimezones } from '@/lib/timezones';

type Props = {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    required?: boolean;
    placeholder?: string;
    className?: string;
};

export default function TimezoneSelect({
    id,
    name,
    value,
    defaultValue,
    onValueChange,
    required,
    placeholder = 'Select a timezone',
    className,
}: Props) {
    const timezones = useMemo(() => getTimezones(), []);

    return (
        <Select
            name={name}
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange}
            required={required}
        >
            <SelectTrigger
                id={id}
                className={className ?? 'w-full'}
                data-slot="select-trigger"
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
                {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
