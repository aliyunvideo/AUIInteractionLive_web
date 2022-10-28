import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoomContext } from '@/context/room';
import styles from './index.less';
import { LiveService } from '@/services/live';
import { RoomStatusEnum } from '@/types/room';
import { replaceHttps, UA } from '@/utils';

export default function Player() {
  const { roomState } = useContext(RoomContext);
  const { rtsUrl, hlsUrl, flvUrl, status } = roomState;
  const { t } = useTranslation();
  const [errorDisplayVisible, setErrorDisplayVisible] = useState(true);
  const isLiving = status === RoomStatusEnum.started;

  const statusText = useMemo(() => {
    const TextMap: any = {
      [RoomStatusEnum.no_data]: t('liveroom_initing'),
      [RoomStatusEnum.not_start]: t('live_anchor_iscoming'),
      [RoomStatusEnum.ended]: t('live_is_ended'),
    }

    return TextMap[status];
  }, [status]);

  const liveService = useMemo(() => (new LiveService()), []);

  const containerClassNames = useMemo(() => {
    const arr = [styles['player-container']];
    if (errorDisplayVisible) {
      arr.push(styles['prism-ErrorMessage-hidden']);
    }
    return arr.join(' ');
  }, [errorDisplayVisible]);

  useEffect(() => {

    const dispose = () => {
      // 销毁实例
      liveService.destroy();
    }

    if (isLiving) {
      // PC 环境优先用 flv，因为延时比 hls 小
      let arr: string[] = [];
      if (UA.isPC) {
        arr = [flvUrl, hlsUrl];
      } else {
        arr = [hlsUrl, flvUrl];
      }

      let rtsFallbackSource = arr[0] || arr[1];
      let source = rtsUrl || rtsFallbackSource;
      
      // 因为 夸克、UC 有点问题，无法正常播放 rts，所以降级
      if (UA.isQuark || UA.isUC) {
        source = rtsFallbackSource;
      }
      if (window.location.protocol === 'https:' && (new URL(rtsFallbackSource)).protocol === 'http:') {
        rtsFallbackSource = replaceHttps(rtsFallbackSource) || '';
        source = replaceHttps(source) || '';
      }
      liveService.play({
        source,
        rtsFallbackSource,
      });

      // 若未开播就进去直播间，等到开播后如果加载 hls 流，很大可能流内容未准备好，就会加载失败
      // 虽然live.ts中有自动重新加载的逻辑，但不想这时展示错误提示
      // 所以先通过 css 隐藏，10 秒后若还是有错误提示就展示
      setTimeout(() => {
        setErrorDisplayVisible(false);
      }, 10000);
    } else {
      dispose()
    }

    return dispose;
  }, [isLiving]);

  return (
    <div className={containerClassNames}>
      <div id="player"></div>
      {!isLiving && (
        <div className={styles.nolive}>
          <img src="https://img.alicdn.com/imgextra/i1/O1CN01pgziS925R7tXtb86t_!!6000000007522-55-tps-238-127.svg" />
          <span>{statusText}</span>
        </div>
      )}
    </div>
  )
}