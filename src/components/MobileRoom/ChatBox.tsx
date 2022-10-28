import { Fragment, useState, useRef, useMemo, useContext, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import copy from 'copy-to-clipboard';
import { Toast } from 'antd-mobile';
import { RoomContext } from '@/context/room';
import { BasicMap } from '@/types/basic';
import styles from './ChatBox.less';


function ChatBox() {
  const { roomState, animeContainerEl, bulletContainerEl, dispatch, sendComment, sendLike } = useContext(RoomContext);
  // console.log('chatbox roomstate', roomState);
  const { t: tr } = useTranslation();
  const operationRef = useRef<HTMLDivElement>(null);
  const { commentInput, messageList, groupMuted, selfMuted, extends: extension } = roomState;
  const [sending, setSending] = useState<boolean>(false);

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
    if (e.key !== 'Enter' || !text || sending) {
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
    // 这里的分享依赖使用 extends 中的 shareUrl，若是有别的方法，请自行调整
    const bool = copy(extensionObj.shareUrl);
    if (bool) {
      Toast.show({
        icon: 'success',
        content: tr('share_success'),
      });
    } else {
      Toast.show({
        icon: 'fail',
        content: tr('share_fail'),
      });
    }
  };

  return (
    <Fragment>
      <div className={styles['chat-box']}>
        <div className={styles['chat-list']}>
          {messageList.map((data, index: number) => (
            <div className={styles['chat-item']} key={data.messageId || index}>
              <span className={styles.emphasize}>
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
            onSubmit={(e: any) => e.preventDefault()}
          >
            <input
              type="text"
              enterKeyHint="send"
              className={styles['chat-input']}
              placeholder={commentPlaceholder}
              value={commentInput}
              disabled={sending || groupMuted || selfMuted}
              onKeyDown={handleKeydown}
              onChange={(e) => updateCommentInput(e.target.value)}
              onTouchStart={touchInputHandler}
            />
          </form>

          {extensionObj.shareUrl ? (
            <div className={`${styles['operation-btn']} share`} onClick={share}>
              <img src="https://img.alicdn.com/imgextra/i2/O1CN01NVOoJY24njpn5Zinn_!!6000000007436-55-tps-37-38.svg" />
            </div>
          ) : null}

          <div className={styles['operation-btn']}>
            <img
              src="https://img.alicdn.com/imgextra/i2/O1CN01FDvTPN1IH84wjF6UD_!!6000000000867-55-tps-37-37.svg"
              onClick={() => sendLike()}
            />
            <div ref={animeContainerEl} className={styles['like-anime-container']}></div>
          </div>
        </div>

        {/* 用于会消失的消息 */}
        <div ref={bulletContainerEl} className={styles['bullet-list']}></div>
      </div>
    </Fragment>
  )
}

export default ChatBox;
