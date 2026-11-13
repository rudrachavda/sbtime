import { useEffect, useMemo, useState } from "react";

import classNames from "classnames";
import { motion } from "framer-motion";
import {
  Bookmark,
  ChatBubbleQuestion,
  Check,
  HalfMoon,
  LogOut,
  MacOsWindow,
  Menu,
  ProfileCircle,
  Star,
  SunLight,
  User,
  Xmark,
} from "iconoir-react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  Button,
  DropdownMenu,
  Flex,
  IconButton,
  MenuItem,
  useTheme,
} from "@repo/theme";

import GetStartedButton from "@/components/GetStartedButton";
import { useAllNavItems } from "@/hooks/api/nav-item";
import useUser from "@/hooks/useUser";
import { signOut } from "@/lib/api";
import { BERKELEY_GOGGLES_URL } from "@/lib/berkeley-goggles";
import { FEATURES } from "@/lib/features";
import { RecentType, getPageUrl } from "@/lib/recent";

import styles from "./NavigationBar.module.scss";

interface ExtraNavItem {
  key: string;
  label: string;
  badgeText?: string | null;
  href: string;
}

// Shown only while the nav items query is loading or has failed, so hiding the
// item from the staff dashboard does not resurrect this copy.
const FALLBACK_NAV_ITEMS: ExtraNavItem[] = [
  {
    key: "fallback-clubs",
    label: "Clubs",
    badgeText: "NEW",
    href: BERKELEY_GOGGLES_URL,
  },
];

interface NavigationBarProps {
  invert?: boolean;
  accentColor?: string;
  noBorder?: boolean;
}

// Appearance choices in the profile menu (null = follow the system)
const THEME_OPTIONS = [
  { value: null, label: "System", Icon: MacOsWindow },
  { value: "light", label: "Light", Icon: SunLight },
  { value: "dark", label: "Dark", Icon: HalfMoon },
] as const;

