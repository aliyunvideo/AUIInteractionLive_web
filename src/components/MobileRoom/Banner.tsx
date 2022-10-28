import { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'umi';
import { useTranslation } from 'react-i18next';
import { RoomContext } from '@/context/room';
import { BasicMap } from '@/types/basic';
import styles from './index.less';

export default function Banner() {
  const navigate = useNavigate();
  const { roomState, dispatch } = useContext(RoomContext);
  const { extends: extension, title, pv, likeCount, notice } = roomState;
  const [showNotice, setShowNotice] = useState(false);
  const { t } = useTranslation();

  const extensionObj: BasicMap<string> = useMemo(() => {
    let ret = {};
    if (extension) {
      try {
        ret = JSON.parse(extension);
      } catch (error) {
        console.log('extension 解析失败！', error);
      }
    }
    return ret;
  }, [extension]);

  const closeRoom = () => {
    navigate('/room-list');
  };

  return (
    <div className={styles.top}>
      <div className={styles['room-info-container']}>
        <div className={styles['room-info']}>
          <div
            className={styles.avatar}
            style={{
              backgroundImage: `url('${
                extensionObj?.avatar ||
                  'https://img.alicdn.com/imgextra/i4/O1CN01BQZKz41EGtPZp3U5P_!!6000000000325-2-tps-1160-1108.png'
              }')`,
            }}
          ></div>
          <div className={styles.info}>
            <div className={styles.title}>
              {title}
            </div>
            <div className={styles.data}>
              <span>
                {pv} {t('live_watch')}
              </span>
              <span>
                {likeCount} {t('chat_like')}
              </span>
            </div>
          </div>
        </div>
        {notice && (
          <div className={styles.notice} onClick={() => setShowNotice(!showNotice)}>
            <span>{t('live_room_notice')}</span>
            {showNotice && (
              <div
                className={styles['notice-content']}
              >{notice}</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.close} onClick={closeRoom}>&times;</div>
    </div>
  );
}