import { Inter, Merriweather } from "next/font/google";

// Optimize fonts using Next.js built-in font loader
export const inter = Inter({ subsets: ["latin"] });
export const merriweather = Merriweather({ 
  weight: ["300", "400", "700"], 
  style: ["normal", "italic"],
  subsets: ["latin"] 
});