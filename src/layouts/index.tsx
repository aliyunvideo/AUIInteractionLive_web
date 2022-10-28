import { Outlet } from 'umi';
import { useEffect, useMemo } from 'react';
import { getParamFromSearch } from '@/utils';
import styles from './index.less';

export default function Layout() {
  const env = useMemo(() => getParamFromSearch('env'), []);

  useEffect(() => {
    const updateBodyFontSize = () => {
      let width = document.documentElement.clientWidth;
      if (width > 450) {
        width = 450;
      }
      document.documentElement.style.fontSize = width / 7.5 + 'px';
    };

    updateBodyFontSize();
    
    window.onresize = () => {
      updateBodyFontSize();
    };

    return () => {
      document.documentElement.style.fontSize = '16px';
    };
  }, []);

  return (
    <div className={styles['app-layout']}>
      {
        env === 'production' ? (
          <div className={styles['app-env']}>线上环境</div>
        ) : null
      }
      <Outlet />
    </div>
  );
}
