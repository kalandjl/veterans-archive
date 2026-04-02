import { merriweather } from "@/app/fonts";
import Link from "next/link";
import { FC } from "react";

interface Props {

}

const Nav: FC<Props> = (props) => {

    return (
        <>

            {/* Header */}
            <header className="border-b border-gray-300 py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className={`text-xl font-bold tracking-tight uppercase ${merriweather.className}`}>
                <span className="font-light text-gray-500 lowercase italic">The veterans archive</span>
                </div>
                <nav className="space-x-6 text-sm font-medium tracking-wide">
                <Link href="#index" className="hover:text-gray-500 transition-colors">Browse Index</Link>
                <Link href="#featured" className="hover:text-gray-500 transition-colors">Featured Exhibits</Link>
                <Link href="/about" className="hover:text-gray-500 transition-colors">About the Project</Link>
                <Link href="/contact" className="hover:text-gray-500 transition-colors">Contact</Link>
                <Link href="/testimonials" className="hover:text-gray-500 transition-colors">Testimonials</Link>
                </nav>
            </header>
        
        </>
    )
}

export default Nav