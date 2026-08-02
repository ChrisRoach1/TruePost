import type { IconBaseProps, IconType } from 'react-icons';
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaYoutube,
} from 'react-icons/fa6';

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
    const Icon = iconRegistry[icon];

    if (Icon) {
        return <Icon {...props} />;
    }

}

export default SystemIcon;
