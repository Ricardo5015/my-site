import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Briefcase, Palette, Heart, Coffee } from 'lucide-react';

// ==================== 类型定义 ====================
type CardType = 'work' | 'rest';

interface ThemeConfig {
  name: string;
  icon: React.ReactNode;
  colorClass: string;
  shadowClass: string;
  borderClass: string;
}

interface CalendarDay {
  date: number | null;
  fullDate?: string;
  type: CardType | null;
  themeIndex?: number;
  cardGroupId?: number; 
  isStart?: boolean; 
  isEnd?: boolean;
}

// ==================== 静态配置 ====================
const THEMES: ThemeConfig[] = [
  { 
    name: '深度工作', 
    icon: <Briefcase size={16} strokeWidth={2.5} />, 
    colorClass: 'bg-indigo-50 text-indigo-600',
    borderClass: 'border-indigo-200',
    shadowClass: 'shadow-indigo-100'
  },
  { 
    name: '创造探索', 
    icon: <Palette size={16} strokeWidth={2.5} />, 
    colorClass: 'bg-purple-50 text-purple-600',
    borderClass: 'border-purple-200',
    shadowClass: 'shadow-purple-100'
  },
  { 
    name: '身心复原', 
    icon: <Heart size={16} strokeWidth={2.5} />, 
    colorClass: 'bg-emerald-50 text-emerald-600',
    borderClass: 'border-emerald-200',
    shadowClass: 'shadow-emerald-100'
  }
];

