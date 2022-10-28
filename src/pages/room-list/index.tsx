import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'umi';
import { DotLoading } from 'antd-mobile';
import services from '@/services';
import { IRoomInfo } from '@/types/room';
import { BasicMap } from '@/types/basic';
import styles from './index.less';

interface RoomBlockProps {
  info: IRoomInfo;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

function RoomBlock(props: RoomBlockProps) {
  const { info, onClick } = props;
  const { extends: extension } = info;

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

  return (
    <div
      onClick={onClick}
      className={styles['list-item']}
      style={
        extensionObj.coverUrl
          ? {
              backgroundImage: `url(${extensionObj.coverUrl})`,
            }
          : {}
      }
    >
      <div className={styles['item-inner']}>
        <div className={styles.online}>{info.metrics.uv}人在线</div>
        <div className={styles['info-container']}>
          <div
            className={styles.avatar}
            style={
              extensionObj.avatar
                ? {
                    backgroundImage: `url(${extensionObj.avatar})`,
                  }
                : {}
            }
          ></div>
          <div className={styles.info}>
            <div className={styles.title}>{info.title}</div>
            <div className={styles.id}>ID: {info.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 此页面为测试列表页面
function RoomList() {
  const navigate = useNavigate();
  const [fetching, setFetching] = useState<boolean>(false);
  const [list, setList] = useState<IRoomInfo[]>([]);

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = () => {
    if (fetching) {
      return;
    }

    setFetching(true);
    services.getRoomList(1, 20)
      .then((res) => {
        if (Array.isArray(res)) {
          setList(res);
        }
      })
      .catch((err) => {
        console.log('获取列表失败', err);
      })
      .finally(() => {
        setFetching(false);
      });
  };

  const enterRoom = (liveId: string) => {
    navigate(`/room/${liveId}`);
  }

  return (
    <section className={styles['room-list-page']}>
      <div className={styles['room-list']}>
        {list.map((item) => (
          <RoomBlock key={item.id} info={item} onClick={() => enterRoom(item.id)} />
        ))}
      </div>

      {
        fetching ? (
          <div className={styles['loading-block']}>
            <DotLoading />
          </div>
        ) : null
      }
    </section>
  );
}

export default RoomList;
