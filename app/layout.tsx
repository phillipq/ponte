import "styles/tailwind.css"
import { SessionProvider } from "components/SessionProvider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
