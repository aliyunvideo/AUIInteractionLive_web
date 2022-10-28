import Banner from "./Banner";
import ChatBox from "./ChatBox";
import styles from "./index.less";
import Player from "./Player";

function MobileRoom() {
  return (
    <div className={styles["room-wrap"]}>
      <Player />
      <Banner />
      <ChatBox />
    </div>
  );
}

export default MobileRoom;
