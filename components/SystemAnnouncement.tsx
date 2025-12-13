import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SystemAnnouncement as AnnouncementType } from '../types';

const VolumeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
);

const SystemAnnouncement = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementType | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!db) return;

    // 監聽 app_settings 集合下的 announcement 文件
    const unsub = onSnapshot(doc(db, 'app_settings', 'announcement'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AnnouncementType;
        setAnnouncement(data);
        checkVisibility(data);
      } else {
        setIsVisible(false);
      }
    });

    return () => unsub();
  }, []);

  // 檢查是否在有效期間內且已啟用
  const checkVisibility = (data: AnnouncementType) => {
    if (!data.isEnabled) {
      setIsVisible(false);
      return;
    }

    const now = new Date();
    const start = data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt);
    const end = data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt);

    if (now >= start && now <= end) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  if (!isVisible || !announcement) return null;

  // 根據 type 決定顏色
  const getColors = () => {
    switch (announcement.type) {
      case 'warning': return 'bg-orange-500 text-white';
      case 'error': return 'bg-rose-500 text-white';
      default: return 'bg-indigo-600 text-white'; // info
    }
  };

  return (
    <div className={`${getColors()} overflow-hidden py-2 shadow-md relative z-50`}>
      <div className="flex items-center">
        {/* 左側固定圖示 */}
        <div className="px-3 bg-inherit z-10 flex-shrink-0 flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
           <VolumeIcon className="w-4 h-4" />
           <span>公告</span>
        </div>

        {/* 跑馬燈區域 */}
        <div className="flex-1 overflow-hidden relative h-6">
           <div className="whitespace-nowrap absolute animate-marquee top-0 left-full">
              <span className="text-sm font-medium px-4 inline-block">
                {announcement.text}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnnouncement;