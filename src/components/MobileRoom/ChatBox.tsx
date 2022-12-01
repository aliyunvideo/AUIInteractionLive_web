import { Fragment, useState, useRef, useMemo, useContext, KeyboardEvent, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@ant-design/icons';
import { RoomContext } from '@/context/room';
import { ReplySvg, HeartSvg } from '@/assets/CustomIcon';
import { RoomStatusEnum } from '@/types/room';
import styles from './ChatBox.less';

const NicknameColors = ['#FFAB91', '#FED998', '#F6A0B5', '#CBED8E', '#95D8F8'];
function getNameColor(name?: string) {
  if (!name) {
    return '';
  }
  return NicknameColors[name.charCodeAt(0) % NicknameColors.length];
}

interface ChatBoxProps {
  hidden?: boolean;
}

function ChatBox(props: ChatBoxProps) {
  const { hidden } = props;
  const { roomState, animeContainerEl, bulletContainerEl, dispatch, sendComment, sendLike } = useContext(RoomContext);
  // console.log('chatbox roomstate', roomState);
  const { t: tr } = useTranslation();
  const operationRef = useRef<HTMLDivElement>(null);
  const { status, commentInput, messageList, groupMuted, selfMuted, isPlayback } = roomState;
  const [sending, setSending] = useState<boolean>(false);

  const allowChat = useMemo(() => {
    // 未开播、直播中时允许使用聊天功能
    return [RoomStatusEnum.not_start, RoomStatusEnum.started].includes(status);
  }, [status]);

  const commentPlaceholder = useMemo(() => {
    let text = tr('liveroom_talkto_anchor');
    if (groupMuted) {
      text = tr('chat_all_banned_start');
    } else if (selfMuted) {
      text = tr('chat_you_banned');
    }
    return text;
  }, [groupMuted, selfMuted]);

  const touchInputHandler = () => {
    // 解决发送双击问题，增加scrollIntoView
    operationRef.current?.scrollIntoView(false);
  };

  const updateCommentInput = (text: string) => {
    dispatch({
      type: 'update',
      payload: { commentInput: text }
    });
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    const text = commentInput.trim();
    if (e.key !== 'Enter' || !text || sending || !allowChat) {
      return;
    }
    e.preventDefault();

    setSending(true);
    sendComment(text)
      .then(() => {
        console.log('发送成功');
        updateCommentInput('');
      })
      .catch((err: any) => {
        console.log('发送失败', err);
      })
      .finally(() => {
        setSending(false);
      });
  }

  const share = () => {
    // 请自行实现分享逻辑
  };

  return (
    <Fragment>
      <div
        className={styles['chat-box']}
        style={{
          display: !!hidden ? 'none' : 'block',
          bottom: isPlayback ? '80px' : 0, // 回看时有控制条，需要往上提，以免遮挡
        }}
      >
        <div
          className={styles['chat-list']}
          style={{ display: allowChat ? 'flex' : 'none' }}
        >
          {messageList.map((data, index: number) => (
            <div className={styles['chat-item']} key={data.messageId || index}>
              <span style={{ color: getNameColor(data.nickName) }}>
                {data.nickName ? data.nickName + ': ' : ''}
              </span>
              <span>{data.content}</span>
            </div>
          ))}
          <div className={`${styles['chat-item']} ${styles['chat-item-notice']}`}>
            {tr('liveroom_notice')}
          </div>
        </div>

        <div className={styles['operations-wrap']} ref={operationRef}>
          <form
            action=""
            className={styles['chat-input-form']}
            style={{ visibility: allowChat ? 'visible' : 'hidden' }}
            onSubmit={(e: any) => e.preventDefault()}
          >
            <input
              type="text"
              enterKeyHint="send"
              className={styles['chat-input']}
              placeholder={commentPlaceholder}
              value={commentInput}
              disabled={!allowChat || sending || groupMuted || selfMuted}
              onKeyDown={handleKeydown}
              onChange={(e) => updateCommentInput(e.target.value)}
              onTouchStart={touchInputHandler}
            />
          </form>

          <span className={styles['operation-btn-wrap']}>
            <span className={styles['operation-btn']} onClick={share}>
              <Icon component={ReplySvg} />
            </span>
          </span>

          <span className={styles['operation-btn-wrap']}>
            <span className={styles['operation-btn']} onClick={() => sendLike()}>
              <Icon component={HeartSvg} />
            </span>
            <div ref={animeContainerEl} className={styles['like-anime-container']}></div>
          </span>
        </div>

        {/* 用于会消失的消息 */}
        <div
          ref={bulletContainerEl}
          className={styles['bullet-list']}
          style={{ display: allowChat ? 'flex' : 'none' }}
        ></div>
      </div>
    </Fragment>
  )
}

export default ChatBox;
