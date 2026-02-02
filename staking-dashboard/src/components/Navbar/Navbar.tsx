import { useState } from "react"
import { Link } from "react-router-dom"
import { Icon } from "@/components/Icon"
import { CustomConnectButton } from "../CustomConnectButton"

/**
 * Main navigation bar component
 * Fixed header with logo, navigation links, and wallet connection
 */
export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { name: "POSITIONS", href: "/my-position" },
    { name: "GOVERNANCE", href: "/governance" },
    { name: "DOCS", href: "https://docs.aztec.network/" },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }
  return (
    <nav className="fixed top-0 w-full bg-ink/80 backdrop-blur-md border-b border-parchment/10 z-[60]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center min-w-[44px] min-h-[44px] justify-center p-2">
            <img
              src="https://cdn.prod.website-files.com/6847005bc403085c1aa846e0/6847514dc37a9e8cfe8a66b8_aztec-logo.svg"
              alt="Aztec"
              className="h-4 w-auto xs:h-5 sm:h-6 md:h-7 lg:h-8 transition-all duration-200 hover:scale-105"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {menuItems.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.name}
                  to={item.href}
                  className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/80 hover:text-chartreuse transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-oracle-standard text-sm uppercase tracking-wider text-parchment/80 hover:text-chartreuse transition-colors font-medium"
                >
                  {item.name}
                </a>
              )
            )}
            <CustomConnectButton size="sm" />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-parchment p-3 hover:text-chartreuse transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Icon name={isMenuOpen ? 'x' : 'menu'} className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-ink/95 backdrop-blur-md border-t border-parchment/10 fixed top-20 left-0 right-0 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="px-4 py-6 space-y-6">
            {menuItems.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMenu}
                  className="block font-oracle-standard text-base uppercase tracking-wider text-parchment hover:text-chartreuse transition-colors font-medium py-2"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="block font-oracle-standard text-base uppercase tracking-wider text-parchment hover:text-chartreuse transition-colors font-medium py-2"
                >
                  {item.name}
                </a>
              )
            )}
            <div className="pt-4 border-t border-parchment/10">
              <CustomConnectButton fullWidth size="lg" />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
};