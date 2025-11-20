import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Briefcase, Palette, Heart, Coffee, GripVertical } from 'lucide-react';

// ==================== 类型定义 ====================
type CardType = 'work' | 'rest';

interface ThemeConfig {
  name: string;
  icon: React.ReactNode;
  // 定义卡片的主色调，用于背景和边框
  colorClass: string;
  shadowClass: string;
}

interface CalendarDay {
  date: number | null;
  fullDate?: string;
  type: CardType | null;
  themeIndex?: number;
  cardGroupId?: number; // 同一组卡片的唯一ID
  isStart?: boolean; // 标记是否是这组卡片的第一天
  isEnd?: boolean;   // 标记是否是这组卡片的最后一天
}

// ==================== 静态配置 ====================

const THEMES: ThemeConfig[] = [
  { 
    name: '深度工作', 
    icon: <Briefcase size={15} strokeWidth={2.5} />, 
    colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    shadowClass: 'shadow-indigo-200'
  },
  { 
    name: '创造探索', 
    icon: <Palette size={15} strokeWidth={2.5} />, 
    colorClass: 'bg-purple-100 text-purple-700 border-purple-200',
    shadowClass: 'shadow-purple-200'
  },
  { 
    name: '身心复原', 
    icon: <Heart size={15} strokeWidth={2.5} />, 
    colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    shadowClass: 'shadow-emerald-200'
  }
];

