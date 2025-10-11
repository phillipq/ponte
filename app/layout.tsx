import "styles/tailwind.css"
import { SessionProvider } from "components/SessionProvider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=The+Seasons:wght@400;700&family=Montserrat:wght@300;400;500;600;700&family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;700&family=Italiana&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Prevent autofill overlay issues */
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus,
            input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 30px #FDF9F3 inset !important;
            }
          `
        }} />
      </head>
      <body className="bg-ponte-cream text-ponte-black font-body">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
