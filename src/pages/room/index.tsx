import { useParams, useNavigate } from 'umi';
import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { throttle } from 'throttle-debounce';
import MobileRoom from '@/components/MobileRoom';
import PCRoom from '@/components/PCRoom/demo';
import services from '@/services';
import { RoomContext, defaultRoomState, roomReducer } from '@/context/room';
import { IRoomInfo, InteractionMessage, RoomStatusEnum } from '@/types/room';
import { CustomMessageTypes, BroadcastTypeEnum } from '@/types/interaction';
import { createDom, UA, assignObjectByParams } from '@/utils';
import LikeProcessor from '@/utils/LikeProcessor';
import '@/styles/anime.less';
import '@/styles/mobileBullet.less';

const MaxMessageCount = 100;

export default function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { t: tr } = useTranslation();
  const [roomState, dispatch] = useReducer(roomReducer, defaultRoomState);
  const InteractionRef = useRef<any>(); // 互动 sdk 实例
  const groupIdRef = useRef<string>(''); // 解决评 groupId 闭包问题
  const commentListCache = useRef<InteractionMessage[]>([]); // 解决评论列表闭包问题
  const animeContainerEl = useRef<HTMLDivElement>(null); // 用于点赞动画
  const bulletContainerEl = useRef<HTMLDivElement>(null); // 用于会消失的消息
  // 创建点赞处理实例
  const likeProcessor = useMemo(() => (new LikeProcessor()), []);

  useEffect(() => {
    const { InteractionEngine } = window.AliyunInteraction;
    InteractionRef.current = InteractionEngine.create();

    if (animeContainerEl.current) {
      likeProcessor.setAnimeContainerEl(animeContainerEl.current);
    }

    if (roomId) {
      fetchRoomDetail();
    } else {
      navigate('/room-list');
    }

    return () => {
      if (groupIdRef.current) {
        InteractionRef.current
          .leaveGroup({
            groupId: groupIdRef.current,
            broadCastType: BroadcastTypeEnum.nobody, // 离开不广播
          })
          .finally(() => {
            InteractionRef.current.logout();
          });
      } else {
        InteractionRef.current.logout();
      }
    };
  }, []);

  const fetchRoomDetail = () => {
    if (!roomId) {
      return;
    }
    services.getRoomDetail(roomId)
      .then((res: IRoomInfo) => {
        // console.log(res);
        dispatch({
          type: 'updateRoomDetail',
          payload: res,
        });

        initInteraction(res.chatId);
      });
  };

  const initInteraction = async (groupId: string) => {
    try {
      // 获取token
      const token: any = await services.getToken();
      // im 服务认证
      await InteractionRef.current.auth(token.access_token);
      // 加入房间
      const userData = services.getUserInfo();
      await InteractionRef.current.joinGroup({
        groupId,
        userNick: userData.userName,
        broadCastType: BroadcastTypeEnum.all, // 广播所有人
        broadCastStatistics: true,
      });
      groupIdRef.current = groupId;
      // (window as any).testim = InteractionRef.current;
      // 更新 likeProcessor
      likeProcessor.setGroupId(groupId);
      likeProcessor.setInteractionInstance(InteractionRef.current);

      listenInteractionMessage();
      // 检查更新自己信息
      updateSelfInfo();
      // 更新直播统计数据
      updateGroupStatistics();
    } catch (error) {
      console.log('initInteraction err', error);
    }
  };

  const updateSelfInfo = () => {
    const userData = services.getUserInfo();
    InteractionRef.current.getGroupUserByIdList({
      groupId: groupIdRef.current,
      userIdList: [userData.userId],
    }).then((res: any) => {
      const info = ((res || {}).userList || [])[0];
      if (info) {
        const muteBy: string[] = info.muteBy || [];
        updateRoomState({
          selfMuted: muteBy.includes('user'),
          groupMuted: muteBy.includes('group'),
        });
      }
    });
  };

  const updateGroupStatistics = () => {
    InteractionRef.current
      .getGroupStatistics({ groupId: groupIdRef.current })
      .then((res: any) => {
        const payload = assignObjectByParams(res, ['likeCount', 'onlineCount', 'pv', 'uv']);
        if (payload) {
          dispatch({ type: 'updateMetrics', payload });
        }
      })
      .catch(() => {});
  };

  // 监听 Interaction SDK 消息
  const listenInteractionMessage = useCallback(() => {
    const { InteractionEventNames = {} } = window.AliyunInteraction || {};
    InteractionRef.current.on(InteractionEventNames.Message, (eventData: any) => {
      console.log('收到信息啦', eventData);
      handleReceivedMessage(eventData || {});
    });
  }, []);

  const handleReceivedMessage = useCallback((eventData: any) => {
    const { InteractionMessageTypes = {} } = window.AliyunInteraction || {};
    const { type, data, messageId, senderId, senderInfo = {} } = eventData || {};
    const nickName = senderInfo.userNick || senderId;

    switch (type) {
      case CustomMessageTypes.Comment:
        // 接收到评论消息
        if (data && data.content) {
          addMessageItem(data.content, nickName, messageId);
        }
        break;
      case InteractionMessageTypes.PaaSLikeInfo:
        // 用户点赞数据，更新对应数据，后续考虑做节流
        if (data && data.likeCount) {
          dispatch({
            type: 'updateMetrics',
            payload: {
              likeCount: data.likeCount,
            },
          });
        }
        break;
      case InteractionMessageTypes.PaaSUserJoin:
        // 用户加入聊天组，更新直播间统计数据
        handleUserJoined(nickName, data);
        break;
      case InteractionMessageTypes.PaaSUserLeave:
        // 用户离开聊天组，不需要展示
        break;
      case InteractionMessageTypes.PaaSMuteGroup:
        // 互动消息组被禁言
        updateRoomState({ groupMuted: true, commentInput: '' });
        addBulletItem(tr('chat_all_banned_start'));
        break;
      case InteractionMessageTypes.PaaSCancelMuteGroup:
        // 互动消息组取消禁言
        updateRoomState({ groupMuted: false });
        addBulletItem(tr('chat_all_banned_stop'));
        break;
      case InteractionMessageTypes.PaaSMuteUser:
        // 个人被禁言
        handleMuteUser(true, messageId, data);
        break;
      case InteractionMessageTypes.PaaSCancelMuteUser:
        // 个人被取消禁言
        handleMuteUser(false, messageId, data);
        break;
      case CustomMessageTypes.LiveStart:
        // 开始直播
        updateRoomState({ status: RoomStatusEnum.started });
        break;
      case CustomMessageTypes.LiveStop:
        // 结束直播
        updateRoomState({ status: RoomStatusEnum.ended });
        break;
      case CustomMessageTypes.LiveInfo:
        // 直播间信息更新
        break;
      default:
        break;
    }
  }, []);

  // 节流展示进入房间的消息
  const handleUserJoined = useCallback(throttle(1500, (nickName: string, data: any) => {
    if (data && data.statistics) {
      dispatch({
        type: 'updateMetrics',
        payload: data.statistics,
      });
    }
    addBulletItem(`${nickName} ${tr('liveroom_enter')}`);
  }), [])

  const handleMuteUser = (isMuted: boolean, messageId: string, userInfo: any = {}) => {
    const userData = services.getUserInfo();
    // 只展示你个人的禁言消息
    if (userData.userId !== userInfo.userId) {
      return;
    }

    const data: any = { selfMuted: isMuted };
    if (isMuted) {
      data.commentInput = ''; // 若当前输入框有内容要清空
      addBulletItem(`${userInfo.userNick || ''}${tr('chat_someone_banned_start')}`);
    } else {
      addBulletItem(`${userInfo.userNick || ''}${tr('chat_someone_banned_stop')}`);
    }

    updateRoomState(data);
  };

  const addMessageItem = (content: string, nickName?: string, messageId?: string) => {
    const messageItem = { messageId, content, nickName };
    // 别超过最大消息个数
    let list = [messageItem, ...commentListCache.current];
    if (list.length > MaxMessageCount) {
      // 这期还没有pc直播间所以暂时注释
      // if (UA.isPC) {
      //   list = list.slice(MaxMessageCount / 2, -1);
      // } else {
      //   list = list.slice(0, MaxMessageCount / 2);
      // }
      list = list.slice(0, MaxMessageCount / 2);
    }
    // console.log('new list', list);
    commentListCache.current = list;
    updateRoomState({ messageList: list });
  };

  const updateRoomState = (payload: any) => {
    dispatch({ type: 'update', payload });
  };

  const sendComment = (content: string) => {
    if (roomState.groupMuted || roomState.selfMuted) {
      return Promise.reject(new Error('isMuted'));
    }
    const options = {
      groupId: groupIdRef.current,
      type: CustomMessageTypes.Comment,
      data: JSON.stringify({ content }),
    }
    return InteractionRef.current.sendMessageToGroup(options);
  };

  const sendLike = () => {
    likeProcessor.send();
  };

  // 用于显示会消失的的气泡消息，如 入会、禁言 相关
  const addBulletItem = (content: string) => {
    if (!content || !bulletContainerEl.current) {
      return;
    }
    const item = createDom('div', { class: 'aui-bullet-item' });
    item.textContent = content;
    bulletContainerEl.current.append(item);

    setTimeout(() => {
      if (bulletContainerEl.current) {
        bulletContainerEl.current.removeChild(item);
      }
    }, 1500);
  };

  return (
    <RoomContext.Provider
      value={{
        roomState,
        animeContainerEl,
        bulletContainerEl,
        dispatch,
        sendComment,
        sendLike,
      }}
    >
      {UA.isPC ? <PCRoom /> : <MobileRoom />}
    </RoomContext.Provider>
  )
}