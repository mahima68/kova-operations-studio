import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Kova Lifestyle · Operations Studio',description:'A fictional Indian T-shirt brand. Plan a launch, manage stock and follow every order in one place.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
