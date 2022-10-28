/**
 * 本组件为测试逻辑，userId 为输入的昵称 md5 得到，具体登录应由你自行实现
 */

import { useState } from 'react';
import md5 from 'md5';
import { Toast } from 'antd-mobile';
import { useTranslation } from 'react-i18next';
import services from '@/services';
import styles from './index.less';

interface LoginProps {
  onLoginSuccess: () => void;
}

function Login(props: LoginProps) {
  const { onLoginSuccess } = props;
  const { t: tr } = useTranslation();
  const [nickname, setNickname] = useState<string>('');
  const [logging, setLogging] = useState<boolean>(false);

  const loginClickHandler = () => {
    const userName = nickname.trim();
    if (!userName) {
      return;
    }
    if (logging) {
      Toast.show({
        content: tr('logging'),
      });
      return;
    }
    setLogging(true);

    const userId = md5(userName);
    services.login(userId, userName)
      .then(() => {
        onLoginSuccess();
      })
      .catch((err) => {
        console.log('登录失败', err);
        Toast.show({
          icon: 'fail',
          content: tr('login_fail'),
        });
      })
      .finally(() => {
        setLogging(false);
      });
  };

  return (
    <div className={styles['login-page']}>
      <div className={styles['login-form']}>
        <div className={styles['login-title']}>
          阿里云互动直播
        </div>
        <div className={styles['login-input']}>
          <label htmlFor="login-input">昵称</label>
          <input
            type="text"
            id="aui-login-nickname"
            placeholder="请输入您的昵称..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className={styles['login-btn']} onClick={loginClickHandler}>
          登录
        </div>
      </div>
    </div>
  );
}

export default Login;
