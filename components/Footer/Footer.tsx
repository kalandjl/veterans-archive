import { FC } from "react";

interface Props {

}

const Footer: FC<Props> = (props) => {

    return (
        <>
            {/* Footer */}
            <footer className="border-t border-gray-300 py-8 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} [Your Name]. Dedicated to those who served. Built with Next.js.</p>
            </footer>
        
        </>
    )
}

export default Footer