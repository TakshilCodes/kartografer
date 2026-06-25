import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/logo.png"
import Desktop_logo from "@/public/logo&text_forlight.png"

const footerLinks = [
    {
        label: "Home",
        href: "/",
    },
    {
        label: "Explore",
        href: "/explore",
    },
];

const socialLinks = [
    {
        label: "GitHub",
        href: "https://github.com/TakshilCodes",
        icon: GithubIcon,
    },
    {
        label: "X",
        href: "https://x.com/TakshilDev",
        icon: XIcon,
    },
    {
        label: "Instagram",
        href: "https://instagram.com/takshillpandya",
        icon: InstagramIcon,
    },
    {
        label: "LinkedIn",
        href: "https://linkedin.com/in/takshilpandya",
        icon: LinkedinIcon,
    },
];

export default function LandingFooter() {
    return (
        <footer className="bg-white px-4 pt-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col items-center">
                    <Link href="/" aria-label="Kartografer home">
                        {/* Mobile: icon only */}
                        <span className="relative block h-10 w-10 sm:hidden">
                            <Image
                                src={Logo}
                                alt="Kartografer"
                                fill
                                className="object-contain"
                                sizes="40px"
                            />
                        </span>

                        {/* Desktop: full logo */}
                        <span className="relative hidden h-10 w-45 sm:block">
                            <Image
                                src={Desktop_logo}
                                alt="Kartografer"
                                fill
                                className="object-contain object-center"
                                sizes="180px"
                            />
                        </span>
                    </Link>

                    <nav className="mt-8 flex items-center justify-center gap-6">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-[#5b351a] transition hover:text-[#2d1e11]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-10 h-px w-full bg-[#e8dbc8]" />

                    <div className="mt-8 flex w-full items-center justify-between gap-6">
                        <p className="text-sm font-medium text-[#806a55]">
                            © {new Date().getFullYear()} Kartografer
                        </p>

                        <div className="flex items-center gap-5">
                            {socialLinks.map((social) => {
                                const Icon = social.icon;

                                return (
                                    <Link
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={social.label}
                                        className="text-[#806a55] transition hover:text-[#5b351a]"
                                    >
                                        <Icon className="h-5 w-5" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-18 w-full overflow-hidden sm:h-40 lg:h-52">
                        <h2 className="select-none translate-y-4 text-center text-[4rem] font-black leading-none tracking-[-0.09em] text-[#5b351a]/40 sm:translate-y-6 sm:text-[8rem] lg:translate-y-8 lg:text-[12rem]">
                            Kartografer
                        </h2>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function GithubIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="currentColor"
        >
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.95c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="currentColor"
        >
            <path d="M18.9 2.75h3.07l-6.7 7.66 7.88 10.84h-6.17l-4.83-6.56-5.53 6.56H3.55l7.17-8.28L3.16 2.75h6.33l4.36 5.99 5.05-5.99Zm-1.08 16.6h1.7L8.56 4.55H6.73l11.09 14.8Z" />
        </svg>
    );
}

function InstagramIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}

function LinkedinIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="currentColor"
        >
            <path d="M5.34 8.86H2.67v12.39h2.67V8.86ZM4 3.25a1.55 1.55 0 1 0 0 3.1 1.55 1.55 0 0 0 0-3.1Zm6.1 5.61H7.54v12.39h2.67v-6.46c0-1.7.78-2.72 2.19-2.72 1.28 0 1.9.9 1.9 2.72v6.46h2.67v-7.15c0-3.04-1.63-4.46-3.8-4.46-1.75 0-2.54.96-2.97 1.64h-.1V8.86Z" />
        </svg>
    );
}