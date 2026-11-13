import { Outlet, useLocation } from "react-router";

import { Flex } from "@repo/theme";

import Banner from "@/components/Banner";
import UatBanner from "@/components/Banner/UatBanner";
import Footer from "@/components/Footer";
import NavigationBar from "@/components/NavigationBar";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import useMinWidth from "@/hooks/useMinWidth";
import { IS_UAT } from "@/lib/environment";

import styles from "./Layout.module.scss";

interface LayoutProps {
  banner?: boolean;
  bannerFallback?: boolean;
  header?: boolean;
  footer?: boolean;
  scrollLock?: boolean;
  headerBorder?: boolean;
}

export default function Layout({
  banner = true,
  bannerFallback = true,
  header = true,
  footer = true,
  scrollLock = false,
  headerBorder = true,
}: LayoutProps) {
  const { headerRef } = useHeaderHeight();
  const isAbovePhone = useMinWidth(768);
  const showBanner = banner && isAbovePhone;
  const { pathname } = useLocation();

  return (
    <Flex direction="column">
      <Flex
        direction="column"
        className={scrollLock ? styles.viewLocked : styles.view}
      >
        {(showBanner || header) && (
          <div ref={headerRef} className={styles.stickyHeader}>
            <UatBanner />
            {showBanner && <Banner showFallback={bannerFallback} />}
            {header && <NavigationBar noBorder={!headerBorder} />}
          </div>
        )}
        {/* Full-screen pages (home, schedule editor, GradTrak) have no
            shared header; home adds its own UAT strip, the rest get a badge. */}
        {IS_UAT && !showBanner && !header && pathname !== "/" && (
          <UatBanner compact />
        )}
        <Outlet />
      </Flex>
      {footer && <Footer />}
    </Flex>
  );
}