const REST_THEME: ThemeConfig = {
  name: '彻底躺平',
  icon: <Coffee size={15} strokeWidth={2.5} />,
  colorClass: 'bg-stone-100 text-stone-600 border-stone-200',
  shadowClass: 'shadow-stone-200'
};

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const TimeManagementCalendar = () => {
  // ==================== 状态管理 ====================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState<CalendarDay[]>([]);
  
  // 拖拽相关状态
  const [dragType, setDragType] = useState<CardType | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null); // 当前鼠标悬停的格子索引

  const QUOTA = { work: 7, rest: 4 };

  // ==================== 核心逻辑 ====================
  
  useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 简单起见，切换月份重置数据。实际项目应检查缓存。
    if (days.length > 0 && days.some(d => d.fullDate?.startsWith(`${year}-${month}`))) return;

    const newDays: CalendarDay[] = [];
    const startWeekday = firstDay.getDay();
    
    // 填充前置空白
    for (let i = 0; i < startWeekday; i++) {
      newDays.push({ date: null, type: null });
    }
    // 填充日期
    for (let d = 1; d <= lastDay.getDate(); d++) {
      newDays.push({ date: d, fullDate: `${year}-${month}-${d}`, type: null });
    }
    // 填充后置空白以补齐表格（可选，为了美观）
    const remaining = 42 - newDays.length;
    for(let i=0; i<remaining; i++) {
       newDays.push({ date: null, type: null });
    }

    setDays(newDays);
  }, [currentDate]);

  // 实时统计
  const stats = useMemo(() => {
    const totalDays = days.filter(d => d.date !== null).length;
    const workGroups = new Set(days.filter(d => d.type === 'work').map(d => d.cardGroupId)).size;
    const restGroups = new Set(days.filter(d => d.type === 'rest').map(d => d.cardGroupId)).size;

    return { 
      usedWorkCards: workGroups,
      usedRestCards: restGroups,
      completion: totalDays > 0 ? Math.round(((workGroups * 3 + restGroups) / totalDays) * 100) : 0
    };
  }, [days]);

  // ==================== 交互逻辑 ====================

  const handleDragStart = (e: React.DragEvent, type: CardType) => {
    setDragType(type);
    e.dataTransfer.effectAllowed = 'copy';
    
    // 创建更精致的拖拽幽灵图
    const el = document.createElement('div');
    el.className = `p-3 rounded-lg font-bold text-sm bg-white shadow-xl border-2 border-dashed ${type === 'work' ? 'border-indigo-300 text-indigo-500' : 'border-stone-300 text-stone-500'}`;
    el.textContent = type === 'work' ? '✨ 3 Days Focus' : '💤 1 Day Rest';
    el.style.position = 'absolute';
    el.style.top = '-1000px';
    document.body.appendChild(el);
    e.dataTransfer.setDragImage(el, 20, 20);
    setTimeout(() => document.body.removeChild(el), 0);
  };

  // 计算卡片将会占据的索引位置（包含跨行逻辑）
  const getTargetIndices = (startIndex: number, type: CardType) => {
    const duration = type === 'work' ? 3 : 1;
    const indices = [];
    for (let i = 0; i < duration; i++) {
      // 只要不超过数组长度且是有效日期格子，就允许（即使跨行）
      const idx = startIndex + i;
      if (idx < days.length && days[idx].date !== null) {
        indices.push(idx);
      } else {
        return null; // 如果任何一部分超出范围或碰到空白格，则无效
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
    
    // 1. 基础有效性检查
    if (!targetIndices || targetIndices.length !== (dragType === 'work' ? 3 : 1)) return;

    // 2. 冲突检查：确保所有目标格子都是空的
    const hasConflict = targetIndices.some(idx => days[idx].type !== null);
    if (hasConflict) {
      alert('这里已经有安排了，请换个位置');
      return;
    }

    // 3. 配额检查
    if (dragType === 'work' && stats.usedWorkCards >= QUOTA.work) {
      alert('本月精力已耗尽，请适度休息');
      return;
    }
    if (dragType === 'rest' && stats.usedRestCards >= QUOTA.rest) {
      alert('摆烂额度已用完，起来干活！');
      return;
    }

    // 4. 执行放置
    const newDays = [...days];
    const groupId = Date.now();
    const themeIdx = targetIndices[0] % 3; // 随机或轮询主题，这里简化

    targetIndices.forEach((idx, i) => {
      newDays[idx] = {
        ...newDays[idx],
        type: dragType,
        cardGroupId: groupId,
        themeIndex: dragType === 'work' ? i : 0, // 0, 1, 2 用于区分三天阶段
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

  // ==================== 渲染辅助 ====================
  
  // 获取当前格子的视觉状态：'preview' | 'occupied' | 'empty'
  const getCellState = (index: number) => {
    // 1. 检查是否被实际占据
    if (days[index].type) return { state: 'occupied', data: days[index] };
    
    // 2. 检查是否处于预览（悬停）状态
    if (dragType && hoverIndex !== null) {
      const previewIndices = getTargetIndices(hoverIndex, dragType);
      if (previewIndices && previewIndices.includes(index)) {
        // 检查预览是否有效（是否冲突）
        const isValid = !previewIndices.some(i => days[i].type !== null);
        // 计算预览时的相对位置 (0, 1, 2)
        const relativeIndex = previewIndices.indexOf(index);
        return { 
          state: 'preview', 
          isValid, 
          previewType: dragType, 
          relativeIndex 
        };
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
            <button onClick={() => setDays([])} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center px-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">November</div>
              <div className="text-xl font-serif text-slate-800">2025</div>
            </div>
            <button onClick={() => setDays([])} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar: Palette */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Cards Palette */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-white/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Stickers</h3>
                <button onClick={() => {if(confirm('重置本月？')) setDays([])}} className="text-slate-300 hover:text-red-400 transition-colors">
                  <RotateCcw size={14} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Work Card Source */}
                <div 
                  draggable={stats.usedWorkCards < QUOTA.work}
                  onDragStart={(e) => handleDragStart(e, 'work')}
                  className={`
                    group relative bg-white rounded-xl border-2 border-dashed border-indigo-100 p-4 cursor-grab active:cursor-grabbing transition-all duration-300
                    hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1
                    ${stats.usedWorkCards >= QUOTA.work ? 'opacity-40 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-medium">
                      <div className="bg-indigo-100 p-1.5 rounded-md"><Briefcase size={14}/></div>
                      Work Cycle
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-400 px-2 py-1 rounded-full">3 DAYS</span>
                  </div>
                  <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-slate-100">
                    <div className="flex-1 bg-indigo-300"/>
                    <div className="flex-1 bg-indigo-300/60"/>
                    <div className="flex-1 bg-indigo-300/30"/>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm font-bold">
                    {QUOTA.work - stats.usedWorkCards}
                  </div>
                </div>

                {/* Rest Card Source */}
                <div 
                  draggable={stats.usedRestCards < QUOTA.rest}
                  onDragStart={(e) => handleDragStart(e, 'rest')}
                  className={`
                    group relative bg-white rounded-xl border-2 border-dashed border-stone-200 p-4 cursor-grab active:cursor-grabbing transition-all duration-300
                    hover:border-stone-400 hover:shadow-lg hover:-translate-y-1
                    ${stats.usedRestCards >= QUOTA.rest ? 'opacity-40 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-stone-700 font-medium">
                      <div className="bg-stone-100 p-1.5 rounded-md"><Coffee size={14}/></div>
                      Rest Day
                    </div>
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-400 px-2 py-1 rounded-full">1 DAY</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-stone-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm font-bold">
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
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-white/50 p-8 md:p-10 select-none">
              
              {/* Week Headers */}
              <div className="grid grid-cols-7 mb-6">
                {WEEK_DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-300 tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-3 lg:gap-4">
                {days.map((day, index) => {
                  const { state, data, previewType, relativeIndex, isValid } = getCellState(index);
                  
                  // 样式计算
                  let cellContent = null;
                  let cellStyle = "bg-transparent"; // 默认透明
                  
                  if (state === 'occupied' && data) {
                    const isWork = data.type === 'work';
                    const theme = isWork && data.themeIndex !== undefined ? THEMES[data.themeIndex] : REST_THEME;
                    
                    // 核心：判断是否在视觉上是"一组"的开头或结尾
                    // 如果是周日(index % 7 === 0)，无论逻辑上是否是开头，视觉上都必须是圆角开头
                    // 如果是周六(index % 7 === 6)，视觉上必须是圆角结尾
                    const isVisualStart = data.isStart || index % 7 === 0;
                    const isVisualEnd = data.isEnd || index % 7 === 6;

                    const roundClass = `
                      ${isVisualStart ? 'rounded-l-xl' : 'rounded-l-none border-l-0'} 
                      ${isVisualEnd ? 'rounded-r-xl' : 'rounded-r-none border-r-0'}
                    `;

                    cellStyle = `
                      ${theme.colorClass} border border-solid ${roundClass}
                      ${theme.shadowClass} shadow-sm
                      transform transition-all duration-300
                    `;

                    cellContent = (
                      <div className="flex flex-col items-center justify-center h-full w-full animate-in fade-in zoom-in duration-300">
                        {/* 如果被切断了，且不是逻辑上的第一天，就不显示图标，只显示颜色块保持连接感 */}
                        {(isVisualStart || data.isStart) && (
                          <div className="scale-90 opacity-90">{theme.icon}</div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); data.cardGroupId && handleRemove(data.cardGroupId); }}
                          className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <span className="block w-1.5 h-1.5 bg-current rounded-full opacity-40 hover:opacity-100" />
                        </button>
                      </div>
                    );
                  } else if (state === 'preview' && relativeIndex !== undefined) {
                    // 预览状态样式
                    const isWork = previewType === 'work';
                    const theme = isWork ? THEMES[relativeIndex] : REST_THEME;
                    
                    // 同样的视觉断行逻辑
                    const isVisualStart = relativeIndex === 0 || index % 7 === 0;
                    const isVisualEnd = relativeIndex === (isWork ? 2 : 0) || index % 7 === 6;
                    const roundClass = `${isVisualStart ? 'rounded-l-xl' : 'rounded-l-none'} ${isVisualEnd ? 'rounded-r-xl' : 'rounded-r-none'}`;

                    cellStyle = `
                      ${isValid ? theme.colorClass : 'bg-red-50 border-red-200'} 
                      border-2 border-dashed ${roundClass} opacity-60 scale-95
                    `;
                  } else if (day.date) {
                    // 空白格子样式
                    cellStyle = "bg-slate-50/50 rounded-xl border border-transparent hover:bg-slate-100 hover:border-slate-200 transition-colors";
                  }

                  return (
                    <div
                      key={index}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      className={`
                        aspect-square relative group flex items-center justify-center
                        ${!day.date ? 'invisible' : ''}
                      `}
                    >
                      {/* 背景层（卡片本身） */}
                      <div className={`absolute inset-0 ${cellStyle}`} />

                      {/* 日期数字 (始终显示，层级最高) */}
                      {day.date && (
                        <span className={`
                          absolute top-2 left-3 text-xs font-bold z-10 pointer-events-none
                          ${state === 'occupied' ? 'text-current opacity-70' : 'text-slate-300'}
                        `}>
                          {day.date}
                        </span>
                      )}

                      {/* 内容层 */}
                      <div className="relative z-10 w-full h-full pointer-events-none">
                        {cellContent}
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