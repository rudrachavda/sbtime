import Banner from "@/components/Banner";
import UatBanner from "@/components/Banner/UatBanner";
import NavigationBar from "@/components/NavigationBar";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import useMinWidth from "@/hooks/useMinWidth";

import Hero from "./Hero";
import styles from "./Landing.module.scss";
import Organization from "./Organization";

const Home = () => {
  const { headerRef } = useHeaderHeight();
  const isAbovePhone = useMinWidth(768);

  return (
    <div className={styles.root}>
      <div ref={headerRef} className={styles.stickyHeader}>
        <UatBanner />
        {isAbovePhone && <Banner />}
        <NavigationBar />
      </div>
      <Hero />
      <Organization />
    </div>
  );
};

export default Home;
