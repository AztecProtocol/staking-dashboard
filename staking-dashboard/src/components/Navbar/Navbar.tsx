import { useLayoutEffect, useState, type MouseEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAccount } from "wagmi"
import { Icon } from "@/components/Icon"
import { CustomConnectButton } from "../CustomConnectButton"
import { POSITIONS_SECTION_ID, WEBSITE_URL } from "@/config/links"

const DOCS_URL = "https://docs.aztec.network/operate/operators"

/** How far down the bar's middle sits, for deciding what is behind it. */
const BAR_MIDLINE = 50

/**
 * Main navigation: the floating glass pill from aztec.network.
 *
 * It carries paper type while it is over a brand picture (any element marked
 * `data-nav-surface="dark"`) and ink type once it is over the page.
 */
export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isOverPicture, setIsOverPicture] = useState(false)
  const { isConnected } = useAccount()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const closeMenu = () => setIsMenuOpen(false)

  useLayoutEffect(() => {
    let frame = 0
    const probe = () => {
      frame = 0
      let overPicture = false
      document.querySelectorAll('[data-nav-surface="dark"]').forEach((element) => {
        const { top, bottom } = element.getBoundingClientRect()
        if (top <= BAR_MIDLINE && bottom > BAR_MIDLINE) overPicture = true
      })
      setIsOverPicture(overPicture)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(probe)
    }

    probe()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [pathname])

  // The positions live in a section of the home view rather than on a page of
  // their own, so the link has to scroll there, after routing home if needed.
  const goToPositions = (event: MouseEvent) => {
    // A modified click (new tab, new window) is the browser's to handle.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    closeMenu()
    const isOnPositionsView = pathname === "/" || pathname === "/my-position"
    if (!isOnPositionsView) navigate("/my-position")
    // Arriving from another view, the providers block above the section is
    // still expanding (700ms); measure once it has settled.
    window.setTimeout(
      () => {
        document
          .getElementById(POSITIONS_SECTION_ID)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      },
      isOnPositionsView ? 0 : 750
    )
  }

  const links = (
    <>
      {isConnected && (
        <a href="/my-position" onClick={goToPositions} className="nav-link">
          Positions
        </a>
      )}
      <a
        href={WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={closeMenu}
        className="nav-link"
      >
        Website
      </a>
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={closeMenu}
        className="nav-link"
      >
        Docs
      </a>
    </>
  )

  return (
    <header
      className={`${isOverPicture ? "on-dark" : "on-light"} fixed top-0 inset-x-0 z-[60] pointer-events-none`}
    >
      <div className="nav-pill pointer-events-auto flex items-center justify-between h-[52px] md:h-[49px] mt-[13px] md:mt-[25px] mx-3 md:mx-[clamp(12px,3.96vw,57px)] pl-[18px] pr-1.5 md:px-[clamp(18px,2.5vw,36px)]">
        {/* The wordmark as supplied: paper over a picture, ink over the page */}
        <Link to="/" className="flex items-center shrink-0 h-11" onClick={closeMenu}>
          <img
            src={isOverPicture ? "/assets/aztec-wordmark-paper.svg" : "/assets/aztec-wordmark-ink.svg"}
            alt="Aztec"
            width={619}
            height={143}
            className="h-[15px] md:h-[21px] w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {links}
          <div className="ml-3">
            <CustomConnectButton
              size="sm"
              accountVariant="secondary"
              chainClassName="hidden lg:inline-flex"
            />
          </div>
        </nav>

        <button
          onClick={() => setIsMenuOpen((open) => !open)}
          className="md:hidden text-parchment min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <Icon name={isMenuOpen ? "x" : "menu"} className="w-5 h-5" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="nav-sheet md:hidden pointer-events-auto mx-3 mt-2 p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <nav className="flex flex-col items-start gap-1" aria-label="Main">
            {links}
          </nav>
          <div className="mt-4 pt-4 border-t border-parchment/10">
            <CustomConnectButton fullWidth size="default" accountVariant="secondary" />
          </div>
        </div>
      )}

      {/* Both wordmarks are needed as the bar crosses the hero; fetch the second ahead of time */}
      <link
        rel="preload"
        as="image"
        href={isOverPicture ? "/assets/aztec-wordmark-ink.svg" : "/assets/aztec-wordmark-paper.svg"}
      />
    </header>
  )
};
