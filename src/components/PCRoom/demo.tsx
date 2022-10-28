/**
 * 因为这期还没有 PC 的直播间组件，所以写了个 demo 居中展示 MobileRoom
 * 后续再支持 PC 的直播间组件
 */
import { useEffect, useState, CSSProperties } from 'react';
import MobileRoom from '../MobileRoom';

const getWrapStyle = () => {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const padding = width > height ? (width - height) / 2 : 0;
  const style: CSSProperties = {
    height: '100%',
    width: '100%',
    padding: `0 ${padding}px`,
  };
  return style;
};

function PCRoom() {
  const [wrapStyle, setWrapStyle] = useState<CSSProperties>(getWrapStyle());

  useEffect(() => {
    const updateWrapStyle = () => {
      console.log('updateWrapStyle');
      setWrapStyle(getWrapStyle());
    };

    window.addEventListener('resize', updateWrapStyle);

    return () => {
      window.removeEventListener('resize', updateWrapStyle);
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
    }}>
      <div style={wrapStyle}>
        <MobileRoom />
      </div>
    </div>
  );
}

export default PCRoom;
