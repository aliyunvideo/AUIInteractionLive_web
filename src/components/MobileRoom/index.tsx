import { useContext, useMemo, useState, useRef } from 'react';
import { RoomContext } from '@/context/room';
import { RoomStatusEnum } from '@/types/room';
import Banner from "./Banner";
import ChatBox from "./ChatBox";
import styles from "./index.less";
import Player from "./Player";

function MobileRoom() {
  const { roomState } = useContext(RoomContext);
  const { status, isPlayback } = roomState;
  const [controlHidden, setControlHidden] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const hiddenTimer = useRef<number|undefined>();

  const isInited = useMemo(() => {
    return status !== RoomStatusEnum.no_data;
  }, [status]);

  const wrapClass = useMemo(() => {
    let str = styles['room-wrap'];
    if (controlHidden) {
      str += ` ${styles['control-hidden']}`;
    }
    return str;
  }, [controlHidden]);

  const setHiddenTimer = () => {
    if (hiddenTimer.current) {
      clearTimeout(hiddenTimer.current);
    }
    // 5 秒后隐藏控件，进入沉浸式观看
    hiddenTimer.current = window.setTimeout(() => {
      setControlHidden(true);
    }, 5000);
  };

  // 只有回看才会触发
  const showControls = () => {
    if (playerReady && isPlayback) {
      setControlHidden(false);
      setHiddenTimer();
    }
  };

  const handleReady = () => {
    setPlayerReady(true);
    setHiddenTimer();
  };

  return (
    <div
      className={wrapClass}
      onClick={showControls}
    >
      <Player onReady={handleReady} />
      <Banner />
      {
        isInited && (<ChatBox hidden={controlHidden} />)
      }
    </div>
  );
}

export default MobileRoom;
