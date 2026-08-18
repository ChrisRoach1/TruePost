import type { IconBaseProps, IconType } from 'react-icons';
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaYoutube,
    FaThreads
} from 'react-icons/fa6';

const iconRegistry: Record<string, IconType> = {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaXTwitter,
    FaYoutube,
    FaThreads,
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
