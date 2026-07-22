import type { IconBaseProps, IconType } from 'react-icons';
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaYoutube,
} from 'react-icons/fa6';

/**
 * Maps `systems.icon` values from the database to react-icons components.
 * Adding a platform means adding its icon here and referencing the key
 * in the system's `icon` column.
 */
const iconRegistry: Record<string, IconType> = {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaYoutube,
};

type Props = {
    icon: string;
} & IconBaseProps;

export function SystemIcon({ icon, ...props }: Props) {
    console.log(icon);
    const Icon = iconRegistry[icon];

    if (Icon) {
        return <Icon {...props} />;
    }

    // Fallback for rows that still store raw SVG path data.
    const { size, className, style, color } = props;

    return (
        <div></div>
    );
}

export default SystemIcon;