// The login page, returning to the current page after Google sign-in.
const loginPath = (location: { pathname: string; search: string }) =>
  location.pathname === "/" || location.pathname === "/login"
    ? "/login"
    : `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export default function NavigationBar({
  invert,
  accentColor,
  noBorder,
}: NavigationBarProps) {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const {
    data: navItems,
    loading: navItemsLoading,
    error: navItemsError,
  } = useAllNavItems();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";
  const savedGradesUrl = getPageUrl(RecentType.GradesPage);
  const gradesPath = savedGradesUrl ? `/grades${savedGradesUrl}` : "/grades";
  const savedEnrollmentUrl = getPageUrl(RecentType.EnrollmentPage);
  const enrollmentPath = savedEnrollmentUrl
    ? `/enrollment${savedEnrollmentUrl}`
    : "/enrollment";

  const extraNavItems = useMemo<ExtraNavItem[]>(() => {
    if (!FEATURES.extraNavItems) return [];
    if (navItemsLoading || navItemsError) return FALLBACK_NAV_ITEMS;

    return (navItems ?? []).map((navItem) => ({
      key: navItem.id,
      label: navItem.label,
      badgeText: navItem.badgeText,
      // Clicks are counted server-side before redirecting to the real url
      href: `/nav-item/click/${navItem.id}`,
    }));
  }, [navItems, navItemsLoading, navItemsError]);

  // Shortcut for signed-out visitors: L opens the login page (on every page,
  // returning here afterwards). G belongs to the Get started button.
  useEffect(() => {
    if (user) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "l") navigate(loginPath(location));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user, navigate, location]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {menuOpen &&
        createPortal(
          <motion.div
            className={styles.menuOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.nav
              className={styles.menuNav}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 },
                },
              }}
            >
              {[
                { to: "/catalog", label: "Catalog", show: true },
                { to: "/schedules", label: "Scheduler", show: true },
                { to: "/gradtrak", label: "Gradtrak", show: FEATURES.gradtrak },
                { to: gradesPath, label: "Grades", show: FEATURES.grades },
                {
                  to: enrollmentPath,
                  label: "Enrollment",
                  show: FEATURES.enrollment,
                },
              ]
                .filter(({ show }) => show)
                .map(({ to, label }) => (
                  <motion.div
                    key={to}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <NavLink to={to} onClick={() => setMenuOpen(false)}>
                      {label}
                    </NavLink>
                  </motion.div>
                ))}
              {extraNavItems.map((navItem) => (
                <motion.div
                  key={navItem.key}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <a
                    href={navItem.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.menuNavExternal}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className={styles.extraItemLabel}>
                      {navItem.label}
                      {navItem.badgeText && (
                        <span className={styles.newBadge}>
                          {navItem.badgeText}
                        </span>
                      )}
                    </span>
                  </a>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>,
          document.body
        )}
      <Flex
        align="center"
        flexShrink="0"
        gap="3"
        className={classNames(styles.root, {
          [styles.invert]: invert,
          [styles.noBorder]: noBorder,
        })}
      >
        <Link className={styles.brand} to="/">
          SBTime
        </Link>
        <div className={styles.group}>
          <NavLink to="/catalog">
            {({ isActive }) => (
              <MenuItem className={styles.item} active={isActive}>
                Catalog
              </MenuItem>
            )}
          </NavLink>
          <NavLink to="/schedules">
            {({ isActive }) => (
              <MenuItem className={styles.item} active={isActive}>
                Scheduler
              </MenuItem>
            )}
          </NavLink>
          {FEATURES.gradtrak && (
            <NavLink to="/gradtrak">
              {({ isActive }) => (
                <MenuItem className={styles.item} active={isActive}>
                  Gradtrak
                </MenuItem>
              )}
            </NavLink>
          )}
          {FEATURES.grades && (
            <NavLink to={gradesPath}>
              {({ isActive }) => (
                <MenuItem className={styles.item} active={isActive}>
                  Grades
                </MenuItem>
              )}
            </NavLink>
          )}
          {FEATURES.enrollment && (
            <NavLink to={enrollmentPath}>
              {({ isActive }) => (
                <MenuItem className={styles.item} active={isActive}>
                  Enrollment
                </MenuItem>
              )}
            </NavLink>
          )}
          {extraNavItems.map((navItem) => (
            <MenuItem
              key={navItem.key}
              as="a"
              href={navItem.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.item}
            >
              <span className={styles.extraItemLabel}>
                {navItem.label}
                {navItem.badgeText && (
                  <span className={styles.newBadge}>{navItem.badgeText}</span>
                )}
              </span>
            </MenuItem>
          ))}
        </div>
        {/* Right-hand group: the grid's third column */}
        <div className={styles.actions}>
          <IconButton
            className={styles.compactMenuButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <motion.div
              animate={{ rotate: menuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              {menuOpen ? <Xmark /> : <Menu />}
            </motion.div>
          </IconButton>
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  className={styles.button}
                  style={{ color: accentColor }}
                >
                  {user.name?.split(" ")[0] ?? "Profile"}
                  <User />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                sideOffset={5}
                align="end"
                forceTheme={invert ? "light" : undefined}
                className={styles.profileDropdown}
              >
                <DropdownMenu.Item asChild>
                  <Link to="/profile">
                    <ProfileCircle width={18} height={18} /> Account
                  </Link>
                </DropdownMenu.Item>
                {/* Theme for pages without a footer (Catalog, Scheduler,
                    GradTrak); same setting as the footer's switch. */}
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger>
                    <MacOsWindow width={18} height={18} /> Appearance
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.SubContent
                    sideOffset={4}
                    forceTheme={invert ? "light" : undefined}
                    className={styles.profileDropdown}
                  >
                    {THEME_OPTIONS.map(({ value, label, Icon }) => (
                      <DropdownMenu.Item
                        key={label}
                        onSelect={() => setTheme(value)}
                      >
                        <Icon width={18} height={18} /> {label}
                        {theme === value && (
                          <Check
                            width={16}
                            height={16}
                            className={styles.checkmark}
                          />
                        )}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
                <DropdownMenu.Item asChild>
                  <Link to="/profile/bookmarks">
                    <Bookmark width={18} height={18} /> Bookmarks
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link to="/profile/ratings">
                    <Star width={18} height={18} /> Ratings
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link to="/profile/support">
                    <ChatBubbleQuestion width={18} height={18} /> Support
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onSelect={() => signOut()}>
                  <LogOut width={18} height={18} /> Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ) : (
            // Signed out: Login everywhere (back to this page afterwards);
            // Get started only on the home page.
            <div className={styles.authLinks}>
              <Link to={loginPath(location)} className={styles.loginLink}>
                Login <kbd className={styles.kbd}>L</kbd>
              </Link>
              {isLandingPage && <GetStartedButton />}
            </div>
          )}
        </div>
      </Flex>
    </>
  );
}
