import { useEffect } from 'react';

function AdSenseAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-6409365438218964"
      data-ad-slot="6709069418"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

export default AdSenseAd;