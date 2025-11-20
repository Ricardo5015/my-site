import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Briefcase, Palette, Heart, Coffee, GripHorizontal } from 'lucide-react';

// ==================== 类型定义 ====================
type CardType = 'work' | 'rest';

interface ThemeConfig {
  name: string;
  icon: React.ReactNode;
  // 优雅的配色方案：bg-背景色, text-文字色, ring-边框色
  style: string;
}

interface CalendarDay {
  date: number | null; // null 代表空白填充格
  fullDate?: string;   // 完整日期字符串用于唯一标识
  type: CardType | null;
  themeIndex?: number; // 0, 1, 2 对应三天打鱼的不同阶段
  cardGroupId?: number; // 同一组卡片的唯一标识
}

// ==================== 静态配置 ====================

// 莫兰迪/Notion 风格配色
const THEMES: ThemeConfig[] = [
  { 
    name: '深度工作', 
    icon: <Briefcase size={14} />, 
    style: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/50 hover:bg-indigo-100' 
  },
  { 
    name: '创造探索', 
    icon: <Palette size={14} />, 
    style: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50 hover:bg-purple-100' 
  },
  { 
    name: '身心复原', 
    icon: <Heart size={14} />, 
    style: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50 hover:bg-emerald-100' 
  }
];

const REST_THEME: ThemeConfig = {
  name: '完全躺平',
  icon: <Coffee size={14} />,
  style: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200'
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TimeManagementCalendar = () => {
  // ==================== 状态管理 ====================
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 核心数据：存储每个月的具体安排 key: 'YYYY-MM-DD', value: CalendarDay
  // 这里简化处理，为了演示方便，我们还是按月重置，但结构上支持扩展
  const [days, setDays] = useState<CalendarDay[]>([]);
  
  // 拖拽中间态
  const [dragType, setDragType] = useState<CardType | null>(null);

  // 卡片配额
  const QUOTA = { work: 7, rest: 4 }; // 7组努力卡，4张休息卡

  // ==================== 计算逻辑 (Derived State) ====================
  
  // 初始化/重新生成日历数据
  useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 如果是切换月份，且该月还没有数据（这里简单处理为每次切换都重置，实际项目可从后端拉取）
    // 为了保留当前操作，我们只在初始化时生成，后续通过 setDays 更新
    if (days.length > 0 && days.some(d => d.fullDate?.startsWith(`${year}-${month}`))) {
      return; 
    }

    const newDays: CalendarDay[] = [];
    const startWeekday = firstDay.getDay();
    
    // 填充前置空白
    for (let i = 0; i < startWeekday; i++) {
      newDays.push({ date: null, type: null });
    }
    
    // 填充实际日期
    for (let d = 1; d <= lastDay.getDate(); d++) {
      newDays.push({ 
        date: d, 
        fullDate: `${year}-${month}-${d}`,
        type: null 
      });
    }
    setDays(newDays);
  }, [currentDate]); // 依赖 currentDate，但逻辑内部加了判断防止重置已编辑的数据

  // 实时统计 (不再需要 useEffect 同步)
  const stats = useMemo(() => {
    const workDays = days.filter(d => d.type === 'work').length;
    const restDays = days.filter(d => d.type === 'rest').length;
    const totalDays = days.filter(d => d.date !== null).length;
    
    const workGroups = new Set(days.filter(d => d.type === 'work').map(d => d.cardGroupId)).size;
    const restGroups = new Set(days.filter(d => d.type === 'rest').map(d => d.cardGroupId)).size;

    return { 
      workDays, 
      restDays, 
      completion: totalDays > 0 ? Math.round(((workDays + restDays) / totalDays) * 100) : 0,
      usedWorkCards: workGroups,
      usedRestCards: restGroups
    };
  }, [days]);

  // ==================== 交互逻辑 ====================

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setDays([]); // 切换月份清空当前视图数据（实际项目应保存）
  };

  const handleDragStart = (e: React.DragEvent, type: CardType) => {
    setDragType(type);
    e.dataTransfer.effectAllowed = 'copy';
    // 优化拖拽幽灵图
    const el = e.currentTarget.cloneNode(true) as HTMLElement;
    el.style.opacity = '1';
    el.style.transform = 'scale(0.9) rotate(2deg)';
    el.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
    el.style.background = 'white';
    el.style.width = '120px';
    document.body.appendChild(el);
    e.dataTransfer.setDragImage(el, 60, 20);
    setTimeout(() => document.body.removeChild(el), 0);
  };

  const handleDrop = (index: number) => {
    if (!dragType) return;
    
    const targetDay = days[index];
    if (!targetDay.date) return;

    // 检查配额
    if (dragType === 'work' && stats.usedWorkCards >= QUOTA.work) {
      alert('本月精力已耗尽，请适度休息');
      return;
    }
    if (dragType === 'rest' && stats.usedRestCards >= QUOTA.rest) {
      alert('摆烂额度已用完，起来干活！');
      return;
    }

    const duration = dragType === 'work' ? 3 : 1;
    const newDays = [...days];
    const groupId = Date.now();

    // 空间检查
    let canPlace = true;
    for (let i = 0; i < duration; i++) {
      const checkIndex = index + i;
      // 越界或已有安排
      if (checkIndex >= newDays.length || !newDays[checkIndex].date || newDays[checkIndex].type) {
        canPlace = false;
        break;
      }
      // 连续卡片跨周检查 (Work卡片不能跨行显示，美观考虑)
      if (dragType === 'work' && i > 0 && (index + i) % 7 === 0) {
        canPlace = false;
        break;
      }
    }

    if (!canPlace) return; // 静默失败或轻微震动反馈

    // 执行放置
    for (let i = 0; i < duration; i++) {
      const currentIdx = index + i;
      newDays[currentIdx] = {
        ...newDays[currentIdx],
        type: dragType,
        cardGroupId: groupId,
        themeIndex: dragType === 'work' ? i : 0
      };
    }

    setDays(newDays);
    setDragType(null);
  };

  const handleRemove = (groupId: number) => {
    setDays(days.map(d => d.cardGroupId === groupId ? { ...d, type: null, themeIndex: undefined, cardGroupId: undefined } : d));
  };

  const resetCalendar = () => {
    if (confirm('清空当前月份的所有计划？')) {
      const newDays = days.map(d => ({ ...d, type: null, themeIndex: undefined, cardGroupId: undefined }));
      setDays(newDays);
    }
  };

  // ==================== 组件渲染 ====================

  return (
    <div className="min-h-screen bg-[#F7F5F3] text-slate-700 font-sans selection:bg-indigo-100">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        
        {/* Header: 极简风格 */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-serif text-slate-900 tracking-tight mb-2">
              Rhythm of Life
            </h1>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              三天打鱼，一天晒网。在专注与松弛之间寻找生活的节奏。
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
            <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-medium font-mono text-slate-700 w-32 text-center">
              {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Sidebar: 工具箱 */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* 数据概览 - 纯文字风格 */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Overview</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Focus Cycles</span>
                    <span className="font-medium text-indigo-600">{stats.usedWorkCards}/{QUOTA.work}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${(stats.usedWorkCards / QUOTA.work) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Rest Days</span>
                    <span className="font-medium text-stone-500">{stats.usedRestCards}/{QUOTA.rest}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-400 rounded-full transition-all duration-500" style={{ width: `${(stats.usedRestCards / QUOTA.rest) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 拖拽源 */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Your Rhythm</h3>
              
              <div 
                draggable={stats.usedWorkCards < QUOTA.work}
                onDragStart={(e) => handleDragStart(e, 'work')}
                className={`
                  group bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm cursor-grab active:cursor-grabbing
                  hover:shadow-md hover:border-indigo-200 transition-all
                  ${stats.usedWorkCards >= QUOTA.work ? 'opacity-50 grayscale pointer-events-none' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-800">Work Cycle</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">3 Days</span>
                </div>
                <div className="flex gap-1">
                  {THEMES.map((t, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${t.style.split(' ')[0].replace('bg-', 'bg-opacity-80 bg-')}`} />
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                   <GripHorizontal size={14} /> Drag to calendar
                </div>
              </div>

              <div 
                draggable={stats.usedRestCards < QUOTA.rest}
                onDragStart={(e) => handleDragStart(e, 'rest')}
                className={`
                  group bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm cursor-grab active:cursor-grabbing
                  hover:shadow-md hover:border-stone-200 transition-all
                  ${stats.usedRestCards >= QUOTA.rest ? 'opacity-50 grayscale pointer-events-none' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800">Rest Day</span>
                  <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">1 Day</span>
                </div>
                 <div className="h-2 w-full rounded-full bg-stone-200" />
              </div>
              
              <button 
                onClick={resetCalendar}
                className="w-full py-2 text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={12} /> Reset Month
              </button>
            </div>
          </div>

          {/* Right: Calendar Grid */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-8">
              
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 mb-4">
                {WEEK_DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 grid-rows-5 gap-3 min-h-[500px]">
                {days.map((day, index) => {
                  // 样式逻辑处理
                  const isWork = day.type === 'work';
                  const isRest = day.type === 'rest';
                  const theme = isWork && day.themeIndex !== undefined ? THEMES[day.themeIndex] : REST_THEME;
                  
                  // 连续卡片的视觉连接处理
                  let roundedClass = 'rounded-2xl';
                  if (isWork) {
                     if (day.themeIndex === 0) roundedClass = 'rounded-l-2xl rounded-r-md';
                     else if (day.themeIndex === 1) roundedClass = 'rounded-md';
                     else if (day.themeIndex === 2) roundedClass = 'rounded-r-2xl rounded-l-md';
                  }

                  return (
                    <div
                      key={index}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                      onDrop={() => handleDrop(index)}
                      className={`
                        relative flex flex-col items-start justify-between p-3 transition-all duration-200
                        ${!day.date ? 'invisible' : 'visible'}
                        ${day.type 
                          ? `${theme.style} ${roundedClass} shadow-sm` 
                          : 'bg-slate-50/50 border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-2xl'
                        }
                      `}
                    >
                      {/* Date Number */}
                      {day.date && (
                        <span className={`
                          text-sm font-medium 
                          ${day.type ? 'opacity-100' : 'text-slate-400'}
                        `}>
                          {day.date}
                        </span>
                      )}

                      {/* Card Content */}
                      {day.type && (
                        <div className="mt-2 w-full">
                          <div className="flex flex-col items-center justify-center py-2 gap-1">
                            {theme.icon}
                            <span className="text-[10px] font-medium tracking-wide opacity-90">
                              {theme.name}
                            </span>
                          </div>
                          
                          {/* Delete Button (Hover) */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); day.cardGroupId && handleRemove(day.cardGroupId); }}
                            className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-black/5 rounded-full transition-opacity"
                          >
                            <span className="sr-only">Remove</span>
                            <div className="w-1.5 h-1.5 bg-current rounded-full opacity-50" />
                          </button>
                        </div>
                      )}

                      {/* Drag Indicator */}
                      {!day.type && dragType && (
                         <div className="absolute inset-0 border-2 border-indigo-200 border-dashed rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-indigo-50/10" />
                      )}
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