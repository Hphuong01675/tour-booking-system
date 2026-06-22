import React from 'react';
import { Link } from 'react-router-dom';

const GuideFooter = () => {
    return (
        <footer className="bg-surface-container-low dark:bg-surface-container-high w-full px-margin-desktop py-md mt-auto border-t border-outline-variant/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-md">
                <div className="flex flex-col items-center md:items-start gap-xs">
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-inverse-on-surface">
                        Chip3Chip
                    </h3>
                    <p className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant">
                        © 2024 Chip3Chip Travel Agency. All rights reserved.
                    </p>
                </div>
                <div className="flex items-center gap-lg">
                    <Link
                        className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant hover:underline hover:text-secondary transition-all"
                        to="#"
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant hover:underline hover:text-secondary transition-all"
                        to="#"
                    >
                        Terms of Service
                    </Link>
                    <Link
                        className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant hover:underline hover:text-secondary transition-all"
                        to="#"
                    >
                        Support
                    </Link>
                    <Link
                        className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant hover:underline hover:text-secondary transition-all"
                        to="#"
                    >
                        Contact Us
                    </Link>
                </div>
                <div className="flex gap-md">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-primary">public</span>
                    </button>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-highest hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-primary">mail</span>
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default GuideFooter;