const REST_THEME: ThemeConfig = {
  name: '彻底躺平',
  icon: <Coffee size={16} strokeWidth={2.5} />,
  colorClass: 'bg-stone-100 text-stone-500',
  borderClass: 'border-stone-200',
  shadowClass: 'shadow-stone-100'
};

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const TimeManagementCalendar = () => {
  // ==================== 状态管理 ====================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<CalendarDay[]>([]);
  
  // 拖拽状态
  const [dragType, setDragType] = useState<CardType | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const QUOTA = { work: 7, rest: 4 };

  // ==================== 核心修复：生成日历的独立函数 ====================
  // 将生成逻辑提取出来，不再依赖 render 周期
  const generateMonthData = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const newDays: CalendarDay[] = [];
    const startWeekday = firstDay.getDay();
    
    // 1. 填充前置空白
    for (let i = 0; i < startWeekday; i++) {
      newDays.push({ date: null, type: null });
    }
    // 2. 填充日期
    for (let d = 1; d <= lastDay.getDate(); d++) {
      newDays.push({ date: d, fullDate: `${year}-${month}-${d}`, type: null });
    }
    // 3. 填充后置空白 (保持网格整齐 6行x7列 = 42)
    const remaining = 42 - newDays.length;
    for(let i=0; i<remaining; i++) {
       newDays.push({ date: null, type: null });
    }
    return newDays;
  }, []);

  // 初始化和切换月份时调用
  useEffect(() => {
    setDays(generateMonthData(currentDate));
  }, [currentDate, generateMonthData]);

  // ==================== 修复后的重置功能 ====================
  const handleReset = () => {
    if (window.confirm('确定要清除本月的所有安排吗？')) {
      // 修复点：不再设置为空数组，而是直接重新生成初始数据
      setDays(generateMonthData(currentDate));
    }
  };

  // ==================== 统计逻辑 ====================
  const stats = React.useMemo(() => {
    const totalDays = days.filter(d => d.date !== null).length;
    const workGroups = new Set(days.filter(d => d.type === 'work').map(d => d.cardGroupId)).size;
    const restGroups = new Set(days.filter(d => d.type === 'rest').map(d => d.cardGroupId)).size;

    return { 
      usedWorkCards: workGroups,
      usedRestCards: restGroups,
      completion: totalDays > 0 ? Math.round(((workGroups * 3 + restGroups) / totalDays) * 100) : 0
    };
  }, [days]);

  // ==================== 拖拽交互逻辑 (保持不变) ====================

  const handleDragStart = (e: React.DragEvent, type: CardType) => {
    setDragType(type);
    e.dataTransfer.effectAllowed = 'copy';
    // 隐形幽灵图，完全依靠自定义预览
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 透明像素
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const getTargetIndices = (startIndex: number, type: CardType) => {
    const duration = type === 'work' ? 3 : 1;
    const indices = [];
    for (let i = 0; i < duration; i++) {
      const idx = startIndex + i;
      if (idx < days.length && days[idx].date !== null) {
        indices.push(idx);
      } else {
        return null;
      }
    }
    return indices;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHoverIndex(index);
  };

  const handleDrop = (index: number) => {
    setHoverIndex(null);
    if (!dragType) return;

    const targetIndices = getTargetIndices(index, dragType);
    if (!targetIndices || targetIndices.length !== (dragType === 'work' ? 3 : 1)) return;

    if (targetIndices.some(idx => days[idx].type !== null)) {
      alert('这里已经有安排了');
      return;
    }
    if (dragType === 'work' && stats.usedWorkCards >= QUOTA.work) return alert('精力耗尽');
    if (dragType === 'rest' && stats.usedRestCards >= QUOTA.rest) return alert('额度用完');

    const newDays = [...days];
    const groupId = Date.now();

    targetIndices.forEach((idx, i) => {
      newDays[idx] = {
        ...newDays[idx],
        type: dragType,
        cardGroupId: groupId,
        themeIndex: dragType === 'work' ? i : 0,
        isStart: i === 0,
        isEnd: i === targetIndices.length - 1
      };
    });

    setDays(newDays);
    setDragType(null);
  };

  const handleRemove = (groupId: number) => {
    setDays(days.map(d => d.cardGroupId === groupId ? { ...d, type: null, themeIndex: undefined, cardGroupId: undefined } : d));
  };

  // 辅助：获取格子状态
  const getCellState = (index: number) => {
    if (days[index].type) return { state: 'occupied', data: days[index] };
    if (dragType && hoverIndex !== null) {
      const previewIndices = getTargetIndices(hoverIndex, dragType);
      if (previewIndices && previewIndices.includes(index)) {
        const isValid = !previewIndices.some(i => days[i].type !== null);
        const relativeIndex = previewIndices.indexOf(index);
        return { state: 'preview', isValid, previewType: dragType, relativeIndex };
      }
    }
    return { state: 'empty' };
  };

  return (
    <div className="min-h-screen bg-[#F4F2F0] text-slate-700 font-sans p-6 md:p-12 selection:bg-indigo-100">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-serif text-slate-900 mb-3 tracking-tight">Rhythm of Life</h1>
            <p className="text-slate-500 text-sm max-w-md">
              三天打鱼，一天晒网。让时间管理像贴纸手账一样简单优雅。
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-white">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center px-4 w-32">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                {currentDate.toLocaleString('en-US', { month: 'long' })}
              </div>
              <div className="text-xl font-serif text-slate-800 leading-none">
                {currentDate.getFullYear()}
              </div>
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-white/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Stickers</h3>
                <button 
                  onClick={handleReset} 
                  className="text-slate-300 hover:text-slate-600 hover:rotate-180 transition-all duration-500 p-1"
                  title="Reset Month"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Work Card */}
                <div 
                  draggable={stats.usedWorkCards < QUOTA.work}
                  onDragStart={(e) => handleDragStart(e, 'work')}
                  className={`
                    group relative bg-white rounded-2xl border-2 border-dashed border-indigo-100 p-4 
                    cursor-grab active:cursor-grabbing transition-all duration-300
                    hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1
                    ${stats.usedWorkCards >= QUOTA.work ? 'opacity-40 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Briefcase size={18}/></div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Work Cycle</div>
                      <div className="text-[10px] text-indigo-400 font-bold tracking-wider">3 DAYS</div>
                    </div>
                  </div>
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-50">
                    <div className="flex-1 bg-indigo-300"/>
                    <div className="flex-1 bg-indigo-300/60"/>
                    <div className="flex-1 bg-indigo-300/30"/>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-white font-bold">
                    {QUOTA.work - stats.usedWorkCards}
                  </div>
                </div>

                {/* Rest Card */}
                <div 
                  draggable={stats.usedRestCards < QUOTA.rest}
                  onDragStart={(e) => handleDragStart(e, 'rest')}
                  className={`
                    group relative bg-white rounded-2xl border-2 border-dashed border-stone-200 p-4 
                    cursor-grab active:cursor-grabbing transition-all duration-300
                    hover:border-stone-400 hover:shadow-lg hover:-translate-y-1
                    ${stats.usedRestCards >= QUOTA.rest ? 'opacity-40 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-stone-100 p-2 rounded-xl text-stone-600"><Coffee size={18}/></div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Rest Day</div>
                      <div className="text-[10px] text-stone-400 font-bold tracking-wider">1 DAY</div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-stone-500 text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-white font-bold">
                    {QUOTA.rest - stats.usedRestCards}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Monthly Balance</span>
                  <span>{stats.completion}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.completion}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-white/50 p-8 select-none min-h-[600px]">
              
              {/* Headers */}
              <div className="grid grid-cols-7 mb-4">
                {WEEK_DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-300 tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-2 md:gap-3">
                {days.map((day, index) => {
                  const { state, data, previewType, relativeIndex, isValid } = getCellState(index);
                  
                  let content = null;
                  
                  // 1. 基础容器样式
                  let wrapperClass = "aspect-square relative flex items-center justify-center rounded-2xl transition-all duration-300";
                  
                  if (state === 'occupied' && data) {
                    const isWork = data.type === 'work';
                    const theme = isWork && data.themeIndex !== undefined ? THEMES[data.themeIndex] : REST_THEME;
                    const isVisualStart = data.isStart || index % 7 === 0;
                    const isVisualEnd = data.isEnd || index % 7 === 6;
                    
                    // 修复圆角：不再强制直角，而是给微小的圆角保持断裂感
                    const roundStyle = `
                      ${isVisualStart ? 'rounded-l-2xl' : 'rounded-l-md ml-0.5'} 
                      ${isVisualEnd ? 'rounded-r-2xl' : 'rounded-r-md mr-0.5'}
                    `;

                    wrapperClass += ` ${theme.colorClass} ${theme.shadowClass} ${roundStyle} shadow-md scale-[0.98]`;
                    
                    content = (
                      <div className="flex flex-col items-center animate-in zoom-in duration-200">
                        {(isVisualStart || data.isStart) && (
                          <div className="scale-90">{theme.icon}</div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); data.cardGroupId && handleRemove(data.cardGroupId); }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer z-20"
                        >
                          <span className="w-2 h-0.5 bg-red-400 rounded-full rotate-45 absolute" />
                          <span className="w-2 h-0.5 bg-red-400 rounded-full -rotate-45 absolute" />
                        </button>
                      </div>
                    );
                  } else if (state === 'preview') {
                    const isWork = previewType === 'work';
                    const theme = isWork ? THEMES[relativeIndex!] : REST_THEME;
                    const isVisualStart = relativeIndex === 0 || index % 7 === 0;
                    const isVisualEnd = relativeIndex === (isWork ? 2 : 0) || index % 7 === 6;
                    
                    const roundStyle = `
                      ${isVisualStart ? 'rounded-l-2xl' : 'rounded-l-md ml-1'} 
                      ${isVisualEnd ? 'rounded-r-2xl' : 'rounded-r-md mr-1'}
                    `;

                    wrapperClass += ` ${isValid ? theme.colorClass : 'bg-red-50'} border-2 border-dashed ${isValid ? theme.borderClass : 'border-red-200'} ${roundStyle} opacity-70 scale-95`;
                  } else if (day.date) {
                     // 空白格子：增加 hover 效果
                     wrapperClass += " hover:bg-slate-50 group";
                  } else {
                     // 填充格：隐藏
                     wrapperClass = "invisible";
                  }

                  return (
                    <div
                      key={index}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      className="aspect-square p-0.5" // 外层容器增加一点padding作为gap
                    >
                      <div className={`${wrapperClass} w-full h-full group`}>
                        {day.date && (
                          <span className={`
                            absolute top-2 left-3 text-[11px] font-bold pointer-events-none transition-colors
                            ${state === 'occupied' ? 'text-current opacity-60' : 'text-slate-300 group-hover:text-slate-400'}
                          `}>
                            {day.date}
                          </span>
                        )}
                        {content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeManagementCalendar;